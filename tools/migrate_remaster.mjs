#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC_DIR = path.resolve('src/packs');

// Replacement dictionary preserving exact case
const REPLACEMENTS = [
  { from: /\bflat-footed\b/g, to: 'off-guard' },
  { from: /\bFlat-footed\b/g, to: 'Off-guard' },
  { from: /\bFLAT-FOOTED\b/g, to: 'OFF-GUARD' },

  { from: /\bspell levels\b/g, to: 'spell ranks' },
  { from: /\bSpell levels\b/g, to: 'Spell ranks' },
  { from: /\bSpell Levels\b/g, to: 'Spell Ranks' },

  { from: /\bspell level\b/g, to: 'spell rank' },
  { from: /\bSpell level\b/g, to: 'Spell rank' },
  { from: /\bSpell Level\b/g, to: 'Spell Rank' },

  { from: /\bpositive energy\b/g, to: 'vitality energy' },
  { from: /\bPositive energy\b/g, to: 'Vitality energy' },
  { from: /\bPositive Energy\b/g, to: 'Vitality Energy' },

  { from: /\bnegative energy\b/g, to: 'void energy' },
  { from: /\bNegative energy\b/g, to: 'Void energy' },
  { from: /\bNegative Energy\b/g, to: 'Void Energy' },

  { from: /\bpositive damage\b/g, to: 'vitality damage' },
  { from: /\bPositive damage\b/g, to: 'Vitality damage' },
  { from: /\bPositive Damage\b/g, to: 'Vitality Damage' },

  { from: /\bnegative damage\b/g, to: 'void damage' },
  { from: /\bNegative damage\b/g, to: 'Void damage' },
  { from: /\bNegative Damage\b/g, to: 'Void Damage' },

  { from: /\battacks of opportunity\b/g, to: 'reactive strikes' },
  { from: /\bAttacks of opportunity\b/g, to: 'Reactive strikes' },
  { from: /\bAttacks of Opportunity\b/g, to: 'Reactive Strikes' },

  { from: /\battack of opportunity\b/g, to: 'reactive strike' },
  { from: /\bAttack of opportunity\b/g, to: 'Reactive strike' },
  { from: /\bAttack of Opportunity\b/g, to: 'Reactive Strike' }
];

async function getJsonFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await getJsonFiles(full)));
    else if (entry.name.endsWith('.json')) files.push(full);
  }
  return files;
}

async function main() {
  const files = await getJsonFiles(SRC_DIR);
  console.log(`\nMigrating pre-Remaster terminology across ${files.length} items...\n` + '='.repeat(70));

  let modifiedFilesCount = 0;
  let totalReplacementsCount = 0;

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file);
    const content = await readFile(file, 'utf-8');
    const data = JSON.parse(content);
    let modified = false;

    // 1. Text description replacements
    let desc = data.system?.description?.value;
    if (typeof desc === 'string') {
      let originalDesc = desc;
      for (const r of REPLACEMENTS) {
        if (r.from.test(desc)) {
          desc = desc.replace(r.from, r.to);
        }
      }
      if (desc !== originalDesc) {
        data.system.description.value = desc;
        modified = true;
      }
    }

    // 2. Trait value replacements (positive -> vitality, negative -> void)
    if (Array.isArray(data.system?.traits?.value)) {
      const traits = data.system.traits.value.map((t) => {
        if (t === 'positive') {
          modified = true;
          return 'vitality';
        }
        if (t === 'negative') {
          modified = true;
          return 'void';
        }
        return t;
      });
      data.system.traits.value = traits;
    }

    // 3. Deity schema modernizations
    if (data.type === 'deity' && data.system) {
      if (Array.isArray(data.system.ability) && !data.system.attribute) {
        data.system.attribute = [...data.system.ability];
        modified = true;
      }
      if (!data.system.publication) {
        data.system.publication = {
          license: 'ORC',
          remaster: true,
          title: "Pathfinder's Guide to Eberron"
        };
        modified = true;
      }
    }

    // 4. Creature damage and defenses (positive/negative damage types)
    if (data.type === 'npc' && data.system) {
      // Check attacks / strikes damage types
      const text = JSON.stringify(data);
      let updatedText = text;
      for (const r of REPLACEMENTS) {
        if (r.from.test(updatedText)) {
          updatedText = updatedText.replace(r.from, r.to);
        }
      }
      if (updatedText !== text) {
        const parsed = JSON.parse(updatedText);
        Object.assign(data, parsed);
        modified = true;
      }
    }

    if (modified) {
      await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
      console.log(`✅ Updated Remaster terms in: ${relPath} (${data.name})`);
      modifiedFilesCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Migration Complete: Successfully updated ${modifiedFilesCount} file(s)!`);
}

main().catch(console.error);
