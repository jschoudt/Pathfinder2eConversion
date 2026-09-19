#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src/packs');

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

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Error: Source packs directory '${SRC_DIR}' does not exist.`);
    process.exit(1);
  }

  const jsonFiles = await getJsonFiles(SRC_DIR);
  console.log(`\nValidating ${jsonFiles.length} compendium source item(s) in 'src/packs/'...\n` + '='.repeat(70));

  let parseErrors = 0;
  let schemaErrors = 0;
  let remasterWarnings = 0;
  const warningsByFile = new Map();

  for (const file of jsonFiles) {
    const relPath = path.relative(process.cwd(), file);
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

    // Schema checks
    if (!data._id || !data.name || !data.type || !data.system) {
      console.warn(`⚠️ Schema issue in ${relPath}: missing one of [_id, name, type, system]`);
      schemaErrors++;
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

  console.log(`\nValidation Summary:`);
  console.log(`  Total Items Checked:    ${jsonFiles.length}`);
  console.log(`  JSON Parse Errors:      ${parseErrors}`);
  console.log(`  Schema Issues:          ${schemaErrors}`);
  console.log(`  Items with Remaster Warnings: ${warningsByFile.size}`);
  console.log(`  Total Legacy Remaster Terms:  ${remasterWarnings}`);

  if (warningsByFile.size > 0) {
    console.log(`\nTop 10 Files with Pre-Remaster Terminology to Update:`);
    let shown = 0;
    for (const [file, warnings] of warningsByFile.entries()) {
      if (shown++ >= 10) break;
      console.log(`  📄 ${file}`);
      for (const w of warnings) {
        console.log(`     - Found "${w.term}" (${w.count}x) -> Replace with "${w.replacement}" (${w.description})`);
      }
    }
    if (warningsByFile.size > 10) {
      console.log(`  ... and ${warningsByFile.size - 10} more files.`);
    }
  }

  // Check Foundry options.json for UPnP security
  const optionsFile = path.resolve('_foundry/data/Config/options.json');
  if (existsSync(optionsFile)) {
    try {
      const opts = JSON.parse(await readFile(optionsFile, 'utf-8'));
      if (opts.upnp === true) {
        console.error(`\n❌ SECURITY ERROR: UPnP is ENABLED in _foundry/data/Config/options.json!`);
        console.error(`   Foundry must not have UPnP enabled for local development. Set "upnp": false.`);
        process.exit(1);
      } else {
        console.log(`🛡️  Foundry options check: UPnP is DISABLED.`);
      }
    } catch (e) {}
  }

  if (parseErrors > 0 || schemaErrors > 0) {
    console.error(`\n❌ Validation failed due to syntax or schema errors.`);
    process.exit(1);
  } else {
    console.log(`\n✅ All JSON source files are syntactically valid and structurally sound!`);
  }
}

main().catch(console.error);
