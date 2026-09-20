import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('PF2e Content Mechanics Deep Verification', () => {
  let docs;

  beforeAll(async () => {
    docs = await loadAllDocuments();
  });

  describe('Ancestries', () => {
    it('should have valid PF2e mechanics on all ancestries', () => {
      const ancestries = docs.filter(d => d.data.type === 'ancestry');
      expect(ancestries.length).toBeGreaterThan(0);

      const VALID_SIZES = new Set(['tiny', 'sm', 'med', 'lg', 'huge', 'grg']);

      for (const anc of ancestries) {
        const sys = anc.data.system;
        expect(sys.hp).toBeGreaterThan(0);
        expect(sys.speed).toBeGreaterThanOrEqual(20);
        expect(VALID_SIZES.has(sys.size)).toBe(true);
        expect(sys.boosts).toBeDefined();
        expect(Array.isArray(sys.traits?.value)).toBe(true);
      }
    });
  });

  describe('Feats', () => {
    it('should have valid action types and levels on all feats (at least 236)', () => {
      const feats = docs.filter(d => d.data.type === 'feat');
      expect(feats.length).toBeGreaterThanOrEqual(236);

      const VALID_ACTION_TYPES = new Set(['passive', 'action', 'reaction', 'free']);

      for (const feat of feats) {
        const sys = feat.data.system;
        expect(VALID_ACTION_TYPES.has(sys.actionType?.value)).toBe(true);
        expect(typeof sys.level?.value).toBe('number');
        expect(sys.level.value).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(sys.traits?.value)).toBe(true);
      }
    });
  });

  describe('Spells', () => {
    it('should have valid ranks and categories on all 107 spells', () => {
      const spells = docs.filter(d => d.data.type === 'spell');
      expect(spells.length).toBe(107);

      const VALID_CATEGORIES = new Set(['spell', 'focus', 'cantrip', 'ritual']);

      for (const spell of spells) {
        const sys = spell.data.system;
        expect(VALID_CATEGORIES.has(sys.category?.value)).toBe(true);
        expect(sys.level?.value).toBeGreaterThanOrEqual(1);
        expect(sys.level?.value).toBeLessThanOrEqual(10);
        expect(Array.isArray(sys.traits?.value)).toBe(true);
      }
    });
  });

  describe('Weapons', () => {
    it('should have valid damage formulas and categories on all weapons', () => {
      const weapons = docs.filter(d => d.data.type === 'weapon');
      expect(weapons.length).toBeGreaterThan(0);

      const VALID_DICE = new Set(['d4', 'd6', 'd8', 'd10', 'd12']);

      for (const weapon of weapons) {
        const dmg = weapon.data.system?.damage;
        expect(dmg).toBeDefined();
        expect(dmg.dice).toBeGreaterThanOrEqual(1);
        expect(VALID_DICE.has(dmg.die)).toBe(true);
        expect(typeof weapon.data.system.category).toBe('string');
      }
    });
  });

  describe('NPCs & Creatures', () => {
    it('should have valid combat statistics on all bestiary NPCs', () => {
      const npcs = docs.filter(d => d.data.type === 'npc');
      expect(npcs.length).toBe(11);

      for (const npc of npcs) {
        const sys = npc.data.system;
        expect(sys.attributes?.hp?.max).toBeGreaterThan(0);
        expect(sys.attributes?.ac?.value).toBeGreaterThan(0);
        expect(typeof sys.details?.level?.value).toBe('number');
        const perceptionVal = sys.attributes?.perception?.value ?? sys.perception?.mod;
        expect(typeof perceptionVal).toBe('number');
        expect(typeof sys.saves?.fortitude?.value).toBe('number');
        expect(typeof sys.saves?.reflex?.value).toBe('number');
        expect(typeof sys.saves?.will?.value).toBe('number');
      }
    });
  });
});
