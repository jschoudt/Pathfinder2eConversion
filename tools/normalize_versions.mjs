#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve('src/packs');

const TARGET_VERSIONS = {
  coreVersion: '14.368',
  systemVersion: '8.5.1',
  schemaVersion: 0.959,
  systemId: 'pf2e'
};

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

function updateStats(stats) {
  const s = stats || {};
  s.systemId = TARGET_VERSIONS.systemId;
  s.systemVersion = TARGET_VERSIONS.systemVersion;
  s.coreVersion = TARGET_VERSIONS.coreVersion;
  return s;
}

function updateSchemaAndMigration(system) {
  if (!system) return;

  system._migration = {
    version: TARGET_VERSIONS.schemaVersion,
    previous: null
  };

  system.schema = {
    version: TARGET_VERSIONS.schemaVersion,
    lastMigration: {
      datetime: null,
      version: {
        schema: TARGET_VERSIONS.schemaVersion,
        foundry: TARGET_VERSIONS.coreVersion,
        system: TARGET_VERSIONS.systemVersion
      }
    }
  };
}

async function main() {
  const files = await getJsonFiles(SRC_DIR);
  console.log(`\nNormalizing Foundry (${TARGET_VERSIONS.coreVersion}), PF2e (${TARGET_VERSIONS.systemVersion}), and schema (${TARGET_VERSIONS.schemaVersion}) versions across ${files.length} items...\n` + '='.repeat(70));

  let updatedCount = 0;

  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const data = JSON.parse(raw);
    const isNpc = data.type === 'npc';

    data._stats = updateStats(data._stats);
    updateSchemaAndMigration(data.system);

    if (isNpc && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item._stats) {
          item._stats = updateStats(item._stats);
        }
        if (item.system) {
          updateSchemaAndMigration(item.system);
        }
      }
    }

    const formatted = JSON.stringify(data, null, 2) + '\n';
    await writeFile(file, formatted, 'utf-8');
    updatedCount++;
  }

  console.log(`\nSuccessfully normalized versions for ${updatedCount} files!\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
