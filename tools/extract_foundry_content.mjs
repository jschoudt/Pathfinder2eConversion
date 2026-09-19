#!/usr/bin/env node
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';

const CONFIG_FILE = path.resolve('foundryconfig.json');
const OUTPUT_BASE_DIR = path.resolve('_sources/foundry_extracted');

async function getFoundryDataPath() {
  const args = process.argv.slice(2);
  const pathArgIdx = args.indexOf('--dataPath');
  if (pathArgIdx !== -1 && args[pathArgIdx + 1]) {
    return path.resolve(args[pathArgIdx + 1]);
  }

  if (!existsSync(CONFIG_FILE)) {
    console.error(`Error: 'foundryconfig.json' not found and no --dataPath argument provided.`);
    console.log(`Usage: node tools/extract_foundry_content.mjs [--module <id>] [--dataPath <path>]`);
    process.exit(1);
  }

  const raw = await readFile(CONFIG_FILE, 'utf-8');
  const config = JSON.parse(raw);
  if (!config.dataPath) {
    console.error(`Error: 'dataPath' is missing in foundryconfig.json.`);
    process.exit(1);
  }
  return path.resolve(config.dataPath);
}

import { cp, rm } from 'node:fs/promises';

async function extractPack(packDir, outputDir) {
  await mkdir(outputDir, { recursive: true });
  
  // Create a temporary snapshot of the pack to bypass LevelDB file locks while Foundry is running
  const tmpDir = path.resolve('_sources/.tmp_pack_' + Math.random().toString(36).substring(2, 9));
  await cp(packDir, tmpDir, {
    recursive: true,
    filter: (src) => !src.endsWith('LOCK')
  });

  const db = new ClassicLevel(tmpDir, { keyEncoding: 'utf8', valueEncoding: 'json' });
  const entries = [];
  try {
    await db.open();
    for await (const [key, value] of db.iterator()) {
      if (!value) continue;
      const id = value._id || key.replace(/^.*!/, '');
      const safeName = (value.name || id).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
      const filename = `${safeName}_${id}.json`;
      const filePath = path.join(outputDir, filename);

      await writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
      entries.push({
        id,
        name: value.name,
        type: value.type,
        file: filename
      });
    }
  } finally {
    try {
      await db.close();
    } catch {}
    await rm(tmpDir, { recursive: true, force: true });
  }

  return entries;
}

async function main() {
  const dataPath = await getFoundryDataPath();
  const modulesDir = path.join(dataPath, 'Data', 'modules');

  if (!existsSync(modulesDir)) {
    console.error(`Error: Modules directory not found at: ${modulesDir}`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const moduleFilterIdx = args.indexOf('--module');
  const targetModuleId = moduleFilterIdx !== -1 ? args[moduleFilterIdx + 1] : null;

  const moduleFolders = await readdir(modulesDir, { withFileTypes: true });
  const availableModules = moduleFolders.filter((d) => d.isDirectory()).map((d) => d.name);

  console.log(`\nScanning installed modules in: ${modulesDir}`);
  
  let modulesToProcess = [];
  if (targetModuleId) {
    if (!availableModules.includes(targetModuleId)) {
      console.error(`Module '${targetModuleId}' not found. Available modules:`, availableModules);
      process.exit(1);
    }
    modulesToProcess = [targetModuleId];
  } else {
    // Look for Eberron, D&D 2024, Artificer, or 5e modules
    const keywords = ['artificer', 'forge', 'eberron', 'dnd', '2024', 'phb', 'dmg', 'monster-manual'];
    modulesToProcess = availableModules.filter((m) => {
      const lower = m.toLowerCase();
      return keywords.some((k) => lower.includes(k)) && !lower.includes('pathfinders-guide-to-eberron');
    });

    if (modulesToProcess.length === 0) {
      console.log('No specific D&D 2024 / Eberron modules automatically detected by keyword.');
      console.log('Available modules:', availableModules);
      console.log('\nYou can extract any specific module using: npm run extract:dnd2024 -- --module <module-id>');
      return;
    }
  }

  console.log(`Modules selected for extraction: ${modulesToProcess.join(', ')}\n`);

  for (const modId of modulesToProcess) {
    const modDir = path.join(modulesDir, modId);
    const modManifestFile = path.join(modDir, 'module.json');
    let manifest = {};

    if (existsSync(modManifestFile)) {
      try {
        manifest = JSON.parse(await readFile(modManifestFile, 'utf-8'));
      } catch (e) {
        console.warn(`Could not parse module.json for ${modId}`);
      }
    }

    const packsDir = path.join(modDir, 'packs');
    if (!existsSync(packsDir)) {
      console.log(`Module '${modId}' has no packs directory. Skipping.`);
      continue;
    }

    const packEntries = await readdir(packsDir, { withFileTypes: true });
    const packs = packEntries.filter((p) => p.isDirectory()).map((p) => p.name);

    console.log(`📦 Module: ${manifest.title || modId} (${packs.length} pack(s))`);
    const moduleOutDir = path.join(OUTPUT_BASE_DIR, modId);
    await mkdir(moduleOutDir, { recursive: true });

    const moduleCatalog = {
      moduleId: modId,
      title: manifest.title || modId,
      version: manifest.version,
      extractedAt: new Date().toISOString(),
      packs: {}
    };

    for (const packName of packs) {
      const packDir = path.join(packsDir, packName);
      const packOutDir = path.join(moduleOutDir, packName);
      process.stdout.write(`  -> Extracting pack '${packName}'...`);
      try {
        const extracted = await extractPack(packDir, packOutDir);
        moduleCatalog.packs[packName] = {
          count: extracted.length,
          items: extracted
        };
        console.log(` Extracted ${extracted.length} records.`);
      } catch (err) {
        console.log(` Error: ${err.message}`);
      }
    }

    await writeFile(path.join(moduleOutDir, 'catalog.json'), JSON.stringify(moduleCatalog, null, 2), 'utf-8');
  }

  console.log(`\nExtraction completed! Extracted data stored in private staging directory: ${OUTPUT_BASE_DIR}`);
  console.log(`(This directory is strictly gitignored to protect proprietary content).`);
}

main().catch(console.error);
