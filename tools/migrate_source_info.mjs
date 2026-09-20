#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve('src/packs');

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

function resolvePublicationAndSource(existingPub, existingSrc) {
  let title = existingPub?.title?.trim() || (typeof existingSrc === 'string' ? existingSrc.trim() : existingSrc?.value?.trim());
  if (!title) {
    title = "Pathfinder's Guide to Eberron";
  }

  const isLegacyPaizo = title.startsWith('Pathfinder ') && title !== "Pathfinder's Guide to Eberron";
  const license = existingPub?.license || (isLegacyPaizo ? 'OGL' : 'ORC');
  const remaster = existingPub?.remaster !== undefined ? existingPub.remaster : !isLegacyPaizo;

  const publication = {
    title,
    authors: existingPub?.authors || '',
    license,
    remaster,
    page: 'N/A'
  };

  const source = {
    value: title,
    page: 'N/A'
  };

  return { publication, source };
}

async function main() {
  const files = await getJsonFiles(SRC_DIR);
  console.log(`\nUpdating publication and source information across ${files.length} items...\n` + '='.repeat(70));

  let updatedCount = 0;

  for (const file of files) {
    const raw = await readFile(file, 'utf-8');
    const data = JSON.parse(raw);
    const isNpc = data.type === 'npc';

    if (isNpc) {
      data.system ??= {};
      data.system.details ??= {};
      const { publication, source } = resolvePublicationAndSource(
        data.system.details.publication,
        data.system.details.source
      );
      data.system.details.publication = publication;
      data.system.details.source = {
        value: source.value,
        author: data.system.details.source?.author || '',
        page: 'N/A'
      };

      if (Array.isArray(data.items)) {
        for (const it of data.items) {
          if (it.system) {
            const itRes = resolvePublicationAndSource(it.system.publication, it.system.source);
            it.system.publication = itRes.publication;
            it.system.source = itRes.source;
          }
        }
      }
    } else {
      data.system ??= {};
      const { publication, source } = resolvePublicationAndSource(
        data.system.publication,
        data.system.source
      );
      data.system.publication = publication;
      data.system.source = source;
    }

    const formatted = JSON.stringify(data, null, 2) + '\n';
    await writeFile(file, formatted, 'utf-8');
    updatedCount++;
  }

  console.log(`\nUpdated publication & source information for ${updatedCount} files successfully!\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
