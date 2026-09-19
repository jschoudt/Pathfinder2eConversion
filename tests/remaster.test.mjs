import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments, DEPRECATED_TERMS } from './setup.mjs';

describe('PF2e Remaster Terminology Audit', () => {
  let docs;

  beforeAll(async () => {
    docs = await loadAllDocuments();
  });

  it('should have zero pre-Remaster legacy terms across all 582 documents', () => {
    const findings = [];

    for (const doc of docs) {
      const name = doc.data.name || '';
      const description = doc.data.system?.description?.value || '';
      const fullText = `${name} ${description}`;

      for (const term of DEPRECATED_TERMS) {
        const matches = fullText.match(term.pattern);
        if (matches) {
          findings.push({
            file: doc.relPath,
            found: matches[0],
            count: matches.length,
            replacement: term.replacement,
            description: term.description
          });
        }
      }
    }

    expect(findings).toEqual([]);
  });

  it('should ensure all deities have valid divine attribute / ability choices', () => {
    const deities = docs.filter(d => d.packName === 'eberron-deities');
    expect(deities.length).toBeGreaterThan(0);
    for (const deity of deities) {
      const attrs = deity.data.system?.attribute || deity.data.system?.ability;
      expect(Array.isArray(attrs)).toBe(true);
      expect(attrs.length).toBeGreaterThan(0);
    }
  });
});
