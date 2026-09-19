import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Deep PF2e Rule Elements Schema Verification', () => {
  let docs;

  beforeAll(async () => {
    docs = await loadAllDocuments();
  });

  it('should validate FlatModifier rule elements', () => {
    const invalid = [];

    for (const doc of docs) {
      if (!Array.isArray(doc.data.system?.rules)) continue;
      for (const [idx, r] of doc.data.system.rules.entries()) {
        if (r.key === 'FlatModifier') {
          const hasSelector = !!r.selector;
          const hasValueOrAbility = r.value !== undefined || (r.type === 'ability' && !!r.ability);
          if (!hasSelector || !hasValueOrAbility) {
            invalid.push({ file: doc.relPath, index: idx, rule: r });
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('should validate RollOption rule elements', () => {
    const invalid = [];

    for (const doc of docs) {
      if (!Array.isArray(doc.data.system?.rules)) continue;
      for (const [idx, r] of doc.data.system.rules.entries()) {
        if (r.key === 'RollOption') {
          const hasDomain = typeof r.domain === 'string' && r.domain.length > 0;
          const hasOption = typeof r.option === 'string' && r.option.length > 0;
          if (!hasDomain || !hasOption) {
            invalid.push({ file: doc.relPath, index: idx, rule: r });
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('should validate GrantItem rule elements', () => {
    const invalid = [];

    for (const doc of docs) {
      if (!Array.isArray(doc.data.system?.rules)) continue;
      for (const [idx, r] of doc.data.system.rules.entries()) {
        if (r.key === 'GrantItem') {
          const hasUuid = typeof r.uuid === 'string' && r.uuid.length > 0;
          if (!hasUuid) {
            invalid.push({ file: doc.relPath, index: idx, rule: r });
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('should validate ActiveEffectLike (AELike) rule elements', () => {
    const invalid = [];

    for (const doc of docs) {
      if (!Array.isArray(doc.data.system?.rules)) continue;
      for (const [idx, r] of doc.data.system.rules.entries()) {
        if (r.key === 'ActiveEffectLike' || r.key === 'AELike') {
          const hasPath = typeof r.path === 'string' && r.path.length > 0;
          const hasMode = typeof r.mode === 'string' || typeof r.mode === 'number';
          const hasValue = r.value !== undefined;
          if (!hasPath || !hasMode || !hasValue) {
            invalid.push({ file: doc.relPath, index: idx, rule: r });
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });

  it('should validate Sense rule elements', () => {
    const invalid = [];

    for (const doc of docs) {
      if (!Array.isArray(doc.data.system?.rules)) continue;
      for (const [idx, r] of doc.data.system.rules.entries()) {
        if (r.key === 'Sense') {
          const hasSelector = typeof r.selector === 'string' && r.selector.length > 0;
          if (!hasSelector) {
            invalid.push({ file: doc.relPath, index: idx, rule: r });
          }
        }
      }
    }

    expect(invalid).toEqual([]);
  });
});
