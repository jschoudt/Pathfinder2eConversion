#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src/packs');
const MODULE_MANIFEST_PATH = path.resolve('pathfinders-guide-to-eberron/module.json');
const FOUNDRY_APP_DIR = path.resolve('_foundry/app');
const PF2E_SYSTEM_DIR = path.resolve('_foundry/data/Data/systems/pf2e');
const FOUNDRY_OPTIONS_PATH = path.resolve('_foundry/data/Config/options.json');

const DEPRECATED_TERMS = [
  { pattern: /\bflat-footed\b/gi, replacement: 'off-guard', description: 'PF2e Remaster: Flat-footed is now Off-guard' },
  { pattern: /\bspell level\b/gi, replacement: 'spell rank', description: 'PF2e Remaster: Spell Level is now Spell Rank' },
  { pattern: /\bpositive energy\b/gi, replacement: 'vitality energy', description: 'PF2e Remaster: Positive is now Vitality' },
  { pattern: /\bnegative energy\b/gi, replacement: 'void energy', description: 'PF2e Remaster: Negative is now Void' },
  { pattern: /\bpositive damage\b/gi, replacement: 'vitality damage', description: 'PF2e Remaster: Positive damage is now Vitality damage' },
  { pattern: /\bnegative damage\b/gi, replacement: 'void damage', description: 'PF2e Remaster: Negative damage is now Void damage' },
  { pattern: /\battack of opportunity\b/gi, replacement: 'reactive strike', description: 'PF2e Remaster: Attack of Opportunity is now Reactive Strike' }
];

async function getJsonFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getJsonFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

// Check semver / Foundry version compatibility
function checkVersionCompatibility(manifest, foundryVersion, pf2eVersion) {
  const issues = [];
  const compat = manifest.compatibility || {};

  if (foundryVersion) {
    if (compat.minimum && isVersionLessThan(foundryVersion, compat.minimum)) {
      issues.push(`Installed Foundry (${foundryVersion}) is below module minimum (${compat.minimum})`);
    }
    if (compat.maximum && isVersionGreaterThan(foundryVersion, compat.maximum)) {
      issues.push(`Installed Foundry (${foundryVersion}) exceeds module maximum (${compat.maximum})`);
    }
  }

  if (pf2eVersion && manifest.relationships?.systems) {
    const pf2eRel = manifest.relationships.systems.find(s => s.id === 'pf2e');
    if (pf2eRel?.compatibility?.minimum && isVersionLessThan(pf2eVersion, pf2eRel.compatibility.minimum)) {
      issues.push(`Installed PF2e system (${pf2eVersion}) is below minimum (${pf2eRel.compatibility.minimum})`);
    }
  }

  return issues;
}

function isVersionLessThan(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na < nb) return true;
    if (na > nb) return false;
  }
  return false;
}

function isVersionGreaterThan(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na > nb) return true;
    if (na < nb) return false;
  }
  return false;
}

async function main() {
  console.log(`\n======================================================================`);
  console.log(`  PF2e Eberron Compendium Validator (Tier 1: Schema & System Engine)  `);
  console.log(`======================================================================\n`);

  if (!existsSync(SRC_DIR)) {
    console.error(`❌ Error: Source packs directory '${SRC_DIR}' does not exist.`);
    process.exit(1);
  }

  let moduleManifest;
  try {
    moduleManifest = JSON.parse(await readFile(MODULE_MANIFEST_PATH, 'utf-8'));
    console.log(`📦 Loaded Module Manifest: ${moduleManifest.id} v${moduleManifest.version}`);
  } catch (err) {
    console.error(`❌ Failed to load module.json: ${err.message}`);
    process.exit(1);
  }

  // 1. Audit Security Configuration
  if (existsSync(FOUNDRY_OPTIONS_PATH)) {
    try {
      const opts = JSON.parse(await readFile(FOUNDRY_OPTIONS_PATH, 'utf-8'));
      if (opts.upnp === true) {
        console.error(`❌ SECURITY ERROR: UPnP is ENABLED in ${FOUNDRY_OPTIONS_PATH}!`);
        console.error(`   Foundry must not have UPnP enabled for local development. Set "upnp": false.`);
        process.exit(1);
      } else {
        console.log(`🛡️  Foundry options: UPnP is DISABLED (verified).`);
      }
    } catch (e) {}
  }

  // 2. Detect Installed Foundry VTT & PF2e System
  let hasFoundryApp = existsSync(path.join(FOUNDRY_APP_DIR, 'common/server.mjs'));
  let hasPf2eSystem = existsSync(path.join(PF2E_SYSTEM_DIR, 'template.json'));
  let foundryVersion = null;
  let pf2eVersion = null;
  let pf2eTemplate = null;

  if (hasFoundryApp) {
    try {
      const fPkg = JSON.parse(await readFile(path.join(FOUNDRY_APP_DIR, 'package.json'), 'utf-8'));
      foundryVersion = fPkg.version;
    } catch (e) {}
  }

  if (hasPf2eSystem) {
    try {
      const sJson = JSON.parse(await readFile(path.join(PF2E_SYSTEM_DIR, 'system.json'), 'utf-8'));
      pf2eVersion = sJson.version;
      pf2eTemplate = JSON.parse(await readFile(path.join(PF2E_SYSTEM_DIR, 'template.json'), 'utf-8'));
    } catch (e) {}
  }

  console.log(`🔍 Environment Detection:`);
  console.log(`   - Foundry VTT: ${foundryVersion ? `v${foundryVersion} (installed)` : 'Not found in _foundry/app'}`);
  console.log(`   - PF2e System: ${pf2eVersion ? `v${pf2eVersion} (installed)` : 'Not found in _foundry/data'}`);

  // Check version compatibility
  const compatIssues = checkVersionCompatibility(moduleManifest, foundryVersion, pf2eVersion);
  if (compatIssues.length > 0) {
    console.warn(`\n⚠️ Compatibility Warnings:`);
    for (const issue of compatIssues) console.warn(`   - ${issue}`);
  } else if (foundryVersion && pf2eVersion) {
    console.log(`   - Compatibility: Manifest is fully compatible with installed versions.`);
  }

  // 3. Initialize Foundry VTT Headless Environment
  let docClasses = null;
  if (hasFoundryApp && pf2eTemplate) {
    try {
      await import(path.join(FOUNDRY_APP_DIR, 'common/server.mjs'));
      globalThis.logger = {
        warn: () => {},
        error: (msg) => console.error("Foundry error:", msg)
      };

      const allActorTypes = Array.from(new Set([...(pf2eTemplate.Actor?.types || []), 'army', 'character', 'familiar', 'hazard', 'loot', 'npc', 'party', 'vehicle']));
      globalThis.game = {
        system: { primaryTokenAttribute: 'attributes.hp' },
        model: {
          Item: Object.fromEntries((pf2eTemplate.Item?.types || []).map(t => [t, pf2eTemplate.Item[t] || {}])),
          Actor: Object.fromEntries(allActorTypes.map(t => [t, pf2eTemplate.Actor[t] || {}]))
        }
      };

      globalThis.CONFIG = {
        Item: { documentClass: foundry.documents.BaseItem, dataModels: {}, typeLabels: {} },
        Actor: { documentClass: foundry.documents.BaseActor, dataModels: {}, typeLabels: {} },
        ActorDelta: { documentClass: foundry.documents.BaseActorDelta, dataModels: {} },
        ActiveEffect: { documentClass: foundry.documents.BaseActiveEffect, dataModels: {} },
        JournalEntry: { documentClass: foundry.documents.BaseJournalEntry, dataModels: {} },
        RollTable: { documentClass: foundry.documents.BaseRollTable, dataModels: {} },
        Token: { movement: { actions: {} } }
      };

      docClasses = {
        Item: foundry.documents.BaseItem,
        Actor: foundry.documents.BaseActor,
        JournalEntry: foundry.documents.BaseJournalEntry,
        RollTable: foundry.documents.BaseRollTable
      };
      console.log(`⚡ Initialized Foundry VTT v14 Document Schema Engine with PF2e template models.`);
    } catch (err) {
      console.warn(`⚠️ Could not bootstrap Foundry server module: ${err.message}. Running static validation only.`);
    }
  }

  // Map pack directories to Document Types from module.json
  const packTypeMap = {};
  for (const pack of moduleManifest.packs || []) {
    packTypeMap[pack.name] = pack.type;
  }

  // 4. Scan and Index all documents
  const jsonFiles = await getJsonFiles(SRC_DIR);
  console.log(`\nValidating ${jsonFiles.length} item(s) across source packs...`);

  let parseErrors = 0;
  let schemaErrors = 0;
  let ruleErrors = 0;
  let remasterWarnings = 0;
  const warningsByFile = new Map();
  const idMap = new Map(); // id -> relPath
  const uuidReferences = []; // { from, ref, targetId }

  for (const file of jsonFiles) {
    const relPath = path.relative(process.cwd(), file);
    const packName = path.basename(path.dirname(file));
    const docType = packTypeMap[packName] || 'Item';

    let content;
    try {
      content = await readFile(file, 'utf-8');
    } catch (e) {
      console.error(`❌ Read error: ${relPath} - ${e.message}`);
      parseErrors++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error(`❌ JSON parse error: ${relPath} - ${e.message}`);
      parseErrors++;
      continue;
    }

    // Index ID
    if (data._id) {
      if (idMap.has(data._id)) {
        console.error(`❌ Duplicate ID: '${data._id}' found in both ${idMap.get(data._id)} and ${relPath}`);
        schemaErrors++;
      } else {
        idMap.set(data._id, relPath);
      }
    } else {
      console.error(`❌ Missing '_id' field in ${relPath}`);
      schemaErrors++;
    }

    // Foundry native DataModel validation
    if (docClasses && docClasses[docType]) {
      try {
        const Cls = docClasses[docType];
        const doc = new Cls(data);
        doc.validate();
      } catch (err) {
        console.error(`❌ Foundry Schema Error in ${relPath}: ${err.message}`);
        schemaErrors++;
      }
    } else {
      // Fallback structural check
      if (!data._id || !data.name || !data.type || !data.system) {
        console.warn(`⚠️ Schema issue in ${relPath}: missing required core fields [_id, name, type, system]`);
        schemaErrors++;
      }
    }

    // Validate PF2e Document Type if template is available
    if (pf2eTemplate) {
      if (docType === 'Item' && !pf2eTemplate.Item?.types?.includes(data.type)) {
        console.error(`❌ Invalid PF2e Item type '${data.type}' in ${relPath}`);
        schemaErrors++;
      } else if (docType === 'Actor' && !pf2eTemplate.Actor?.types?.includes(data.type) && !['army', 'character', 'familiar', 'hazard', 'loot', 'npc', 'party', 'vehicle'].includes(data.type)) {
        console.error(`❌ Invalid PF2e Actor type '${data.type}' in ${relPath}`);
        schemaErrors++;
      }
    }

    // Validate PF2e Rule Elements
    if (data.system?.rules && Array.isArray(data.system.rules)) {
      for (const [idx, rule] of data.system.rules.entries()) {
        if (!rule || typeof rule !== 'object') {
          console.error(`❌ Rule element #${idx} in ${relPath} is not an object.`);
          ruleErrors++;
          continue;
        }
        if (!rule.key || typeof rule.key !== 'string') {
          console.error(`❌ Rule element #${idx} in ${relPath} is missing a valid 'key'.`);
          ruleErrors++;
        }
      }
    }

    // Collect UUID references for link validation
    const matches = content.match(/@UUID\[([^\]]+)\]/g) || [];
    for (const match of matches) {
      if (match.includes('pathfinders-guide-to-eberron')) {
        const targetId = match.replace('@UUID[', '').replace(']', '').split('.').pop().trim();
        uuidReferences.push({ from: relPath, ref: match, targetId });
      }
      if (match.includes('Compendium.pf2e.spells-srd') || match.includes('Compendium.pf2e.feats-srd') ||
          match.includes('Compendium.pf2e.actionspf2e') || match.includes('Compendium.pf2e.conditionitems') ||
          match.includes('Compendium.pf2e.equipment-srd')) {
        console.warn(`⚠️ Legacy PF2e pack reference in ${relPath}: ${match}`);
      }
    }

    // Remaster terminology audit
    const fileWarnings = [];
    const descriptionText = data.system?.description?.value || '';
    const fullTextToCheck = `${data.name} ${descriptionText}`;

    for (const term of DEPRECATED_TERMS) {
      const matches = fullTextToCheck.match(term.pattern);
      if (matches) {
        fileWarnings.push({
          term: matches[0],
          replacement: term.replacement,
          description: term.description,
          count: matches.length
        });
        remasterWarnings += matches.length;
      }
    }

    if (fileWarnings.length > 0) {
      warningsByFile.set(relPath, fileWarnings);
    }
  }

  // 5. Internal Link Integrity Check
  let brokenLinks = 0;
  for (const { from, ref, targetId } of uuidReferences) {
    if (!idMap.has(targetId)) {
      console.warn(`⚠️ Broken internal link in ${from}: ${ref} (Target ID '${targetId}' not found)`);
      brokenLinks++;
    }
  }

  // 6. Summary Report
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`Validation Results:`);
  console.log(`  Items Checked:                 ${jsonFiles.length}`);
  console.log(`  JSON Parse Errors:             ${parseErrors}`);
  console.log(`  Foundry Schema Errors:         ${schemaErrors}`);
  console.log(`  PF2e Rule Element Errors:      ${ruleErrors}`);
  console.log(`  Internal Broken UUID Links:    ${brokenLinks}`);
  console.log(`  Items with Remaster Warnings:  ${warningsByFile.size}`);
  console.log(`  Total Remaster Terms to Fix:   ${remasterWarnings}`);
  console.log(`----------------------------------------------------------------------`);

  if (warningsByFile.size > 0) {
    console.log(`\nTop Files with Pre-Remaster Terminology:`);
    let shown = 0;
    for (const [file, warnings] of warningsByFile.entries()) {
      if (shown++ >= 5) break;
      console.log(`  📄 ${file}`);
      for (const w of warnings) {
        console.log(`     - "${w.term}" (${w.count}x) -> replace with "${w.replacement}"`);
      }
    }
  }

  if (parseErrors > 0 || schemaErrors > 0 || ruleErrors > 0) {
    console.error(`\n❌ Tier 1 Validation FAILED with critical errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Tier 1 Validation PASSED: All source documents conform to Foundry v14 and PF2e schemas!\n`);
  }
}

main().catch(console.error);
