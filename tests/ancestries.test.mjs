import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Eberron Ancestries & Heritages Specifications', () => {
  let docs;
  let ancestryMap = new Map();
  let heritageList = [];

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      if (doc.data.type === 'ancestry') {
        ancestryMap.set(doc.data.name, doc.data);
      } else if (doc.data.type === 'heritage') {
        heritageList.push(doc.data);
      }
    }
  });

  const EXPECTED_ANCESTRIES = [
    {
      name: 'Warforged',
      expectedHp: 8,
      expectedSpeed: 25,
      requiredTraits: ['construct', 'hb_warforged'],
      expectedSize: 'med'
    },
    {
      name: 'Kalashtar',
      expectedHp: 6,
      expectedSpeed: 25,
      requiredTraits: ['humanoid', 'hb_kalashtar'],
      expectedSize: 'med'
    },
    {
      name: 'Eberron Changeling',
      expectedHp: 6,
      expectedSpeed: 25,
      requiredTraits: ['humanoid', 'hb_eberron-changelings'],
      expectedSize: 'med'
    },
    {
      name: 'Shifter',
      expectedHp: 8,
      expectedSpeed: 25,
      requiredTraits: ['humanoid', 'hb_shifter'],
      expectedSize: 'med'
    },
    {
      name: 'Bugbear',
      expectedHp: 10,
      expectedSpeed: 25,
      requiredTraits: ['humanoid', 'hb_bugbear'],
      expectedSize: 'med'
    }
  ];

  describe.each(EXPECTED_ANCESTRIES)(
    'Ancestry: $name',
    ({ name, expectedHp, expectedSpeed, requiredTraits, expectedSize }) => {
      it('should exist in eberron-ancestries compendium', () => {
        expect(ancestryMap.has(name)).toBe(true);
      });

      it(`should have ${expectedHp} base Hit Points`, () => {
        const anc = ancestryMap.get(name);
        expect(anc?.system.hp).toBe(expectedHp);
      });

      it(`should have base speed of ${expectedSpeed} feet`, () => {
        const anc = ancestryMap.get(name);
        expect(anc?.system.speed).toBe(expectedSpeed);
      });

      it(`should be ${expectedSize} size category`, () => {
        const anc = ancestryMap.get(name);
        expect(anc?.system.size).toBe(expectedSize);
      });

      it(`should possess required traits: ${requiredTraits.join(', ')}`, () => {
        const anc = ancestryMap.get(name);
        const traits = anc?.system.traits?.value || [];
        for (const trait of requiredTraits) {
          expect(traits).toContain(trait);
        }
      });

      it('should have attribute boost configuration defined', () => {
        const anc = ancestryMap.get(name);
        expect(anc?.system.boosts).toBeDefined();
        const boostKeys = Object.keys(anc.system.boosts);
        expect(boostKeys.length).toBeGreaterThanOrEqual(2);
      });

      it('should have rich background and lore description', () => {
        const anc = ancestryMap.get(name);
        const desc = anc?.system.description?.value || '';
        expect(desc.length).toBeGreaterThan(100);
        expect(desc).toContain('<h2>You might');
      });
    }
  );

  describe('Heritages & Versatile Heritages', () => {
    it('should have at least 50 heritages and dragonmarked heritage options', () => {
      expect(heritageList.length).toBeGreaterThanOrEqual(50);
    });

    it('should have valid traits on every heritage', () => {
      for (const h of heritageList) {
        expect(Array.isArray(h.system.traits?.value)).toBe(true);
      }
    });

    it('should include Shifter beast heritages', () => {
      const heritageNames = heritageList.map(h => h.name);
      const expectedShifter = [
        'Beasthide Shifter',
        'Cliffwalk Shifter',
        'Dreamsight Shifter',
        'Longstride Shifter',
        'Wildhunt Shifter'
      ];
      for (const name of expectedShifter) {
        const match = heritageNames.find(hn => hn.includes(name));
        expect(match).toBeDefined();
      }
    });
  });
});
