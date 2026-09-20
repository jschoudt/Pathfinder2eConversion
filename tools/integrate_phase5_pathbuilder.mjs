import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pathbuilderFile = path.resolve('pathbuilder-custom-pack/pathfinders-guide-to-eberron.json');
const pack = JSON.parse(fs.readFileSync(pathbuilderFile, 'utf8'));

if (!pack.listCustomWeapons) pack.listCustomWeapons = [];
if (!pack.listCustomArmor) pack.listCustomArmor = [];
if (!pack.listCustomFeats) pack.listCustomFeats = [];

let addedWeapons = 0;
if (!pack.listCustomWeapons.some(w => w.name === 'Tentacle Whip')) {
  pack.listCustomWeapons.push({
    databaseID: 1,
    uniqueIdentiier: crypto.randomUUID(),
    name: 'Tentacle Whip',
    hands: '1',
    description: 'This supple, barbed tentacle bonds with your wrist and forearm, feeding through microscopic capillaries. It functions as a +1 striking whip that deals 1d6 slashing damage, has the agile and finesse traits, and extends your reach to 10 feet. On a critical hit, the venom inflicts stupefied 1.',
    src: "Pathfinder's Guide to Eberron",
    proficiencyType: 2,
    damage: 6,
    damageType: 'S',
    group: 'Flail',
    weaponTraits: 'Agile, Finesse, Reach, Trip, Symbiont, 3rd Party'
  });
  addedWeapons++;
}

let addedArmor = 0;
if (!pack.listCustomArmor.some(a => a.name === 'Living Breastplate')) {
  pack.listCustomArmor.push({
    databaseID: 1,
    uniqueIdentiier: crypto.randomUUID(),
    name: 'Living Breastplate',
    price: 1000,
    bulk: '1',
    description: 'This chitinous breastplate of alien tendon, shell, and pulsating muscle grafts directly to your ribs and torso upon investment. It acts as a +1 resilient breastplate. The breastplate constantly filters your bodily fluids, granting you a +1 item bonus to Fortitude saving throws against poisons and diseases, and you recover 5 Hit Points every 10 minutes.',
    src: "Pathfinder's Guide to Eberron",
    acBonus: 4,
    strength: 14,
    dexCap: 2,
    checkPenalty: -1,
    speedPenalty: 0,
    armorTraits: '3rd Party, Symbiont, Invested, Magical'
  });
  addedArmor++;
}

if (!pack.listCustomArmor.some(a => a.name === 'Atchaas Armor')) {
  pack.listCustomArmor.push({
    databaseID: 1,
    uniqueIdentiier: crypto.randomUUID(),
    name: 'Atchaas Armor',
    price: 700,
    bulk: '3',
    description: 'Crafted by ancient Dhakaani daashor smiths from folded adamantine and inscribed with runes of atchaas (martial honor and solemn resolve), this suit of full plate functions as +1 resilient adamantine full plate. The wearer embodies the unyielding courage of the empire, gaining complete immunity to the frightened condition and a +2 circumstance bonus to saving throws against emotion and mental effects.',
    src: "Pathfinder's Guide to Eberron",
    acBonus: 6,
    strength: 18,
    dexCap: 0,
    checkPenalty: -3,
    speedPenalty: -10,
    armorTraits: '3rd Party, Invested, Magical'
  });
  addedArmor++;
}

let addedFeats = 0;
if (!pack.listCustomFeats.some(f => f.name === 'Breed Leech')) {
  pack.listCustomFeats.push({
    id: crypto.randomUUID(),
    name: 'Breed Leech',
    level: 8,
    traits: 'Symbiont, Invested, Magical, 3rd Party',
    textDescription: 'A thick, rubbery daelkyr organism that attaches to the base of your spine. The leech feeds constantly on your blood, imparting the drained 1 condition while it remains invested (this condition cannot be removed until the leech is uninvested). In return, the creature absorbs devastating physical shock: you gain complete immunity to the extra damage from critical hits and precision damage, treating all critical hits against you as normal hits.',
    src: "Pathfinder's Guide to Eberron",
    databaseID: 1
  });
  addedFeats++;
}

fs.writeFileSync(pathbuilderFile, JSON.stringify(pack, null, 2), 'utf8');
console.log(`Added ${addedWeapons} weapons, ${addedArmor} armors, and ${addedFeats} feats/symbionts to Pathbuilder pack.`);
