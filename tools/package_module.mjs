#!/usr/bin/env node
import { readFile, copyFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MODULE_DIR = 'pathfinders-guide-to-eberron-compendium';
const DIST_DIR = path.resolve('dist');

async function main() {
  console.log(`\nStarting release packaging...\n` + '='.repeat(50));

  // 0. Validate packs against installed Foundry and PF2e
  console.log('1. Validating source packs against Foundry v14 and PF2e...');
  await execFileAsync('node', ['tools/validate_packs.mjs'], { stdio: 'inherit' });

  // 1. Build packs
  console.log('2. Building LevelDB packs from src/packs/...');
  await execFileAsync('node', ['tools/build_packs.mjs']);

  // 2. Validate manifest
  const manifestPath = path.join(MODULE_DIR, 'module.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  console.log(`3. Verified manifest for version v${manifest.version}`);

  // 3. Prepare dist
  await mkdir(DIST_DIR, { recursive: true });
  const zipName = `${MODULE_DIR}.zip`;
  const zipPath = path.join(DIST_DIR, zipName);

  if (existsSync(zipPath)) {
    await rm(zipPath);
  }

  // 4. Create ZIP package
  console.log(`3. Creating distribution zip: dist/${zipName}...`);
  // Zip from repository root including the module directory
  await execFileAsync('zip', [
    '-r',
    zipPath,
    MODULE_DIR,
    '-x',
    '*.DS_Store*',
    '*.lock',
    '*__MACOSX*'
  ]);

  // 5. Copy manifest and changelog to dist
  console.log(`4. Copying module.json and CHANGELOG.md to dist/...`);
  await copyFile(manifestPath, path.join(DIST_DIR, 'module.json'));
  const changelogPath = path.join(MODULE_DIR, 'CHANGELOG.md');
  if (existsSync(changelogPath)) {
    await copyFile(changelogPath, path.join(DIST_DIR, 'CHANGELOG.md'));
  }

  console.log(`\n🎉 Packaging complete!`);
  console.log(`   - Release ZIP:      ${zipPath}`);
  console.log(`   - Release Manifest: ${path.join(DIST_DIR, 'module.json')}`);
  console.log(`   - Release Notes:    ${path.join(DIST_DIR, 'CHANGELOG.md')}`);
}

main().catch(console.error);
