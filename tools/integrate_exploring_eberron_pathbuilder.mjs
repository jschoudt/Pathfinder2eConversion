import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const PACKS_DIR = path.join(ROOT_DIR, 'src', 'packs');
const PB_PATH = path.join(ROOT_DIR, 'pathbuilder-custom-pack', 'pathfinders-guide-to-eberron.json');

function makeUuid(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const pb = JSON.parse(fs.readFileSync(PB_PATH, 'utf-8'));

// 1. Ancestries
const newAncestries = [
  {
    name: "Sahuagin",
    hp: 8,
    abilityBoosts: [0, 4], // Str, Wis
    abilityFlaws: [5],     // Cha
    traits: "3rd Party, Amphibious, Humanoid, Sahuagin, Uncommon",
    description: "Predatory amphibious humanoids of the Thunder Sea, Kar'lassa trenches, and Shargon's Teeth. Sahuagin possess darkvision, amphibious breathing, a swim speed of 25 feet, and deadly natural claw and bite strikes. While surface-dwellers often fear them as 'sea devils', those aligned with the Eternal Dominion or living among landwalkers display profound communal loyalty, shark telepathy, and lethal aquatic martial discipline.",
    languages: "Common, Thalassian"
  },
  {
    name: "Kalamer Landwalker",
    hp: 8,
    abilityBoosts: [1, 5], // Dex, Cha
    abilityFlaws: [4],     // Wis
    traits: "3rd Party, Amphibious, Humanoid, Merfolk, Uncommon",
    description: "Merfolk of the Kalamer alliance who undergo sacred elemental or transmutation rituals to split their tails into legs upon emerging onto dry land. Retaining their aquatic grace and amphibious lungs, landwalkers serve as emissaries, navigators, and traders connecting surface ports such as Stormreach and Sharn with deep underwater civilizations.",
    languages: "Common, Thalassian"
  }
];

const existingAncNames = new Set((pb.listCustomAncestries || []).map(a => a.name));
for (const anc of newAncestries) {
  if (!existingAncNames.has(anc.name)) {
    pb.listCustomAncestries.push({
      name: anc.name,
      id: makeUuid(`pathbuilder.ancestry.${anc.name}`),
      traits: anc.traits,
      hp: anc.hp,
      abilityBoosts: anc.abilityBoosts,
      abilityFlaws: anc.abilityFlaws,
      description: anc.description,
      languages: anc.languages,
      listCustomEffects: [],
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    console.log(`Added Ancestry: ${anc.name}`);
  }
}

// 2. Heritages
const newHeritages = [
  {
    name: "Ruinbound",
    textDescription: "You carry a sympathetic fragment of the Mourning or an ancient Dhakaani/daelkyr ruin fused to your soul and flesh. You gain the Ruinbound versatile heritage trait, darkvision, and you can select Ruinbound ancestry feats.",
    traits: "Versatile, Ruinbound, Rare, 3rd Party"
  },
  {
    name: "Dhakaani Ghaal'dar",
    textDescription: "You were trained in the strict military discipline of the Dhakaani Kech vaults. You gain a +1 circumstance bonus to saving throws against emotion and fear effects. When you fail a check while an ally is within 30 feet, you can gain a +1 circumstance bonus to your reroll once per hour.",
    traits: "Hobgoblin, Dhakaani, Uncommon, 3rd Party"
  },
  {
    name: "Dhakaani Golin'dar",
    textDescription: "Quick folk of the Dhakaani vaults forming the craft and stealth backbone of the empire. Your base land Speed increases by 5 feet (to 30 feet), and you can Tumble Through the space of larger creatures with a +1 circumstance bonus to Acrobatics.",
    traits: "Goblin, Dhakaani, Common, 3rd Party"
  },
  {
    name: "Jhorgun'taal",
    textDescription: "Celebrated in the Shadow Marches as children of two bloods uniting orc and human ancestry. You gain Orc Ferocity, and you become trained in one additional skill of your choice and gain one 1st-level general feat.",
    traits: "Orc, Human, Common, 3rd Party"
  }
];

const existingHerNames = new Set((pb.listCustomHeritages || []).map(h => h.name));
for (const her of newHeritages) {
  if (!existingHerNames.has(her.name)) {
    pb.listCustomHeritages.push({
      id: makeUuid(`pathbuilder.heritage.${her.name}`),
      name: her.name,
      textDescription: her.textDescription,
      traits: her.traits,
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    console.log(`Added Heritage: ${her.name}`);
  }
}

// 3. Backgrounds
const boostMap = { str: "0", dex: "1", con: "2", int: "3", wis: "4", cha: "5" };
const newBackgrounds = [
  {
    name: "Changeling Traveler (Background)",
    boosts: ["dex", "cha"],
    skill: "Society",
    lore: "Settlement Lore",
    feat: "Streetwise",
    desc: "You wander across Khorvaire adopting different personas in every town and enclave, learning regional customs and underworld contacts."
  },
  {
    name: "Dhakaani Goblinoid",
    boosts: ["str", "con"],
    skill: "Athletics",
    lore: "Dhakaani Lore",
    feat: "Hefty Hauler",
    desc: "You were raised inside a subterranean Kech vault adhering strictly to the ancient martial code of the Dhakaani Empire."
  },
  {
    name: "Malenti",
    boosts: ["dex", "int"],
    skill: "Deception",
    lore: "Ocean Lore",
    feat: "Lie to Me",
    desc: "Born of sahuagin parents but bearing the physical form of a sea elf, you were trained as a deep infiltrator and scout."
  }
];

const existingBgNames = new Set((pb.listCustomBackgrounds || []).map(b => b.name));
for (const bg of newBackgrounds) {
  if (!existingBgNames.has(bg.name)) {
    pb.listCustomBackgrounds.push({
      databaseID: 1,
      id: makeUuid(`pathbuilder.background.${bg.name}`),
      name: bg.name,
      traits: "3rd Party, Common",
      boost_ref_1: boostMap[bg.boosts[0]],
      boost_ref_2: boostMap[bg.boosts[1]],
      boost_ref_3: "0",
      freeFeatDetail: `Trained in ${bg.skill} and ${bg.lore}. Gain ${bg.feat}.`,
      skill: bg.skill,
      lore: bg.lore,
      description: bg.desc,
      src: "Pathfinder's Guide to Eberron"
    });
    console.log(`Added Background: ${bg.name}`);
  }
}

// 4. Feats & Class Features
const featFiles = fs.readdirSync(path.join(PACKS_DIR, 'eberron-feats')).filter(f => f.endsWith('.json'));
const classFiles = fs.readdirSync(path.join(PACKS_DIR, 'eberron-classes')).filter(f => f.endsWith('.json'));
const existingFtNames = new Set((pb.listCustomFeats || []).map(f => f.name));

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

for (const f of [...featFiles, ...classFiles]) {
  const dir = featFiles.includes(f) ? 'eberron-feats' : 'eberron-classes';
  const item = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, dir, f), 'utf-8'));
  if (!existingFtNames.has(item.name)) {
    const traitsList = ["3rd Party", ...(item.system.traits?.value || []).map(t => t.charAt(0).toUpperCase() + t.slice(1))];
    pb.listCustomFeats.push({
      id: makeUuid(`pathbuilder.feat.${item.name}`),
      name: item.name,
      level: item.system.level?.value || 1,
      reqSpecials: "",
      textDescription: stripHtml(item.system.description?.value),
      traits: traitsList.join(', '),
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    existingFtNames.add(item.name);
    console.log(`Added Feat: ${item.name}`);
  }
}

// 5. Spells
const spellFiles = fs.readdirSync(path.join(PACKS_DIR, 'eberron-spells')).filter(f => f.endsWith('.json'));
const existingSpNames = new Set((pb.listCustomSpells || []).map(s => s.name));

for (const f of spellFiles) {
  const item = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, 'eberron-spells', f), 'utf-8'));
  if (!existingSpNames.has(item.name)) {
    const isFocus = item.system.category?.value === 'focus';
    const isCantrip = item.system.category?.value === 'cantrip';
    const traitsList = ["3rd Party", ...(item.system.traits?.value || []).map(t => t.charAt(0).toUpperCase() + t.slice(1))];
    pb.listCustomSpells.push({
      uniqueID: makeUuid(`pathbuilder.spell.${item.name}`),
      name: item.name,
      type: isFocus ? "Focus" : (isCantrip ? "Cantrip" : "Spell"),
      level: item.system.level?.value || 1,
      traits: traitsList.join(', '),
      cast: item.system.time?.value || "2 actions",
      descriptionHeightened: stripHtml(item.system.description?.value),
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    existingSpNames.add(item.name);
    console.log(`Added Spell: ${item.name}`);
  }
}

// 6. Weapons
const newWeapons = [
  {
    name: "Shaarat'doovol, the Blade of Truth",
    hands: "1",
    proficiencyType: 2,
    damage: 8,
    damageType: "S",
    group: "Sword",
    weaponTraits: "Magical, Holy, Versatile P, 3rd Party",
    description: "Sentient longsword forged in khaar'draguus. Deals vitality damage against aberrations and grants truesight."
  },
  {
    name: "Keeper's Fang",
    hands: "1",
    proficiencyType: 1,
    damage: 4,
    damageType: "P",
    group: "Knife",
    weaponTraits: "Magical, Agile, Finesse, Thrown 10, Versatile S, 3rd Party",
    description: "Shaarat'khesh assassin dagger with embedded Khyber shard. Soul-severing strike on creatures reduced to 0 HP."
  },
  {
    name: "Hungry Weapon",
    hands: "1",
    proficiencyType: 2,
    damage: 8,
    damageType: "S",
    group: "Sword",
    weaponTraits: "Magical, 3rd Party",
    description: "Organic symbiont weapon burrowing tendrils into the wielder's hand to drain vitality."
  }
];

const existingWpNames = new Set((pb.listCustomWeapons || []).map(w => w.name));
for (const wp of newWeapons) {
  if (!existingWpNames.has(wp.name)) {
    pb.listCustomWeapons.push({
      databaseID: 1,
      uniqueIdentiier: makeUuid(`pathbuilder.weapon.${wp.name}`),
      name: wp.name,
      hands: wp.hands,
      description: wp.description,
      src: "Pathfinder's Guide to Eberron",
      proficiencyType: wp.proficiencyType,
      damage: wp.damage,
      damageType: wp.damageType,
      group: wp.group,
      weaponTraits: wp.weaponTraits
    });
    console.log(`Added Weapon: ${wp.name}`);
  }
}

fs.writeFileSync(PB_PATH, JSON.stringify(pb, null, 2), 'utf-8');
console.log('Successfully updated Pathbuilder pack!');
