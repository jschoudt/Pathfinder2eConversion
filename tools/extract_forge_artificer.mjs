#!/usr/bin/env node
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';
import { cleanHtmlToMarkdown } from './extract_ddb_journals.mjs';

const MODULE_DIR = path.resolve('_foundry/data/Data/modules/dnd-forge-artificer');
const PACKS_DIR = path.join(MODULE_DIR, 'packs');
const OUTPUT_DIR = path.resolve('_sources/foundry_extracted/forge_of_the_artificer');

async function loadPackRecords(packPath) {
  if (!existsSync(packPath)) return [];
  const tmpDir = path.resolve('_sources/.tmp_pack_' + Math.random().toString(36).substring(2, 9));
  await cp(packPath, tmpDir, {
    recursive: true,
    filter: (src) => !src.endsWith('LOCK')
  });

  const db = new ClassicLevel(tmpDir, { keyEncoding: 'utf8', valueEncoding: 'json' });
  const records = [];
  try {
    await db.open();
    for await (const [key, value] of db.iterator()) {
      if (value) records.push({ key, value });
    }
  } finally {
    try {
      await db.close();
    } catch {}
    await rm(tmpDir, { recursive: true, force: true });
  }
  return records;
}

function computeActorAC(actor, subItems = []) {
  if (actor.system?.attributes?.ac?.flat) {
    return actor.system.attributes.ac.flat;
  }
  const dex = actor.system?.abilities?.dex?.value ?? 10;
  const dexMod = Math.floor((dex - 10) / 2);
  const armor = subItems.find(
    (i) =>
      i.name &&
      (i.name.includes('Mail') ||
        i.name.includes('Leather') ||
        i.name.includes('Plate') ||
        i.system?.type?.value === 'armor')
  );

  let ac = 10 + dexMod;
  if (armor) {
    const aName = armor.name;
    if (aName.includes('Plate')) ac = 18;
    else if (aName.includes('Chain Mail')) ac = 16;
    else if (aName.includes('Half Plate') || aName.includes('Scale Mail')) ac = 14 + Math.min(2, dexMod);
    else if (aName.includes('Studded Leather')) ac = 12 + dexMod;
    else if (aName.includes('Leather')) ac = 11 + dexMod;
  }

  const shield = subItems.find((i) => i.name?.includes('Shield') || i.system?.type?.value === 'shield');
  if (shield) ac += 2;

  return ac;
}

function cleanFoundryMacros(text, actor = null, item = null) {
  if (!text) return '';

  let cleaned = text
    // &Reference[term ...] -> **term**
    .replace(/&amp;Reference\[([^\]\s]+)[^\]]*\]/gi, '**$1**')
    .replace(/&Reference\[([^\]\s]+)[^\]]*\]/gi, '**$1**')

    // [[/item ...]{Label} -> **Label** (handles single or double brackets)
    .replace(/\[\[\/item\s+[^\]]+\]+\{([^}]+)\}/gi, '**$1**')
    .replace(/\[\[\/item\s+([^\]]+)\]+/gi, '**$1**')

    // [[lookup @name ...]]
    .replace(/\[\[lookup\s+@name[^\]]*\]\]/gi, actor ? actor.name : 'the creature')
    .replace(/\[\[lookup\s+@attributes\.spell\.dc[^\]]*\]\]/gi, () => {
      const pb = actor?.system?.attributes?.prof ?? 2;
      const intMod = Math.floor(((actor?.system?.abilities?.int?.value ?? 10) - 10) / 2);
      return String(8 + pb + intMod);
    })
    .replace(/\[\[lookup\s+@attributes\.spell\.abilityLabel[^\]]*\]\]/gi, 'Intelligence')
    .replace(/\[\[lookup\s+@activation\.condition[^\]]*\]\]/gi, 'hit by an attack')
    .replace(/\[\[lookup\s+[^\]]+\]\]/gi, '')

    // Clean double commas or spacing
    .replace(/,\s*,+/g, ',')
    .replace(/[ \t]+/g, ' ');

  // Attack & Damage macros
  if (cleaned.includes('[[/attack') || cleaned.includes('[[/damage')) {
    let atkDesc = '*Attack:* +bonus to hit';
    let dmgDesc = 'Hit: damage';

    if (item?.system) {
      const actObj = Object.values(item.system.activities || {})[0];
      const isRanged =
        actObj?.attack?.type?.value === 'ranged' || (item.system.range?.value && !item.system.range?.reach);
      const reach = item.system.range?.reach ? `reach ${item.system.range.reach} ft.` : '';
      const range = item.system.range?.value
        ? `range ${item.system.range.value}${item.system.range.long ? `/${item.system.range.long}` : ''} ft.`
        : '';
      const atkTypeStr = isRanged ? `*Ranged Weapon Attack:*` : `*Melee Weapon Attack:*`;
      const distanceStr = isRanged ? range : reach || 'reach 5 ft.';

      const pb = actor?.system?.attributes?.prof ?? 2;
      const ability = actObj?.attack?.ability || (isRanged ? 'dex' : 'str');
      const abScore = actor?.system?.abilities?.[ability]?.value ?? 10;
      const abMod = Math.floor((abScore - 10) / 2);
      const bonus = pb + abMod;
      const bonusSign = bonus >= 0 ? `+${bonus}` : `${bonus}`;

      atkDesc = `${atkTypeStr} ${bonusSign} to hit, ${distanceStr}, one target`;

      const dmg = item.system.damage?.base;
      if (dmg && dmg.number && dmg.denomination) {
        const dType = dmg.types?.[0] || 'damage';
        const flatMod = abMod !== 0 ? (abMod > 0 ? ` + ${abMod}` : ` - ${Math.abs(abMod)}`) : '';
        dmgDesc = `Hit: ${dmg.number}d${dmg.denomination}${flatMod} ${dType} damage`;
      }
    }

    cleaned = cleaned
      .replace(/\[\[\/attack[^\]]*\]\]/gi, atkDesc)
      .replace(/\[\[\/damage\s+([0-9a-z\s]+)average[^\]]*\]\]/gi, 'Hit: $1 damage')
      .replace(/\[\[\/damage[^\]]*\]\]/gi, dmgDesc);
  }

  return cleaned;
}

function formatActorMarkdown(actor, subItems = []) {
  const parts = [];
  const cr = actor.system?.details?.cr ?? '—';
  const type = actor.system?.details?.type?.value || actor.type;
  const alignment = actor.system?.details?.alignment || 'Unformatted';
  const hp = actor.system?.attributes?.hp?.value ?? actor.system?.attributes?.hp?.max ?? '—';
  const hpFormula = actor.system?.attributes?.hp?.formula ? ` (${actor.system.attributes.hp.formula})` : '';
  const ac = computeActorAC(actor, subItems);

  parts.push(`### ${actor.name} (CR ${cr})`);
  parts.push(`*${type}, ${alignment}*`);
  parts.push(`- **Armor Class:** ${ac}`);
  parts.push(`- **Hit Points:** ${hp}${hpFormula}`);

  const speedObj = actor.system?.attributes?.movement;
  if (speedObj) {
    const speeds = [];
    if (speedObj.walk) speeds.push(`${speedObj.walk} ft.`);
    if (speedObj.fly) speeds.push(`fly ${speedObj.fly} ft.`);
    if (speedObj.swim) speeds.push(`swim ${speedObj.swim} ft.`);
    if (speedObj.climb) speeds.push(`climb ${speedObj.climb} ft.`);
    if (speeds.length > 0) parts.push(`- **Speed:** ${speeds.join(', ')}`);
  }

  // Abilities
  const ab = actor.system?.abilities;
  if (ab && ab.str) {
    const fmt = (stat) => {
      const v = ab[stat]?.value ?? 10;
      const mod = Math.floor((v - 10) / 2);
      return `${v} (${mod >= 0 ? '+' + mod : mod})`;
    };
    parts.push(
      `- **Abilities:** STR ${fmt('str')} | DEX ${fmt('dex')} | CON ${fmt('con')} | INT ${fmt('int')} | WIS ${fmt(
        'wis'
      )} | CHA ${fmt('cha')}`
    );
  }

  // Traits
  const traitsObj = actor.system?.traits;
  if (traitsObj?.languages?.custom || traitsObj?.languages?.value?.length > 0) {
    const langs = [...(traitsObj.languages.value || [])];
    if (traitsObj.languages.custom) langs.push(traitsObj.languages.custom);
    parts.push(`- **Languages:** ${langs.join(', ')}`);
  }

  const bio = actor.system?.details?.biography?.value;
  if (bio) {
    parts.push(`\n${cleanHtmlToMarkdown(bio)}\n`);
  }

  if (subItems.length > 0) {
    const actions = subItems.filter((i) => i.system?.activation?.type === 'action' || i.type === 'weapon');
    const bonusActions = subItems.filter((i) => i.system?.activation?.type === 'bonus');
    const reactions = subItems.filter((i) => i.system?.activation?.type === 'reaction');
    const traits = subItems.filter(
      (i) =>
        i.type === 'feat' &&
        !['action', 'bonus', 'reaction'].includes(i.system?.activation?.type)
    );
    const spells = subItems.filter((i) => i.type === 'spell');

    if (traits.length > 0) {
      parts.push(`\n#### Special Traits`);
      for (const t of traits) {
        const rawDesc = cleanHtmlToMarkdown(t.system?.description?.value || '');
        const desc = cleanFoundryMacros(rawDesc, actor, t);
        parts.push(`- **${t.name}.** ${desc}`);
      }
    }

    if (actions.length > 0) {
      parts.push(`\n#### Actions`);
      for (const a of actions) {
        const rawDesc = cleanHtmlToMarkdown(a.system?.description?.value || '');
        const desc = cleanFoundryMacros(rawDesc, actor, a);
        parts.push(`- **${a.name}.** ${desc}`);
      }
    }

    if (bonusActions.length > 0) {
      parts.push(`\n#### Bonus Actions`);
      for (const b of bonusActions) {
        const rawDesc = cleanHtmlToMarkdown(b.system?.description?.value || '');
        const desc = cleanFoundryMacros(rawDesc, actor, b);
        parts.push(`- **${b.name}.** ${desc}`);
      }
    }

    if (reactions.length > 0) {
      parts.push(`\n#### Reactions`);
      for (const r of reactions) {
        const rawDesc = cleanHtmlToMarkdown(r.system?.description?.value || '');
        const desc = cleanFoundryMacros(rawDesc, actor, r);
        parts.push(`- **${r.name}.** ${desc}`);
      }
    }

    if (spells.length > 0) {
      parts.push(`\n#### Spells`);
      for (const s of spells) {
        const rawDesc = cleanHtmlToMarkdown(s.system?.description?.value || '');
        const desc = cleanFoundryMacros(rawDesc, actor, s);
        parts.push(`- **${s.name}** (Level ${s.system?.level ?? 0}): ${desc}`);
      }
    }
  }

  return parts.join('\n');
}

export async function extractForgeArtificer(packsDir = PACKS_DIR, outputDir = OUTPUT_DIR) {
  if (!existsSync(packsDir)) {
    console.error(`❌ Module packs directory not found: ${packsDir}`);
    process.exit(1);
  }

  console.log(`\n📦 Extracting Eberron: Forge of the Artificer from: ${packsDir}`);
  await mkdir(outputDir, { recursive: true });
  const chaptersDir = path.join(outputDir, 'chapters');
  await mkdir(chaptersDir, { recursive: true });

  // 1. Load all records from packs
  const bookRecords = await loadPackRecords(path.join(packsDir, 'book'));
  const optionsRecords = await loadPackRecords(path.join(packsDir, 'options'));
  const itemsRecords = await loadPackRecords(path.join(packsDir, 'items'));
  const bastionsRecords = await loadPackRecords(path.join(packsDir, 'bastions'));
  const actorsRecords = await loadPackRecords(path.join(packsDir, 'actors'));

  // Lookup maps
  const optionsMap = new Map();
  for (const r of optionsRecords) {
    if (r.value?._id) {
      optionsMap.set(r.value._id, r.value);
      optionsMap.set(`Compendium.dnd-forge-artificer.options.Item.${r.value._id}`, r.value);
    }
  }

  const itemsMap = new Map();
  for (const r of itemsRecords) {
    if (r.value?._id) {
      itemsMap.set(r.value._id, r.value);
      itemsMap.set(`Compendium.dnd-forge-artificer.items.Item.${r.value._id}`, r.value);
    }
  }

  const bastionsMap = new Map();
  for (const r of bastionsRecords) {
    if (r.value?._id) {
      bastionsMap.set(r.value._id, r.value);
      bastionsMap.set(`Compendium.dnd-forge-artificer.bastions.Item.${r.value._id}`, r.value);
    }
  }

  // Actors and subkeys
  const actorsMap = new Map();
  const actorSubItems = new Map();
  for (const r of actorsRecords) {
    if (r.key.startsWith('!actors!') && r.value?._id) {
      actorsMap.set(r.value._id, r.value);
      actorsMap.set(`Compendium.dnd-forge-artificer.actors.Actor.${r.value._id}`, r.value);
    } else if (r.key.startsWith('!actors.items!') && !r.key.includes('.effects!')) {
      const parts = r.key.replace('!actors.items!', '').split('.');
      const actorId = parts[0];
      if (!actorSubItems.has(actorId)) actorSubItems.set(actorId, []);
      actorSubItems.get(actorId).push(r.value);
    }
  }

  // Book folders, journals, pages
  const foldersMap = new Map();
  const journalsMap = new Map();
  const pagesMap = new Map();

  for (const r of bookRecords) {
    if (r.key.startsWith('!folders!') && r.value?._id) {
      foldersMap.set(r.value._id, r.value);
    } else if (r.key.startsWith('!journal!') && !r.key.startsWith('!journal.pages!') && r.value?._id) {
      journalsMap.set(r.value._id, r.value);
    } else if (r.key.startsWith('!journal.pages!')) {
      const pageKey = r.key.replace('!journal.pages!', '');
      pagesMap.set(pageKey, r.value);
    }
  }

  console.log(`Loaded from packs:
  - Book: ${journalsMap.size} journals, ${pagesMap.size} pages
  - Character Options: ${optionsMap.size / 2} items
  - Equipment & Magic Items: ${itemsMap.size / 2} items
  - Bastions: ${bastionsMap.size / 2} items
  - Actors & Vehicles: ${actorsMap.size / 2} actors (${actorSubItems.size} with embedded items)`);

  const chapterDefinitions = [
    {
      id: '00_introduction',
      name: 'Introduction & Overview',
      match: (j, f) => !f && (j.name.includes('Introduction') || j.name.includes('Credits') || j.name.includes('Changelog'))
    },
    {
      id: '01_chapter_1',
      name: 'Chapter 1: The Artificer',
      match: (j, f) => f?.name?.includes('Chapter 1') || j.name.includes('The Artificer') || j.name.includes('Artificer Subclasses')
    },
    {
      id: '02_chapter_2',
      name: 'Chapter 2: Character Options',
      match: (j, f) => f?.name?.includes('Chapter 2') || j.name.includes('Character Options')
    },
    {
      id: '03_chapter_3',
      name: 'Chapter 3: Bastions in Khorvaire',
      match: (j, f) => f?.name?.includes('Chapter 3') || j.name.includes('Bastions')
    },
    {
      id: '04_chapter_4',
      name: 'Chapter 4: Sharn Inquisitives',
      match: (j, f) => f?.name?.includes('Chapter 4') || j.name.includes('Sharn') || j.name.includes('Inquisitive')
    },
    {
      id: '05_chapter_5',
      name: 'Chapter 5: Dragonmarked Intrigue',
      match: (j, f) => f?.name?.includes('Chapter 5') || j.name.includes('Dragonmarked')
    },
    {
      id: '06_chapter_6',
      name: 'Chapter 6: Morgrave Expeditions',
      match: (j, f) => f?.name?.includes('Chapter 6') || j.name.includes('Morgrave')
    },
    {
      id: '07_chapter_7',
      name: 'Chapter 7: Elemental Airships',
      match: (j, f) => f?.name?.includes('Chapter 7') || j.name.includes('Airship')
    },
    {
      id: '08_stat_blocks',
      name: 'Chapter 8: Stat Blocks & Bestiary',
      match: (j, f) => j.name.includes('Stat Blocks')
    },
    {
      id: '09_appendices',
      name: 'Appendices & Spell Lists',
      match: (j, f) => j.name.startsWith('Appendix')
    }
  ];

  const assignedJournals = new Set();
  const structuredSections = [];
  let totalChars = 0;
  let totalWords = 0;
  const fullBookMarkdown = [];

  fullBookMarkdown.push(`# Eberron: Forge of the Artificer
**Authors:** Andrew Clayton, Kim Mantas, Jeff Hitchcock, Clayton Thomson, Matthew Haentschke, Matt Ryan
**Publisher:** Foundry Gaming LLC
**Reference URL:** https://foundryvtt.com/packages/dnd-forge-artificer

---
`);

  for (let chIdx = 0; chIdx < chapterDefinitions.length; chIdx++) {
    const chDef = chapterDefinitions[chIdx];
    const chJournals = [];

    for (const [jId, journal] of journalsMap) {
      if (assignedJournals.has(jId)) continue;
      const folder = foldersMap.get(journal.folder);
      if (chDef.match(journal, folder)) {
        chJournals.push({ id: jId, journal, folder });
        assignedJournals.add(jId);
      }
    }

    chJournals.sort((a, b) => (a.journal.sort ?? 0) - (b.journal.sort ?? 0));

    const chContent = [];
    chContent.push(`# ${chDef.name}\n\n`);

    let secOrder = 0;

    for (const jObj of chJournals) {
      const journal = jObj.journal;
      const pageIds = Array.isArray(journal.pages) ? journal.pages : [];

      for (let pIdx = 0; pIdx < pageIds.length; pIdx++) {
        const pageId = typeof pageIds[pIdx] === 'string' ? pageIds[pIdx] : pageIds[pIdx]?._id;
        const pageDoc = pagesMap.get(`${journal._id}.${pageId}`);
        if (!pageDoc) continue;

        if (pageDoc.type === 'image' && !pageDoc.text?.content && !pageDoc.system?.description?.value) {
          continue;
        }

        const sectionParts = [];

        // Subclass / class pages
        if (pageDoc.type === 'subclass' || pageDoc.type === 'class') {
          const itemUuid = pageDoc.system?.item;
          if (itemUuid && optionsMap.has(itemUuid)) {
            const item = optionsMap.get(itemUuid);
            const itemDesc = item.system?.description?.value || '';
            if (itemDesc) sectionParts.push(itemDesc);

            if (Array.isArray(item.system?.advancement)) {
              for (const adv of item.system.advancement) {
                const grantItems = adv.configuration?.items || [];
                for (const gi of grantItems) {
                  const gUuid = gi.uuid;
                  if (optionsMap.has(gUuid)) {
                    const feature = optionsMap.get(gUuid);
                    const fDesc = feature.system?.description?.value || '';
                    sectionParts.push(`\n<h3>${feature.name} (Level ${adv.level})</h3>\n${fDesc}\n`);
                  }
                }
              }
            }
          }
        }

        const pageContent = pageDoc.text?.content || pageDoc.system?.description?.value || '';
        if (pageContent) {
          sectionParts.push(pageContent);
        }

        let combinedText = sectionParts.join('\n\n');

        // Recursive embed resolution (up to 4 passes for nested embeds)
        let pass = 0;
        const embedRegex = /@Embed\[Compendium\.dnd-forge-artificer\.([^.]+)\.([^.]+)\.([a-zA-Z0-9_-]+)[^\]]*\](?:\{([^}]+)\})?/g;
        while (combinedText.includes('@Embed[') && pass < 4) {
          pass++;
          combinedText = combinedText.replace(embedRegex, (fullMatch, packName, docType, docId, label) => {
            if (docType === 'Actor' && actorsMap.has(docId)) {
              const actor = actorsMap.get(docId);
              const subItems = actorSubItems.get(actor._id) || [];
              return `\n\n${formatActorMarkdown(actor, subItems)}\n\n`;
            } else if (docType === 'Item') {
              const item = optionsMap.get(docId) || itemsMap.get(docId) || bastionsMap.get(docId);
              if (item) {
                const itemDesc = cleanHtmlToMarkdown(item.system?.description?.value || '');
                return `\n\n**${item.name}**: ${itemDesc}\n\n`;
              }
            }
            return '';
          });
        }

        // Clean @UUID links into readable bold text
        combinedText = combinedText.replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '**$1**');
        combinedText = combinedText.replace(/@UUID\[Compendium\.dnd-forge-artificer\.[^.]+\.[^.]+\.([a-zA-Z0-9_-]+)\]/g, (m, id) => {
          const doc = optionsMap.get(id) || itemsMap.get(id) || bastionsMap.get(id) || actorsMap.get(id);
          return doc ? `**${doc.name}**` : '';
        });
        combinedText = combinedText.replace(/@UUID\[Compendium\.[^\]]+\]/g, '');

        // Clean Foundry macros
        combinedText = cleanFoundryMacros(combinedText);

        const fullSectionMarkdown = cleanHtmlToMarkdown(combinedText);
        if (!fullSectionMarkdown) continue;

        secOrder++;
        const words = fullSectionMarkdown.split(/\s+/).filter(Boolean).length;
        totalChars += fullSectionMarkdown.length;
        totalWords += words;

        const secTitle = pageDoc.name !== journal.name ? `${journal.name} - ${pageDoc.name}` : pageDoc.name;
        chContent.push(`## ${secTitle}\n\n${fullSectionMarkdown}\n\n`);

        structuredSections.push({
          bookId: 'forge_of_the_artificer',
          bookTitle: 'Eberron: Forge of the Artificer',
          chapterOrder: chIdx,
          chapterName: chDef.name,
          sectionOrder: secOrder,
          sectionName: secTitle,
          pageId: pageDoc._id,
          charCount: fullSectionMarkdown.length,
          wordCount: words,
          text: fullSectionMarkdown
        });
      }
    }

    const chapterFileContent = chContent.join('');
    const chFilename = `${chDef.id}.md`;
    await writeFile(path.join(chaptersDir, chFilename), chapterFileContent, 'utf-8');
    fullBookMarkdown.push(chapterFileContent);
  }

  // 2. Index all individual options (feats, infusions, backgrounds, bastion facilities, magic items) as dedicated sections
  console.log(`\nIndexing dedicated character options and mechanical items...`);
  const itemCatalogSections = [];

  // Options: Feats & Infusions
  for (const [id, item] of optionsMap) {
    if (!id.startsWith('Compendium.')) continue;
    const rawDesc = cleanHtmlToMarkdown(item.system?.description?.value || '');
    const desc = cleanFoundryMacros(rawDesc, null, item);
    if (!desc || desc.length < 20) continue;

    const typeLabel = item.type === 'feat' ? 'Feat / Infusion' : item.type;
    const text = `### ${item.name} (${typeLabel})\n\n${desc}`;
    const words = text.split(/\s+/).filter(Boolean).length;

    itemCatalogSections.push({
      bookId: 'forge_of_the_artificer',
      bookTitle: 'Eberron: Forge of the Artificer',
      chapterOrder: 2,
      chapterName: 'Chapter 2: Character Options & Infusions',
      sectionOrder: structuredSections.length + itemCatalogSections.length + 1,
      sectionName: `${item.name} (${typeLabel})`,
      pageId: item._id,
      charCount: text.length,
      wordCount: words,
      text
    });
  }

  // Items: Airship Equipment & Magic Items
  for (const [id, item] of itemsMap) {
    if (!id.startsWith('Compendium.')) continue;
    const rawDesc = cleanHtmlToMarkdown(item.system?.description?.value || '');
    const desc = cleanFoundryMacros(rawDesc, null, item);
    if (!desc || desc.length < 20) continue;

    const text = `### ${item.name} (${item.type})\n\n${desc}`;
    const words = text.split(/\s+/).filter(Boolean).length;

    itemCatalogSections.push({
      bookId: 'forge_of_the_artificer',
      bookTitle: 'Eberron: Forge of the Artificer',
      chapterOrder: 7,
      chapterName: 'Chapter 7: Airship Equipment & Magic Items',
      sectionOrder: structuredSections.length + itemCatalogSections.length + 1,
      sectionName: `${item.name} (Item)`,
      pageId: item._id,
      charCount: text.length,
      wordCount: words,
      text
    });
  }

  // Bastions: Facilities & Charms
  for (const [id, item] of bastionsMap) {
    if (!id.startsWith('Compendium.')) continue;
    const rawDesc = cleanHtmlToMarkdown(item.system?.description?.value || '');
    const desc = cleanFoundryMacros(rawDesc, null, item);
    if (!desc || desc.length < 20) continue;

    const text = `### ${item.name} (Bastion ${item.type})\n\n${desc}`;
    const words = text.split(/\s+/).filter(Boolean).length;

    itemCatalogSections.push({
      bookId: 'forge_of_the_artificer',
      bookTitle: 'Eberron: Forge of the Artificer',
      chapterOrder: 3,
      chapterName: 'Chapter 3: Bastions & Facilities',
      sectionOrder: structuredSections.length + itemCatalogSections.length + 1,
      sectionName: `${item.name} (Bastion)`,
      pageId: item._id,
      charCount: text.length,
      wordCount: words,
      text
    });
  }

  const allSections = [...structuredSections, ...itemCatalogSections];

  // Write full consolidated book & structured sections
  const fullBookPath = path.join(outputDir, 'forge_of_the_artificer_full.md');
  await writeFile(fullBookPath, fullBookMarkdown.join('\n---\n\n'), 'utf-8');

  const sectionsJsonPath = path.join(outputDir, 'forge_of_the_artificer_sections.json');
  await writeFile(sectionsJsonPath, JSON.stringify(allSections, null, 2), 'utf-8');

  let grandTotalWords = 0;
  let grandTotalChars = 0;
  for (const s of allSections) {
    grandTotalWords += s.wordCount;
    grandTotalChars += s.charCount;
  }

  console.log(`\n🎉 Extraction Complete!`);
  console.log(`- Book Chapters: ${chapterDefinitions.length}`);
  console.log(`- Narrative Sections: ${structuredSections.length}`);
  console.log(`- Mechanical Catalog Sections: ${itemCatalogSections.length}`);
  console.log(`- Total Indexed Sections: ${allSections.length}`);
  console.log(`- Total Words: ${grandTotalWords.toLocaleString()}`);
  console.log(`- Total Characters: ${grandTotalChars.toLocaleString()}`);
  console.log(`- Files written to: ${outputDir}`);

  return {
    sections: allSections.length,
    words: grandTotalWords,
    chars: grandTotalChars,
    outputDir
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve('tools/extract_forge_artificer.mjs')) {
  extractForgeArtificer().catch((err) => {
    console.error('Extraction failed:', err);
    process.exit(1);
  });
}
