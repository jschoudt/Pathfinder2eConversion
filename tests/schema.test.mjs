import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments, initFoundryEnvironment, getModuleManifest } from './setup.mjs';

describe('Foundry v14 & PF2e Schema Validation', () => {
  let docs;
  let foundryEnv;
  let manifest;

  beforeAll(async () => {
    docs = await loadAllDocuments();
    foundryEnv = await initFoundryEnvironment();
    manifest = await getModuleManifest();
  });

  it('should load all source documents (at least 582)', () => {
    expect(docs.length).toBeGreaterThanOrEqual(582);
  });

  it('should have unique _id across all items', () => {
    const ids = new Set();
    const duplicates = [];
    for (const doc of docs) {
      if (ids.has(doc.data._id)) {
        duplicates.push({ id: doc.data._id, file: doc.relPath });
      }
      ids.add(doc.data._id);
    }
    expect(duplicates).toEqual([]);
  });

  it('should have all required core fields (_id, name, type, system)', () => {
    const invalid = docs.filter(
      d => !d.data._id || !d.data.name || !d.data.type || !d.data.system
    );
    expect(invalid.map(d => d.relPath)).toEqual([]);
  });

  it('should validate every document against Foundry v14 Document classes', () => {
    const { docClasses } = foundryEnv;
    expect(docClasses).toBeDefined();

    const errors = [];
    for (const doc of docs) {
      const Cls = docClasses[doc.docType];
      try {
        const instance = new Cls(doc.data);
        instance.validate();
      } catch (err) {
        errors.push({ file: doc.relPath, error: err.message });
      }
    }
    expect(errors).toEqual([]);
  });

  it('should only use valid PF2e Item and Actor types from template.json', () => {
    const { pf2eTemplate } = foundryEnv;
    if (!pf2eTemplate) return;

    const invalid = [];
    for (const doc of docs) {
      if (doc.docType === 'Item' && !pf2eTemplate.Item?.types?.includes(doc.data.type)) {
        invalid.push({ file: doc.relPath, type: doc.data.type });
      } else if (doc.docType === 'Actor' && !pf2eTemplate.Actor?.types?.includes(doc.data.type) && !['army', 'character', 'familiar', 'hazard', 'loot', 'npc', 'party', 'vehicle'].includes(doc.data.type)) {
        invalid.push({ file: doc.relPath, type: doc.data.type });
      }
    }
    expect(invalid).toEqual([]);
  });

  it('should have valid publication and source information with title and page across all documents', () => {
    const missing = [];
    for (const doc of docs) {
      const data = doc.data;
      const isActorWithDetails = data.type === 'npc' || data.type === 'vehicle';
      const pub = isActorWithDetails ? (data.system?.details?.publication || data.system?.publication) : data.system?.publication;
      const src = isActorWithDetails ? (data.system?.details?.source || data.system?.source) : data.system?.source;

      if (!pub || !pub.title || typeof pub.title !== 'string' || !pub.title.trim()) {
        missing.push({ file: doc.relPath, issue: 'missing publication.title' });
      } else if (pub.page !== 'N/A') {
        missing.push({ file: doc.relPath, issue: `publication.page is '${pub.page}', expected 'N/A'` });
      }

      if (!src || !src.value || typeof src.value !== 'string' || !src.value.trim()) {
        missing.push({ file: doc.relPath, issue: 'missing source.value' });
      } else if (src.page !== 'N/A') {
        missing.push({ file: doc.relPath, issue: `source.page is '${src.page}', expected 'N/A'` });
      }
    }
    expect(missing).toEqual([]);
  });

  it('should normalize all documents to Foundry v14 (14.368), PF2e (8.5.1), and schema (0.959)', () => {
    const mismatched = [];
    for (const doc of docs) {
      const data = doc.data;
      const stats = data._stats;
      const system = data.system;

      if (!stats || stats.coreVersion !== '14.368' || stats.systemVersion !== '8.5.1' || stats.systemId !== 'pf2e') {
        mismatched.push({
          file: doc.relPath,
          issue: `_stats invalid: coreVersion='${stats?.coreVersion}', systemVersion='${stats?.systemVersion}'`
        });
      }

      if (!system || system.schema?.version !== 0.959 || system._migration?.version !== 0.959) {
        mismatched.push({
          file: doc.relPath,
          issue: `schema version invalid: schema.version=${system?.schema?.version}, _migration.version=${system?._migration?.version}`
        });
      }
    }
    expect(mismatched).toEqual([]);
  });
});


