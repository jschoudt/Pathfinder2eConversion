#!/usr/bin/env node
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const SRC_DIR = path.resolve('src/packs');
const PACKS_DIR = path.resolve('pathfinders-guide-to-eberron/packs');

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Error: Source packs directory '${SRC_DIR}' does not exist.`);
    process.exit(1);
  }

  await mkdir(PACKS_DIR, { recursive: true });

  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  const packDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  console.log(`Building ${packDirs.length} pack(s) from ${SRC_DIR} -> ${PACKS_DIR}:\n`);

  for (const packName of packDirs) {
    const inputDir = path.join(SRC_DIR, packName);
    console.log(`Packing '${packName}'...`);

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
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    } catch (err) {
      console.error(`Error packing '${packName}':`, err.message);
    }
  }

  console.log('\nBuild complete! All packs compiled successfully into pathfinders-guide-to-eberron/packs/');
}

main().catch(console.error);
