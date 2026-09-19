import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('PF2e Rule Elements Validation', () => {
  let docs;

  beforeAll(async () => {
    docs = await loadAllDocuments();
  });

  it('should ensure system.rules is an array on all items with rules', () => {
    const nonArrayRules = docs.filter(
      d => d.data.system?.rules !== undefined && !Array.isArray(d.data.system.rules)
    );
    expect(nonArrayRules.map(d => d.relPath)).toEqual([]);
  });

  it('should ensure all rule elements have a valid non-empty string key', () => {
    const invalidRules = [];

    for (const doc of docs) {
      if (Array.isArray(doc.data.system?.rules)) {
        for (const [idx, rule] of doc.data.system.rules.entries()) {
          if (!rule || typeof rule !== 'object') {
            invalidRules.push({ file: doc.relPath, index: idx, issue: 'Rule is not an object' });
          } else if (!rule.key || typeof rule.key !== 'string' || rule.key.trim() === '') {
            invalidRules.push({ file: doc.relPath, index: idx, issue: 'Rule missing key' });
          }
        }
      }
    }

    expect(invalidRules).toEqual([]);
  });
});
