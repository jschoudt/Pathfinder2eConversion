#!/usr/bin/env node
import { readFile, symlink, lstat, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CONFIG_FILE = path.resolve('foundryconfig.json');
const MODULE_NAME = 'pathfinders-guide-to-eberron-compendium';
const LOCAL_MODULE_PATH = path.resolve(MODULE_NAME);

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

  const linkPath = path.join(targetModulesDir, MODULE_NAME);

  if (existsSync(linkPath)) {
    const stat = await lstat(linkPath);
    if (stat.isSymbolicLink()) {
      await unlink(linkPath);
      console.log(`Replacing existing symlink at ${linkPath}`);
    } else {
      console.error(`Error: A non-symlink directory already exists at ${linkPath}. Please remove or back it up first.`);
      process.exit(1);
    }
  }

  await symlink(LOCAL_MODULE_PATH, linkPath, 'dir');
  console.log(`\nSuccessfully linked:`);
  console.log(`  Source: ${LOCAL_MODULE_PATH}`);
  console.log(`  Target: ${linkPath}`);
  console.log(`\nNow whenever you run 'npm run build', changes will immediately be available in your local Foundry server!`);
}

main().catch(console.error);
