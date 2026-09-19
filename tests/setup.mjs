import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const SRC_DIR = path.resolve('src/packs');
export const MODULE_MANIFEST_PATH = path.resolve('pathfinders-guide-to-eberron/module.json');
export const FOUNDRY_APP_DIR = path.resolve('_foundry/app');
export const PF2E_SYSTEM_DIR = path.resolve('_foundry/data/Data/systems/pf2e');
export const FOUNDRY_OPTIONS_PATH = path.resolve('_foundry/data/Config/options.json');

export const DEPRECATED_TERMS = [
  { pattern: /\bflat-footed\b/gi, replacement: 'off-guard', description: 'PF2e Remaster: Flat-footed is now Off-guard' },
  { pattern: /\bspell level\b/gi, replacement: 'spell rank', description: 'PF2e Remaster: Spell Level is now Spell Rank' },
  { pattern: /\bpositive energy\b/gi, replacement: 'vitality energy', description: 'PF2e Remaster: Positive is now Vitality' },
  { pattern: /\bnegative energy\b/gi, replacement: 'void energy', description: 'PF2e Remaster: Negative is now Void' },
  { pattern: /\bpositive damage\b/gi, replacement: 'vitality damage', description: 'PF2e Remaster: Positive damage is now Vitality damage' },
  { pattern: /\bnegative damage\b/gi, replacement: 'void damage', description: 'PF2e Remaster: Negative damage is now Void damage' },
  { pattern: /\battack of opportunity\b/gi, replacement: 'reactive strike', description: 'PF2e Remaster: Attack of Opportunity is now Reactive Strike' }
];

let cachedDocs = null;
let cachedManifest = null;
let cachedFoundry = null;

export async function getModuleManifest() {
  if (!cachedManifest) {
    cachedManifest = JSON.parse(await readFile(MODULE_MANIFEST_PATH, 'utf-8'));
  }
  return cachedManifest;
}

export async function initFoundryEnvironment() {
  if (cachedFoundry) return cachedFoundry;

  const manifest = await getModuleManifest();
  const packTypeMap = {};
  for (const pack of manifest.packs || []) {
    packTypeMap[pack.name] = pack.type;
  }

  const templatePath = path.join(PF2E_SYSTEM_DIR, 'template.json');
  let pf2eTemplate = null;
  if (existsSync(templatePath)) {
    pf2eTemplate = JSON.parse(await readFile(templatePath, 'utf-8'));
  }

  const serverMjsPath = path.join(FOUNDRY_APP_DIR, 'common/server.mjs');
  let docClasses = null;

  if (existsSync(serverMjsPath) && pf2eTemplate) {
    await import(serverMjsPath);

    globalThis.logger = {
      warn: () => {},
      error: () => {}
    };

    globalThis.game = {
      model: {
        Item: Object.fromEntries((pf2eTemplate.Item?.types || []).map(t => [t, pf2eTemplate.Item[t] || {}])),
        Actor: Object.fromEntries((pf2eTemplate.Actor?.types || []).map(t => [t, pf2eTemplate.Actor[t] || {}]))
      }
    };

    globalThis.CONFIG = {
      Item: { documentClass: foundry.documents.BaseItem, dataModels: {}, typeLabels: {} },
      Actor: { documentClass: foundry.documents.BaseActor, dataModels: {}, typeLabels: {} },
      JournalEntry: { documentClass: foundry.documents.BaseJournalEntry, dataModels: {} },
      RollTable: { documentClass: foundry.documents.BaseRollTable, dataModels: {} },
      Token: { movement: { actions: {} } }
    };

    docClasses = {
      Item: foundry.documents.BaseItem,
      Actor: foundry.documents.BaseActor,
      JournalEntry: foundry.documents.BaseJournalEntry,
      RollTable: foundry.documents.BaseRollTable
    };
  }

  cachedFoundry = {
    docClasses,
    pf2eTemplate,
    packTypeMap
  };
  return cachedFoundry;
}

export async function loadAllDocuments() {
  if (cachedDocs) return cachedDocs;

  const manifest = await getModuleManifest();
  const packTypeMap = {};
  for (const pack of manifest.packs || []) {
    packTypeMap[pack.name] = pack.type;
  }

  const docs = [];
  const packDirs = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const packDir of packDirs) {
    const fullDir = path.join(SRC_DIR, packDir);
    const files = (await readdir(fullDir, { withFileTypes: true }))
      .filter(e => e.isFile() && e.name.endsWith('.json'))
      .map(e => e.name);

    const docType = packTypeMap[packDir] || 'Item';

    for (const file of files) {
      const fullPath = path.join(fullDir, file);
      const relPath = path.relative(process.cwd(), fullPath);
      const content = await readFile(fullPath, 'utf-8');
      const data = JSON.parse(content);
      docs.push({
        fullPath,
        relPath,
        packName: packDir,
        fileName: file,
        docType,
        content,
        data
      });
    }
  }

  cachedDocs = docs;
  return docs;
}
