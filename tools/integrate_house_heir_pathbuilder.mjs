import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pathbuilderFile = path.resolve('pathbuilder-custom-pack/pathfinders-guide-to-eberron.json');
const pack = JSON.parse(fs.readFileSync(pathbuilderFile, 'utf8'));

const heirs = [
  {
    name: 'House Cannith Heir',
    b1: '3',
    b2: '0',
    skill: 'Crafting',
    lore: 'House Cannith Lore',
    feat: 'Specialty Crafting',
    desc: 'You were raised in the workshops and foundries of House Cannith, learning the secrets of metallurgy, magewright engineering, and magical artifice. Whether hailing from Cannith South in Sharn, Cannith East in Karrnath, or Cannith West in Aundair, you carry the proud lineage of the Mark of Making.'
  },
  {
    name: 'House Deneith Heir',
    b1: '0',
    b2: '5',
    skill: 'Athletics',
    lore: 'House Deneith Lore',
    feat: 'Combat Climber',
    desc: 'You were trained in the martial academies of the Blademark Guild or Sentinel Marshals. House Deneith commands iron military discipline, bodyguard contracts, and martial excellence, holding the destiny of the Mark of Sentinel.'
  },
  {
    name: 'House Ghallanda Heir',
    b1: '5',
    b2: '2',
    skill: 'Diplomacy',
    lore: 'House Ghallanda Lore',
    feat: 'Group Impression',
    desc: 'Born into the hospitable hearths of the Hostelers Guild, you know how to make anyone feel welcome, fed, and secure. From Talenta nomad encampments to grand urban enclaves, House Ghallanda shelters all under the Mark of Hospitality.'
  },
  {
    name: 'House Jorasco Heir',
    b1: '4',
    b2: '2',
    skill: 'Medicine',
    lore: 'House Jorasco Lore',
    feat: 'Battle Medicine',
    desc: 'Raised in the healing houses and sanitariums of House Jorasco, you learned anatomy, pharmacology, and triage. You balance the compassionate preservation of life with the sharp economic realities of the Healers Guild under the Mark of Healing.'
  },
  {
    name: 'House Kundarak Heir',
    b1: '3',
    b2: '4',
    skill: 'Thievery',
    lore: 'House Kundarak Lore',
    feat: 'Subtle Theft',
    desc: 'You trained in the deep vaults of the Mror Holds and Khorvaire\'s banking enclaves. House Kundarak masters warding runes, impenetrable lockwork, and secure banking under the Mark of Warding.'
  },
  {
    name: 'House Lyrandar Heir',
    b1: '1',
    b2: '5',
    skill: 'Nature',
    lore: 'House Lyrandar Lore',
    feat: 'Steady Balance',
    desc: 'You felt the call of storm and sky from childhood. Whether serving aboard a swift elemental airship or seafaring galleon of the Windwrights Guild, House Lyrandar commands the boundless skies under the Mark of Storm.'
  },
  {
    name: 'House Medani Inquisitive Heir',
    b1: '3',
    b2: '4',
    skill: 'Deception',
    lore: 'House Medani Lore',
    feat: 'Lie to Me',
    desc: 'You were trained by the Warning Guild of House Medani to spot deception, anticipate ambush, and piece together fractured clues. You carry the prophetic vigilance of the Mark of Detection.'
  },
  {
    name: 'House Orien Heir',
    b1: '1',
    b2: '2',
    skill: 'Survival',
    lore: 'House Orien Lore',
    feat: 'Terrain Expertise',
    desc: 'You are at home on the move, having traveled the lightning rail tracks and trade routes of the Couriers Guild. House Orien bridges continents and outpaces distance through the Mark of Passage.'
  },
  {
    name: 'House Phiarlan Heir',
    b1: '1',
    b2: '5',
    skill: 'Performance',
    lore: 'House Phiarlan Lore',
    feat: 'Fascinating Performance',
    desc: 'Raised in the Demesnes of Art, you were schooled in music, theatre, and dance—while mastering the quiet observation of the Serpentine Table. House Phiarlan weaves artistry and espionage under the Mark of Shadow.'
  },
  {
    name: 'House Sivis Scribe Heir',
    b1: '3',
    b2: '5',
    skill: 'Society',
    lore: 'House Sivis Lore',
    feat: 'Multilingual',
    desc: 'You were educated in the high libraries of Korranberg and Sivis message stations. Masters of the spoken and written word, House Sivis controls communications, legal notarization, and diplomatic translation under the Mark of Scribing.'
  },
  {
    name: 'House Tharashk Heir',
    b1: '0',
    b2: '4',
    skill: 'Survival',
    lore: 'House Tharashk Lore',
    feat: 'Experienced Tracker',
    desc: 'Hardened in the swamps of the Shadow Marches or prospecting boomtowns of the frontier, you track people, beasts, and dragonshards alike for the Finders Guild under the Mark of Finding.'
  },
  {
    name: 'House Thuranni Heir',
    b1: '1',
    b2: '3',
    skill: 'Stealth',
    lore: 'House Thuranni Lore',
    feat: 'Terrain Stalker',
    desc: 'Since the Shadow Schism split your house from Phiarlan, you have walked the sharp edge of the Truecraft Guild and the Shadow Network. House Thuranni thrives on precision, silent infiltration, and dark secrets under the Mark of Shadow.'
  },
  {
    name: 'House Vadalis Heir',
    b1: '4',
    b2: '0',
    skill: 'Nature',
    lore: 'House Vadalis Lore',
    feat: 'Train Animal',
    desc: 'Raised on the sprawling ranches and breeding sanctuaries of the Eldeen Reaches, you bond with beasts and magebred monstrosities alike. House Vadalis guides biological evolution under the Mark of Handling.'
  },
  {
    name: 'Aberrant Heir',
    b1: '2',
    b2: '5',
    skill: 'Intimidation',
    lore: 'Underworld Lore',
    feat: 'Intimidating Glare',
    desc: 'Your dragonmark is erratic, dangerous, and feared by the Twelve. Whether recruited by House Tarkanan in the lower ruins of Sharn or hiding on the run, you wield destructive aberrant power and an uncanny survival instinct.'
  }
];

if (!pack.listCustomBackgrounds) {
  pack.listCustomBackgrounds = [];
}

let addedCount = 0;
for (const h of heirs) {
  if (pack.listCustomBackgrounds.some(b => b.name === h.name)) {
    console.log(`Skipping already existing: ${h.name}`);
    continue;
  }

  const uuid = crypto.randomUUID();
  const entry = {
    databaseID: 1,
    id: uuid,
    name: h.name,
    traits: '3rd Party, Common',
    boost_ref_1: h.b1,
    boost_ref_2: h.b2,
    freeFeatDetail: h.feat,
    skill: h.skill,
    lore: h.lore,
    description: h.desc,
    src: "Pathfinder's Guide to Eberron"
  };

  pack.listCustomBackgrounds.push(entry);
  addedCount++;
  console.log(`Added: ${h.name}`);
}

fs.writeFileSync(pathbuilderFile, JSON.stringify(pack, null, 2) + '\n', 'utf8');
console.log(`Finished. Total backgrounds in pack: ${pack.listCustomBackgrounds.length} (added ${addedCount})`);
