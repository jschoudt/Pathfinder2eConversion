import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Vehicles, Airships & Bestiary Integration', () => {
  let docs;
  let docMap = new Map();

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      docMap.set(doc.data.name, doc.data);
    }
  });

  describe('Elemental Airship Vehicles', () => {
    const VEHICLES = [
      {
        name: 'Lyrandar Skyskiff',
        level: 6,
        ac: 20,
        hardness: 10,
        hp: 120,
        collisionDC: 22,
        speed: 'fly 60 feet (elemental ring)',
        size: 'huge'
      },
      {
        name: 'Lyrandar Air Cruiser',
        level: 11,
        ac: 26,
        hardness: 15,
        hp: 240,
        collisionDC: 28,
        speed: 'fly 45 feet (elemental ring)',
        size: 'grg'
      },
      {
        name: 'Strider War Airship',
        level: 16,
        ac: 34,
        hardness: 20,
        hp: 400,
        collisionDC: 34,
        speed: 'fly 40 feet (elemental ring)',
        size: 'grg'
      }
    ];

    it.each(VEHICLES)(
      'should validate vehicle $name (Level $level)',
      ({ name, level, ac, hardness, hp, collisionDC, speed, size }) => {
        expect(docMap.has(name), `Missing vehicle: ${name}`).toBe(true);
        const vehicle = docMap.get(name);
        expect(vehicle.type).toBe('vehicle');
        expect(vehicle.system.details.level.value).toBe(level);
        expect(vehicle.system.attributes.ac.value).toBe(ac);
        expect(vehicle.system.attributes.hardness).toBe(hardness);
        expect(vehicle.system.attributes.hp.max).toBe(hp);
        expect(vehicle.system.attributes.collisionDC.value).toBe(collisionDC);
        expect(vehicle.system.details.speed).toBe(speed);
        expect(vehicle.system.traits.size.value).toBe(size);
        expect(vehicle.system.traits.value).toContain('air');
        expect(vehicle.system.traits.value).toContain('magical');
      }
    );
  });

  describe('Airship Upgrades & Equipment', () => {
    const UPGRADES = [
      {
        name: 'Cloudburst Sails',
        type: 'equipment',
        level: 7,
        traits: ['magical', 'air'],
        priceGp: 340
      },
      {
        name: 'Elemental Thrusters',
        type: 'equipment',
        level: 9,
        traits: ['magical', 'fire'],
        priceGp: 650
      },
      {
        name: 'Arcane Harpoon Cannon',
        type: 'weapon',
        level: 8,
        traits: ['magical', 'tethered', 'uncommon'],
        priceGp: 480
      }
    ];

    it.each(UPGRADES)(
      'should validate airship upgrade item $name',
      ({ name, type, level, traits, priceGp }) => {
        expect(docMap.has(name), `Missing item: ${name}`).toBe(true);
        const item = docMap.get(name);
        expect(item.type).toBe(type);
        expect(item.system.level.value).toBe(level);
        expect(item.system.price.value.gp).toBe(priceGp);
        for (const trait of traits) {
          expect(item.system.traits.value).toContain(trait);
        }
      }
    );
  });

  describe('Airship Crew Actions', () => {
    it('should validate Overcharge Elemental Ring action', () => {
      expect(docMap.has('Overcharge Elemental Ring')).toBe(true);
      const action = docMap.get('Overcharge Elemental Ring');
      expect(action.type).toBe('action');
      expect(action.system.actions.value).toBe(1);
      expect(action.system.traits.value).toContain('air');
      expect(action.system.traits.value).toContain('fire');
      expect(action.system.traits.value).toContain('magical');
    });
  });
});
