import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Compendium Link & UUID Integrity', () => {
  let docs;
  let idSet;

  beforeAll(async () => {
    docs = await loadAllDocuments();
    idSet = new Set(docs.map(d => d.data._id));
  });

  it('should have zero broken internal @UUID links', () => {
    const brokenLinks = [];

    for (const doc of docs) {
      const matches = doc.content.match(/@UUID\[([^\]]+)\]/g) || [];
      for (const match of matches) {
        if (match.includes('pathfinders-guide-to-eberron-compendium')) {
          const targetId = match.replace('@UUID[', '').replace(']', '').split('.').pop().trim();
          if (!idSet.has(targetId)) {
            brokenLinks.push({
              source: doc.relPath,
              reference: match,
              missingId: targetId
            });
          }
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  it('should have properly formatted source compendium flags where present', () => {
    const malformedFlags = [];
    for (const doc of docs) {
      const sourceId = doc.data.flags?.core?.sourceId;
      if (sourceId && typeof sourceId !== 'string') {
        malformedFlags.push({ file: doc.relPath, sourceId });
      }
    }
    expect(malformedFlags).toEqual([]);
  });
});
