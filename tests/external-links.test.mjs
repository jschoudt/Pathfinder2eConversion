import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('External PF2e System Link Modernization', () => {
  let docs;

  const LEGACY_PACK_NAMES = [
    'spells-srd',
    'feats-srd',
    'actionspf2e',
    'conditionitems',
    'equipment-srd'
  ];

  const VALID_PF2E_PACKS = new Set([
    'actions',
    'ancestries',
    'ancestry-features',
    'backgrounds',
    'classes',
    'class-features',
    'conditions',
    'deities',
    'equipment',
    'equipment-effects',
    'feat-effects',
    'feats',
    'heritages',
    'journals',
    'macros',
    'rollable-tables',
    'spell-effects',
    'spells',
    'vehicles'
  ]);

  beforeAll(async () => {
    docs = await loadAllDocuments();
  });

  it('should have zero legacy pre-v11 PF2e pack names (e.g. spells-srd, feats-srd)', () => {
    const legacyMatches = [];

    for (const doc of docs) {
      for (const legacy of LEGACY_PACK_NAMES) {
        const pattern = new RegExp(`Compendium\\.pf2e\\.${legacy}\\.`, 'g');
        const matches = doc.content.match(pattern);
        if (matches) {
          legacyMatches.push({
            file: doc.relPath,
            legacyPack: legacy,
            count: matches.length
          });
        }
      }
    }

    expect(legacyMatches).toEqual([]);
  });

  it('should ensure all @UUID[Compendium.pf2e...] references point to recognized modern PF2e packs', () => {
    const unrecognizedRefs = [];

    for (const doc of docs) {
      const matches = doc.content.match(/@UUID\[Compendium\.pf2e\.([^\]]+)\]/g) || [];
      for (const match of matches) {
        const parts = match.replace('@UUID[Compendium.pf2e.', '').replace(']', '').split('.');
        const packName = parts[0];
        if (!VALID_PF2E_PACKS.has(packName)) {
          unrecognizedRefs.push({
            file: doc.relPath,
            reference: match,
            packName
          });
        }
      }
    }

    expect(unrecognizedRefs).toEqual([]);
  });
});
