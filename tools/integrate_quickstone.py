#!/usr/bin/env python3
"""
Integrates all player options from Frontiers of Eberron: Quickstone into:
1. Foundry VTT source compendiums (src/packs/*)
2. Pathbuilder 2e custom pack (pathbuilder-custom-pack/pathfinders-guide-to-eberron.json)
"""

import json
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
SRC_DIR = BASE_DIR / "src" / "packs"
PB_FILE = BASE_DIR / "pathbuilder-custom-pack" / "pathfinders-guide-to-eberron.json"

SCHEMA = {
    "version": 0.959,
    "lastMigration": {
        "datetime": None,
        "version": {
            "schema": 0.959,
            "foundry": "14.368",
            "system": "8.5.1"
        }
    }
}

PUB = {
    "title": "Pathfinder's Guide to Eberron",
    "authors": "",
    "license": "OGL",
    "remaster": True,
    "page": "N/A"
}

MIGRATION = {
    "version": 0.959,
    "previous": None
}

def make_id(name: str) -> str:
    # Deterministic 16-char hex from name
    return uuid.uuid5(uuid.NAMESPACE_DNS, f"eberron.quickstone.{name}").hex[:16]

def make_pb_uuid(name: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"pathbuilder.quickstone.{name}"))

def slugify(name: str) -> str:
    import re
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

# -------------------------------------------------------------
# 1. ANCESTRIES
# -------------------------------------------------------------
ANCESTRIES = [
    {
        "name": "Gargoyle",
        "hp": 8,
        "size": "med",
        "speed": 25,
        "boosts": {"0": {"value": ["str"]}, "1": {"value": ["con"]}, "2": {"value": ["cha", "con", "dex", "int", "str", "wis"]}},
        "flaws": {"0": {"value": ["dex"]}},
        "traits": ["elemental", "earth", "humanoid", "gargoyle"],
        "rarity": "rare",
        "description": "<p>Carved from living stone by Dhakaani artisans and awakened by the daelkyr Orlassk, gargoyles endure through the ages. Made of living rock, they require neither food nor breath, possessing natural stone armor and false appearance.</p>"
    },
    {
        "name": "Harpy",
        "hp": 6,
        "size": "med",
        "speed": 25,
        "boosts": {"0": {"value": ["dex"]}, "1": {"value": ["cha"]}, "2": {"value": ["cha", "con", "dex", "int", "str", "wis"]}},
        "flaws": {"0": {"value": ["con"]}},
        "traits": ["humanoid", "harpy"],
        "rarity": "rare",
        "description": "<p>Avian humanoids possessing functional feathered wings and captivating voices that weave enchantments. In Droaam, harpies form passionate flights devoted to family, allies, and sovereign causes.</p>"
    },
    {
        "name": "Medusa",
        "hp": 8,
        "size": "med",
        "speed": 25,
        "boosts": {"0": {"value": ["con"]}, "1": {"value": ["cha"]}, "2": {"value": ["cha", "con", "dex", "int", "str", "wis"]}},
        "flaws": {"0": {"value": ["str"]}},
        "traits": ["humanoid", "medusa"],
        "rarity": "rare",
        "description": "<p>Serpent-haired humanoids renowned across Droaam as master architects, judges, and priests of the Cazhaak Creed. Their head-vipers grant 30-foot imprecise scent, and their gaze stiffens enemy limbs.</p>"
    },
    {
        "name": "Worg",
        "hp": 10,
        "size": "med",
        "speed": 35,
        "boosts": {"0": {"value": ["str"]}, "1": {"value": ["wis"]}, "2": {"value": ["cha", "con", "dex", "int", "str", "wis"]}},
        "flaws": {"0": {"value": ["int"]}},
        "traits": ["beast", "worg"],
        "rarity": "rare",
        "description": "<p>Intelligent canid predators of the Great Pack with speech, keen senses, and pack loyalty. Worgs fight alongside riders as equals, wielding specialized steel jaw harnesses in battle.</p>"
    }
]

# -------------------------------------------------------------
# 2. HERITAGES
# -------------------------------------------------------------
HERITAGES = [
    # Gargoyle
    {"name": "Guardian Gargoyle", "ancestry": "Gargoyle", "traits": ["gargoyle"], "desc": "When you Raise a Shield or Take Cover adjacent to an ally, grant that ally +1 circumstance bonus to AC."},
    {"name": "Mover Gargoyle", "ancestry": "Gargoyle", "traits": ["gargoyle"], "desc": "Your base Speed increases to 30 feet, and you gain the Quick Jump feat."},
    {"name": "Seeker Gargoyle", "ancestry": "Gargoyle", "traits": ["gargoyle"], "desc": "Trained in Society, with +1 circumstance bonus to Recall Knowledge on ancient ruins and stonework."},
    {"name": "Thinker Gargoyle", "ancestry": "Gargoyle", "traits": ["gargoyle"], "desc": "+2 circumstance bonus to Will saves against mental effects; trained in Arcana, Occultism, or Religion."},
    # Harpy
    {"name": "Watching Wood Harrier", "ancestry": "Harpy", "traits": ["harpy"], "desc": "While flying, your movement does not trigger reactive strikes from creatures that have not yet acted."},
    {"name": "Roost Songbird", "ancestry": "Harpy", "traits": ["harpy"], "desc": "Treat critical failures on Performance checks to impress crowds or soothe creatures as failures."},
    {"name": "Emissary of Sora Kell", "ancestry": "Harpy", "traits": ["harpy"], "desc": "+1 circumstance bonus to Deception and Diplomacy checks negotiating treaties or contracts."},
    # Medusa
    {"name": "Cazhaak Mason", "ancestry": "Medusa", "traits": ["medusa"], "desc": "Gain Specialty Crafting (Stonemasonry) and +1 circumstance bonus to notice stonework traps."},
    {"name": "Scaled Gaze", "ancestry": "Medusa", "traits": ["medusa"], "desc": "When an enemy critically fails against your Gray Gaze, they take 1d4 persistent poison damage."},
    {"name": "Ophidian Seer", "ancestry": "Medusa", "traits": ["medusa"], "desc": "+2 circumstance bonus to initiative rolls and saving throws against traps and hazards."},
    # Worg
    {"name": "Watching Wood Tracker", "ancestry": "Worg", "traits": ["worg"], "desc": "Your imprecise scent increases to 60 feet, and gain +1 circumstance bonus to Survival to Track."},
    {"name": "Great Pack Vanguard", "ancestry": "Worg", "traits": ["worg"], "desc": "+1 circumstance bonus to Athletics checks to Shove or Trip enemies while moving."},
    {"name": "Devourer's Fang", "ancestry": "Worg", "traits": ["worg"], "desc": "Your bite critical hits inflict 1d4 persistent bleed damage."},
    # Eberron Planar Lineages
    {"name": "Dolurrhi Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Pale skin with whispering mist; gain psychic resistance equal to half your level (min 1) and innate daze."},
    {"name": "Fernian Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Embers in your eyes; gain fire resistance equal to half your level (min 1) and innate ignition."},
    {"name": "Kythrian Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Shifting chaos skin; cycle acid, cold, electricity, or fire resistance daily, and gain innate electric arc."},
    {"name": "Mabaran Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Shadowy grace; gain void resistance equal to half your level (min 1) and innate void warp."},
    {"name": "Risian Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Rime-frosted horns; gain cold resistance equal to half your level (min 1) and innate frostbite."},
    {"name": "Sakah Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Rakshasa descent with reversed hands; +1 to Deception/Intimidation, +2 to Will saves vs mental, innate mage hand."},
    {"name": "Shavaran Lineage", "ancestry": None, "traits": ["nephilim"], "desc": "Steel horns and metal scales; trained in light and medium armor, +1 vs forced movement, innate shield."}
]

# -------------------------------------------------------------
# 3. BACKGROUNDS
# -------------------------------------------------------------
BACKGROUNDS = [
    {
        "name": "Dragonmarked Bravo",
        "lore": "Warfare Lore",
        "skill": "Athletics",
        "feat": "Titan Wrestler",
        "boosts": ["str", "cha"],
        "desc": "Your work for your house took advantage of your strength and speed as a guard or mercenary."
    },
    {
        "name": "Dragonmarked Foundling",
        "lore": "Underworld Lore",
        "skill": "Stealth",
        "feat": "Terrain Stalker",
        "boosts": ["dex", "con"],
        "desc": "You manifested a dragonmark outside house politics and learned to survive in the underworld."
    },
    {
        "name": "Dragonmarked Scion",
        "lore": "House Lore",
        "skill": "Arcana",
        "feat": "Courtly Graces",
        "boosts": ["int", "cha"],
        "desc": "Trained in the research, administrative, and mercantile centers of a dragonmarked house."
    },
    {
        "name": "Magewright",
        "lore": "Guild Lore",
        "skill": "Crafting",
        "feat": "Specialty Crafting",
        "boosts": ["int", "wis"],
        "desc": "You master practical cantrips to enhance everyday artisan craft and trade."
    },
    {
        "name": "Wandslinger",
        "lore": "Warfare Lore",
        "skill": "Intimidation",
        "feat": "Quick Draw",
        "boosts": ["dex", "cha"],
        "desc": "You are quick on the draw with wands and attack cantrips on the frontier."
    },
    {
        "name": "Frontier Marshal",
        "lore": "Legal Lore",
        "skill": "Survival",
        "feat": "Experienced Tracker",
        "boosts": ["wis", "str"],
        "desc": "You wear a tin star upholding peace in lawless border boomtowns."
    },
    {
        "name": "Dragonshard Prospector",
        "lore": "Dragonshard Lore",
        "skill": "Survival",
        "feat": "Terrain Expertise",
        "boosts": ["con", "wis"],
        "desc": "You prospect for Siberys and Khyber dragonshards across rocky frontier ranges."
    },
    {
        "name": "Droaam Emissary",
        "lore": "Droaam Lore",
        "skill": "Diplomacy",
        "feat": "Hobnobber",
        "boosts": ["cha", "int"],
        "desc": "You serve the Daughters of Sora Kell as an envoy to border communities and travelers."
    }
]

# -------------------------------------------------------------
# 4. FEATS
# -------------------------------------------------------------
FEATS = [
    # Gargoyle
    {"name": "Hewn for Battle", "level": 1, "category": "ancestry", "traits": ["gargoyle"], "desc": "Your stone fists or claws deal 1d6 bludgeoning or slashing damage with agile and finesse."},
    {"name": "Stone Camouflage", "level": 1, "category": "ancestry", "traits": ["gargoyle"], "desc": "Hide without cover or concealment while adjacent to a stone wall or cliff and motionless."},
    {"name": "Wings of Stone", "level": 5, "category": "ancestry", "traits": ["gargoyle"], "desc": "Manifest carved stone wings granting a fly Speed of 20 feet and glide reaction."},
    {"name": "Unyielding Monolith", "level": 9, "category": "ancestry", "traits": ["gargoyle"], "action": "reaction", "desc": "Negate forced movement or being knocked prone."},
    # Harpy
    {"name": "Voice of the Fury", "level": 1, "category": "ancestry", "traits": ["harpy"], "desc": "Cast fear once per day as an innate occult spell."},
    {"name": "Shadow's Gift of Song", "level": 5, "category": "ancestry", "traits": ["harpy"], "desc": "Cast charm and suggestion each once per day as innate occult spells."},
    {"name": "Aerial Agility", "level": 9, "category": "ancestry", "traits": ["harpy"], "desc": "Your fly Speed increases to 30 feet, and you no longer need to land each turn."},
    {"name": "Shattering Screech", "level": 13, "category": "ancestry", "traits": ["harpy", "sonic"], "action": "2", "desc": "15-ft cone deals 6d6 sonic damage with deafness on critical failure."},
    # Medusa
    {"name": "Snakebite Mane", "level": 1, "category": "ancestry", "traits": ["medusa"], "desc": "Unarmed strike dealing 1d4 piercing + 1d4 poison damage with agile and finesse."},
    {"name": "Shadow's Gift of Stone", "level": 5, "category": "ancestry", "traits": ["medusa"], "desc": "Cast hold person and slow each once per day as innate occult spells."},
    {"name": "Stone Eyes", "level": 9, "category": "ancestry", "traits": ["medusa"], "desc": "Target within 30 ft must make Fortitude save or become restrained and turned to permanent stone."},
    # Worg
    {"name": "Pack Harrying", "level": 1, "category": "ancestry", "traits": ["worg"], "action": "1", "desc": "Adjacent enemy becomes off-guard to your ally's next melee strike."},
    {"name": "Steel Jaws Mastery", "level": 5, "category": "ancestry", "traits": ["worg"], "desc": "Your Steel Jaws gain the deadly d8 and knock-down traits."},
    {"name": "Terrifying Howl", "level": 9, "category": "ancestry", "traits": ["worg", "auditory", "emotion", "fear", "mental"], "action": "2", "desc": "30-ft emanation makes enemies frightened 1 on a failed Will save."},
    # Druidic Sect Feats
    {"name": "Ashbound Initiate", "level": 4, "category": "general", "traits": ["general"], "desc": "Trained in Intimidation. Gain +1 circumstance bonus to attacks vs arcane casters, and innate nondetection."},
    {"name": "Gatekeeper Initiate", "level": 4, "category": "general", "traits": ["general"], "desc": "Trained in Arcana. +2 circumstance bonus to saves vs aberrations, and innate magic circle."},
    {"name": "Greensinger Initiate", "level": 4, "category": "general", "traits": ["general"], "desc": "Trained in Performance. Reaction Stride upon charming enemies, and innate hideous laughter."},
    {"name": "Warden Initiate", "level": 4, "category": "general", "traits": ["general"], "desc": "Trained in Survival. Reaction gives adjacent ally resistance 2 + Con mod, and innate sanctuary."},
    {"name": "Winter Initiate", "level": 4, "category": "general", "traits": ["general"], "desc": "Gain temporary HP on taking void damage, summon undead decay, and innate ray of enfeeblement."},
    # Implement Feats
    {"name": "Orb Expert", "level": 4, "category": "general", "traits": ["general"], "desc": "+1 AC vs reactive strikes while holding orb, and reaction Step when an enemy closes in."},
    {"name": "Rod Expert", "level": 4, "category": "general", "traits": ["general"], "desc": "Rod functions as a resonant club; make melee strike with rod alongside ranged spell attack."},
    {"name": "Staff Expert", "level": 4, "category": "general", "traits": ["general"], "desc": "Increase range of spells by 30 feet; long-range spell crits knock enemies prone."},
    {"name": "Wand Expert", "level": 4, "category": "general", "traits": ["general"], "desc": "Draw or stow wand as free action; draw on initiative with +1 circumstance bonus to roll."},
    {"name": "Wandslinger Fighting Style", "level": 2, "category": "class", "traits": ["fighter", "gunslinger"], "desc": "Treat wands as martial weapons; +1 circumstance bonus to wand spell attack rolls and spell DC."}
]

# -------------------------------------------------------------
# 5. CLASSES & SUBCLASSES
# -------------------------------------------------------------
CLASSES = [
    {
        "name": "Demonshard Instinct",
        "traits": ["barbarian"],
        "desc": "<p>You channel fury through an embedded shard of Khyber demonglass. Rage adds Fire or Void damage. Fiendish Retribution reaction deals 1d6 fire/void damage to attackers within 60 ft.</p>"
    },
    {
        "name": "Muse of Wands",
        "traits": ["bard"],
        "desc": "<p>You treat wand combat as a symphony. Gain the Wandslinger's Flourish composition cantrip to empower wand cantrips and grant allies saving throw bonuses.</p>"
    },
    {
        "name": "Commerce Domain",
        "traits": ["cleric"],
        "desc": "<p>Patrons: Kol Korran and The Keeper. Grants the Divine Wealth initial focus spell (divine coins) and Divine Bargain advanced focus spell (essence trading).</p>"
    },
    {
        "name": "Bloodhound Edge",
        "traits": ["ranger"],
        "desc": "<p>Hunt Prey tracks quarry at any distance through ley lines. First Strike deals +1d6 precision damage, with Relentless Pursuit and Eyes on the Prize feats.</p>"
    },
    {
        "name": "Nemesis Bloodline",
        "traits": ["sorcerer"],
        "desc": "<p>Arcane/Occult spell duelist bloodline. Grants Spell Deflection reaction, countermagic, and dueling spells.</p>"
    },
    {
        "name": "Stone Sovereign Patron",
        "traits": ["witch"],
        "desc": "<p>Patrons: Orlassk, King Grayfinger, Queen Sheshka. Grants Gray Gaze hex cantrip and Form of Stone hex spell (absorb damage with Hardness 5).</p>"
    }
]

# -------------------------------------------------------------
# 6. SPELLS
# -------------------------------------------------------------
SPELLS = [
    {
        "name": "Absorb Elements",
        "level": 1,
        "school": "abjuration",
        "traditions": ["arcane", "primal"],
        "traits": ["manipulate"],
        "type": "spell",
        "action": "reaction",
        "desc": "Reaction when taking elemental damage: gain resistance 5 against the triggering damage, and your next melee strike deals +1d6 of that damage type."
    },
    {
        "name": "Earthbind",
        "level": 2,
        "school": "transmutation",
        "traditions": ["arcane", "occult", "primal"],
        "traits": ["concentrate", "manipulate"],
        "type": "spell",
        "action": "2",
        "desc": "Binds a flying creature, reducing its fly Speed to 0 and safely grounding it at 60 feet per round."
    },
    {
        "name": "Earth Tremor",
        "level": 1,
        "school": "evocation",
        "traditions": ["arcane", "primal"],
        "traits": ["earth", "concentrate", "manipulate"],
        "type": "spell",
        "action": "2",
        "desc": "10-foot emanation slams ground, dealing 2d6 bludgeoning damage, knocking creatures prone, and creating difficult terrain."
    },
    {
        "name": "Gray Gaze",
        "level": 1,
        "school": "transmutation",
        "traditions": ["occult", "primal"],
        "traits": ["cantrip", "visual", "concentrate"],
        "type": "cantrip",
        "action": "1",
        "desc": "Petrifying glance deals 1d4 void or bludgeoning damage and imposes a -1 penalty to Reflex saving throws."
    },
    {
        "name": "Mold Earth",
        "level": 1,
        "school": "transmutation",
        "traditions": ["primal"],
        "traits": ["cantrip", "earth", "manipulate"],
        "type": "cantrip",
        "action": "2",
        "desc": "Excavate dirt or stone up to 5 feet away, create shaped stone signs for 1 hour, or create difficult terrain."
    },
    {
        "name": "Orien Step",
        "level": 1,
        "school": "transmutation",
        "traditions": ["arcane"],
        "traits": ["cantrip", "teleportation", "manipulate"],
        "type": "cantrip",
        "action": "1",
        "desc": "Teleport up to 5 feet to an unoccupied space without provoking reactive strikes (Mark of Passage)."
    },
    {
        "name": "Divine Wealth",
        "level": 1,
        "school": "evocation",
        "traditions": [],
        "traits": ["cleric", "focus", "fortune", "uncommon", "concentrate"],
        "type": "focus",
        "action": "1",
        "desc": "Conjure divine coins that can be spent as a reaction to grant +1 status bonus or impose -1 penalty to saving throws."
    },
    {
        "name": "Divine Bargain",
        "level": 4,
        "school": "necromancy",
        "traditions": [],
        "traits": ["cleric", "focus", "healing", "void", "uncommon", "concentrate"],
        "type": "focus",
        "action": "2",
        "desc": "Magical transaction siphoning essence to heal an ally or granting temporary HP while enfeebling a foe."
    },
    {
        "name": "Form of Stone",
        "level": 1,
        "school": "transmutation",
        "traditions": [],
        "traits": ["witch", "focus", "earth", "uncommon", "manipulate"],
        "type": "focus",
        "action": "reaction",
        "desc": "Reaction upon taking damage: calcify skin for Hardness 5, then step through adjacent stone up to 15 feet away."
    }
]

# -------------------------------------------------------------
# 7. WEAPON: Steel Jaws
# -------------------------------------------------------------
STEEL_JAWS = {
    "name": "Steel Jaws",
    "type": "weapon",
    "img": "systems/pf2e/icons/default-icons/weapon.svg",
    "system": {
        "description": {"value": "<p>A Droaamite steel jaw harness fitting over a worg's teeth, allowing them to bite with martial force and apply weapon runes.</p>"},
        "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
        "publication": PUB,
        "rules": [],
        "slug": "steel-jaws",
        "schema": SCHEMA,
        "_migration": MIGRATION,
        "traits": {"value": ["finesse", "trip", "disarm"], "rarity": "uncommon"},
        "damage": {"dice": 1, "die": "d8", "damageType": "piercing"},
        "category": "martial",
        "group": "brawling",
        "baseItem": None,
        "bonus": {"value": 0},
        "bonusDamage": {"value": 0},
        "range": None,
        "reload": {"value": None}
    }
}

STATS = {
    "systemId": "pf2e",
    "systemVersion": "8.5.1",
    "coreVersion": "14.368",
    "createdTime": 1726848000000,
    "modifiedTime": 1726848000000,
    "lastModifiedBy": "lxzmymmFddOcN8CB"
}

def generate_foundry_packs():
    print("Generating Foundry VTT packs in src/packs/...")
    
    # 1. Ancestries
    anc_dir = SRC_DIR / "eberron-ancestries"
    anc_dir.mkdir(parents=True, exist_ok=True)
    for a in ANCESTRIES:
        item_id = make_id(f"ancestry.{a['name']}")
        doc = {
            "name": a["name"],
            "type": "ancestry",
            "img": "systems/pf2e/icons/default-icons/ancestry.svg",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": a["description"]},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(a["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "traits": {"value": a["traits"], "rarity": a["rarity"], "custom": ""},
                "hp": a["hp"],
                "size": a["size"],
                "reach": 5,
                "speed": a["speed"],
                "boosts": a["boosts"],
                "flaws": a["flaws"],
                "languages": {"value": ["common", "goblin"], "custom": ""},
                "additionalLanguages": {"value": [], "count": 1, "custom": ""},
                "items": {},
                "vision": "darkvision"
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{a['name'].replace(' ', '_')}_{item_id}.json"
        with open(anc_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Ancestry] {a['name']} -> {filename}")

    # 2. Heritages
    her_dir = SRC_DIR / "eberron-heritages"
    her_dir.mkdir(parents=True, exist_ok=True)
    for h in HERITAGES:
        item_id = make_id(f"heritage.{h['name']}")
        anc_ref = None
        if h["ancestry"]:
            anc_id = make_id(f"ancestry.{h['ancestry']}")
            anc_ref = {
                "name": h["ancestry"],
                "uuid": f"Compendium.pathfinders-guide-to-eberron.eberron-ancestries.{anc_id}"
            }
        doc = {
            "name": h["name"],
            "type": "heritage",
            "img": "systems/pf2e/icons/default-icons/heritage.svg",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": f"<p>{h['desc']}</p>"},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(h["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "traits": {"value": h["traits"], "rarity": "common", "custom": ""},
                "ancestry": anc_ref
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{h['name'].replace(' ', '_').replace('/', '_')}_{item_id}.json"
        with open(her_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Heritage] {h['name']} -> {filename}")

    # 3. Backgrounds
    bg_dir = SRC_DIR / "eberron-backgrounds"
    bg_dir.mkdir(parents=True, exist_ok=True)
    for b in BACKGROUNDS:
        item_id = make_id(f"background.{b['name']}")
        doc = {
            "name": b["name"],
            "type": "background",
            "img": "systems/pf2e/icons/default-icons/background.svg",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": f"<p>{b['desc']}</p>"},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(b["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "traits": {"value": [], "rarity": "common", "custom": ""},
                "boosts": {
                    "0": {"value": b["boosts"]},
                    "1": {"value": ["cha", "con", "dex", "int", "str", "wis"]}
                },
                "trainedLore": b["lore"],
                "trainedSkills": {"value": [b["skill"].lower()], "custom": ""}
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{b['name'].replace(' ', '_')}_{item_id}.json"
        with open(bg_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Background] {b['name']} -> {filename}")

    # 4. Feats
    feat_dir = SRC_DIR / "eberron-feats"
    feat_dir.mkdir(parents=True, exist_ok=True)
    for ft in FEATS:
        item_id = make_id(f"feat.{ft['name']}")
        doc = {
            "name": ft["name"],
            "type": "feat",
            "img": "systems/pf2e/icons/default-icons/feats.webp",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": f"<p>{ft['desc']}</p>"},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(ft["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "level": {"value": ft["level"]},
                "traits": {"value": ft["traits"], "rarity": "common", "custom": ""},
                "category": ft["category"],
                "actionType": {"value": "action" if "action" in ft else "passive"},
                "actions": {"value": int(ft["action"]) if "action" in ft and ft["action"].isdigit() else None}
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{ft['name'].replace(' ', '_')}_{item_id}.json"
        with open(feat_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Feat] {ft['name']} -> {filename}")

    # 5. Classes & Subclasses
    cls_dir = SRC_DIR / "eberron-classes"
    cls_dir.mkdir(parents=True, exist_ok=True)
    for c in CLASSES:
        item_id = make_id(f"class.{c['name']}")
        doc = {
            "name": c["name"],
            "type": "feat",
            "img": "systems/pf2e/icons/default-icons/class.svg",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": c["desc"]},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(c["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "level": {"value": 1},
                "traits": {"value": c["traits"], "rarity": "common", "custom": ""},
                "category": "classfeature",
                "actionType": {"value": "passive"},
                "actions": {"value": None}
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{c['name'].replace(' ', '_')}_{item_id}.json"
        with open(cls_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Class Feature] {c['name']} -> {filename}")

    # 6. Spells
    sp_dir = SRC_DIR / "eberron-spells"
    sp_dir.mkdir(parents=True, exist_ok=True)
    for sp in SPELLS:
        item_id = make_id(f"spell.{sp['name']}")
        doc = {
            "name": sp["name"],
            "type": "spell",
            "img": "systems/pf2e/icons/default-icons/spell.svg",
            "effects": [],
            "folder": None,
            "sort": 0,
            "flags": {},
            "_id": item_id,
            "system": {
                "description": {"value": f"<p>{sp['desc']}</p>"},
                "source": {"value": "Pathfinder's Guide to Eberron", "page": "N/A"},
                "publication": PUB,
                "rules": [],
                "slug": slugify(sp["name"]),
                "schema": SCHEMA,
                "_migration": MIGRATION,
                "level": {"value": sp["level"]},
                "traits": {"value": sp["traits"], "rarity": "common", "custom": ""},
                "traditions": {"value": sp["traditions"], "custom": ""},
                "school": {"value": sp["school"]},
                "category": {"value": sp["type"]},
                "time": {"value": str(sp["action"])}
            },
            "_stats": STATS,
            "_key": f"!items!{item_id}"
        }
        filename = f"{sp['name'].replace(' ', '_')}_{item_id}.json"
        with open(sp_dir / filename, "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=2)
        print(f"  [Spell] {sp['name']} -> {filename}")

    # 7. Item: Steel Jaws
    item_dir = SRC_DIR / "eberron-items"
    item_dir.mkdir(parents=True, exist_ok=True)
    item_id = make_id("weapon.Steel Jaws")
    steel_jaws_doc = dict(STEEL_JAWS)
    steel_jaws_doc["_id"] = item_id
    steel_jaws_doc["_stats"] = STATS
    steel_jaws_doc["_key"] = f"!items!{item_id}"
    with open(item_dir / f"Steel_Jaws_{item_id}.json", "w", encoding="utf-8") as f:
        json.dump(steel_jaws_doc, f, indent=2)
    print(f"  [Item] Steel Jaws -> Steel_Jaws_{item_id}.json")

def update_pathbuilder():
    print("\nUpdating Pathbuilder custom pack JSON...")
    with open(PB_FILE, "r", encoding="utf-8") as f:
        pb = json.load(f)

    # 1. Ancestries
    existing_anc_names = {a["name"] for a in pb.get("listCustomAncestries", [])}
    for a in ANCESTRIES:
        if a["name"] in existing_anc_names:
            continue
        boost_num = {"str": 0, "dex": 1, "con": 2, "int": 3, "wis": 4, "cha": 5}
        pb_boosts = [boost_num[k] for k in ["str", "con"] if a["name"] == "Gargoyle"]
        if a["name"] == "Harpy":
            pb_boosts = [1, 5]
        elif a["name"] == "Medusa":
            pb_boosts = [2, 5]
        elif a["name"] == "Worg":
            pb_boosts = [0, 4]
        
        entry = {
            "name": a["name"],
            "id": make_pb_uuid(f"ancestry.{a['name']}"),
            "traits": f"3rd Party, {a['name']}, Humanoid, Rare" if a["name"] != "Worg" else "3rd Party, Worg, Beast, Rare",
            "hp": a["hp"],
            "abilityBoosts": pb_boosts,
            "abilityFlaws": [1 if a["name"] == "Gargoyle" else 2 if a["name"] == "Harpy" else 0 if a["name"] == "Medusa" else 3],
            "description": a["description"].replace("<p>", "").replace("</p>", ""),
            "languages": "Common, Goblin, Additional languages equal to your Intelligence modifier.",
            "listCustomEffects": [],
            "src": "Pathfinder's Guide to Eberron",
            "databaseID": 1
        }
        pb.setdefault("listCustomAncestries", []).append(entry)
        print(f"  Added Pathbuilder Ancestry: {a['name']}")

    # 2. Heritages
    existing_her_names = {h["name"] for h in pb.get("listCustomHeritages", [])}
    for h in HERITAGES:
        if h["name"] in existing_her_names:
            continue
        entry = {
            "id": make_pb_uuid(f"heritage.{h['name']}"),
            "name": h["name"],
            "textDescription": h["desc"],
            "traits": f"3rd Party, {', '.join(h['traits'])}",
            "src": "Pathfinder's Guide to Eberron",
            "databaseID": 1
        }
        pb.setdefault("listCustomHeritages", []).append(entry)
        print(f"  Added Pathbuilder Heritage: {h['name']}")

    # 3. Backgrounds
    existing_bg_names = {b["name"] for b in pb.get("listCustomBackgrounds", [])}
    boost_map = {"str": "0", "dex": "1", "con": "2", "int": "3", "wis": "4", "cha": "5"}
    for b in BACKGROUNDS:
        if b["name"] in existing_bg_names:
            continue
        entry = {
            "databaseID": 1,
            "id": make_pb_uuid(f"background.{b['name']}"),
            "name": b["name"],
            "traits": "3rd Party, Common",
            "boost_ref_1": boost_map[b["boosts"][0]],
            "boost_ref_2": boost_map[b["boosts"][1]],
            "boost_ref_3": "0",
            "freeFeatDetail": f"Trained in {b['skill']} and {b['lore']}. Gain {b['feat']}.",
            "skill": b["skill"],
            "lore": b["lore"],
            "description": b["desc"],
            "src": "Pathfinder's Guide to Eberron"
        }
        pb.setdefault("listCustomBackgrounds", []).append(entry)
        print(f"  Added Pathbuilder Background: {b['name']}")

    # 4. Feats
    existing_ft_names = {f["name"] for f in pb.get("listCustomFeats", [])}
    for ft in FEATS:
        if ft["name"] in existing_ft_names:
            continue
        entry = {
            "id": make_pb_uuid(f"feat.{ft['name']}"),
            "name": ft["name"],
            "level": ft["level"],
            "reqSpecials": "",
            "textDescription": ft["desc"],
            "traits": f"3rd Party, {', '.join(ft['traits'])}",
            "src": "Pathfinder's Guide to Eberron",
            "databaseID": 1
        }
        pb.setdefault("listCustomFeats", []).append(entry)
        print(f"  Added Pathbuilder Feat: {ft['name']}")

    # 5. Spells
    existing_sp_names = {s["name"] for s in pb.get("listCustomSpells", [])}
    for sp in SPELLS:
        if sp["name"] in existing_sp_names:
            continue
        entry = {
            "uniqueID": make_pb_uuid(f"spell.{sp['name']}"),
            "name": sp["name"],
            "type": "Focus" if sp["type"] == "focus" else "Cantrip" if sp["type"] == "cantrip" else "Spell",
            "level": sp["level"],
            "traits": f"3rd Party, {', '.join(sp['traits'])}",
            "cast": sp.get("action", "2 actions"),
            "descriptionHeightened": sp["desc"],
            "src": "Pathfinder's Guide to Eberron",
            "databaseID": 1
        }
        pb.setdefault("listCustomSpells", []).append(entry)
        print(f"  Added Pathbuilder Spell: {sp['name']}")

    # 6. Weapons (Steel Jaws)
    existing_wp_names = {w["name"] for w in pb.get("listCustomWeapons", [])}
    if "Steel Jaws" not in existing_wp_names:
        entry = {
            "databaseID": 1,
            "uniqueIdentiier": make_pb_uuid("weapon.Steel Jaws"),
            "name": "Steel Jaws",
            "hands": "0",
            "description": "Droaamite steel jaw harness for worgs. Martial brawling weapon, 1d8 piercing.",
            "src": "Pathfinder's Guide to Eberron",
            "proficiencyType": 2,
            "damage": 8,
            "damageType": "P",
            "group": "Brawling",
            "weaponTraits": "Finesse, Trip, Disarm, 3rd Party"
        }
        pb.setdefault("listCustomWeapons", []).append(entry)
        print("  Added Pathbuilder Weapon: Steel Jaws")

    with open(PB_FILE, "w", encoding="utf-8") as f:
        json.dump(pb, f, indent=2)
    print("Pathbuilder JSON updated successfully.")

if __name__ == "__main__":
    generate_foundry_packs()
    update_pathbuilder()
