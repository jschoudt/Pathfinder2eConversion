#!/usr/bin/env node
import { ClassicLevel } from 'classic-level';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

function randomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Cache for core PF2e compendium packs
const corePacksCache = new Map();
const SYSTEM_PACKS_DIR = path.resolve('_foundry/data/Data/systems/pf2e/packs');
const EBERRON_PACKS_DIR = path.resolve('src/packs');

async function getCorePackItems(packName) {
  if (corePacksCache.has(packName)) return corePacksCache.get(packName);
  const p = path.join(SYSTEM_PACKS_DIR, packName);
  const items = [];
  if (existsSync(p)) {
    const db = new ClassicLevel(p, { valueEncoding: 'json' });
    for await (const [key, value] of db.iterator()) {
      items.push({ key, ...value });
    }
    await db.close();
  }
  corePacksCache.set(packName, items);
  return items;
}

// Cache for Eberron conversion source packs
let eberronItemsCache = null;
async function getEberronItems() {
  if (eberronItemsCache) return eberronItemsCache;
  const items = [];
  const dirs = await readdir(EBERRON_PACKS_DIR, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const packPath = path.join(EBERRON_PACKS_DIR, d.name);
    const files = await readdir(packPath);
    for (const f of files) {
      if (f.endsWith('.json')) {
        try {
          const content = JSON.parse(await readFile(path.join(packPath, f), 'utf-8'));
          items.push({ pack: d.name, ...content });
        } catch (_) {}
      }
    }
  }
  eberronItemsCache = items;
  return items;
}

async function findItem(query, packTypes = ['feats', 'class-features', 'equipment', 'spells', 'classes', 'ancestries', 'heritages', 'backgrounds', 'deities']) {
  const qLower = query.toLowerCase().trim();
  
  // 1. First check Eberron conversion packs
  const eberronItems = await getEberronItems();
  const ebMatch = eberronItems.find(i => (i.name && i.name.toLowerCase() === qLower) || (i.system?.slug === qLower));
  if (ebMatch) {
    return JSON.parse(JSON.stringify(ebMatch));
  }

  // 2. Then check core PF2e packs
  for (const pack of packTypes) {
    const coreItems = await getCorePackItems(pack);
    const match = coreItems.find(i => (i.name && i.name.toLowerCase() === qLower) || (i.system?.slug === qLower));
    if (match) {
      return JSON.parse(JSON.stringify(match));
    }
  }

  // Substring fallback
  for (const pack of packTypes) {
    const coreItems = await getCorePackItems(pack);
    const match = coreItems.find(i => i.name && i.name.toLowerCase().includes(qLower));
    if (match) {
      return JSON.parse(JSON.stringify(match));
    }
  }

  return null;
}

function instantiateItem(baseItem, overrides = {}) {
  const cloned = JSON.parse(JSON.stringify(baseItem));
  cloned._id = randomId();
  cloned.effects = cloned.effects || [];
  cloned.folder = null;
  cloned.sort = 0;
  cloned.ownership = { default: 0, pB3LUsQDggXSdM1t: 3 };
  cloned.flags = cloned.flags || {};
  cloned._stats = {
    coreVersion: '14.368',
    systemId: 'pf2e',
    systemVersion: '8.5.1',
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: 'pB3LUsQDggXSdM1t',
    compendiumSource: cloned._stats?.compendiumSource || `Compendium.pf2e.${baseItem.type || 'items'}.Item.${baseItem._id || randomId()}`
  };

  if (overrides.name) cloned.name = overrides.name;
  if (overrides.system) {
    cloned.system = { ...cloned.system, ...overrides.system };
  }
  return cloned;
}

function createSpellcastingEntry({ name, ability, tradition, prepared = 'spontaneous', showSlots = true }) {
  const entryId = randomId();
  const slots = {};
  if (showSlots) {
    slots.slot1 = { max: 4, value: 4 };
    slots.slot2 = { max: 4, value: 4 };
    slots.slot3 = { max: 4, value: 4 };
    slots.slot4 = { max: 4, value: 4 };
    slots.slot5 = { max: 4, value: 4 };
    slots.slot6 = { max: 3, value: 3 };
  }

  return {
    _id: entryId,
    name,
    type: 'spellcastingEntry',
    img: 'systems/pf2e/icons/default-icons/spellcastingEntry.svg',
    system: {
      ability: { value: ability },
      prepared: { value: prepared },
      tradition: { value: tradition },
      proficiency: { slug: '', value: 3 }, // Master spellcaster at 11 or Expert (2/3)
      spelldc: { dc: 0, value: 0 },
      slots,
      autoHeightenLevel: { value: null },
      rules: [],
      publication: { license: 'ORC', remaster: true, title: 'Pathfinder Player Core' },
      _migration: { version: 0.959, previous: null }
    },
    ownership: { default: 0, pB3LUsQDggXSdM1t: 3 },
    effects: [],
    flags: {},
    _stats: {
      coreVersion: '14.368',
      systemId: 'pf2e',
      systemVersion: '8.5.1',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'pB3LUsQDggXSdM1t'
    }
  };
}

export async function buildCharacters() {
  const actorsDbPath = path.resolve('_foundry/data/Data/worlds/pf2e-test/data/actors');
  const db = new ClassicLevel(actorsDbPath, { valueEncoding: 'json' });

  console.log('🚀 Connecting to pf2e-test LevelDB at:', actorsDbPath);

  // Character definitions
  const characterConfigs = [
    // ------------------------------------------------------------------------
    // 1. SIR LUPERCALIA (Worg Bard - College of Dance conversion)
    // ------------------------------------------------------------------------
    {
      name: 'Sir Lupercalia',
      bio: 'An intelligent, refined Worg performer of Droaam and the Great Pack, whose graceful footwork and jaw strikes weave battlefield harmony and deadly rhythm.',
      img: 'ddb-images/characters/134506221-sir-lupercalia.jpeg',
      keyAbility: 'cha',
      boosts: {
        '1': ['dex', 'cha', 'con', 'wis'],
        '5': ['dex', 'cha', 'con', 'wis'],
        '10': ['dex', 'cha', 'str', 'con']
      },
      ancestryName: 'Worg',
      heritageName: 'Great Pack Vanguard',
      backgroundName: 'Entertainer',
      className: 'Bard',
      classFeatures: [
        'Warrior Muse',
        'Spell Repertoire',
        'Bard Spellcasting',
        'Composition Spells',
        'Signature Spells',
        'Expert Spellcaster',
        'Perception Expertise',
        'Reflex Expertise',
        'Weapon Expertise'
      ],
      feats: [
        'Versatile Performance',
        'Courageous Advance',
        'Multifarious Muse',
        'Dirge of Doom',
        'Rallying Anthem',
        'Swashbuckler Dedication',
        'Leading Dance',
        "Swashbuckler's Speed",
        'Acrobatic Performer',
        'Fascinating Performance',
        'Fleet',
        'Toughness'
      ],
      spellcasting: {
        entry: { name: 'Occult Spontaneous Spells', ability: 'cha', tradition: 'occult', prepared: 'spontaneous' },
        spells: [
          // Cantrips
          { name: 'Telekinetic Projectile', rank: 0 },
          { name: 'Guidance', rank: 0 },
          { name: 'Light', rank: 0 },
          { name: 'Prestidigitation', rank: 0 },
          { name: 'Daze', rank: 0 },
          // Rank 1
          { name: 'Soothe', rank: 1 },
          { name: 'Phantasmal Minion', rank: 1 },
          { name: 'Dizzying Colors', rank: 1 },
          // Rank 2
          { name: 'Noise Blast', rank: 2 },
          { name: 'Blur', rank: 2 },
          { name: 'Laughing Fit', rank: 2 },
          // Rank 3
          { name: 'Slow', rank: 3 },
          { name: 'Dispel Magic', rank: 3 },
          { name: 'Heroism', rank: 3 },
          // Rank 4
          { name: 'Invisibility', rank: 4 },
          { name: 'Moonlight Ray', rank: 4 },
          { name: 'Phantasmal Killer', rank: 4 },
          // Rank 5
          { name: 'Synaptic Pulse', rank: 5 },
          { name: 'Shadow Siphon', rank: 5 },
          // Rank 6
          { name: 'Teleport', rank: 6 },
          { name: 'Never Mind', rank: 6 }
        ]
      },
      equipment: [
        { name: 'Handwraps of Mighty Blows', system: { runes: { potency: 2, striking: 1 } }, equipped: true },
        { name: "Explorer's Clothing", system: { runes: { potency: 1, resilient: 1 } }, equipped: true },
        { name: 'Boots of Bounding (Greater)', nameOverride: 'Winged Boots of Bounding', equipped: true },
        { name: 'Cloak of Illusions', nameOverride: 'Instrument & Cloak of Illusions', equipped: true },
        { name: 'Backpack', equipped: true }
      ]
    },

    // ------------------------------------------------------------------------
    // 2. BRUNWULF GHOST BEAR (Shifter Barbarian - Beast & Fighter conversion)
    // ------------------------------------------------------------------------
    {
      name: 'Brunwulf Ghost Bear',
      bio: "A fierce Shifter warrior of the Gatekeeper primal tradition, bound to the spirit of the ancient Ghost Bear. He defends the wilderness and innocent youth against aberrations and corruption.",
      img: 'ddb-images/characters/133496646-brunwulf-ghost-bear.jpeg',
      keyAbility: 'str',
      boosts: {
        '1': ['str', 'con', 'dex', 'wis'],
        '5': ['str', 'con', 'dex', 'wis'],
        '10': ['str', 'con', 'dex', 'wis']
      },
      ancestryName: 'Shifter',
      heritageName: 'Beasthide Shifter',
      backgroundName: 'Nomad',
      className: 'Barbarian',
      classFeatures: [
        'Rage',
        'Animal Instinct',
        'Deny Advantage',
        'Juggernaut',
        'Brutal Bulwark',
        'Weapon Specialization',
        'Greater Juggernaut'
      ],
      feats: [
        'Raging Athlete',
        'Animal Skin',
        'Furious Grab',
        'Predator\'s Pounce',
        'Thrash',
        'Wrestler Dedication',
        'Combat Grab',
        'Suplex',
        'Titan Wrestler',
        'Intimidating Glare',
        'Terrifying Resistance',
        'Diehard',
        'Toughness'
      ],
      spellcasting: null,
      equipment: [
        { name: 'Handwraps of Mighty Blows', system: { runes: { potency: 2, striking: 1 } }, equipped: true },
        { name: 'Belt of Giant Strength', equipped: true },
        { name: 'Ring of the Ram', equipped: true },
        { name: 'Ring of Climbing', nameOverride: 'Ring of the Wilds & Climbing', equipped: true },
        { name: 'Backpack', equipped: true }
      ]
    },

    // ------------------------------------------------------------------------
    // 3. MORLAAK (Orc Cleric of Light / Kalok Shash)
    // ------------------------------------------------------------------------
    {
      name: 'Morlaak',
      bio: 'An Orc scholar and holy warrior of the Binding Flame (Kalok Shash), wielding radiant dawn fire, sunward wards, and adamantine arms to banish darkness and unlife.',
      img: 'ddb-images/characters/159575243-morlaak.jpeg',
      keyAbility: 'wis',
      boosts: {
        '1': ['wis', 'con', 'dex', 'str'],
        '5': ['wis', 'con', 'dex', 'str'],
        '10': ['wis', 'con', 'dex', 'int']
      },
      ancestryName: 'Orc',
      heritageName: 'Hold-Scarred Orc',
      backgroundName: 'Scholar',
      className: 'Cleric',
      classFeatures: [
        'Cloistered Cleric',
        'Divine Font',
        'Divine Spellcasting',
        'Doctrine',
        'Expert Spellcaster',
        'Resolve',
        'Perception Expertise'
      ],
      feats: [
        'Orc Ferocity',
        'Undying Ferocity',
        'Domain Initiate',
        'Advanced Domain',
        'Sentinel Dedication',
        'Steel Skin',
        'Emblazon Armament',
        'Raise Symbol',
        'Channel Smite',
        'Healing Hands',
        'Recognize Spell',
        'Assurance',
        'Shield Block'
      ],
      spellcasting: {
        entry: { name: 'Divine Prepared Spells', ability: 'wis', tradition: 'divine', prepared: 'prepared' },
        spells: [
          // Cantrips
          { name: 'Divine Lance', rank: 0 },
          { name: 'Light', rank: 0 },
          { name: 'Vitality Lash', rank: 0 },
          { name: 'Shield', rank: 0 },
          { name: 'Guidance', rank: 0 },
          // Rank 1
          { name: 'Heal', rank: 1 },
          { name: 'Breathe Fire', rank: 1 },
          { name: 'Sanctuary', rank: 1 },
          // Rank 2
          { name: 'Cleanse Affliction', rank: 2 },
          { name: 'Noise Blast', rank: 2 },
          { name: 'See the Unseen', rank: 2 },
          // Rank 3
          { name: 'Holy Light', rank: 3 },
          { name: 'Crisis of Faith', rank: 3 },
          { name: 'Fireball', rank: 3 },
          // Rank 4
          { name: 'Divine Wrath', rank: 4 },
          { name: 'Vital Beacon', rank: 4 },
          // Rank 5
          { name: 'Breath of Life', rank: 5 },
          { name: 'Flame Strike', rank: 5 },
          // Rank 6
          { name: 'Blade Barrier', rank: 6 },
          { name: 'Sunburst', rank: 6 }
        ]
      },
      equipment: [
        { name: 'Half Plate', system: { runes: { potency: 1, resilient: 1 }, material: { type: 'adamantine', grade: 'standard' } }, equipped: true },
        { name: 'Sturdy Shield', equipped: true },
        { name: 'Sickle', nameOverride: 'Adamantine Sickle +2', system: { runes: { potency: 2, striking: 1 }, material: { type: 'adamantine', grade: 'standard' } }, equipped: true },
        { name: 'Morningstar', system: { runes: { potency: 1, striking: 1 } }, equipped: true },
        { name: 'Religious Symbol (Silver)', nameOverride: 'Amulet of the Devout (Kalok Shash)', equipped: true }
      ]
    },

    // ------------------------------------------------------------------------
    // 4. TALI (Nephilim Celestial Sorcerer - Dolurrhi Lineage)
    // ------------------------------------------------------------------------
    {
      name: 'Tali',
      bio: 'A planar wanderer touched by the quiet shade of Dolurrh, guided by celestial grace. She channels brilliant angelic radiance, searing holy wrath, and communion with spiritual familiars.',
      img: 'ddb-images/characters/134414594-tali.jpeg',
      keyAbility: 'cha',
      boosts: {
        '1': ['cha', 'dex', 'int', 'wis'],
        '5': ['cha', 'dex', 'int', 'wis'],
        '10': ['cha', 'dex', 'con', 'wis']
      },
      ancestryName: 'Human',
      heritageName: 'Nephilim',
      lineageName: 'Dolurrhi Lineage',
      backgroundName: 'Nomad',
      className: 'Sorcerer',
      classFeatures: [
        'Bloodline',
        'Sorcerer Spellcasting',
        'Spell Repertoire',
        'Bloodline Spells',
        'Signature Spells',
        'Sorcerous Potency',
        'Expert Spellcaster'
      ],
      feats: [
        'Bloodline: Angelic',
        'Propelling Sorcery',
        'Advanced Bloodline',
        'Greater Bloodline',
        'Divine Evolution',
        'Familiar Master Dedication',
        'Enhanced Familiar',
        'Incredible Familiar',
        'Cantrip Expansion',
        'Dolurrhi Lineage',
        'Nephilim Eyes',
        'Toughness',
        'Fleet'
      ],
      spellcasting: {
        entry: { name: 'Angelic Divine Spells', ability: 'cha', tradition: 'divine', prepared: 'spontaneous' },
        spells: [
          // Cantrips
          { name: 'Divine Lance', rank: 0 },
          { name: 'Light', rank: 0 },
          { name: 'Daze', rank: 0 },
          { name: 'Guidance', rank: 0 },
          { name: 'Shield', rank: 0 },
          // Rank 1
          { name: 'Heal', rank: 1 },
          { name: 'Holy Light', rank: 1 },
          { name: 'Disguise Magic', rank: 1 },
          // Rank 2
          { name: 'Clear Mind', rank: 2 },
          { name: 'Cleanse Affliction', rank: 2 },
          { name: 'Mist', rank: 2 },
          // Rank 3
          { name: 'Heroism', rank: 3 },
          { name: 'Holy Light', rank: 3 },
          { name: 'Crisis of Faith', rank: 3 },
          // Rank 4
          { name: 'Divine Wrath', rank: 4 },
          { name: 'Wall of Fire', rank: 4 },
          // Rank 5
          { name: 'Spirit Blast', rank: 5 },
          { name: 'Breath of Life', rank: 5 },
          // Rank 6
          { name: 'Divine Decree', rank: 6 },
          { name: 'Spirit Song', rank: 6 }
        ]
      },
      equipment: [
        { name: "Explorer's Clothing", nameOverride: 'Bracers & Vestments of Armor +2', system: { runes: { potency: 2, resilient: 1 } }, equipped: true },
        { name: 'Feather Step Stone', nameOverride: 'Ring of Feather Falling', equipped: true },
        { name: 'Backpack', equipped: true }
      ]
    }
  ];

  // Fetch all existing actor keys to delete any older generated versions
  const allKeys = await db.keys().all();
  for (const config of characterConfigs) {
    console.log(`\n--------------------------------------------------------------`);
    console.log(`🔨 Building Character: ${config.name}`);

    // Check if an actor with this name already exists in pf2e-test
    for (const key of allKeys) {
      if (key.startsWith('!actors!') && !key.includes('.items.')) {
        try {
          const existing = await db.get(key);
          if (existing?.name === config.name) {
            console.log(`   Found existing record (${key}), removing old version...`);
            const subKeys = allKeys.filter(k => k.startsWith(`!actors.items!${existing._id}.`));
            for (const sk of subKeys) await db.del(sk);
            await db.del(key);
          }
        } catch (_) {}
      }
    }

    const actorId = randomId();
    const embeddedItems = [];
    const itemIds = [];

    // Helper to add an embedded item
    const addItem = (item) => {
      embeddedItems.push(item);
      itemIds.push(item._id);
      return item;
    };

    // 1. Ancestry
    const ancestryBase = await findItem(config.ancestryName, ['ancestries']);
    if (ancestryBase) {
      console.log(`   ✓ Adding Ancestry: ${ancestryBase.name}`);
      addItem(instantiateItem(ancestryBase));
    }

    // 2. Heritage
    const heritageBase = await findItem(config.heritageName, ['heritages']);
    if (heritageBase) {
      console.log(`   ✓ Adding Heritage: ${heritageBase.name}`);
      addItem(instantiateItem(heritageBase));
    }

    // 3. Lineage (if separate)
    if (config.lineageName) {
      const lineageBase = await findItem(config.lineageName, ['heritages', 'feats']);
      if (lineageBase) {
        console.log(`   ✓ Adding Lineage: ${lineageBase.name}`);
        addItem(instantiateItem(lineageBase));
      }
    }

    // 4. Background
    const bgBase = await findItem(config.backgroundName, ['backgrounds']);
    if (bgBase) {
      console.log(`   ✓ Adding Background: ${bgBase.name}`);
      addItem(instantiateItem(bgBase));
    }

    // 5. Class
    const classBase = await findItem(config.className, ['classes']);
    if (classBase) {
      console.log(`   ✓ Adding Class: ${classBase.name}`);
      addItem(instantiateItem(classBase));
    }

    // 6. Class Features
    for (const cfName of config.classFeatures || []) {
      const featBase = await findItem(cfName, ['class-features', 'feats']);
      if (featBase) {
        addItem(instantiateItem(featBase));
      }
    }
    console.log(`   ✓ Added ${(config.classFeatures || []).length} class features`);

    // 7. Feats
    for (const featName of config.feats || []) {
      const featBase = await findItem(featName, ['feats', 'class-features']);
      if (featBase) {
        addItem(instantiateItem(featBase));
      } else {
        console.warn(`     ⚠️ Feat not found in packs: ${featName}`);
      }
    }
    console.log(`   ✓ Added ${(config.feats || []).length} feats`);

    // 8. Spellcasting Entry & Spells
    if (config.spellcasting) {
      const spellEntry = createSpellcastingEntry(config.spellcasting.entry);
      addItem(spellEntry);
      console.log(`   ✓ Added Spellcasting Entry: ${spellEntry.name}`);

      let spellsAdded = 0;
      for (const spDef of config.spellcasting.spells || []) {
        const spellBase = await findItem(spDef.name, ['spells']);
        if (spellBase) {
          const spellInstance = instantiateItem(spellBase, {
            system: {
              location: {
                value: spellEntry._id,
                heightenedLevel: spDef.rank || spellBase.system?.level?.value || 1
              }
            }
          });
          addItem(spellInstance);
          spellsAdded++;
        } else {
          console.warn(`     ⚠️ Spell not found in packs: ${spDef.name}`);
        }
      }
      console.log(`   ✓ Attached ${spellsAdded} spells to spellcasting repertoire`);
    }

    // 9. Equipment
    for (const eqDef of config.equipment || []) {
      const eqBase = await findItem(eqDef.name, ['equipment']);
      if (eqBase) {
        const eqInstance = instantiateItem(eqBase, {
          name: eqDef.nameOverride || eqBase.name,
          system: {
            equipped: { carryType: 'worn', inSlot: eqDef.equipped !== false, invested: true },
            ...(eqDef.system || {})
          }
        });
        addItem(eqInstance);
      } else {
        console.warn(`     ⚠️ Equipment not found in packs: ${eqDef.name}`);
      }
    }
    console.log(`   ✓ Added ${(config.equipment || []).length} equipment items`);

    // Construct Actor Document
    const actorDoc = {
      _id: actorId,
      name: config.name,
      type: 'character',
      img: config.img || 'systems/pf2e/icons/default-icons/character.svg',
      ownership: {
        default: 1,
        pB3LUsQDggXSdM1t: 3
      },
      prototypeToken: {
        name: config.name,
        actorLink: true,
        texture: {
          src: config.img || 'systems/pf2e/icons/default-icons/character.svg'
        },
        sight: { enabled: true, range: 0, visionMode: 'basic' },
        flags: {
          pf2e: { linkToActorSize: true, autoscale: true }
        }
      },
      system: {
        attributes: {
          hp: { value: 120, temp: 0 }
        },
        initiative: { statistic: 'perception' },
        details: {
          level: { value: 11 },
          biography: {
            backstory: `<p>${config.bio}</p>`,
            appearance: '',
            visibility: { appearance: true, backstory: true, personality: true, campaign: false }
          },
          keyability: { value: config.keyAbility || 'str' },
          languages: { value: ['common'], details: '' },
          xp: { value: 0, min: 0, max: 1000 }
        },
        resources: {
          heroPoints: { value: 1, max: 3 }
        },
        build: {
          attributes: {
            boosts: config.boosts || {
              '1': ['str', 'dex', 'con', 'wis'],
              '5': ['str', 'dex', 'con', 'wis'],
              '10': ['str', 'dex', 'con', 'wis']
            }
          }
        },
        _migration: { version: 0.959, previous: null }
      },
      items: itemIds,
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      _stats: {
        coreVersion: '14.368',
        systemId: 'pf2e',
        systemVersion: '8.5.1',
        createdTime: Date.now(),
        modifiedTime: Date.now(),
        lastModifiedBy: 'pB3LUsQDggXSdM1t'
      }
    };

    // Commit actor and embedded items to LevelDB
    await db.put(`!actors!${actorId}`, actorDoc);
    for (const item of embeddedItems) {
      await db.put(`!actors.items!${actorId}.${item._id}`, item);
    }
    console.log(`   ✨ Successfully created ${config.name} (Actor ID: ${actorId}) with ${embeddedItems.length} embedded items!`);
  }

  await db.close();
  console.log('\n🎉 Finished creating all 4 characters in pf2e-test world database!');
}

buildCharacters().catch(console.error);
