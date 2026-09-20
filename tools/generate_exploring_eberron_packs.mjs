import fs from 'fs';
import path from 'path';

const PACKS_ROOT = path.resolve('src/packs');

function getBaseSystem(slug, traits, rarity = 'common') {
  return {
    source: {
      value: "Pathfinder's Guide to Eberron",
      page: "N/A"
    },
    publication: {
      title: "Pathfinder's Guide to Eberron",
      authors: "",
      license: "ORC",
      remaster: true,
      page: "N/A"
    },
    rules: [],
    slug,
    schema: {
      version: 0.959,
      lastMigration: {
        datetime: null,
        version: {
          schema: 0.959,
          foundry: "14.368",
          system: "8.5.1"
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
      custom: ""
    }
  };
}

function getStats() {
  return {
    systemId: "pf2e",
    systemVersion: "8.5.1",
    coreVersion: "14.368",
    createdTime: 1726848000000,
    modifiedTime: 1726848000000,
    lastModifiedBy: "lxzmymmFddOcN8CB"
  };
}

// 1. Ancestries
const ancestries = [
  {
    _id: "a5c9f13e778401b2",
    name: "Sahuagin",
    type: "ancestry",
    img: "systems/pf2e/icons/default-icons/ancestry.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("sahuagin", ["humanoid", "amphibious", "sahuagin"], "uncommon"),
      description: {
        value: `<p><em>Spawned in the oceanic trenches of the Thunder Sea, the sahuagin are masters of the Eternal Dominion, possessing shark-like predatory instincts, armored scales, and webbed claws.</em></p>
<hr />
<h2>You might…</h2>
<ul>
<li>View land-dwellers with curious bewilderment, pitying their inability to perceive currents or swim three-dimensionally.</li>
<li>Channel instinctual predatory focus when the scent of blood enters the water or air.</li>
<li>Honor the Devourer as the primordial lord of storms, reefs, and oceanic fury.</li>
</ul>
<h2>Others Probably…</h2>
<ul>
<li>Fear your predatory gaze, sharp teeth, and fearsome reputation as a monster of the depths.</li>
<li>Rely on your aquatic speed, underwater breathing, and peerless tracking to navigate coastal and oceanic hazards.</li>
<li>Expect you to be superstitious or wary of prolonged time away from fresh or salt water.</li>
</ul>`
      },
      hp: 8,
      size: "med",
      reach: 5,
      speed: 25,
      boosts: {
        "0": { value: ["str"] },
        "1": { value: ["con"] },
        "2": { value: ["cha", "con", "dex", "int", "str", "wis"] }
      },
      flaws: {
        "0": { value: ["cha"] }
      },
      languages: {
        value: ["common"],
        custom: "Sahuagin, Aquan"
      },
      additionalLanguages: {
        value: [],
        count: 1,
        custom: ""
      },
      items: {},
      vision: "darkvision"
    },
    _stats: getStats(),
    _key: "!items!a5c9f13e778401b2"
  },
  {
    _id: "b7e2c94a50d182f4",
    name: "Kalamer Landwalker",
    type: "ancestry",
    img: "systems/pf2e/icons/default-icons/ancestry.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("kalamer-landwalker", ["humanoid", "amphibious", "merfolk"], "rare"),
      description: {
        value: `<p><em>Kalamer merfolk of the Thunder Sea blessed with the ancient oceanic gift to transform their piscine fluke into humanoid legs to walk the surface world.</em></p>
<hr />
<h2>You might…</h2>
<ul>
<li>Marvel at surface architecture, fire, and the sensation of walking upon solid stone or soil.</li>
<li>Maintain a deep, reverent bond with the tides, moon cycles, and coastal currents.</li>
<li>Express complex emotions through underwater trills, oceanic songs, or flowing hand gestures.</li>
</ul>
<h2>Others Probably…</h2>
<ul>
<li>Are astonished by your ability to shift between a swimming tail and human-like legs.</li>
<li>Rely on your maritime knowledge, weather intuition, and swimming mastery.</li>
<li>Assume you are homesick or uncomfortable when away from bodies of water.</li>
</ul>`
      },
      hp: 8,
      size: "med",
      reach: 5,
      speed: 25,
      boosts: {
        "0": { value: ["dex"] },
        "1": { value: ["wis"] },
        "2": { value: ["cha", "con", "dex", "int", "str", "wis"] }
      },
      flaws: {
        "0": { value: ["con"] }
      },
      languages: {
        value: ["common"],
        custom: "Aquan"
      },
      additionalLanguages: {
        value: [],
        count: 1,
        custom: ""
      },
      items: {},
      vision: "lowLightVision"
    },
    _stats: getStats(),
    _key: "!items!b7e2c94a50d182f4"
  }
];

// 2. Heritages
const heritages = [
  {
    _id: "c81d4e6b90f25a17",
    name: "Ruinbound",
    type: "heritage",
    img: "systems/pf2e/icons/default-icons/heritage.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("ruinbound", ["ruinbound"], "rare"),
      description: {
        value: "<p>Born to parents exposed to Daelkyr corruption or the depths of the War Below, you enter the world permanently fused to an inseparable personal symbiont. You gain darkvision, poison resistance equal to half your level (minimum 1), and can invest one additional symbiotic item without counting against your investment limit.</p>"
      },
      ancestry: null
    },
    _stats: getStats(),
    _key: "!items!c81d4e6b90f25a17"
  },
  {
    _id: "d92f5a7c01b36c28",
    name: "Dhakaani Ghaal'dar",
    type: "heritage",
    img: "systems/pf2e/icons/default-icons/heritage.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("dhakaani-ghaal-dar", ["hobgoblin", "dhakaani"], "uncommon"),
      description: {
        value: "<p>You were trained in the military discipline of the Dhakaani Kech vaults. You gain a +1 circumstance bonus to saving throws against emotion and fear effects. In addition, when you fail a check while at least one ally is within 30 feet, you can gain a +1 circumstance bonus to the reroll once per hour.</p>"
      },
      ancestry: null
    },
    _stats: getStats(),
    _key: "!items!d92f5a7c01b36c28"
  },
  {
    _id: "ea3a6b8d12c47d39",
    name: "Dhakaani Golin'dar",
    type: "heritage",
    img: "systems/pf2e/icons/default-icons/heritage.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("dhakaani-golin-dar", ["goblin", "dhakaani"], "common"),
      description: {
        value: "<p>Quick folk of the Dhakaani vaults who form the vital craft and stealth backbone of the empire. Your base land Speed increases by 5 feet (to 30 feet), and you can Tumble Through the space of larger creatures with a +1 circumstance bonus to Acrobatics.</p>"
      },
      ancestry: null
    },
    _stats: getStats(),
    _key: "!items!ea3a6b8d12c47d39"
  },
  {
    _id: "fb4b7c9e23d58e4a",
    name: "Jhorgun'taal",
    type: "heritage",
    img: "systems/pf2e/icons/default-icons/heritage.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("jhorgun-taal", ["orc", "human"], "common"),
      description: {
        value: "<p>Celebrated in the Shadow Marches as children of two bloods uniting orc and human ancestry. You gain Orc Ferocity, and you become trained in one additional skill of your choice and gain one 1st-level general feat.</p>"
      },
      ancestry: null
    },
    _stats: getStats(),
    _key: "!items!fb4b7c9e23d58e4a"
  }
];

// 3. Backgrounds
const backgrounds = [
  {
    _id: "1a5c8d0e34f69f5b",
    name: "Changeling Traveler",
    type: "background",
    img: "systems/pf2e/icons/default-icons/background.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("changeling-traveler", ["eberron-changelings"], "common"),
      description: {
        value: "<p>You are an urban nomad, wandering from city to city across Khorvaire. You spent your youth traveling with a close-knit changeling family or clan, shifting identities to evade discovery and survive in human settlements.</p><p>Choose two ability boosts. One must be to <strong>Dexterity</strong> or <strong>Charisma</strong>, and one is a free ability boost.</p><p>You're trained in the <strong>Deception</strong> skill, and the <strong>Underworld Lore</strong> skill. You gain the <strong>Lie to Me</strong> skill feat.</p>"
      },
      boosts: {
        "0": { value: ["dex", "cha"] },
        "1": { value: ["cha", "con", "dex", "int", "str", "wis"] }
      },
      trainedSkills: {
        value: ["dec"],
        custom: ""
      },
      trainedLore: "Underworld Lore",
      items: {}
    },
    _stats: getStats(),
    _key: "!items!1a5c8d0e34f69f5b"
  },
  {
    _id: "2b6d9e1f45a7a06c",
    name: "Dhakaani Goblinoid",
    type: "background",
    img: "systems/pf2e/icons/default-icons/background.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("dhakaani-goblinoid", ["dhakaani"], "common"),
      description: {
        value: "<p>You were raised inside the hidden subterranean vault of a Kech, indoctrinated in the ancient martial traditions, metalcraft, and honor code of the Empire of Dhakaan.</p><p>Choose two ability boosts. One must be to <strong>Strength</strong> or <strong>Constitution</strong>, and one is a free ability boost.</p><p>You're trained in the <strong>Athletics</strong> skill, and the <strong>Dhakaan Lore</strong> skill. You gain the <strong>Assurance</strong> (Athletics) skill feat.</p>"
      },
      boosts: {
        "0": { value: ["str", "con"] },
        "1": { value: ["cha", "con", "dex", "int", "str", "wis"] }
      },
      trainedSkills: {
        value: ["ath"],
        custom: ""
      },
      trainedLore: "Dhakaan Lore",
      items: {}
    },
    _stats: getStats(),
    _key: "!items!2b6d9e1f45a7a06c"
  },
  {
    _id: "3c7ea02a56b8b17d",
    name: "Malenti",
    type: "background",
    img: "systems/pf2e/icons/default-icons/background.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("malenti", ["sahuagin"], "rare"),
      description: {
        value: "<p>Born a sahuagin in the abyssal trenches of the Eternal Dominion, ancient biomantic rituals transformed you into the exact physical likeness of a surface dweller you replaced. While indistinguishable from a dryskin on the outside, your predatory mind remains loyal to the undersea Dominion.</p><p>Choose two ability boosts. One must be to <strong>Dexterity</strong> or <strong>Intelligence</strong>, and one is a free ability boost.</p><p>You're trained in the <strong>Deception</strong> skill, and the <strong>Thunder Sea Lore</strong> skill. You gain the <strong>Underwater Marauder</strong> skill feat.</p>"
      },
      boosts: {
        "0": { value: ["dex", "int"] },
        "1": { value: ["cha", "con", "dex", "int", "str", "wis"] }
      },
      trainedSkills: {
        value: ["dec"],
        custom: ""
      },
      trainedLore: "Thunder Sea Lore",
      items: {}
    },
    _stats: getStats(),
    _key: "!items!3c7ea02a56b8b17d"
  }
];

// 4. Classes & Subclasses
const classes = [
  {
    _id: "4d8fb13b67c9c28e",
    name: "Forge Adept Innovation",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("forge-adept-innovation", ["inventor", "artificer"], "common"),
      description: {
        value: "<p>Carrying on the ancient metallurgical secrets of Dhakaani daashor smiths, you imbue a melee weapon with a fraction of your soul to forge a Ghaal'Shaarat (mighty blade). Your bonded weapon automatically scales its weapon potency and striking runes as you level, gains the Thrown 30 ft and Returning traits, and grants you the Runes of War focus spell to radiate an elemental damage aura.</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!4d8fb13b67c9c28e"
  },
  {
    _id: "5e9ac24c78dad39f",
    name: "Maverick Innovation",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("maverick-innovation", ["inventor", "artificer"], "common"),
      description: {
        value: "<p>A polymath tinkerer who cobbles together custom solutions, you push past standard arcane boundaries. You can prepare experimental spell scroll prototypes during daily preparations, allowing you to prepare spells from the Divine, Occult, or Primal spell lists into Arcane slots.</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!5e9ac24c78dad39f"
  },
  {
    _id: "6fabd35d89ebe4a0",
    name: "College of the Dirge Singer",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("college-of-the-dirge-singer", ["bard"], "common"),
      description: {
        value: "<p>Heirs to the Dhakaani duur'kala tradition, dirge singers preserve the memory of fallen empires and direct troops with commanding chants. Gain the Song of the Iron Will composition cantrip (+1 status bonus vs mental effects and to Athletics) and Dirge of the Victorious Blade focus spell.</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!6fabd35d89ebe4a0"
  },
  {
    _id: "70bce46e9afcf5b1",
    name: "Mind Domain",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("mind-domain", ["cleric"], "common"),
      description: {
        value: "<p>Mind domain clerics channel the psychic power of mortal thought, revered among the Path of Light, Riedran Path of Inspiration, and psionic cults of Xoriat. Grants the Mental Shielding initial focus spell (Will save bonus and psychic backlash) and Thought Projection advanced focus spell (gestalt field).</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!70bce46e9afcf5b1"
  },
  {
    _id: "81cdf57fa0ad06c2",
    name: "Circle of the Forged",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("circle-of-the-forged", ["druid"], "common"),
      description: {
        value: "<p>What is truly natural? Druids of the Circle of the Forged explore the living potential of wood, stone, and steel, shape-shifting into construct beasts. Gain Crafting as an order skill and the Construct Form focus spell.</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!81cdf57fa0ad06c2"
  },
  {
    _id: "92dea680b1be17d3",
    name: "Warrior of the Living Weapon",
    type: "feat",
    img: "systems/pf2e/icons/default-icons/class.svg",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("warrior-of-the-living-weapon", ["monk"], "common"),
      description: {
        value: "<p>Monks of the Living Weapon hone their physical bodies as a smith tempers a blade. Drawing upon warforged, changeling, shifter, and kalashtar traditions, they adopt specialized biomantic and ectoplasmic stances: Forged Heart, Nightmare Shroud, Traveler's Blade, and Weretouched.</p>"
      },
      level: { value: 1 },
      category: "classfeature",
      actionType: { value: "passive" },
      actions: { value: null }
    },
    _stats: getStats(),
    _key: "!items!92dea680b1be17d3"
  }
];

// 5. Spells
const spells = [
  {
    _id: "a3efb791c2cf28e4",
    name: "Concussive Burst",
    type: "spell",
    img: "systems/pf2e/icons/spells/concussive-burst.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("concussive-burst", ["arcane", "force", "occult"]),
      description: {
        value: "<p>A pulse of kinetic pressure ripples through the air at a designated point within 60 feet. Each creature in a 15-foot burst takes 2d4 force damage and must attempt a Fortitude saving throw. On a failure, the creature is deafened until the end of its next turn; on a critical failure, it takes double damage, is deafened for 1 minute, and pushed 5 feet away.</p><p><strong>Heightened (+1):</strong> The damage increases by 2d4.</p>"
      },
      level: { value: 1 },
      category: { value: "spell" },
      spellType: { value: "save" },
      defense: { save: { statistic: "fortitude", basic: false } },
      target: { value: "" },
      range: { value: "60 feet" },
      area: { type: "burst", value: 15 },
      time: { value: "2" },
      duration: { value: "instantaneous" },
      damage: {
        "0": {
          applyMod: false,
          category: null,
          formula: "2d4",
          type: "force",
          materials: []
        }
      },
      heightening: {
        type: "interval",
        interval: 1,
        damage: { "0": "2d4" }
      }
    },
    _stats: getStats(),
    _key: "!items!a3efb791c2cf28e4"
  },
  {
    _id: "b4fac8a2d3d039f5",
    name: "Mental Shielding",
    type: "spell",
    img: "systems/pf2e/icons/spells/mental-shielding.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("mental-shielding", ["cleric", "focus", "mental", "psychic"], "uncommon"),
      description: {
        value: "<p><strong>Trigger:</strong> You or an ally within 30 feet attempts a Will saving throw.</p><p>You erect a barrier of psychic dissonance. The target gains a +2 status bonus to the triggering save. If the target succeeds, the attacker takes 2d6 psychic damage from mental backlash.</p><p><strong>Heightened (+1):</strong> Backlash damage increases by 1d6.</p>"
      },
      level: { value: 1 },
      category: { value: "focus" },
      spellType: { value: "utility" },
      time: { value: "reaction" },
      range: { value: "30 feet" },
      damage: {
        "0": {
          formula: "2d6",
          type: "psychic"
        }
      }
    },
    _stats: getStats(),
    _key: "!items!b4fac8a2d3d039f5"
  },
  {
    _id: "c5abd9b3e4e14a06",
    name: "Thought Projection",
    type: "spell",
    img: "systems/pf2e/icons/spells/thought-projection.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("thought-projection", ["cleric", "focus", "mental", "psychic"], "uncommon"),
      description: {
        value: "<p>You project a calm psionic gestalt field in a 20-foot emanation for 1 minute. You and allies can communicate telepathically and gain a +1 status bonus to mental saves. Enemies entering the area take 3d6 mental damage (basic Will save).</p><p><strong>Heightened (+1):</strong> Damage increases by 1d6.</p>"
      },
      level: { value: 4 },
      category: { value: "focus" },
      spellType: { value: "save" },
      defense: { save: { statistic: "will", basic: true } },
      area: { type: "emanation", value: 20 },
      time: { value: "2" },
      duration: { value: "1 minute" },
      damage: {
        "0": {
          formula: "3d6",
          type: "mental"
        }
      }
    },
    _stats: getStats(),
    _key: "!items!c5abd9b3e4e14a06"
  },
  {
    _id: "d6bceac4f5f25b17",
    name: "Song of the Iron Will",
    type: "spell",
    img: "systems/pf2e/icons/spells/song-of-the-iron-will.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("song-of-the-iron-will", ["bard", "cantrip", "composition", "emotion", "mental"], "uncommon"),
      description: {
        value: "<p>Drawing upon ancient Dhakaani duur'kala battle dirges, you chant of past glory. You and allies in a 30-foot emanation gain a +1 status bonus to Will saves against fear and mental effects, and a +1 status bonus to Athletics checks for 1 round.</p>"
      },
      level: { value: 1 },
      category: { value: "cantrip" },
      spellType: { value: "utility" },
      area: { type: "emanation", value: 30 },
      time: { value: "1" },
      duration: { value: "1 round" }
    },
    _stats: getStats(),
    _key: "!items!d6bceac4f5f25b17"
  },
  {
    _id: "e7cdfbd506036c28",
    name: "Dirge of the Victorious Blade",
    type: "spell",
    img: "systems/pf2e/icons/spells/dirge-of-the-victorious-blade.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("dirge-of-the-victorious-blade", ["bard", "composition", "focus", "sonic"], "uncommon"),
      description: {
        value: "<p><strong>Trigger:</strong> An ally within 30 feet critically hits an enemy with a weapon strike.</p><p>You punctuate the blow with a resonant dirge. The struck foe and adjacent enemies take 2d6 sonic damage (basic Fortitude save). The triggering ally gains temporary Hit Points equal to your Charisma modifier for 1 minute.</p><p><strong>Heightened (+1):</strong> Damage increases by 1d6.</p>"
      },
      level: { value: 1 },
      category: { value: "focus" },
      spellType: { value: "save" },
      defense: { save: { statistic: "fortitude", basic: true } },
      range: { value: "30 feet" },
      time: { value: "reaction" },
      damage: {
        "0": {
          formula: "2d6",
          type: "sonic"
        }
      }
    },
    _stats: getStats(),
    _key: "!items!e7cdfbd506036c28"
  },
  {
    _id: "f8dea0e617147d39",
    name: "Construct Form",
    type: "spell",
    img: "systems/pf2e/icons/spells/construct-form.webp",
    effects: [],
    folder: null,
    sort: 0,
    flags: {},
    system: {
      ...getBaseSystem("construct-form", ["druid", "focus", "polymorph", "primal"], "uncommon"),
      description: {
        value: "<p>You shape-shift into a living construct beast of steel plates and copper wire. You gain the construct trait, an item bonus to AC equal to 16 + your level, resistance to bleed and precision damage equal to half your level, and your natural strikes can deal your choice of bludgeoning, piercing, slashing, acid, cold, fire, or electricity damage.</p>"
      },
      level: { value: 1 },
      category: { value: "focus" },
      spellType: { value: "utility" },
      time: { value: "2" },
      duration: { value: "1 minute" }
    },
    _stats: getStats(),
    _key: "!items!f8dea0e617147d39"
  }
];

// 6. Feats
const featData = [
  // Origin & Species Feats
  { id: "1b2c3d4e5f6a7b8c", name: "Aereni Expertise", level: 1, traits: ["elf"], desc: "Growing up in the sanctuaries of Aerenal, you spent decades perfecting a singular craft. Gain training in a skill of your choice (or expert if trained), and a +1 circumstance bonus to checks with that skill." },
  { id: "2c3d4e5f6a7b8c9d", name: "Envoy Specialist", level: 1, traits: ["warforged"], desc: "You have an artisan tool or kit integrated directly into your body. As long as you have a hand free, you can use this tool, gaining a +1 circumstance bonus to checks using it." },
  { id: "3d4e5f6a7b8c9d0e", name: "Khesh'dar Training", level: 1, traits: ["dhakaani"], desc: "Trained in the Silent Folk of Dhakaan, you become trained in Stealth (expert at level 5). The DC for observers to spot you when you Hide increases by 2." },
  { id: "4e5f6a7b8c9d0e1f", name: "Focused Personas", level: 1, traits: ["eberron-changelings"], desc: "You develop two distinct personas. When assuming one of them, you gain a +1 circumstance bonus to Deception and associated Lore checks, and fluency in Skin Cant." },
  { id: "5f6a7b8c9d0e1f2a", name: "Uul Dhakaan", level: 1, traits: ["dhakaani"], desc: "Attuned to the collective dream of Dhakaan (the Uul). You remain fully lucid when dreaming, gain resistance to psychic damage equal to half your level, and receive cryptic guidance during daily prep." },
  { id: "6a7b8c9d0e1f2a3b", name: "Aereni Half-Life", level: 5, traits: ["elf"], desc: "Rituals binding you to Irian give your flesh a mummy-like endurance. Gain a +2 circumstance bonus to death saves, and void resistance equal to half your level. Spells you cast dealing void damage can deal vitality damage instead." },
  { id: "7b8c9d0e1f2a3b4c", name: "Changeling Metamorphosis", level: 5, traits: ["eberron-changelings"], desc: "Your shapeshifting alters deeper physiology. When shifting, you can sprout gills and webbed digits (swim speed equal to land speed), darkvision, or 1d6 agile/finesse claws and fangs." },
  { id: "8c9d0e1f2a3b4c5d", name: "Juggernaut Plating", level: 5, traits: ["warforged"], desc: "Your armor plates are reinforced with adamantine. Donned armor cannot be targeted or heated against your will. You gain critical hit resistance against physical strikes equal to your Constitution modifier." },
  { id: "9d0e1f2a3b4c5d6e", name: "Quori Bond", level: 5, traits: ["kalashtar"], desc: "You forge a deep bond with your quori lineage (Du'ulora, Hashalaq, Kalaraq, or Tsucora), gaining training in an associated skill and casting its signature spell once per day as an innate occult spell." },
  { id: "0e1f2a3b4c5d6e7f", name: "Superior Shifting", level: 5, traits: ["shifter"], desc: "Your shifting transformation lasts for 10 minutes (instead of 1 minute), and you can Shift an additional time per day." },

  // Monk Stances
  { id: "a1b2c3d4e5f6a7b8", name: "Forged Heart Stance", level: 1, traits: ["monk", "stance"], desc: "Enter a stance channeling warforged structural power. Unarmed strikes deal 1d8 bludgeoning damage, and critical hits push enemies 10 feet directly away from you." },
  { id: "b2c3d4e5f6a7b8c9", name: "Nightmare Shroud Stance", level: 1, traits: ["monk", "stance"], desc: "Surround yourself in an ectoplasmic shroud. Unarmed strikes deal 1d6 mental or physical damage, and using Deflect Attacks inflicts the frightened 1 condition on the attacker (DC = class DC)." },
  { id: "c3d4e5f6a7b8c9d0", name: "Traveler's Blade Stance", level: 1, traits: ["monk", "stance"], desc: "You stretch your limbs and extrude bone blades. Unarmed strikes deal 1d6 piercing or slashing damage and gain the Reach 10 ft, agile, and finesse traits." },
  { id: "d4e5f6a7b8c9d0e1", name: "Weretouched Stance", level: 1, traits: ["monk", "stance"], desc: "Hone predatory ferocity. Unarmed strikes deal 1d8 slashing damage, and reducing a foe to 0 Hit Points grants temporary Hit Points equal to your level for 1 minute." },

  // Variant Capstones (Inventor Feats 20)
  { id: "e5f6a7b8c9d0e1f2", name: "Perfected Elixirs", level: 20, traits: ["inventor", "alchemist"], desc: "During daily preparations, produce one Panacea elixir (restores full HP and ends all conditions) and one Vivacity elixir (grants 8-hour flight speed 50 ft and resilience)." },
  { id: "f6a7b8c9d0e1f2a3", name: "Overcharge", level: 20, traits: ["inventor"], desc: "Once per day as a 2-action activity, overcharge your armor to unleash a 100-foot line of destructive elemental energy (force, thunder, or electricity) dealing 10d10 damage (basic Reflex save)." },
  { id: "a7b8c9d0e1f2a3b4", name: "Infused Cannon", level: 20, traits: ["inventor"], desc: "Overcharge your cannons to unleash a 60-foot dragonflame cone (10d6 fire), a 120-foot barrage sphere (8d8 force), or a 10-foot restorative wave healing 30 Hit Points." },
  { id: "b8c9d0e1f2a3b4c5", name: "Steel Vanguard", level: 20, traits: ["inventor"], desc: "Once per day as a 2-action activity, grant your construct companion a fly Speed equal to its land Speed, 50 temporary Hit Points, and a fourth strike during flurry commands for 1 minute." },
  { id: "c9d0e1f2a3b4c5d6", name: "Travel Anywhere", level: 20, traits: ["inventor"], desc: "Cast 10th-rank Gate once per day without material components, precisely linking to any location across Eberron or its outer planes." },
  { id: "d0e1f2a3b4c5d6e7", name: "Weapon of Legend", level: 20, traits: ["inventor"], desc: "Your Ghaal'Shaarat's Aura of War is permanent. Foes starting their turn in your aura take 2d6 elemental damage, and you can empower it to deal 4d6 damage for 1 minute." },
  { id: "e1f2a3b4c5d6e7f8", name: "Improved Genius", level: 20, traits: ["inventor"], desc: "Once per day as a 2-action activity, cast any spell of 8th-rank or lower from any magical tradition without expending a spell slot or requiring components." },

  // Siberys Dragonmarks (Apex Feats 17)
  { id: "f1a2b3c4d5e6f7a8", name: "Siberys Mark of Detection", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Perception and Investigation checks. Cast 8th-rank True Seeing once per day as an innate occult spell." },
  { id: "a2b3c4d5e6f7a8b9", name: "Siberys Mark of Finding", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Survival checks to Track. Cast Find the Path and Commune with Nature once per day as innate primal spells." },
  { id: "b3c4d5e6f7a8b9c0", name: "Siberys Mark of Handling", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Nature checks. Cast 7th-rank Dominate (targeting animals) once per day with up to 8-hour duration." },
  { id: "c4d5e6f7a8b9c0d1", name: "Siberys Mark of Healing", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Medicine checks. Cast 9th-rank Heal once per day as an innate divine spell." },
  { id: "d5e6f7a8b9c0d1e2", name: "Siberys Mark of Hospitality", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Diplomacy checks. Cast 7th-rank Mordenkainen's Magnificent Mansion once per day as an innate arcane spell." },
  { id: "e6f7a8b9c0d1e2f3", name: "Siberys Mark of Making", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Crafting checks. Cast 7th-rank Fabricate and Create Homunculus each once per day as innate arcane spells." },
  { id: "f7a8b9c0d1e2f3a4", name: "Siberys Mark of Passage", level: 17, traits: ["dragonmark"], desc: "Gain a +10-foot status bonus to your Speeds. Cast 7th-rank Teleport once per day as an innate arcane spell." },
  { id: "a8b9c0d1e2f3a4b5", name: "Siberys Mark of Scribing", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Society checks. Cast 7th-rank Symbol once per day as an innate occult spell." },
  { id: "b9c0d1e2f3a4b5c6", name: "Siberys Mark of Sentinel", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Perception checks for initiative. Cast 7th-rank Globe of Invulnerability once per day as an innate divine spell." },
  { id: "c0d1e2f3a4b5c6d7", name: "Siberys Mark of Shadow", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Stealth checks. Cast 7th-rank Project Image once per day as an innate occult spell." },
  { id: "d1e2f3a4b5c6d7e8", name: "Siberys Mark of Storm", level: 17, traits: ["dragonmark"], desc: "Gain a fly Speed equal to your land Speed. Cast 8th-rank Control Weather once per day as an innate primal spell." },
  { id: "e2f3a4b5c6d7e8f9", name: "Siberys Mark of Warding", level: 17, traits: ["dragonmark"], desc: "Gain a +2 circumstance bonus to Thievery checks to Disable a Device. Cast 7th-rank Forbiddance once per day as an innate divine spell." }
];

const feats = featData.map(f => ({
  _id: f.id,
  name: f.name,
  type: "feat",
  img: "systems/pf2e/icons/features/feats/feats.webp",
  effects: [],
  folder: null,
  sort: 0,
  flags: {},
  system: {
    ...getBaseSystem(f.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), f.traits, f.traits.includes("rare") ? "rare" : "common"),
    description: {
      value: `<p>${f.desc}</p>`
    },
    level: { value: f.level },
    category: f.traits.includes("stance") ? "class" : (f.level === 20 ? "class" : (f.level === 17 ? "general" : "ancestry")),
    actionType: { value: f.traits.includes("stance") ? "action" : "passive" },
    actions: { value: f.traits.includes("stance") ? 1 : null }
  },
  _stats: getStats(),
  _key: `!items!${f.id}`
}));

// 7. Magic Items & Symbionts
const itemData = [
  { id: "11aa22bb33cc44dd", name: "Breastplate of Kamvuul Norek", level: 16, price: 9500, bulk: "1", type: "armor", category: "medium", group: "plate", armorValue: 4, strength: 16, dex: 1, check: -2, speedPenalty: -5, baseItem: "breastplate", desc: "Blackened adamantine breastplate of an ancient Dhakaani hero. Functions as +2 greater resilient fortified adamantine breastplate. Reflects aberration mental blasts on critical Will save." },
  { id: "22bb33cc44dd55ee", name: "Ghaal'duur, the Mighty Dirge", level: 20, price: 0, bulk: "1", type: "equipment", desc: "Warhorn of Jhazaal Dhakaan. Grants +4 item bonus to spell DC, doubles composition spell durations, and sounds a 600-ft inspiring blast." },
  { id: "33cc44dd55ee66ff", name: "Shaarat'doovol, the Blade of Truth", level: 17, price: 14000, bulk: "1", type: "weapon", category: "martial", group: "sword", damage: { dice: 1, die: "d8", damageType: "slashing" }, desc: "Sentient longsword forged in khaar'draguus. Functions as +3 greater striking holy longsword; deals 2d8 vitality against aberrations, grants truesight 60 ft, and mind immunity." },
  { id: "44dd55ee66ff77aa", name: "Keeper's Fang", level: 8, price: 480, bulk: "L", type: "weapon", category: "simple", group: "knife", damage: { dice: 1, die: "d4", damageType: "piercing" }, desc: "Shaarat'khesh assassin dagger with embedded Khyber shard. Functions as +1 striking wounding dagger. Targets reduced to 0 HP have their souls severed." },
  { id: "55ee66ff77aa88bb", name: "Uul'kur (Dream Key)", level: 2, price: 25, bulk: "-", type: "equipment", desc: "Dhakaani dream token. Wearer remains lucid in dreams, remembers everything upon waking, and can share dreams with linked allies." },
  { id: "66ff77aa88bb99cc", name: "Vola'khesh", level: 2, price: 30, bulk: "-", type: "equipment", desc: "Carved communication stones for Dhakaani squads. Whispered messages are heard by all allies wearing linked stones within 120 feet." },
  { id: "77aa88bb99cc00dd", name: "Ghallanda Cauldron", level: 1, price: 15, bulk: "2", type: "equipment", desc: "Rune-carved iron cauldron for Mark of Hospitality. Reduces cooking times by 90% and grants +1 circumstance to Cooking Lore." },
  { id: "88bb99cc00dd11ee", name: "Helm of the Sentinel", level: 9, price: 650, bulk: "1", type: "equipment", desc: "Sentinel helm with 3 charges. Cast Protection or Shield of Faith, or prime a contingent Counterspell ward against enemy casters." },
  { id: "99cc00dd11ee22ff", name: "Houseward", level: 9, price: 700, bulk: "4", type: "equipment", desc: "Lead block with Siberys shard. A bearer of the Mark of Warding can cast Guards and Wards without material components over an estate." },
  { id: "00dd11ee22ff33aa", name: "Manor Key", level: 10, price: 950, bulk: "L", type: "equipment", desc: "Requiring the Mark of Hospitality, tracing a door outline in the air casts Mordenkainen's Magnificent Mansion once per day." },
  { id: "11ee22ff33aa44bb", name: "Prospector's Wand", level: 4, price: 90, bulk: "L", type: "equipment", desc: "Y-shaped hazel wand bearing the Mark of Finding with 5 charges to cast Locate or pinpoint dragonshard and mineral deposits." },
  { id: "22ff33aa44bb55cc", name: "Rod of Wild Dominion", level: 8, price: 480, bulk: "1", type: "equipment", desc: "Polished oak rod for Mark of Handling. Grants +2 circumstance to handle animals and casts Dominate (animals) once per day for up to 1 hour." },
  { id: "33aa44bb55cc66dd", name: "Thurimbar Rod", level: 1, price: 10, bulk: "L", type: "equipment", desc: "Zilargo musical rod. Produces auditory illusions unerringly replicating any musical instrument with which you are proficient." },
  { id: "44bb55cc66dd77ee", name: "Duster", level: 1, price: 5, bulk: "L", type: "equipment", desc: "Magewright wand. Instantly cleans an area of up to 1 cubic foot within 10 feet, removing dirt, soot, and grime." },

  // Symbionts
  { id: "55cc66dd77ee88ff", name: "Crawling Gauntlet", level: 3, price: 55, bulk: "L", type: "equipment", desc: "Daelkyr flesh gauntlet fusing to forearm. Unarmed strikes deal 1d6 slashing with agile and finesse traits. Cast Mage Hand at will." },
  { id: "66dd77ee88ff99aa", name: "Coat of Many Eyes", level: 6, price: 240, bulk: "1", type: "armor", category: "light", group: "leather", armorValue: 1, strength: 10, dex: 4, check: 0, speedPenalty: 0, baseItem: "leather-armor", desc: "Warm leather armor covered in blinking eyes bred by Belashyrra. Grants darkvision 120 ft, all-around vision, and +1 item bonus to sight Perception." },
  { id: "77ee88ff99aa00bb", name: "Hungry Weapon", level: 4, price: 90, bulk: "1", type: "weapon", category: "martial", group: "sword", damage: { dice: 1, die: "d8", damageType: "slashing" }, desc: "Organic muscle weapon that burrows tendrils into your hand. Expend 1 hit die on hit to deal +1d8 void damage and heal yourself." },
  { id: "88ff99aa00bb11cc", name: "Shadow Sibling", level: 7, price: 340, bulk: "-", type: "equipment", desc: "Forehead gem parasite crafted by Dyrrn. Exudes an ectoplasmic shroud for concealment, and reacts to grant +2 circumstance to AC." },
  { id: "99aa00bb11cc22dd", name: "Spellburrow", level: 5, price: 160, bulk: "-", type: "equipment", desc: "Skull-burrowing iridescent scarab bred by Valaara. Grants one innate cantrip, one 1st-rank spell, and one 2nd-rank spell." },
  { id: "00bb11cc22dd33ee", name: "Throwing Scarab", level: 4, price: 85, bulk: "-", type: "equipment", desc: "Palm-burrowing scarab extruding razor chitin darts. Functions as +1 striking thrown dart dealing 1d4 piercing + 1d4 acid damage." },
  { id: "11cc22dd33ee44ff", name: "Tongueworm", level: 5, price: 140, bulk: "-", type: "equipment", desc: "Barbed muscle worm under tongue. Make agile unarmed strikes dealing 1d4 piercing + 1d6 poison damage; clumsy 1 on critical hit." },
  { id: "22dd33ee44ff55aa", name: "Wandering Eye", level: 3, price: 60, bulk: "-", type: "equipment", desc: "Shoulder eyestalk extending 18 inches. Remains vigilant while you sleep, and stretches around corners to scout safely." }
];

const items = itemData.map(it => ({
  _id: it.id,
  name: it.name,
  type: it.type === "armor" ? "armor" : (it.type === "weapon" ? "weapon" : "equipment"),
  img: "systems/pf2e/icons/default-icons/equipment.svg",
  effects: [],
  folder: null,
  sort: 0,
  flags: {},
  system: {
    ...getBaseSystem(it.name.toLowerCase().replace(/[^a-z0-9]/g, '-'), ["magical"], it.level >= 16 ? "rare" : "common"),
    description: {
      value: `<p>${it.desc}</p>`
    },
    level: { value: it.level },
    quantity: 1,
    weight: { value: it.bulk },
    price: { value: { gp: it.price } },
    equipped: {
      carryType: "worn",
      invested: it.level > 1 ? true : null,
      handsHeld: 0
    },
    size: "med",
    identification: {
      status: "identified"
    },
    ...(it.type === "weapon" ? {
      damage: it.damage,
      category: it.category,
      group: it.group,
      bonus: { value: 0 },
      bonusDamage: { value: 0 },
      range: null,
      reload: { value: null }
    } : {}),
    ...(it.type === "armor" ? {
      category: it.category,
      group: it.group,
      armor: { value: it.armorValue },
      strength: it.strength,
      dex: { value: it.dex },
      check: { value: it.check },
      speed: { value: it.speedPenalty },
      baseItem: it.baseItem
    } : {})
  },
  _stats: getStats(),
  _key: `!items!${it.id}`
}));

function writePackItems(packName, items) {
  const dir = path.join(PACKS_ROOT, packName);
  for (const item of items) {
    const filename = `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_${item._id}.json`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf-8');
    console.log(`Wrote ${filePath}`);
  }
}

writePackItems('eberron-ancestries', ancestries);
writePackItems('eberron-heritages', heritages);
writePackItems('eberron-backgrounds', backgrounds);
writePackItems('eberron-classes', classes);
writePackItems('eberron-spells', spells);
writePackItems('eberron-feats', feats);
writePackItems('eberron-items', items);

console.log("Successfully generated all Exploring Eberron compendium files!");
