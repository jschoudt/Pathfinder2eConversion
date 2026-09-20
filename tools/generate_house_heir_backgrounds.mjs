import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const backgroundsDir = path.resolve('src/packs/eberron-backgrounds');

const houseHeirs = [
  {
    name: 'House Cannith Heir',
    slug: 'house-cannith-heir',
    boosts: ['int', 'str'],
    skill: 'cra',
    skillName: 'Crafting',
    lore: 'House Cannith Lore',
    featName: "Specialty Crafting",
    mark: 'Mark of Making',
    desc: 'You were raised in the workshops and foundries of House Cannith, learning the secrets of metallurgy, magewright engineering, and magical artifice. Whether hailing from Cannith South in Sharn, Cannith East in Karrnath, or Cannith West in Aundair, you carry the proud lineage of the Mark of Making.'
  },
  {
    name: 'House Deneith Heir',
    slug: 'house-deneith-heir',
    boosts: ['str', 'cha'],
    skill: 'ath',
    skillName: 'Athletics',
    lore: 'House Deneith Lore',
    featName: 'Combat Climber',
    mark: 'Mark of Sentinel',
    desc: 'You were trained in the martial academies of the Blademark Guild or Sentinel Marshals. House Deneith commands iron military discipline, bodyguard contracts, and martial excellence, holding the destiny of the Mark of Sentinel.'
  },
  {
    name: 'House Ghallanda Heir',
    slug: 'house-ghallanda-heir',
    boosts: ['cha', 'con'],
    skill: 'dip',
    skillName: 'Diplomacy',
    lore: 'House Ghallanda Lore',
    featName: 'Group Impression',
    mark: 'Mark of Hospitality',
    desc: 'Born into the hospitable hearths of the Hostelers Guild, you know how to make anyone feel welcome, fed, and secure. From Talenta nomad encampments to grand urban enclaves, House Ghallanda shelters all under the Mark of Hospitality.'
  },
  {
    name: 'House Jorasco Heir',
    slug: 'house-jorasco-heir',
    boosts: ['wis', 'con'],
    skill: 'med',
    skillName: 'Medicine',
    lore: 'House Jorasco Lore',
    featName: 'Battle Medicine',
    mark: 'Mark of Healing',
    desc: 'Raised in the healing houses and sanitariums of House Jorasco, you learned anatomy, pharmacology, and triage. You balance the compassionate preservation of life with the sharp economic realities of the Healers Guild under the Mark of Healing.'
  },
  {
    name: 'House Kundarak Heir',
    slug: 'house-kundarak-heir',
    boosts: ['int', 'wis'],
    skill: 'thi',
    skillName: 'Thievery',
    lore: 'House Kundarak Lore',
    featName: 'Subtle Theft',
    mark: 'Mark of Warding',
    desc: 'You trained in the deep vaults of the Mror Holds and Khorvaire\'s banking enclaves. House Kundarak masters warding runes, impenetrable lockwork, and secure banking under the Mark of Warding.'
  },
  {
    name: 'House Lyrandar Heir',
    slug: 'house-lyrandar-heir',
    boosts: ['dex', 'cha'],
    skill: 'nat',
    skillName: 'Nature',
    lore: 'House Lyrandar Lore',
    featName: 'Steady Balance',
    mark: 'Mark of Storm',
    desc: 'You felt the call of storm and sky from childhood. Whether serving aboard a swift elemental airship or seafaring galleon of the Windwrights Guild, House Lyrandar commands the boundless skies under the Mark of Storm.'
  },
  {
    name: 'House Medani Inquisitive Heir',
    slug: 'house-medani-inquisitive-heir',
    boosts: ['int', 'wis'],
    skill: 'dec',
    skillName: 'Deception',
    lore: 'House Medani Lore',
    featName: 'Lie to Me',
    mark: 'Mark of Detection',
    desc: 'You were trained by the Warning Guild of House Medani to spot deception, anticipate ambush, and piece together fractured clues. You carry the prophetic vigilance of the Mark of Detection.'
  },
  {
    name: 'House Orien Heir',
    slug: 'house-orien-heir',
    boosts: ['dex', 'con'],
    skill: 'sur',
    skillName: 'Survival',
    lore: 'House Orien Lore',
    featName: 'Terrain Expertise',
    mark: 'Mark of Passage',
    desc: 'You are at home on the move, having traveled the lightning rail tracks and trade routes of the Couriers Guild. House Orien bridges continents and outpaces distance through the Mark of Passage.'
  },
  {
    name: 'House Phiarlan Heir',
    slug: 'house-phiarlan-heir',
    boosts: ['dex', 'cha'],
    skill: 'prf',
    skillName: 'Performance',
    lore: 'House Phiarlan Lore',
    featName: 'Fascinating Performance',
    mark: 'Mark of Shadow',
    desc: 'Raised in the Demesnes of Art, you were schooled in music, theatre, and dance—while mastering the quiet observation of the Serpentine Table. House Phiarlan weaves artistry and espionage under the Mark of Shadow.'
  },
  {
    name: 'House Sivis Scribe Heir',
    slug: 'house-sivis-scribe-heir',
    boosts: ['int', 'cha'],
    skill: 'soc',
    skillName: 'Society',
    lore: 'House Sivis Lore',
    featName: 'Multilingual',
    mark: 'Mark of Scribing',
    desc: 'You were educated in the high libraries of Korranberg and Sivis message stations. Masters of the spoken and written word, House Sivis controls communications, legal notarization, and diplomatic translation under the Mark of Scribing.'
  },
  {
    name: 'House Tharashk Heir',
    slug: 'house-tharashk-heir',
    boosts: ['str', 'wis'],
    skill: 'sur',
    skillName: 'Survival',
    lore: 'House Tharashk Lore',
    featName: 'Experienced Tracker',
    mark: 'Mark of Finding',
    desc: 'Hardened in the swamps of the Shadow Marches or prospecting boomtowns of the frontier, you track people, beasts, and dragonshards alike for the Finders Guild under the Mark of Finding.'
  },
  {
    name: 'House Thuranni Heir',
    slug: 'house-thuranni-heir',
    boosts: ['dex', 'int'],
    skill: 'ste',
    skillName: 'Stealth',
    lore: 'House Thuranni Lore',
    featName: 'Terrain Stalker',
    mark: 'Mark of Shadow',
    desc: 'Since the Shadow Schism split your house from Phiarlan, you have walked the sharp edge of the Truecraft Guild and the Shadow Network. House Thuranni thrives on precision, silent infiltration, and dark secrets under the Mark of Shadow.'
  },
  {
    name: 'House Vadalis Heir',
    slug: 'house-vadalis-heir',
    boosts: ['wis', 'str'],
    skill: 'nat',
    skillName: 'Nature',
    lore: 'House Vadalis Lore',
    featName: 'Train Animal',
    mark: 'Mark of Handling',
    desc: 'Raised on the sprawling ranches and breeding sanctuaries of the Eldeen Reaches, you bond with beasts and magebred monstrosities alike. House Vadalis guides biological evolution under the Mark of Handling.'
  },
  {
    name: 'Aberrant Heir',
    slug: 'aberrant-heir',
    boosts: ['con', 'cha'],
    skill: 'itm',
    skillName: 'Intimidation',
    lore: 'Underworld Lore',
    featName: 'Intimidating Glare',
    mark: 'Aberrant Mark',
    desc: 'Your dragonmark is erratic, dangerous, and feared by the Twelve. Whether recruited by House Tarkanan in the lower ruins of Sharn or hiding on the run, you wield destructive aberrant power and an uncanny survival instinct.'
  }
];

for (const h of houseHeirs) {
  const deterministicId = crypto.createHash('sha256').update(h.slug).digest('hex').slice(0, 16);
  const boostNames = h.boosts.map(b => {
    switch (b) {
      case 'str': return 'Strength';
      case 'dex': return 'Dexterity';
      case 'con': return 'Constitution';
      case 'int': return 'Intelligence';
      case 'wis': return 'Wisdom';
      case 'cha': return 'Charisma';
      default: return b;
    }
  }).join('</strong> or <strong>');

  const doc = {
    _id: deterministicId,
    name: h.name,
    type: 'background',
    img: 'systems/pf2e/icons/default-icons/background.svg',
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      source: {
        value: "Pathfinder's Guide to Eberron",
        page: 'N/A'
      },
      publication: {
        title: "Pathfinder's Guide to Eberron",
        authors: '',
        license: 'ORC',
        remaster: true,
        page: 'N/A'
      },
      rules: [],
      slug: h.slug,
      schema: {
        version: 0.959,
        lastMigration: {
          datetime: null,
          version: {
            schema: 0.959,
            foundry: '14.368',
            system: '8.5.1'
          }
        }
      },
      _migration: {
        version: 0.959,
        previous: null
      },
      traits: {
        value: [],
        rarity: 'common',
        custom: ''
      },
      description: {
        value: `<p>${h.desc}</p><p>Choose two attribute boosts. One must be to <strong>${boostNames}</strong>, and one is a free attribute boost.</p><p>You're trained in the <strong>${h.skillName}</strong> skill and the <strong>${h.lore}</strong> skill. You gain the <strong>${h.featName}</strong> skill feat. You have access to ${h.mark} feats.</p>`
      },
      boosts: {
        '0': {
          value: h.boosts
        },
        '1': {
          value: ['cha', 'con', 'dex', 'int', 'str', 'wis']
        }
      },
      trainedSkills: {
        value: [h.skill],
        custom: ''
      },
      trainedLore: h.lore,
      items: {}
    },
    _stats: {
      systemId: 'pf2e',
      systemVersion: '8.5.1',
      coreVersion: '14.368',
      createdTime: 1726848000000,
      modifiedTime: 1726848000000,
      lastModifiedBy: 'lxzmymmFddOcN8CB'
    },
    _key: `!items!${deterministicId}`
  };

  const safeFilename = `${h.name.replace(/[^a-zA-Z0-9]/g, '_')}_${deterministicId}.json`;
  const targetPath = path.join(backgroundsDir, safeFilename);
  fs.writeFileSync(targetPath, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`Created: ${safeFilename}`);
}
