#!/usr/bin/env node
import { readdir, mkdir, stat, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const SRC_DIR = path.resolve('src/packs');
const PACKS_DIR = path.resolve('pathfinders-guide-to-eberron/packs');
const STAMPS_FILE = path.join(PACKS_DIR, '.build_stamps.json');

async function getLatestMtime(dirPath) {
  let latest = 0;
  if (!existsSync(dirPath)) return 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isFile() && !entry.name.startsWith('.')) {
        const { mtimeMs } = await stat(full);
        if (mtimeMs > latest) latest = mtimeMs;
      }
    }
  } catch (_) {}
  return latest;
}

async function loadBuildStamps() {
  if (!existsSync(STAMPS_FILE)) return {};
  try {
    const raw = await readFile(STAMPS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

async function saveBuildStamps(stamps) {
  try {
    await writeFile(STAMPS_FILE, JSON.stringify(stamps, null, 2), 'utf-8');
  } catch (_) {}
}

export async function buildPacks({ incremental = false, verbose = true } = {}) {
  if (!existsSync(SRC_DIR)) {
    console.error(`Error: Source packs directory '${SRC_DIR}' does not exist.`);
    return false;
  }

  await mkdir(PACKS_DIR, { recursive: true });

  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  const packDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const stamps = await loadBuildStamps();
  let builtCount = 0;

  for (const packName of packDirs) {
    const inputDir = path.join(SRC_DIR, packName);
    const outputDir = path.join(PACKS_DIR, packName);

    const srcLatest = await getLatestMtime(inputDir);
    const lastBuilt = stamps[packName] || 0;

    if (incremental && existsSync(outputDir) && lastBuilt >= srcLatest && lastBuilt > 0) {
      continue;
    }

    if (verbose) console.log(`📦 Compiling LevelDB pack '${packName}'...`);

    try {
      const { stdout, stderr } = await execFileAsync('npx', [
        'fvtt',
        'package',
        'pack',
        packName,
        '--in',
        inputDir,
        '--out',
        PACKS_DIR
      ]);
      builtCount++;
      stamps[packName] = Date.now();
      if (stdout && verbose) process.stdout.write(stdout);
      if (stderr && verbose) process.stderr.write(stderr);
    } catch (err) {
      console.error(`Error packing '${packName}':`, err.message);
    }
  }

  if (builtCount > 0) {
    await saveBuildStamps(stamps);
    if (verbose) {
      console.log(`✨ Pack compilation complete (${builtCount} pack(s) updated).\n`);
    }
  }
  return true;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const isIncremental = process.argv.includes('--incremental');
  buildPacks({ incremental: isIncremental, verbose: true }).catch(console.error);
}
