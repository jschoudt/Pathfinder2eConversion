import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Classes, Subclasses & Archetypes Integration', () => {
  let docs;
  let docMap = new Map();

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      docMap.set(doc.data.name, doc.data);
    }
  });

  describe('Core & 2024 Eberron Class Features and Innovations', () => {
    const CLASS_FEATURES = [
      { name: 'Leyline Cartographer Innovation', type: 'feat', traits: ['inventor', 'artificer'], level: 1 },
      { name: 'Dreadnaught Armor Model', type: 'feat', traits: ['inventor', 'artificer'], level: 1 },
      { name: 'Forge Adept Innovation', type: 'feat', traits: ['inventor', 'artificer'], level: 1 },
      { name: 'Maverick Innovation', type: 'feat', traits: ['inventor', 'artificer'], level: 1 },
      { name: 'Demonshard Instinct', type: 'feat', traits: ['barbarian'], level: 1 },
      { name: 'Bloodhound Edge', type: 'feat', traits: ['ranger'], level: 1 },
      { name: 'Nemesis Bloodline', type: 'feat', traits: ['sorcerer'], level: 1 },
      { name: 'Stone Sovereign Patron', type: 'feat', traits: ['witch'], level: 1 },
      { name: 'Circle of the Forged', type: 'feat', traits: ['druid'], level: 1 },
      { name: 'College of the Dirge Singer', type: 'feat', traits: ['bard'], level: 1 },
      { name: 'Warrior of the Living Weapon', type: 'feat', traits: ['monk'], level: 1 },
      { name: 'Way of the Wandslinger', type: 'feat', traits: ['gunslinger'], level: 1 },
      { name: 'Wandslinger Dedication', type: 'feat', traits: ['archetype', 'dedication'], level: 2 }
    ];

    it.each(CLASS_FEATURES)(
      'should load class feature: $name with level $level and traits: $traits',
      ({ name, type, traits, level }) => {
        expect(docMap.has(name), `Missing class feature: ${name}`).toBe(true);
        const feature = docMap.get(name);
        expect(feature.type).toBe(type);
        expect(feature.system.level.value).toBe(level);
        for (const trait of traits) {
          expect(feature.system.traits.value).toContain(trait);
        }
      }
    );
  });

  describe('2024 Eberron Class Feats & Stances', () => {
    const CLASS_FEATS = [
      { name: 'Survey the Ley Lines', level: 1, traits: ['inventor', 'artificer'], actionType: 'action' },
      { name: 'Force Demolisher Strike', level: 4, traits: ['inventor', 'artificer'], actionType: 'action' },
      { name: 'Leyline Shifting', level: 8, traits: ['inventor', 'artificer'], actionType: 'action' },
      { name: 'Giant Stature Overcharge', level: 12, traits: ['inventor', 'artificer', 'unstable'], actionType: 'action' },
      { name: 'Quick-Draw Wand', level: 2, traits: ['gunslinger', 'archetype'], actionType: 'action' },
      { name: 'Wand Dueling', level: 4, traits: ['gunslinger', 'archetype'], actionType: 'passive' },
      { name: 'Deflective Cantrip', level: 6, traits: ['gunslinger', 'archetype'], actionType: 'reaction' },
      { name: 'Tendril Whip Stance', level: 1, traits: ['monk', 'stance'], actionType: 'action' },
      { name: 'Carapace Stance', level: 4, traits: ['monk', 'stance'], actionType: 'action' }
    ];

    it.each(CLASS_FEATS)(
      'should load feat: $name (Level $level) with actionType: $actionType',
      ({ name, level, traits, actionType }) => {
        expect(docMap.has(name), `Missing feat: ${name}`).toBe(true);
        const feat = docMap.get(name);
        expect(feat.type).toBe('feat');
        expect(feat.system.level.value).toBe(level);
        expect(feat.system.actionType.value).toBe(actionType);
        for (const trait of traits) {
          expect(feat.system.traits.value).toContain(trait);
        }
      }
    );
  });

  describe('Focus Spells for Subclasses', () => {
    it('should have Waypoint Anchor focus spell for Leyline Cartographer', () => {
      expect(docMap.has('Waypoint Anchor')).toBe(true);
      const spell = docMap.get('Waypoint Anchor');
      expect(spell.type).toBe('spell');
      expect(spell.system.category.value).toBe('focus');
      expect(spell.system.level.value).toBe(1);
      expect(spell.system.traits.value).toContain('teleportation');
      expect(spell.system.traits.value).toContain('inventor');
    });
  });
});
