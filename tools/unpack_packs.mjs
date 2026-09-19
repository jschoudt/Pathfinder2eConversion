#!/usr/bin/env node
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PACKS_DIR = path.resolve('pathfinders-guide-to-eberron-compendium/packs');
const SRC_DIR = path.resolve('src/packs');

async function main() {
  if (!existsSync(PACKS_DIR)) {
    console.error(`Error: Packs directory '${PACKS_DIR}' not found.`);
    process.exit(1);
  }

  await mkdir(SRC_DIR, { recursive: true });

  const entries = await readdir(PACKS_DIR, { withFileTypes: true });
  const packDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  console.log(`Found ${packDirs.length} pack(s) to unpack from ${PACKS_DIR}:\n`);

  for (const packName of packDirs) {
    const targetSrcDir = path.join(SRC_DIR, packName);
    await mkdir(targetSrcDir, { recursive: true });

    console.log(`Unpacking '${packName}' -> 'src/packs/${packName}'...`);
    try {
      const { stdout, stderr } = await execFileAsync('npx', [
        'fvtt',
        'package',
        'unpack',
        packName,
        '--in',
        PACKS_DIR,
        '--out',
        targetSrcDir
      ]);
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    } catch (err) {
      console.error(`Error unpacking pack '${packName}':`, err.message);
    }
  }

  console.log('\nUnpacking complete! All source JSON files are located in src/packs/');
}

main().catch(console.error);
