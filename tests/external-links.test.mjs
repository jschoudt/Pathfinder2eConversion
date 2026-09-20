import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadAllDocuments, PF2E_SYSTEM_DIR } from './setup.mjs';

describe('External PF2e System Link & Pack Reference Integrity', () => {
  let docs;
  let validPf2ePacks = new Set();

  beforeAll(async () => {
    docs = await loadAllDocuments();

    const systemJsonPath = path.join(PF2E_SYSTEM_DIR, 'system.json');
    if (existsSync(systemJsonPath)) {
      const systemJson = JSON.parse(await readFile(systemJsonPath, 'utf-8'));
      for (const pack of systemJson.packs || []) {
        validPf2ePacks.add(pack.name);
      }
    }
    // Also accept standard PF2e shorthand aliases used in rich text UUID references
    for (const alias of ['actions', 'conditions', 'equipment', 'feats', 'spells', 'ancestry-features', 'class-features']) {
      validPf2ePacks.add(alias);
    }
  });

  it('should ensure all Compendium.pf2e.* references point to registered PF2e system packs', () => {
    const invalidRefs = [];

    for (const doc of docs) {
      // Check Rule Elements
      for (const rule of doc.data.system?.rules || []) {
        if (typeof rule.uuid === 'string' && rule.uuid.startsWith('Compendium.pf2e.')) {
          const parts = rule.uuid.split('.');
          const packName = parts[2];
          if (!validPf2ePacks.has(packName)) {
            invalidRefs.push({
              file: doc.relPath,
              context: 'rule element',
              uuid: rule.uuid,
              invalidPack: packName
            });
          }
        }
      }

      // Check system.items
      if (doc.data.system?.items) {
        for (const [key, item] of Object.entries(doc.data.system.items)) {
          if (typeof item.uuid === 'string' && item.uuid.startsWith('Compendium.pf2e.')) {
            const parts = item.uuid.split('.');
            const packName = parts[2];
            if (!validPf2ePacks.has(packName)) {
              invalidRefs.push({
                file: doc.relPath,
                context: 'system.items',
                uuid: item.uuid,
                invalidPack: packName
              });
            }
          }
        }
      }

      // Check @UUID and @Compendium tags in descriptions
      const matches = doc.content.match(/@(UUID|Compendium)\[Compendium\.pf2e\.([^\]]+)\]/g) || [];
      for (const match of matches) {
        const inner = match.replace(/^@(UUID|Compendium)\[Compendium\.pf2e\./, '').replace(/\]$/, '');
        const packName = inner.split('.')[0];
        if (!validPf2ePacks.has(packName)) {
          invalidRefs.push({
            file: doc.relPath,
            context: 'description tag',
            reference: match,
            invalidPack: packName
          });
        }
      }
    }

    expect(invalidRefs).toEqual([]);
  });
});
