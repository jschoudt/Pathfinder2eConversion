#!/usr/bin/env node

/**
 * Migration script to normalize legacy `hb_` prefixes in compendium items.
 * Removes `hb_` prefix from:
 * - system.traits.value (e.g. "hb_warforged" -> "warforged")
 * - system.rules[].add (e.g. "hb_dragonmarked-heritage" -> "dragonmarked-heritage")
 * - system.baseItem (e.g. "hb_boomerang-talenta" -> "boomerang-talenta")
 * - system.group (e.g. "hb_boomerang" -> "boomerang")
 * - system.languages.value (e.g. "hb_quori" -> "quori")
 */

import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function stripHb(str) {
  if (typeof str === 'string' && str.startsWith('hb_')) {
    return str.slice(3);
  }
  return str;
}

function normalizeItem(item) {
  let changed = false;

  if (item.system) {
    // 1. system.traits.value
    if (Array.isArray(item.system.traits?.value)) {
      const newTraits = item.system.traits.value.map(t => {
        const stripped = stripHb(t);
        if (stripped !== t) changed = true;
        return stripped;
      });
      item.system.traits.value = newTraits;
    }

    // 2. system.baseItem
    if (typeof item.system.baseItem === 'string' && item.system.baseItem.startsWith('hb_')) {
      item.system.baseItem = stripHb(item.system.baseItem);
      changed = true;
    }

    // 3. system.group
    if (typeof item.system.group === 'string' && item.system.group.startsWith('hb_')) {
      item.system.group = stripHb(item.system.group);
      changed = true;
    }

    // 4. system.languages.value
    if (Array.isArray(item.system.languages?.value)) {
      const newLanguages = item.system.languages.value.map(l => {
        const stripped = stripHb(l);
        if (stripped !== l) changed = true;
        return stripped;
      });
      item.system.languages.value = newLanguages;
    }

    // 5. system.rules
    if (Array.isArray(item.system.rules)) {
      item.system.rules.forEach(rule => {
        if (Array.isArray(rule.add)) {
          const newAdd = rule.add.map(t => {
            const stripped = stripHb(t);
            if (stripped !== t) changed = true;
            return stripped;
          });
          rule.add = newAdd;
        }
        if (Array.isArray(rule.predicate)) {
          const newPredicate = rule.predicate.map(p => {
            const stripped = stripHb(p);
            if (stripped !== p) changed = true;
            return stripped;
          });
          rule.predicate = newPredicate;
        }
      });
    }
  }

  // Also check embedded items (e.g. if actors have embedded items)
  if (Array.isArray(item.items)) {
    item.items.forEach(embedded => {
      if (normalizeItem(embedded)) {
        changed = true;
      }
    });
  }

  return changed;
}

const packsDir = path.resolve('src/packs');
const files = walk(packsDir);
let modifiedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(content);
  if (normalizeItem(json)) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
    modifiedCount++;
  }
}

console.log(`Successfully normalized traits in ${modifiedCount} files.`);
