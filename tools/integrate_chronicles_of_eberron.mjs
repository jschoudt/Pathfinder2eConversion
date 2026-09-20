#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const PACKS_DIR = path.join(ROOT_DIR, 'src/packs');
const PATHBUILDER_FILE = path.join(ROOT_DIR, 'pathbuilder-custom-pack/pathfinders-guide-to-eberron.json');

function genId(slug) {
  return crypto.createHash('sha256').update(slug).digest('hex').slice(0, 16);
}

function getBaseSystem(slug, traits, rarity = 'common', page = 'N/A') {
  return {
    source: {
      value: `Chronicles of Eberron, p. ${page}`,
      page: 'N/A'
    },
    publication: {
      title: 'Chronicles of Eberron',
      authors: 'Keith Baker',
      license: 'DMs Guild Community Content Agreement',
      remaster: true,
      page: 'N/A'
    },
    rules: [],
    slug,
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
      value: traits,
      rarity,
      custom: ''
    }
  };
}

function getStats() {
  return {
    systemId: 'pf2e',
    systemVersion: '8.5.1',
    coreVersion: '14.368',
    createdTime: Date.now(),
    modifiedTime: Date.now(),
    lastModifiedBy: 'lxzmymmFddOcN8CB'
  };
}

// 1. Backgrounds
const backgrounds = [
  {
    name: 'Displaced Noble',
    slug: 'displaced-noble',
    page: 19,
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 19–20), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>You were born into wealth, power, and prestige in the Five Nations—perhaps an aristocratic prince of fallen Cyre, or a minor baron whose ancestral lands were scorched, annexed, or ruined during the Last War. While your estate and riches may be gone, your pedigree remains undeniable. Royalists, expatriates, and commoners who still revere the old nobility treat you with quiet reverence and offer aid.</p><p>Choose two attribute boosts. One must be to <strong>Charisma</strong> or <strong>Constitution</strong>, and one is a free attribute boost.</p><p>You are trained in the <strong>Society</strong> skill and the <strong>Last War Lore</strong> skill. You gain the <strong>Courtly Graces</strong> skill feat.</p>',
    boosts: {
      '0': { value: ['cha', 'con'] },
      '1': { value: ['cha', 'con', 'dex', 'int', 'str', 'wis'] }
    },
    trainedSkills: { value: ['soc'], custom: '' },
    trainedLore: 'Last War Lore'
  },
  {
    name: 'Newly Risen Noble',
    slug: 'newly-risen-noble',
    page: 20,
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 20–21), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>You or your immediate forebears earned elevation into the aristocracy during the crucible of the Last War. Whether knighted on the battlefield for acts of desperate valor, rewarded with land by a desperate monarch, or buying titles through aggressive war-profiteering, you are an upstart in the noble courts. While blueblooded scions may whisper behind your back, you have real momentum and practical experience.</p><p>Choose two attribute boosts. One must be to <strong>Strength</strong> or <strong>Charisma</strong>, and one is a free attribute boost.</p><p>You are trained in the <strong>Diplomacy</strong> skill and the <strong>Mercantile Lore</strong> skill. You gain the <strong>Hobnobber</strong> skill feat.</p>',
    boosts: {
      '0': { value: ['str', 'cha'] },
      '1': { value: ['cha', 'con', 'dex', 'int', 'str', 'wis'] }
    },
    trainedSkills: { value: ['dip'], custom: '' },
    trainedLore: 'Mercantile Lore'
  },
  {
    name: 'Disgraced Noble',
    slug: 'disgraced-noble',
    page: 21,
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 21–22), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>You were born to the heights of high society, but a public scandal, treasonous intrigue, devastating court trial, or ruinous financial collapse stripped your family of title and honor. Whether you were framed by rival courtiers or are completely guilty of the crimes alleged against you, your name is synonymous with disgrace. You now navigate the shadows and the underworld, where pedigree counts for little and cunning is everything.</p><p>Choose two attribute boosts. One must be to <strong>Dexterity</strong> or <strong>Charisma</strong>, and one is a free attribute boost.</p><p>You are trained in the <strong>Deception</strong> skill and the <strong>Underworld Lore</strong> skill. You gain the <strong>Confabulator</strong> skill feat.</p>',
    boosts: {
      '0': { value: ['dex', 'cha'] },
      '1': { value: ['cha', 'con', 'dex', 'int', 'str', 'wis'] }
    },
    trainedSkills: { value: ['dec'], custom: '' },
    trainedLore: 'Underworld Lore'
  }
];

// 2. Heritages
const heritages = [
  {
    name: 'Lorghalan Gnome',
    slug: 'lorghalan-gnome',
    page: 59,
    traits: ['gnome'],
    rarity: 'uncommon',
    ancestry: { name: 'Gnome', slug: 'gnome' },
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 58–60), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>You hail from the isolated, jungle-covered island of Lorghalan, where gnomes live in vibrant communion with the primal manifest zones of Lamannia. Rather than the political subterfuge of Zilargo, you practice stonesinging—using melodic resonance to speak with beasts, soothe waves, and cooperate with elemental spirits. You know one primal cantrip of your choice from the following: <em>gale blast</em>, <em>guidance</em>, or <em>tremor sense</em>. You can cast this spell as an innate primal spell at will. In addition, you gain a +1 circumstance bonus to Diplomacy checks when negotiating with elementals, beasts, and primal creatures.</p>'
  }
];

// 3. Feats
const feats = [
  {
    name: 'Tairnadal Revenant',
    slug: 'tairnadal-revenant',
    page: 49,
    level: 2,
    traits: ['champion', 'archetype'],
    rarity: 'uncommon',
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 49–50), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Prerequisites:</strong> Follower of the Spirits of the Past or Tairnadal elf; Champion or martial class</p><p>You have dedicated your life to emulating the legendary exploits of a patron ancestor of the Tairnadal elves. You gain the <strong>Aura of the Paragon</strong> reaction.</p><p><strong>Aura of the Paragon</strong> [reaction] (divine, emotion, holy); <strong>Trigger:</strong> You or an ally within your 15-foot emanation successfully hits an enemy with a Strike; <strong>Effect:</strong> You channel the martial frenzy of your patron ancestor, urging the attack onward. The triggering Strike deals an additional 1d4 holy spirit damage (increasing to 2d4 at 10th level and 3d4 at 16th level). If you have an animal companion or divine steed, your companion also benefits from your champion aura and deals this bonus damage on its attacks.</p>'
  },
  {
    name: 'Stonesinger',
    slug: 'stonesinger',
    page: 59,
    level: 2,
    traits: ['druid', 'bard', 'archetype'],
    rarity: 'uncommon',
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 59–60), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Prerequisites:</strong> Trained in Performance and Nature, or Lorghalan Gnome</p><p>You have mastered the harmonic methods of Lorghalan, using music and primal melodies to shape the elements. You can substitute your Performance modifier for Nature checks when commanding or calming elementals and beasts. When Activating or Crafting primal magic items, wands, and elemental vessels, you can use Performance in place of Nature. Furthermore, you gain the <em>Stonesinger’s Melodic Accord</em> focus cantrip: as a single action, grant an allied elemental, construct, or beast within 30 feet a +1 status bonus to attack rolls and AC for 1 round.</p>'
  },
  {
    name: 'Defiled Gift Spellshape',
    slug: 'defiled-gift-spellshape',
    page: 95,
    level: 4,
    traits: ['cleric', 'oracle', 'witch', 'spellshape'],
    rarity: 'uncommon',
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 95, 97), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Frequency:</strong> once per minute</p><p>[one-action] You invoke the dark transactional bargains of the Shadow or the Dark Six, sacrificing vitality to amplify magical recovery. If your next action is to Cast a Spell from spell slots that restores Hit Points to an ally, either you or a willing ally within your reach sacrifices vital essence, taking 1d6 void damage per spell rank (which cannot be reduced in any way). In exchange, the healing spell surges with power, restoring an additional 2d6 Hit Points to the target.</p>'
  },
  {
    name: 'Reverse Speech Spellshape',
    slug: 'reverse-speech-spellshape',
    page: 95,
    level: 8,
    traits: ['bard', 'sorcerer', 'witch', 'spellshape'],
    rarity: 'uncommon',
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 95, 97), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>[one-action] You utter your incantations backward, weaving the disturbing and forbidden phonetic paradoxes of the Shadow into the spell’s fabric. If your next action is to Cast a Spell with verbal components that inflicts the <strong>frightened</strong> condition, you can choose instead for affected targets to become <strong>off-guard</strong> and <strong>fascinated</strong> by you for the duration. If the spell would instead cause a target to become <strong>fascinated</strong> or charmed, you can choose instead for the target to become <strong>frightened 2</strong>.</p>'
  }
];

// 4. Spells
const spells = [
  {
    name: 'Awaken Ambition',
    slug: 'awaken-ambition',
    page: 95,
    level: 1,
    traits: ['cleric', 'focus', 'divine', 'void'],
    school: '',
    category: 'focus',
    traditions: ['divine'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 93, 95), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Cast:</strong> [one-action] somatic</p><p><strong>Area:</strong> 30-foot emanation; <strong>Targets:</strong> you and up to 3 willing allies</p><p><strong>Duration:</strong> 1 minute</p><hr /><p>You invoke the Sovereign of Ambition, converting present pain into irresistible drive. Each target takes 1d4 void damage per spell rank (which cannot be reduced). In exchange, each target gains temporary Hit Points equal to twice the damage taken for the duration, and gains a +1 status bonus to its next attack roll or skill check made within 1 round.</p><p><strong>Heightened (+1):</strong> The void damage taken increases by 1d4, granting twice that amount in temporary Hit Points.</p>'
  },
  {
    name: "Shadow's Gifts",
    slug: 'shadows-gifts',
    page: 95,
    level: 4,
    traits: ['cleric', 'focus', 'divine', 'morph'],
    school: '',
    category: 'focus',
    traditions: ['divine'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 93, 95), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Cast:</strong> [two-actions] verbal, somatic</p><p><strong>Range:</strong> Touch; <strong>Target:</strong> 1 willing creature</p><p><strong>Duration:</strong> 1 minute</p><hr /><p>You awaken dark, monstrous adaptations taught by the Shadow to the warlords of Droaam. Choose one of the following gifts:</p><ul><li><strong>Eyes of the Medusa:</strong> The target gains a petrifying gaze. Once per round as a single action, the target can gaze upon a creature within 30 feet; the creature must succeed at a Fortitude save against your spell DC or become <strong>clumsy 1</strong> and have its Speeds reduced by 10 feet for 1 round (critical failure: <strong>clumsy 2</strong> and immobilized for 1 round).</li><li><strong>Heart of the Troll:</strong> The target gains <strong>fast healing 5</strong>. If the target takes acid or fire damage, this fast healing ceases to function until the end of its next turn.</li><li><strong>Mastery of the Hag:</strong> The target gains a +2 status bonus to Deception and Intimidation checks, and can cast <em>illusory disguise</em> at will as an innate divine spell.</li></ul><p><strong>Heightened (7th):</strong> Fast healing increases to 10; the Medusa gaze also causes the target to be <strong>slowed 1</strong> on a failure.</p>'
  },
  {
    name: "Fury's Chorus",
    slug: 'furys-chorus',
    page: 98,
    level: 1,
    traits: ['mental', 'emotion'],
    school: '',
    category: 'spell',
    traditions: ['divine', 'occult'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 96, 98), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Cast:</strong> [two-actions] verbal, somatic</p><p><strong>Range:</strong> 60 feet; <strong>Area:</strong> 20-foot burst</p><p><strong>Defense:</strong> Will; <strong>Duration:</strong> 1 minute</p><hr /><p>You utter chaotic, shrieking discord that fans the flames of fury and distrust. Each enemy in the area must attempt a Will saving throw.</p><ul><li><strong>Critical Success:</strong> The creature is unaffected.</li><li><strong>Success:</strong> For 1 round, the creature cannot distinguish friend from foe when deciding to make reactions (if an ally provokes a reaction such as Reactive Strike, it must use its reaction if available).</li><li><strong>Failure:</strong> As success, but for 1 minute. The target may attempt a new Will save at the end of each of its turns to end the effect.</li><li><strong>Critical Failure:</strong> As failure, and the creature is also <strong>confused</strong> for 1 round.</li></ul>'
  },
  {
    name: "Keeper's Vault",
    slug: 'keepers-vault',
    page: 98,
    level: 2,
    traits: ['void'],
    school: '',
    category: 'spell',
    traditions: ['divine', 'occult'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 96, 98), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Cast:</strong> [two-actions] verbal, somatic; <strong>Focus:</strong> an unlit lantern worth at least 5 gp</p><p><strong>Range:</strong> 60 feet; <strong>Target:</strong> 1 living creature</p><p><strong>Defense:</strong> Fortitude; <strong>Duration:</strong> Sustained up to 1 minute</p><hr /><p>You pull a fragment of the target\'s living soul into your focus lantern, igniting it with ghostly, pale luminescence that sheds dim light in a 20-foot radius. The target takes 2d6 void damage (basic Fortitude save). Each time you Sustain the spell, the lantern continues to siphon the tethered soul, dealing 2d6 void damage (basic Fortitude save). If the target dies while its soul is bound in the lantern, it cannot be raised from the dead by magic of equal or lower rank until the lantern is physically shattered or dispelled.</p><p><strong>Heightened (+1):</strong> The void damage increases by 1d6.</p>'
  }
];

// 5. Items & Equipment
const items = [
  {
    name: 'Sentira Hand Lens',
    slug: 'sentira-hand-lens',
    page: 186,
    type: 'weapon',
    rarity: 'uncommon',
    traits: ['martial', 'ranged', 'occult', 'mind', 'nonlethal'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>Crafted by Sarlonan psionic artificers from <em>sentira</em>—a pearlescent material forged from solidified ectoplasm and distilled human emotion—this hand-held projector channels the wielder\'s latent psionic resonance into harmful bolts of telepathic force. It deals 1d6 mental damage with a range increment of 40 feet, using no physical ammunition.</p>',
    system: {
      category: 'martial',
      group: 'sling',
      damage: { dice: 1, die: 'd6', damageType: 'mental' },
      range: 40,
      reload: { value: '0' },
      bulk: { value: 'L' },
      hands: { value: '1' },
      price: { value: { gp: 15 } },
      level: { value: 1 }
    }
  },
  {
    name: 'Sentira Light Lens',
    slug: 'sentira-light-lens',
    page: 186,
    type: 'weapon',
    rarity: 'uncommon',
    traits: ['martial', 'ranged', 'occult', 'mind', 'concussive', 'two-hand'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>The standard-issue psionic projection carbine of Riedra\'s Harmonious Shield. Wielded with two hands, it amplifies psychic impulses into concussive telepathic shockwaves. Deals 1d8 mental damage with a range increment of 60 feet.</p>',
    system: {
      category: 'martial',
      group: 'bow',
      damage: { dice: 1, die: 'd8', damageType: 'mental' },
      range: 60,
      reload: { value: '0' },
      bulk: { value: '1' },
      hands: { value: '2' },
      price: { value: { gp: 30 } },
      level: { value: 2 }
    }
  },
  {
    name: 'Sentira Heavy Lens',
    slug: 'sentira-heavy-lens',
    page: 186,
    type: 'weapon',
    rarity: 'rare',
    traits: ['martial', 'ranged', 'occult', 'mind', 'fatal-d12', 'two-hand'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>A heavy, long-barreled psionic cannon featuring large sentira and crysteel resonant focus prisms. Capable of unleashing catastrophic psychic trauma at extreme distances, dealing 1d10 mental damage (fatal d12) with a range increment of 100 feet.</p>',
    system: {
      category: 'martial',
      group: 'crossbow',
      damage: { dice: 1, die: 'd10', damageType: 'mental' },
      range: 100,
      reload: { value: '1' },
      bulk: { value: '2' },
      hands: { value: '2' },
      price: { value: { gp: 70 } },
      level: { value: 4 }
    }
  },
  {
    name: 'Sentira Shard of Anxiety',
    slug: 'sentira-shard-of-anxiety',
    page: 186,
    type: 'equipment',
    rarity: 'uncommon',
    traits: ['consumable', 'magical', 'occult', 'emotion', 'mental', 'talisman'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Price:</strong> 12 gp; <strong>Bulk:</strong> —; <strong>Level:</strong> 3</p><p><strong>Usage:</strong> affixed to a sentira lens or ranged weapon</p><p><strong>Trigger:</strong> You hit a creature with a Strike using the affixed weapon.</p><p><strong>Effect:</strong> The shard shatters, releasing sharp pulses of psychic panic. The target must succeed at a DC 19 Will save or become <strong>frightened 1</strong> (or <strong>frightened 2</strong> on a critical failure).</p>',
    system: {
      level: { value: 3 },
      price: { value: { gp: 12 } },
      bulk: { value: '-' }
    }
  },
  {
    name: 'Sentira Shard of Dread',
    slug: 'sentira-shard-of-dread',
    page: 186,
    type: 'equipment',
    rarity: 'uncommon',
    traits: ['consumable', 'magical', 'occult', 'emotion', 'mental', 'talisman'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Price:</strong> 45 gp; <strong>Bulk:</strong> —; <strong>Level:</strong> 6</p><p><strong>Usage:</strong> affixed to a sentira lens or ranged weapon</p><p><strong>Trigger:</strong> You hit a creature with a Strike using the affixed weapon.</p><p><strong>Effect:</strong> Heavy emotional distress floods the target\'s mind. The target must succeed at a DC 22 Will save or become <strong>stupefied 1</strong> for 1 minute (critical failure: <strong>stupefied 2</strong>).</p>',
    system: {
      level: { value: 6 },
      price: { value: { gp: 45 } },
      bulk: { value: '-' }
    }
  },
  {
    name: 'Sentira Shard of Grief',
    slug: 'sentira-shard-of-grief',
    page: 186,
    type: 'equipment',
    rarity: 'uncommon',
    traits: ['consumable', 'magical', 'occult', 'emotion', 'mental', 'talisman'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 186–187), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Price:</strong> 20 gp; <strong>Bulk:</strong> —; <strong>Level:</strong> 4</p><p><strong>Usage:</strong> affixed to a sentira lens or ranged weapon</p><p><strong>Trigger:</strong> You hit a creature with a Strike using the affixed weapon.</p><p><strong>Effect:</strong> Overwhelming sorrow weighs down the target. The target must succeed at a DC 20 Fortitude save or take a -10-foot status penalty to all Speeds and become <strong>clumsy 1</strong> for 1 round.</p>',
    system: {
      level: { value: 4 },
      price: { value: { gp: 20 } },
      bulk: { value: '-' }
    }
  },
  {
    name: 'Cannith Spellbolt',
    slug: 'cannith-spellbolt',
    page: 17,
    type: 'equipment',
    rarity: 'common',
    traits: ['consumable', 'magical'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 17–18), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Price:</strong> 3 gp; <strong>Bulk:</strong> —; <strong>Level:</strong> 1</p><p>A precision-machined steel bolt inscribed with elemental conduits by House Cannith. When fired as part of a ranged Strike, the bolt detonates upon striking the target, dealing an additional 1d6 damage of a chosen energy type (acid, cold, electricity, or fire, chosen upon creation). On a critical hit, the elemental charge splashes, inflicting 1 persistent damage of that type.</p>',
    system: {
      level: { value: 1 },
      price: { value: { gp: 3 } },
      bulk: { value: '-' }
    }
  },
  {
    name: 'Crossbow Silencer',
    slug: 'crossbow-silencer',
    page: 16,
    type: 'equipment',
    rarity: 'uncommon',
    traits: ['magical'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 16–17), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p><strong>Price:</strong> 25 gp; <strong>Bulk:</strong> L; <strong>Level:</strong> 2</p><p>An acoustic muffling attachment engineered by Cannith for the King\'s Dark Lanterns. Fitted over the prod and string of a crossbow, it reduces the release snap to an imperceptible whisper. Ranged Strikes made with the crossbow do not automatically reveal your position if you miss while hidden or undetected, and creatures take a -2 circumstance penalty to Perception checks to locate the shot\'s origin.</p>',
    system: {
      level: { value: 2 },
      price: { value: { gp: 25 } },
      bulk: { value: 'L' }
    }
  }
];

// 6. Creatures
const creatures = [
  {
    name: 'Mordain the Fleshweaver',
    slug: 'mordain-the-fleshweaver',
    page: 169,
    level: 18,
    rarity: 'unique',
    traits: ['medium', 'elf', 'humanoid'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 165–170), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>Exiled centuries ago from the Twelve for his grotesque transmutation experiments, Mordain dwells in the twisted manor of Blackroot in Droaam. Part elf and part living chimera, Mordain has rewritten his own anatomy and that of countless beasts, crafting aberrant monstrosities with horrifying mastery.</p>',
    hp: 310,
    ac: 42,
    perception: 32,
    saves: { fort: 30, ref: 28, will: 34 }
  },
  {
    name: 'Avassh, the Twister of Roots',
    slug: 'avassh-the-twister-of-roots',
    page: 176,
    level: 22,
    rarity: 'unique',
    traits: ['huge', 'aberration', 'plant'],
    description: '<p><strong>Reference:</strong> <em>Chronicles of Eberron</em> (p. 171–177), by Keith Baker (<a href="https://www.dmsguild.com/product/415474/Chronicles-of-Eberron">DMs Guild</a>)</p><p>The daelkyr lord of corrupted flora, rot, and predatory plant life. Avassh reaches out from its Khyber demiplane through ancient root systems, warping ancient forests, transforming trees into ravenous blights, and seeking to subsume all mortal biology into one boundless, rotting organism.</p>',
    hp: 450,
    ac: 47,
    perception: 39,
    saves: { fort: 39, ref: 34, will: 38 }
  }
];

function writeJson(dir, filename, data) {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`[CREATED] ${path.relative(ROOT_DIR, filePath)}`);
}

async function main() {
  console.log('=== Generating Chronicles of Eberron Packs ===');

  // Backgrounds
  const bgDir = path.join(PACKS_DIR, 'eberron-backgrounds');
  for (const bg of backgrounds) {
    const id = genId(bg.slug);
    const data = {
      _id: id,
      name: bg.name,
      type: 'background',
      img: 'systems/pf2e/icons/default-icons/background.svg',
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      system: {
        ...getBaseSystem(bg.slug, [], 'common', bg.page),
        description: { value: bg.description },
        boosts: bg.boosts,
        trainedSkills: bg.trainedSkills,
        trainedLore: bg.trainedLore,
        items: {}
      },
      _stats: getStats(),
      _key: `!items!${id}`
    };
    writeJson(bgDir, `${bg.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  // Heritages
  const herDir = path.join(PACKS_DIR, 'eberron-heritages');
  for (const her of heritages) {
    const id = genId(her.slug);
    const data = {
      _id: id,
      name: her.name,
      type: 'heritage',
      img: 'systems/pf2e/icons/default-icons/heritage.svg',
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      system: {
        ...getBaseSystem(her.slug, her.traits, her.rarity, her.page),
        description: { value: her.description },
        ancestry: her.ancestry
      },
      _stats: getStats(),
      _key: `!items!${id}`
    };
    writeJson(herDir, `${her.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  // Feats
  const featDir = path.join(PACKS_DIR, 'eberron-feats');
  for (const feat of feats) {
    const id = genId(feat.slug);
    const data = {
      _id: id,
      name: feat.name,
      type: 'feat',
      img: 'systems/pf2e/icons/default-icons/feat.svg',
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      system: {
        ...getBaseSystem(feat.slug, feat.traits, feat.rarity, feat.page),
        description: { value: feat.description },
        level: { value: feat.level },
        category: 'class',
        onlyLevel1: false,
        maxTakable: 1,
        actionType: { value: 'action' },
        actions: { value: 1 }
      },
      _stats: getStats(),
      _key: `!items!${id}`
    };
    writeJson(featDir, `${feat.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  // Spells
  const spellDir = path.join(PACKS_DIR, 'eberron-spells');
  for (const spell of spells) {
    const id = genId(spell.slug);
    const data = {
      _id: id,
      name: spell.name,
      type: 'spell',
      img: 'systems/pf2e/icons/default-icons/spell.svg',
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      system: {
        ...getBaseSystem(spell.slug, spell.traits, 'common', spell.page),
        description: { value: spell.description },
        level: { value: spell.level },
        category: { value: spell.category },
        traditions: { value: spell.traditions, custom: '' },
        school: { value: spell.school },
        time: { value: '2' },
        target: { value: '' },
        range: { value: '' },
        area: null,
        duration: { value: '' },
        defense: null
      },
      _stats: getStats(),
      _key: `!items!${id}`
    };
    writeJson(spellDir, `${spell.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  // Items
  const itemDir = path.join(PACKS_DIR, 'eberron-items');
  for (const it of items) {
    const id = genId(it.slug);
    const data = {
      _id: id,
      name: it.name,
      type: it.type,
      img: 'systems/pf2e/icons/default-icons/equipment.svg',
      effects: [],
      folder: null,
      sort: 0,
      flags: {},
      system: {
        ...getBaseSystem(it.slug, it.traits, it.rarity, it.page),
        description: { value: it.description },
        ...(it.system || {})
      },
      _stats: getStats(),
      _key: `!items!${id}`
    };
    writeJson(itemDir, `${it.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  // Creatures
  const creatureDir = path.join(PACKS_DIR, 'eberron-creatures');
  for (const cr of creatures) {
    const id = genId(cr.slug);
    const data = {
      name: cr.name,
      type: 'npc',
      prototypeToken: {
        flags: { pf2e: { linkToActorSize: true, autoscale: true } },
        name: cr.name,
        displayName: 0,
        actorLink: false,
        texture: { src: 'systems/pf2e/icons/default-icons/npc.svg', scaleX: 1, scaleY: 1 },
        disposition: -1,
        bar1: { attribute: 'attributes.hp' }
      },
      system: {
        attributes: {
          hp: { value: cr.hp, max: cr.hp, temp: 0, details: '' },
          ac: { value: cr.ac, details: '' },
          perception: { value: cr.perception },
          speed: { value: 30, otherSpeeds: [] }
        },
        perception: {
          mod: cr.perception
        },
        saves: {
          fortitude: { value: cr.saves.fort },
          reflex: { value: cr.saves.ref },
          will: { value: cr.saves.will }
        },
        details: {
          level: { value: cr.level },
          alignment: { value: 'NE' },
          publicNotes: cr.description,
          source: { value: `Chronicles of Eberron, p. ${cr.page}`, page: 'N/A' },
          publication: {
            title: 'Chronicles of Eberron',
            authors: 'Keith Baker',
            license: 'DMs Guild Community Content Agreement',
            remaster: true,
            page: 'N/A'
          }
        },
        traits: {
          value: cr.traits,
          rarity: cr.rarity,
          size: { value: cr.traits.includes('huge') ? 'huge' : 'med' }
        },
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
        }
      },
      items: [],
      _id: id,
      _stats: getStats(),
      _key: `!actors!${id}`
    };
    writeJson(creatureDir, `${cr.name.replace(/[^a-zA-Z0-9]/g, '_')}_${id}.json`, data);
  }

  console.log('\n=== Integrating into Pathbuilder Custom Pack ===');
  const pbData = JSON.parse(fs.readFileSync(PATHBUILDER_FILE, 'utf8'));

  // Integrate Backgrounds
  for (const bg of backgrounds) {
    if (!pbData.listCustomBackgrounds.some(b => b.name === bg.name)) {
      pbData.listCustomBackgrounds.push({
        id: crypto.randomUUID(),
        name: bg.name,
        traits: '3rd Party, Common',
        boost_ref_1: bg.boosts['0'].value[0] === 'cha' ? '5' : '1',
        boost_ref_2: '0',
        boost_ref_3: '0',
        freeFeatDetail: `${bg.name}. Reference: Chronicles of Eberron (p. ${bg.page}), by Keith Baker.`,
        src: `Chronicles of Eberron, p. ${bg.page}`
      });
      console.log(`[Pathbuilder BG] Added ${bg.name}`);
    }
  }

  // Integrate Heritages
  for (const her of heritages) {
    if (!pbData.listCustomHeritages.some(h => h.name === her.name)) {
      pbData.listCustomHeritages.push({
        id: crypto.randomUUID(),
        name: her.name,
        textDescription: `Reference: Chronicles of Eberron (p. ${her.page}), by Keith Baker.<br><br>${her.description.replace(/<[^>]+>/g, ' ')}`,
        traits: 'Gnome, 3rd Party, Uncommon',
        src: `Chronicles of Eberron, p. ${her.page}`
      });
      console.log(`[Pathbuilder Heritage] Added ${her.name}`);
    }
  }

  // Integrate Feats
  for (const feat of feats) {
    if (!pbData.listCustomFeats.some(f => f.name === feat.name)) {
      pbData.listCustomFeats.push({
        id: crypto.randomUUID(),
        name: feat.name,
        level: feat.level,
        traits: feat.traits.join(', '),
        textDescription: `<b>Reference:</b> <em>Chronicles of Eberron</em> (p. ${feat.page}), by Keith Baker.<br><br>${feat.description.replace(/<[^>]+>/g, ' ')}`,
        src: `Chronicles of Eberron, p. ${feat.page}`
      });
      console.log(`[Pathbuilder Feat] Added ${feat.name}`);
    }
  }

  // Integrate Spells
  for (const spell of spells) {
    if (!pbData.listCustomSpells.some(s => s.name === spell.name)) {
      pbData.listCustomSpells.push({
        uniqueID: crypto.randomUUID(),
        name: spell.name,
        type: spell.category === 'focus' ? 'Focus' : 'Spell',
        level: spell.level,
        traits: spell.traits.join(', '),
        cast: 'verbal, somatic',
        descriptionHeightened: `<b>Reference:</b> <em>Chronicles of Eberron</em> (p. ${spell.page}), by Keith Baker.<br><br>${spell.description.replace(/<[^>]+>/g, ' ')}`,
        src: `Chronicles of Eberron, p. ${spell.page}`
      });
      console.log(`[Pathbuilder Spell] Added ${spell.name}`);
    }
  }

  // Integrate Weapons
  for (const it of items.filter(i => i.type === 'weapon')) {
    if (!pbData.listCustomWeapons.some(w => w.name === it.name)) {
      pbData.listCustomWeapons.push({
        uniqueIdentiier: crypto.randomUUID(),
        name: it.name,
        hands: String(it.system.hands.value),
        description: `Reference: Chronicles of Eberron (p. ${it.page}), by Keith Baker. ${it.description.replace(/<[^>]+>/g, ' ')}`,
        src: `Chronicles of Eberron, p. ${it.page}`
      });
      console.log(`[Pathbuilder Weapon] Added ${it.name}`);
    }
  }

  fs.writeFileSync(PATHBUILDER_FILE, JSON.stringify(pbData, null, 2) + '\n', 'utf8');
  console.log('[SAVED] Pathbuilder pack updated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
