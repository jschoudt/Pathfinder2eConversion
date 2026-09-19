#!/usr/bin/env node
import { readFile, symlink, lstat, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CONFIG_FILE = path.resolve('foundryconfig.json');

const MODULES_TO_LINK = [
  {
    name: 'pathfinders-guide-to-eberron-compendium',
    source: path.resolve('pathfinders-guide-to-eberron-compendium')
  },
  {
    name: 'pathfinders-guide-to-eberron-tests',
    source: path.resolve('tests/companion-module')
  }
];

async function main() {
  if (!existsSync(CONFIG_FILE)) {
    console.error(`\nError: Configuration file 'foundryconfig.json' not found.`);
    console.log(`Please copy 'foundryconfig.json.example' to 'foundryconfig.json' and configure your 'dataPath'.`);
    process.exit(1);
  }

  const rawConfig = await readFile(CONFIG_FILE, 'utf-8');
  let config;
  try {
    config = JSON.parse(rawConfig);
  } catch (err) {
    console.error(`Error parsing foundryconfig.json:`, err.message);
    process.exit(1);
  }

  if (!config.dataPath) {
    console.error(`Error: 'dataPath' is missing from foundryconfig.json.`);
    process.exit(1);
  }

  const targetModulesDir = path.resolve(config.dataPath, 'Data', 'modules');
  if (!existsSync(targetModulesDir)) {
    console.log(`Creating target modules directory: ${targetModulesDir}`);
    await mkdir(targetModulesDir, { recursive: true });
  }

  // Ensure LevelDB packs are built if not already present
  const packsDir = path.resolve('pathfinders-guide-to-eberron-compendium/packs');
  if (!existsSync(packsDir)) {
    console.log('Compiled packs missing. Building LevelDB packs from src/packs/...');
    const { execFileSync } = await import('node:child_process');
    execFileSync('node', ['tools/build_packs.mjs'], { stdio: 'inherit' });
  }

  console.log(`\nLinking Foundry modules into ${targetModulesDir}...`);

  for (const mod of MODULES_TO_LINK) {
    const linkPath = path.join(targetModulesDir, mod.name);

    if (existsSync(linkPath)) {
      const stat = await lstat(linkPath);
      if (stat.isSymbolicLink()) {
        await unlink(linkPath);
        console.log(`  Replacing existing symlink for ${mod.name}`);
      } else {
        console.error(`Error: A non-symlink directory already exists at ${linkPath}. Please remove or back it up first.`);
        continue;
      }
    }

    await symlink(mod.source, linkPath, 'dir');
    console.log(`  ✓ Linked ${mod.name} -> ${mod.source}`);
  }

  console.log(`\nAll modules linked successfully! Both the compendium and companion test suite are ready in Foundry.`);
}

main().catch(console.error);
