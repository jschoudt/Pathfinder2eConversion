import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const pathbuilderFile = path.resolve('pathbuilder-custom-pack/pathfinders-guide-to-eberron.json');
const pack = JSON.parse(fs.readFileSync(pathbuilderFile, 'utf8'));

const newFeats = [
  {
    name: 'Leyline Cartographer Innovation',
    level: 1,
    traits: 'Inventor, Artificer, Class Feature, 3rd Party',
    textDescription: 'You study the subtle energetic geography of the world, charting the metaphysical leylines and planar conduits that crisscross Eberron. You are trained in Surveying Lore and ignore non-magical difficult terrain. You gain the Survey the Ley Lines action and can place Waypoint Anchors to guide dimensional movement.'
  },
  {
    name: 'Dreadnaught Armor Model',
    level: 1,
    traits: 'Inventor, Artificer, Class Feature, 3rd Party',
    textDescription: 'An innovation modification engineered for heavy frontline siege operations and unstoppable momentum. Your innovation armor gains the Bulwark trait and grants you a +1 circumstance bonus to Athletics checks to Shove or Trip. It serves as the chassis for heavy demolition attacks like Force Demolisher Strike.'
  },
  {
    name: 'Survey the Ley Lines',
    level: 1,
    actions: 1,
    traits: 'Inventor, Artificer, 3rd Party',
    textDescription: '<b>Requirements</b> You are an inventor with the Leyline Cartographer innovation or have surveyed the local landscape.<br><br>You scan the ambient magical topography and read the subtle ebb and flow of leylines across the battlefield. You and all allies within a 30-foot emanation gain a +10-foot status bonus to Speed for 1 round.'
  },
  {
    name: 'Force Demolisher Strike',
    level: 4,
    actions: 2,
    traits: 'Inventor, Artificer, 3rd Party',
    textDescription: '<b>Requirements</b> You are wearing your Dreadnaught Armor innovation or wielding an innovation weapon.<br><br>You channel concentrated kinetic and magical pressure through your innovation actuators. Make a melee Strike against a creature or structure. The Strike deals an additional 1d6 force damage (scaling to 2d6 at 10th level and 3d6 at 16th level). If the target is an object, construct, or barrier, this Strike ignores half of its Hardness.'
  },
  {
    name: 'Leyline Shifting',
    level: 8,
    actions: 2,
    traits: 'Inventor, Artificer, 3rd Party',
    textDescription: '<b>Prerequisites</b> Leyline Cartographer Innovation<br><br>You pulse harmonic resonance into the bedrock, warping the local dimensional geometry. You designate a 20-foot burst within 60 feet. You can choose whether the affected terrain becomes difficult terrain or ceases to be difficult terrain. Additionally, you can move one willing ally inside the burst up to 15 feet to an unoccupied space within the burst without triggering reactions.'
  },
  {
    name: 'Giant Stature Overcharge',
    level: 12,
    actions: 1,
    traits: 'Inventor, Artificer, Unstable, 3rd Party',
    textDescription: '<b>Prerequisites</b> Dreadnaught Armor Model or Armor Innovation<br><br>You route surging volatile energy through the expansion plates of your armor chassis. You grow to Large size (or Huge if you were already Large), increasing your reach by 10 feet and gaining a +2 status bonus to melee damage for 1 minute. While overcharged, your armor\'s Bulwark modifier increases by 1.'
  },
  {
    name: 'Quick-Draw Wand',
    level: 2,
    actions: 1,
    traits: 'Gunslinger, Archetype, 3rd Party',
    textDescription: '<b>Prerequisites</b> Way of the Wandslinger or Wandslinger Dedication<br><br>You draw a wand or stave from your bandolier or holster with lightning speed and immediately Cast a Spell or Activate an item from that wand or stave.'
  },
  {
    name: 'Wand Dueling',
    level: 4,
    traits: 'Gunslinger, Archetype, 3rd Party',
    textDescription: '<b>Prerequisites</b> Way of the Wandslinger or Wandslinger Dedication<br><br>When wielding a wand or staff in one hand and your other hand is free, you gain a +1 circumstance bonus to AC against ranged attacks and spell attacks, and a +1 circumstance bonus on spell attack rolls made using your wands.'
  },
  {
    name: 'Deflective Cantrip',
    level: 6,
    traits: 'Gunslinger, Archetype, Reaction, 3rd Party',
    textDescription: '<b>Trigger</b> You are targeted by a ranged Strike or spell attack roll.<br><b>Requirements</b> You are wielding a wand charged with a cantrip or have a prepared cantrip wand.<br><br>You flick your wand to snap a defensive kinetic or elemental arc in the path of the incoming attack. You gain a +2 circumstance bonus to AC against the triggering attack. If the attack misses, and was a spell attack roll, you deflect the magical energy harmlessly into the ground.'
  },
  {
    name: 'Tendril Whip Stance',
    level: 1,
    actions: 1,
    traits: 'Monk, Stance, 3rd Party',
    textDescription: '<b>Requirements</b> Warrior of the Living Weapon or Monk<br><br>You alter your physical anatomy—extending sinew, elongating bone spurs, or unfurling symbiotic lashers. While in this stance, the only Strikes you can make are tendril whip unarmed attacks. These deal 1d6 piercing or slashing damage; have the agile, finesse, reach 10 ft, and trip traits; and are in the brawling weapon group.'
  },
  {
    name: 'Carapace Stance',
    level: 4,
    actions: 1,
    traits: 'Monk, Stance, 3rd Party',
    textDescription: '<b>Requirements</b> Warrior of the Living Weapon or Monk<br><br>Your skin hardens into thick chitin, segmented plates, or living composite armor. While in this stance, your unarmed attacks deal 1d8 bludgeoning damage and gain the parry trait. Additionally, you gain resistance to physical damage (except adamantine or byeshk) equal to half your level, and you gain a +1 circumstance bonus to AC against ranged attacks.'
  }
];

const newSpells = [
  {
    name: 'Waypoint Anchor',
    type: 'Focus',
    level: 1,
    actions: 2,
    traits: 'inventor, artificer, focus, teleportation, 3rd Party',
    range: '60 feet',
    cast: 'focus, somatic',
    descriptionHeightened: 'You anchor a resonant dimensional beacon to a point on the ground within range. The beacon lasts for 1 minute. While the anchor persists, you and any willing ally within 30 feet of you can spend 1 action to immediately teleport adjacent to the anchor, provided there is an unoccupied space available. A creature can only warp to the anchor once per round.<br><br><b>Heightened (+2)</b> The range increases by 30 feet, and the duration increases by 1 minute.'
  }
];

if (!pack.listCustomFeats) pack.listCustomFeats = [];
if (!pack.listCustomSpells) pack.listCustomSpells = [];

let addedFeats = 0;
for (const feat of newFeats) {
  if (!pack.listCustomFeats.some(f => f.name === feat.name)) {
    pack.listCustomFeats.push({
      id: crypto.randomUUID(),
      name: feat.name,
      level: feat.level,
      actions: feat.actions || undefined,
      traits: feat.traits,
      textDescription: feat.textDescription,
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    addedFeats++;
  }
}

let addedSpells = 0;
for (const spell of newSpells) {
  if (!pack.listCustomSpells.some(s => s.name === spell.name)) {
    pack.listCustomSpells.push({
      uniqueID: crypto.randomUUID(),
      name: spell.name,
      type: spell.type,
      level: spell.level,
      actions: spell.actions,
      traits: spell.traits,
      range: spell.range,
      cast: spell.cast,
      descriptionHeightened: spell.descriptionHeightened,
      src: "Pathfinder's Guide to Eberron",
      databaseID: 1
    });
    addedSpells++;
  }
}

fs.writeFileSync(pathbuilderFile, JSON.stringify(pack, null, 2), 'utf8');
console.log(`Added ${addedFeats} feats and ${addedSpells} spells to Pathbuilder custom pack.`);
console.log(`Total feats: ${pack.listCustomFeats.length}, Total spells: ${pack.listCustomSpells.length}`);
