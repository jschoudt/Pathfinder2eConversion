# Changelog - Pathfinder's Guide to Eberron (Foundry VTT Compendium)

All notable changes to the **Pathfinder's Guide to Eberron** compendium module will be documented in this file.
This format is optimized for both human reading and automated changelog tools (including Foundry VTT core and Big Bad Module Manager).

---

## [2.4.0] - 2026-09-19

### Changed - Pathfinder 2e Remaster Alignment
- **Terminology Migration:** Migrated all 582 compendium items to PF2e Remaster standards:
  - **Off-guard:** Replaced all occurrences of *flat-footed* with *off-guard* across feats, ancestries, and spells (*Forewarned*, *Moon Presence*, *Pack Tactics*, *Detect Danger*, etc.).
  - **Spell Ranks:** Replaced *spell level* with *spell rank* across all feats, spells, and magic items.
  - **Vitality & Void:** Replaced *positive/negative energy* and *damage* with *vitality* and *void* across creatures, spells (*Healing Word*), and deities (*The Path of Light*).
  - **Traits:** Updated all damage and spell traits (`positive` -> `vitality`, `negative` -> `void`).
- **Deity Modernization:** Updated all Eberron deity entries:
  - Mapped legacy `ability` arrays to modern `attribute` arrays.
  - Added Remaster ORC publication metadata (`{ license: "ORC", remaster: true }`).

### Added - Modern Foundry v14 Support
- **Foundry v14 & PF2e 8.5.1 Compatibility:** Declared and verified compatibility with Foundry Virtual Tabletop v14 and PF2e System v8.5.1+.
- **Modern DialogV2:** Modernized license and community notice dialog in `legal.js` to use `foundry.applications.api.DialogV2.prompt` with fallback for legacy v11.
- **Source-Controlled Compendiums:** Decompiled monolithic binary LevelDB packs into 582 individual, human-readable JSON files in `src/packs/` compiled on-demand using `@foundryvtt/foundryvtt-cli`.
- **Packaging & Build System:** Added automated CLI scripts for building, linting, packaging, and testing compendium packs.
- **Automated Tier 1 Headless Schema & System Validation:** Integrated automated validation in `tools/validate_packs.mjs` (`npm test`) using Foundry v14's native `BaseItem`, `BaseActor`, `BaseJournalEntry`, and `BaseRollTable` Document schema engine alongside installed PF2e system `template.json`, validating 582 source documents, rule elements, and internal `@UUID` link integrity with zero schema errors.
- **Security & UPnP Enforcement:** Disabled UPnP in local server options and added automated startup/test validation guards preventing Foundry from running with UPnP enabled.
- **D&D 2024 & Forge of the Artificer Extraction Pipeline:** Added `npm run extract:dnd2024` tool to extract installed 2024 core rules and *Forge of the Artificer* packs into private staging for mechanical conversion.

### Removed
- Removed legacy bundled `.zip` file from the module source directory (now output to `dist/`).
- Removed deprecated `.db` extension references from compendium pack declarations in `module.json`.

---

## [2.3.2] - 2024-02-15
- Compendium pack maintenance and compatibility updates for Foundry v11.
- Synchronized compendium items with core conversion errata.

---

## [2.3.0] - 2023-10-29
- Synchronized Foundry VTT compendium versioning with the main document release.
- Added support for Pathbuilder custom pack integration.
- Added legal notice prompt on module launch in compliance with WotC Fan Content and Paizo CUP policies.

---

## [2.0.0] - 2022-09-08
- Complete overhaul of Eberron Ancestries (Kalashtar, Shifter, Warforged, Eberron Changeling).
- Added Dragonmarked Heritages, Focus Spells, and Feats.
- Added Eberron Magic Items, Shards, and Equipment.
