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
      } else if (doc.docType === 'Actor' && !pf2eTemplate.Actor?.types?.includes(doc.data.type)) {
        invalid.push({ file: doc.relPath, type: doc.data.type });
      }
    }
    expect(invalid).toEqual([]);
  });
});
