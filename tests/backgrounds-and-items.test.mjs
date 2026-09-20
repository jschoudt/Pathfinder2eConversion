import { describe, it, expect, beforeAll } from 'vitest';
import { initFoundryEnvironment, loadAllDocuments } from './setup.mjs';

describe('Backgrounds and Items: Schemas, Bestowals, and AC Mechanics', () => {
  let env;
  let docs;
  let docMap = new Map();
  let ancestryMap = new Map();
  let heritageMap = new Map();
  let backgroundMap = new Map();
  let itemMap = new Map();

  beforeAll(async () => {
    env = await initFoundryEnvironment();

    globalThis.game.release = { version: '12.331' };
    globalThis.game.system = {
      id: 'pf2e',
      version: '6.4.0',
      primaryTokenAttribute: 'attributes.hp',
      secondaryTokenAttribute: null
    };

    docs = await loadAllDocuments();
    for (const doc of docs) {
      docMap.set(doc.data._id, doc.data);
      if (doc.data.type === 'ancestry') ancestryMap.set(doc.data.name, doc.data);
      if (doc.data.type === 'heritage') heritageMap.set(doc.data.name, doc.data);
      if (doc.data.type === 'background') backgroundMap.set(doc.data.name, doc.data);
      if (doc.packName === 'eberron-items') itemMap.set(doc.data.name, doc.data);
    }
  });

  function createTestActor(name, items = []) {
    return new env.docClasses.Actor({
      name,
      type: 'character',
      items
    });
  }

  describe('Eberron Backgrounds Integration', () => {
    const EXPECTED_BACKGROUNDS = [
      { name: 'House Agent', rarity: 'uncommon' },
      { name: 'Excoriate', rarity: 'rare' },
      { name: 'Foundling', rarity: 'common' },
      { name: 'House Orphan', rarity: 'common' },
      { name: 'House Scion', rarity: 'common' }
    ];

    it('should find all 5 dragonmarked house backgrounds', () => {
      expect(backgroundMap.size).toBe(5);
      for (const bg of EXPECTED_BACKGROUNDS) {
        expect(backgroundMap.has(bg.name), `Missing background: ${bg.name}`).toBe(true);
      }
    });

    describe.each(EXPECTED_BACKGROUNDS)('Background: $name', ({ name, rarity }) => {
      it(`should have correct rarity (${rarity}) and Dragonmarked Houses lore`, () => {
        const bg = backgroundMap.get(name);
        expect(bg).toBeDefined();
        expect(bg.system.traits.rarity).toBe(rarity);
        expect(bg.system.trainedLore).toBe('Dragonmarked Houses');
        expect(bg.system.trainedSkills?.custom).toBe('House Skill (Table 2-1)');
      });

      it('should offer proper attribute boosts (Wis/Cha/Int + Free)', () => {
        const bg = backgroundMap.get(name);
        const boosts = bg.system.boosts;
        expect(boosts['0'].value).toEqual(expect.arrayContaining(['cha', 'int', 'wis']));
        expect(boosts['1'].value.length).toBe(6);
      });

      it('should instantiate cleanly on a PC actor', () => {
        const bg = backgroundMap.get(name);
        const actor = createTestActor(`PC with ${name}`, [bg]);
        expect(() => actor.validate()).not.toThrow();
        expect(actor.items.size).toBe(1);
        expect(actor.items.contents[0].name).toBe(name);
      });
    });
  });

  describe('Eberron Armors: Modern PF2e Schema & AC Properties', () => {
    const ARMOR_CONFIGS = [
      {
        name: 'Light Integrated Armour',
        expectedAcBonus: 2,
        expectedDexCap: 3,
        expectedCheck: -1,
        expectedSpeed: 0,
        expectedStrength: 12,
        expectedCategory: 'light',
        expectedGroup: 'leather'
      },
      {
        name: 'Medium Integrated Armour',
        expectedAcBonus: 4,
        expectedDexCap: 1,
        expectedCheck: -2,
        expectedSpeed: -5,
        expectedStrength: 16,
        expectedCategory: 'medium',
        expectedGroup: 'plate'
      },
      {
        name: 'Heavy Integrated Armour',
        expectedAcBonus: 6,
        expectedDexCap: 0,
        expectedCheck: -3,
        expectedSpeed: -10,
        expectedStrength: 18,
        expectedCategory: 'heavy',
        expectedGroup: 'plate',
        expectedTraits: ['comfort', 'bulwark', 'hb_warforged']
      },
      {
        name: 'Nominal Integrated Armour',
        expectedAcBonus: 0,
        expectedDexCap: 5,
        expectedCheck: 0,
        expectedSpeed: 0,
        expectedStrength: 0,
        expectedCategory: 'unarmored',
        expectedGroup: 'leather'
      },
      {
        name: 'Leafweave',
        expectedAcBonus: 1,
        expectedDexCap: 4,
        expectedCheck: -1,
        expectedSpeed: 0,
        expectedStrength: 10,
        expectedCategory: 'light',
        expectedGroup: 'leather'
      },
      {
        name: 'Darkleaf Breastplate',
        expectedAcBonus: 4,
        expectedDexCap: 2,
        expectedCheck: -1,
        expectedSpeed: 0,
        expectedStrength: 14,
        expectedCategory: 'medium',
        expectedGroup: 'composite'
      },
      {
        name: 'Darkleaf Branded Mail',
        expectedAcBonus: 4,
        expectedDexCap: 1,
        expectedCheck: -2,
        expectedSpeed: -5,
        expectedStrength: 14,
        expectedCategory: 'medium',
        expectedGroup: 'chain'
      }
    ];

    describe.each(ARMOR_CONFIGS)('Armor: $name', (armorCfg) => {
      it('should define modern PF2e schema properties in item data', () => {
        const armor = itemMap.get(armorCfg.name);
        expect(armor, `Armor ${armorCfg.name} must exist in item pack`).toBeDefined();
        expect(armor.type).toBe('armor');

        // Modern PF2e fields
        expect(armor.system.acBonus).toBe(armorCfg.expectedAcBonus);
        expect(armor.system.dexCap).toBe(armorCfg.expectedDexCap);
        expect(armor.system.checkPenalty).toBe(armorCfg.expectedCheck);
        expect(armor.system.speedPenalty).toBe(armorCfg.expectedSpeed);
        expect(armor.system.strength).toBe(armorCfg.expectedStrength);
        expect(armor.system.category).toBe(armorCfg.expectedCategory);
        expect(armor.system.group).toBe(armorCfg.expectedGroup);

        // Equipped state must be inSlot: true for character AC calculation
        expect(armor.system.equipped.inSlot).toBe(true);
        expect(armor.system.equipped.carryType).toBe('worn');

        if (armorCfg.expectedTraits) {
          for (const trait of armorCfg.expectedTraits) {
            expect(armor.system.traits.value).toContain(trait);
          }
        }
      });

      it('should properly equip on an actor and provide active AC bonus and Dex cap', () => {
        const armor = itemMap.get(armorCfg.name);
        const actor = createTestActor(`Actor wearing ${armorCfg.name}`, [armor]);
        expect(() => actor.validate()).not.toThrow();

        const equippedItem = actor.items.contents[0];
        expect(equippedItem.system.acBonus).toBe(armorCfg.expectedAcBonus);
        expect(equippedItem.system.dexCap).toBe(armorCfg.expectedDexCap);
        expect(equippedItem.system.equipped.inSlot).toBe(true);
        expect(equippedItem.system.equipped.carryType).toBe('worn');
      });
    });
  });

  describe('Eberron Weapons: Categories, Groups, and Damage Values', () => {
    const WEAPON_CONFIGS = [
      { name: 'Boomerang, Talenta', category: 'martial', group: 'hb_boomerang', die: 'd4', type: 'bludgeoning' },
      { name: "Boomerang, Xen'Drik", category: 'martial', group: 'hb_boomerang', die: 'd4', type: 'slashing' },
      { name: 'Double-Bladed Scimitar', category: 'martial', group: 'sword', die: 'd6', type: 'slashing' },
      { name: 'Gnoll Bow', category: 'advanced', group: 'bow', die: 'd8', type: 'piercing' },
      { name: 'Myrnaxe Axehead', category: 'advanced', group: 'axe', die: 'd12', type: 'slashing' },
      { name: 'Myrnaxe Spearhead', category: 'advanced', group: 'spear', die: 'd6', type: 'piercing' },
      { name: 'Psi-Blade', category: 'simple', group: 'knife', die: 'd4', type: 'piercing' },
      { name: 'Sharrash', category: 'martial', group: 'polearm', die: 'd6', type: 'slashing' },
      { name: 'Tangat', category: 'martial', group: 'sword', die: 'd6', type: 'slashing' }
    ];

    describe.each(WEAPON_CONFIGS)('Weapon: $name', ({ name, category, group, die, type }) => {
      it(`should be a ${category} ${group} dealing 1${die} ${type}`, () => {
        const weapon = itemMap.get(name);
        expect(weapon, `Weapon ${name} must exist`).toBeDefined();
        expect(weapon.type).toBe('weapon');
        expect(weapon.system.category).toBe(category);
        expect(weapon.system.group).toBe(group);
        expect(weapon.system.damage.die).toBe(die);
        expect(weapon.system.damage.damageType).toBe(type);
      });

      it('should equip cleanly on an actor', () => {
        const weapon = itemMap.get(name);
        const actor = createTestActor(`Actor wielding ${name}`, [weapon]);
        expect(() => actor.validate()).not.toThrow();
        expect(actor.items.size).toBe(1);
      });
    });
  });

  describe('Eberron Consumables & Gear: Integrity & Actor Integration', () => {
    it('should cleanly instantiate all consumables on an actor without errors', () => {
      const consumables = [...itemMap.values()].filter(i => i.type === 'consumable');
      expect(consumables.length).toBeGreaterThanOrEqual(25);

      for (const consumable of consumables) {
        const actor = createTestActor(`Actor holding ${consumable.name}`, [consumable]);
        expect(() => actor.validate()).not.toThrow();
      }
    });

    it('should cleanly instantiate all general equipment items on an actor without errors', () => {
      const equipment = [...itemMap.values()].filter(i => i.type === 'equipment');
      expect(equipment.length).toBeGreaterThanOrEqual(70);

      for (const eq of equipment) {
        const actor = createTestActor(`Actor carrying ${eq.name}`, [eq]);
        expect(() => actor.validate()).not.toThrow();
      }
    });
  });

  describe('Full Character Creation Permutations: Ancestry × Background × Heritage × Items', () => {
    const TEST_SCENARIOS = [
      {
        characterName: 'Bastion (Warforged Skirmisher Soldier)',
        ancestry: 'Warforged',
        heritage: 'Skirmisher Warforged',
        background: 'House Agent',
        armor: 'Light Integrated Armour',
        weapon: 'Double-Bladed Scimitar',
        expectedAcBonus: 2,
        expectedDexCap: 3
      },
      {
        characterName: 'Bulwark (Warforged Juggernaut Heavy Guard)',
        ancestry: 'Warforged',
        heritage: 'Juggernaut Warforged',
        background: 'House Scion',
        armor: 'Heavy Integrated Armour',
        weapon: 'Sharrash',
        expectedAcBonus: 6,
        expectedDexCap: 0
      },
      {
        characterName: 'Fang (Beasthide Shifter Hunter)',
        ancestry: 'Shifter',
        heritage: 'Beasthide Shifter',
        background: 'Foundling',
        armor: 'Darkleaf Breastplate',
        weapon: 'Tangat',
        expectedAcBonus: 4,
        expectedDexCap: 2
      },
      {
        characterName: 'Sariel (Mark of Making Human Artificer)',
        ancestry: 'Warforged', // Versatile heritage can attach to any ancestry
        heritage: 'Mark of Making [Versatile (Dragonmarked Ancestries) Heritage]',
        background: 'House Agent',
        armor: 'Light Integrated Armour',
        weapon: 'Psi-Blade',
        expectedAcBonus: 2,
        expectedDexCap: 3
      },
      {
        characterName: 'Thok (Bugbear Raider)',
        ancestry: 'Bugbear',
        heritage: "Ghaal Guul'dar",
        background: 'Excoriate',
        armor: 'Darkleaf Branded Mail',
        weapon: 'Myrnaxe Axehead',
        expectedAcBonus: 4,
        expectedDexCap: 1
      },
      {
        characterName: 'Dax (Persona Changeling Infiltrator)',
        ancestry: 'Eberron Changeling',
        heritage: 'Persona Changeling',
        background: 'House Orphan',
        armor: 'Leafweave',
        weapon: 'Boomerang, Talenta',
        expectedAcBonus: 1,
        expectedDexCap: 4
      }
    ];

    describe.each(TEST_SCENARIOS)('Scenario: $characterName', (scenario) => {
      it('should assemble a complete character and verify all components and AC mechanics', () => {
        const ancestry = ancestryMap.get(scenario.ancestry);
        const heritage = heritageMap.get(scenario.heritage);
        const background = backgroundMap.get(scenario.background);
        const armor = itemMap.get(scenario.armor);
        const weapon = itemMap.get(scenario.weapon);

        expect(ancestry, `Ancestry ${scenario.ancestry} must exist`).toBeDefined();
        expect(heritage, `Heritage ${scenario.heritage} must exist`).toBeDefined();
        expect(background, `Background ${scenario.background} must exist`).toBeDefined();
        expect(armor, `Armor ${scenario.armor} must exist`).toBeDefined();
        expect(weapon, `Weapon ${scenario.weapon} must exist`).toBeDefined();

        const actor = createTestActor(scenario.characterName, [
          ancestry,
          heritage,
          background,
          armor,
          weapon
        ]);

        expect(() => actor.validate()).not.toThrow();
        expect(actor.items.size).toBe(5);

        // Verify armor on actor
        const actorArmor = actor.items.contents.find(i => i.type === 'armor');
        expect(actorArmor).toBeDefined();
        expect(actorArmor.system.acBonus).toBe(scenario.expectedAcBonus);
        expect(actorArmor.system.dexCap).toBe(scenario.expectedDexCap);
        expect(actorArmor.system.equipped.inSlot).toBe(true);

        // Verify background boosts
        const actorBg = actor.items.contents.find(i => i.type === 'background');
        expect(actorBg).toBeDefined();
        expect(actorBg.system.trainedLore).toBe('Dragonmarked Houses');

        // Verify weapon
        const actorWeapon = actor.items.contents.find(i => i.type === 'weapon');
        expect(actorWeapon).toBeDefined();
        expect(actorWeapon.name).toBe(scenario.weapon);
      });
    });
  });
});
