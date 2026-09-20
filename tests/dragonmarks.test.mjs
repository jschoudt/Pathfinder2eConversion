import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Dragonmarks, Houses & Dragonshards Specifications', () => {
  let docs;
  let markMap = new Map();
  let shardItems = [];

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      if (doc.packName === 'eberron-dragonmarks') {
        markMap.set(doc.data.name, doc.data);
      }
      if (doc.packName === 'eberron-items' && doc.data.name.toLowerCase().includes('shard')) {
        shardItems.push(doc.data);
      }
    }
  });

  describe('Dragonmarked Houses & Feats', () => {
    const HOUSE_FEATS = [
      { house: 'Cannith (Making)', feat: 'Cannith Forgecraft', requiredTrait: 'mark-of-making' },
      { house: 'Deneith (Sentinel)', feat: 'Deneith Battle Fortitude', requiredTrait: 'mark-of-sentinel' },
      { house: 'Medani (Detection)', feat: 'Eye of Medani', requiredTrait: 'mark-of-detection' },
      { house: 'Ghallanda (Hospitality)', feat: 'Grace of Ghallanda', requiredTrait: 'mark-of-hospitality' },
      { house: 'Jorasco (Healing)', feat: 'Jorasco Treatment', requiredTrait: 'mark-of-healing' },
      { house: 'Kundarak (Warding)', feat: 'Kundarak Insight', requiredTrait: 'mark-of-warding' },
      { house: 'Lyrandar (Storm)', feat: 'Lyrandar Captain', requiredTrait: 'mark-of-storm' },
      { house: 'Orien (Passage)', feat: 'Orien Traveller', requiredTrait: 'mark-of-passage' },
      { house: 'Phiarlan (Shadow)', feat: 'Phiarlan Performer', requiredTrait: 'mark-of-shadow' },
      { house: 'Sivis (Scribing)', feat: 'Scribe of Sivis', requiredTrait: 'mark-of-scribing' },
      { house: 'Tharashk (Finding)', feat: 'Tharashk Survivalist', requiredTrait: 'mark-of-finding' },
      { house: 'Vadalis (Handling)', feat: 'Vadalis Instincts', requiredTrait: 'mark-of-handling' }
    ];

    describe.each(HOUSE_FEATS)(
      'House: $house',
      ({ house, feat, requiredTrait }) => {
        it(`should have ${feat} in dragonmarks compendium`, () => {
          expect(markMap.has(feat)).toBe(true);
        });

        it(`should have trait '${requiredTrait}' on ${feat}`, () => {
          const item = markMap.get(feat);
          const traits = item?.system.traits?.value || [];
          expect(traits).toContain(requiredTrait);
        });
      }
    );

    describe('Dragonmark Progression Tiers', () => {
      const TIERS = [
        { name: 'Least Mark', minLevel: 1 },
        { name: 'Lesser Mark', minLevel: 4 },
        { name: 'Greater Mark', minLevel: 8 },
        { name: 'Siberys Mark', minLevel: 12 }
      ];

      describe.each(TIERS)('Tier: $name', ({ name, minLevel }) => {
        it('should exist as a progression feat', () => {
          expect(markMap.has(name)).toBe(true);
        });

        it(`should be level ${minLevel} or higher`, () => {
          const item = markMap.get(name);
          expect(item?.system.level?.value).toBeGreaterThanOrEqual(minLevel);
        });
      });
    });
  });

  describe('Eberron, Khyber & Siberys Dragonshards', () => {
    it('should have all 24 standard dragonshard commodities and items', () => {
      expect(shardItems.length).toBeGreaterThanOrEqual(24);
    });

    const SHARD_TYPES = ['Eberron', 'Khyber', 'Siberys'];
    const SHARD_SIZES = ['Small', 'Medium', 'Large', 'Greater'];

    describe.each(SHARD_TYPES)('%s Dragonshards', (shardType) => {
      it(`should have both refined and unprocessed ${shardType} shards`, () => {
        const typeLower = shardType.toLowerCase();
        const refined = shardItems.filter(s => s.name.toLowerCase().includes('refined') && s.name.toLowerCase().includes(typeLower));
        const unprocessed = shardItems.filter(s => s.name.toLowerCase().includes('unproccessed') && s.name.toLowerCase().includes(typeLower));
        expect(refined.length).toBeGreaterThanOrEqual(3);
        expect(unprocessed.length).toBeGreaterThanOrEqual(3);
      });

      describe.each(SHARD_SIZES)(`%s ${shardType} Shard`, (size) => {
        it(`should have ${size} ${shardType} shards in compendium`, () => {
          const typeLower = shardType.toLowerCase();
          const sizeLower = size.toLowerCase();
          const match = shardItems.find(s => s.name.toLowerCase().includes(sizeLower) && s.name.toLowerCase().includes(typeLower));
          expect(match).toBeDefined();
        });
      });
    });
  });
});
