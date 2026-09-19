import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Eberron Religions & Deities Specifications', () => {
  let docs;
  let deityMap = new Map();

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      if (doc.data.type === 'deity') {
        deityMap.set(doc.data.name, doc.data);
      }
    }
  });

  const EBERRON_DEITIES = [
    { name: 'Arawai: Goddess of Agriculture', font: ['heal'], weapons: ['flail', 'war-flail'] },
    { name: 'Aureon: God of Law and Knowledge', font: ['harm', 'heal'], weapons: ['staff'] },
    { name: 'Balinor: God of Beasts and the Hunt', font: ['harm', 'heal'], weapons: ['longbow', 'composite-longbow'] },
    { name: 'Boldrei: Goddess of Community and Hearth', font: ['heal'], weapons: ['spear'] },
    { name: 'Cults of the Dragon Below', font: ['harm'], weapons: ['greatpick'] },
    { name: 'Dol Arrah: Goddess of Honor and Sacrifice', font: ['heal'], weapons: ['halberd'] },
    { name: 'Dol Dorn: God of Strength at Arms', font: ['heal'], weapons: ['longsword'] },
    { name: 'Kol Korran: God of Trade and Wealth', font: ['harm', 'heal'], weapons: ['mace'] },
    { name: 'Olladra: Goddess of Feast and Good Fortune', font: ['heal'], weapons: ['dagger'] },
    { name: 'Onatar: God of Artifice and the Forge', font: ['heal'], weapons: ['warhammer'] },
    { name: 'The Blood of Vol', font: ['harm', 'heal'], weapons: ['dagger'] },
    { name: 'The Devourer: The Sovereign of Wave and Whelm', font: ['harm'], weapons: ['trident'] },
    { name: 'The Fury: The Sovereign of Rage and Ruin', font: ['harm'], weapons: ['rapier'] },
    { name: 'The Keeper: The Sovereign of Death and Decay', font: ['harm'], weapons: ['scythe'] },
    { name: 'The Mockery: The Sovereign of Betrayal and Bloodshed', font: ['harm'], weapons: ['kama'] },
    { name: 'The Path of Light', font: ['heal'], weapons: ['fist'] },
    { name: 'The Shadow: The Sovereign of Magic and Mayhem', font: ['harm'], weapons: ['staff'] },
    { name: 'The Silver Flame', font: ['heal'], weapons: ['longbow', 'composite-longbow'] },
    { name: 'The Sovereign Host', font: ['harm', 'heal'], weapons: ['longsword'] },
    { name: 'The Spirits of the Past', font: ['harm', 'heal'], weapons: ['scimitar'] },
    { name: 'The Traveler: The Sovereign of Chaos and Change', font: ['harm', 'heal'], weapons: ['scimitar'] },
    { name: 'The Undying Court', font: ['harm', 'heal'], weapons: ['scimitar'] }
  ];

  it('should have all 22 Eberron deities in the compendium', () => {
    expect(deityMap.size).toBe(22);
  });

  describe.each(EBERRON_DEITIES)(
    'Deity: $name',
    ({ name, font, weapons }) => {
      it('should exist in eberron-deities compendium', () => {
        expect(deityMap.has(name)).toBe(true);
      });

      it(`should grant favored weapon(s): ${weapons.join(', ')}`, () => {
        const deity = deityMap.get(name);
        expect(deity?.system.weapons).toEqual(weapons);
      });

      it(`should have divine font: [${font.join(', ')}]`, () => {
        const deity = deityMap.get(name);
        expect(deity?.system.font).toEqual(font);
      });

      it('should have granted cleric spells for heightening levels', () => {
        const deity = deityMap.get(name);
        const spells = deity?.system.spells;
        expect(spells).toBeDefined();
        if (name !== 'The Sovereign Host') {
          const levels = Object.keys(spells || {});
          expect(levels.length).toBeGreaterThan(0);
        }
      });

      it('should have primary or associated domains defined', () => {
        const deity = deityMap.get(name);
        expect(deity?.system.domains).toBeDefined();
      });
    }
  );
});
