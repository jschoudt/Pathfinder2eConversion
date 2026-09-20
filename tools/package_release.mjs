#!/usr/bin/env node
import { readFile, copyFile, mkdir, rm, cp, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT_DIR = process.cwd();
const MODULE_DIR = 'pathfinders-guide-to-eberron';
const TEST_MODULE_DIR = path.join('tests', 'companion-module');
const PATHBUILDER_DIR = 'pathbuilder-custom-pack';
const DIST_DIR = path.resolve('dist');
const STAGING_DIR = path.join(DIST_DIR, '.staging');

async function extractChangelogSection(changelogPath, targetVersion) {
  if (!existsSync(changelogPath)) {
    return `Release notes for version ${targetVersion}`;
  }

  const content = await readFile(changelogPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  let capturing = false;
  const extractedLines = [];

  // Match ## [2.4.0] or ## 2.4.0
  const versionRegex = new RegExp(`^##\\s+\\[?${targetVersion.replace(/\./g, '\\.')}\\]?`, 'i');
  const nextHeadingRegex = /^##\s+\[?[0-9]/;

  for (const line of lines) {
    if (!capturing) {
      if (versionRegex.test(line)) {
        capturing = true;
        extractedLines.push(line);
      }
    } else {
      if (nextHeadingRegex.test(line)) {
        break;
      }
      extractedLines.push(line);
    }
  }

  // If specific version section wasn't found, extract top-most version section
  if (extractedLines.length === 0) {
    let started = false;
    for (const line of lines) {
      if (!started && nextHeadingRegex.test(line)) {
        started = true;
        extractedLines.push(line);
      } else if (started) {
        if (nextHeadingRegex.test(line)) {
          break;
        }
        extractedLines.push(line);
      }
    }
  }

  return extractedLines.join('\n').trim();
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Starting Pathfinder\'s Guide to Eberron Release Packaging');
  console.log('='.repeat(60) + '\n');

  // 1. Validation of compendium schemas
  console.log('📋 [1/7] Validating compendium packs against Foundry & PF2e schemas...');
  await execFileAsync('node', ['tools/validate_packs.mjs'], { stdio: 'inherit' });

  // 2. Build LevelDB packs
  console.log('📦 [2/7] Compiling LevelDB packs from src/packs/...');
  await execFileAsync('node', ['tools/build_packs.mjs'], { stdio: 'inherit' });

  // 3. Read module manifest
  const manifestPath = path.join(MODULE_DIR, 'module.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
  const version = manifest.version;
  console.log(`📌 [3/7] Packaging release artifacts for version v${version}...`);

  // Prepare clean output directories
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true, force: true });
  }
  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(STAGING_DIR, { recursive: true });

  // 4. Build/Verify PDF guide
  console.log('📄 [4/7] Generating PDF Guide (pathfinders-guide-to-eberron.pdf)...');
  try {
    await execFileAsync('node', ['tools/generate_pdf.mjs'], { stdio: 'inherit' });
  } catch (err) {
    console.warn(`⚠️ Warning: PDF generation failed (${err.message}). Checking existing PDF...`);
    if (!existsSync(path.join(ROOT_DIR, 'pathfinders-guide-to-eberron.pdf'))) {
      throw new Error('PDF generation failed and no pre-existing PDF exists.');
    }
  }
  const sourcePdfPath = path.join(ROOT_DIR, 'pathfinders-guide-to-eberron.pdf');
  const destPdfPath = path.join(DIST_DIR, 'pathfinders-guide-to-eberron.pdf');
  await copyFile(sourcePdfPath, destPdfPath);

  // 5. Package Foundry Release Module
  console.log('📦 [5/7] Packaging Foundry VTT Release Module...');
  const moduleZipPath = path.join(DIST_DIR, `${MODULE_DIR}.zip`);
  await execFileAsync('zip', [
    '-r',
    moduleZipPath,
    MODULE_DIR,
    '-x',
    '*.DS_Store*',
    '*.lock',
    '*__MACOSX*'
  ]);
  // Copy manifest to dist/module.json for latest download link
  await copyFile(manifestPath, path.join(DIST_DIR, 'module.json'));

  // 6. Package Companion Test Module
  console.log('🧪 [6/7] Packaging Companion In-VTT Test Module...');
  const testModuleStaging = path.join(STAGING_DIR, 'pathfinders-guide-to-eberron-tests');
  await mkdir(testModuleStaging, { recursive: true });
  await copyFile(path.join(TEST_MODULE_DIR, 'module.json'), path.join(testModuleStaging, 'module.json'));
  await cp(path.join(TEST_MODULE_DIR, 'scripts'), path.join(testModuleStaging, 'scripts'), { recursive: true });
  
  const testModuleZipPath = path.join(DIST_DIR, 'pathfinders-guide-to-eberron-tests.zip');
  await execFileAsync('zip', [
    '-r',
    testModuleZipPath,
    'pathfinders-guide-to-eberron-tests',
    '-x',
    '*.DS_Store*',
    '*__MACOSX*'
  ], { cwd: STAGING_DIR });

  // 7. Package Pathbuilder integration & Text zip
  console.log('🗜️  [7/7] Packaging Pathbuilder pack, Guide text source, and Changelog...');
  
  // Pathbuilder integration pack
  const pathbuilderSource = path.join(PATHBUILDER_DIR, 'pathfinders-guide-to-eberron.json');
  const pathbuilderDest = path.join(DIST_DIR, 'pathfinders-guide-to-eberron.json');
  if (existsSync(pathbuilderSource)) {
    await copyFile(pathbuilderSource, pathbuilderDest);
  } else {
    console.warn('⚠️ Pathbuilder custom pack JSON not found!');
  }

  // Guide text source archive
  const textZipPath = path.join(DIST_DIR, 'pathfinders-guide-to-eberron-text.zip');
  await execFileAsync('zip', [
    '-r',
    textZipPath,
    'Pathfinder-2e-Eberron-Conversion.txt',
    'Subsections',
    '-x',
    '*.DS_Store*',
    '*__MACOSX*'
  ]);

  // Extract Changelog for release notes
  const changelogPath = path.join(MODULE_DIR, 'CHANGELOG.md');
  const releaseNotes = await extractChangelogSection(changelogPath, version);
  const releaseNotesPath = path.join(DIST_DIR, 'RELEASE_NOTES.md');
  await copyFile(changelogPath, path.join(DIST_DIR, 'CHANGELOG.md'));
  
  const releaseNotesContent = releaseNotes || `## [${version}]\n\nRelease version ${version} of Pathfinder's Guide to Eberron.`;
  await (await import('node:fs')).promises.writeFile(releaseNotesPath, releaseNotesContent, 'utf-8');

  // Clean staging
  await rm(STAGING_DIR, { recursive: true, force: true });

  // Print summary of built artifacts
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 RELEASE PACKAGING COMPLETE (v${version})`);
  console.log('='.repeat(60));
  const distFiles = await readdir(DIST_DIR);
  for (const file of distFiles.sort()) {
    const filePath = path.join(DIST_DIR, file);
    const fileStat = await stat(filePath);
    const sizeStr = fileStat.size >= 1024 * 1024
      ? `${(fileStat.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileStat.size / 1024).toFixed(1)} KB`;
    console.log(`  📦 dist/${file.padEnd(38)} (${sizeStr})`);
  }
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ Packaging failed:', err);
  process.exit(1);
});
