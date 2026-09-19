import fs from 'node:fs';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import { SRC_DIR } from './setup.mjs';

const SPELLS_DIR = path.join(SRC_DIR, 'eberron-spells');
const spellFiles = fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith('.json'));
const spells = spellFiles.map((f) => JSON.parse(fs.readFileSync(path.join(SPELLS_DIR, f), 'utf-8')));

describe('Eberron Spells Compendium Specifications', () => {

  test('compendium contains expected spell count', () => {
    expect(spells.length).toBeGreaterThanOrEqual(90);
  });

  describe('Individual Spell Validations', () => {
    test.each(
      spells.map((s) => [s.name, s])
    )('%s should have valid PF2e spell schema and mechanics', (name, spell) => {
      expect(spell.type).toBe('spell');

      // System level
      expect(spell.system).toBeDefined();
      expect(typeof spell.system.level.value).toBe('number');
      expect(spell.system.level.value).toBeGreaterThanOrEqual(1);
      expect(spell.system.level.value).toBeLessThanOrEqual(10);

      // Category
      expect(['spell', 'focus', 'cantrip', 'ritual']).toContain(spell.system.category.value);

      // Cast time
      expect(typeof spell.system.time.value).toBe('string');

      // Traits
      expect(Array.isArray(spell.system.traits.value)).toBe(true);

      // Description
      expect(typeof spell.system.description.value).toBe('string');
      expect(spell.system.description.value.length).toBeGreaterThan(10);
    });
  });

  describe('Dragonmark Cantrips & Focus Spells', () => {
    const markCantrips = [
      'Cantrip of Detection',
      'Cantrip of Finding',
      'Cantrip of the Courier',
      'Cantrip of the Crafter',
      'Cantrip of the Guard',
      'Cantrip of the Handler',
      'Cantrip of the Messenger',
      'Cantrip of the Sentinel',
    ];

    test.each(markCantrips)('should contain mark cantrip "%s"', (cantripName) => {
      const found = spells.find((s) => s.name === cantripName);
      expect(found, `Expected ${cantripName} to exist in eberron-spells`).toBeDefined();
      expect(found.system.category.value).toBe('focus');
    });
  });

  describe('Iconic Eberron Spells', () => {
    const iconicSpells = [
      'Aberrant Feedback',
      'Banish Dragonmark',
      'Become Shadow',
    ];

    test.each(iconicSpells)('should contain iconic Eberron spell "%s"', (spellName) => {
      const found = spells.find((s) => s.name === spellName);
      expect(found, `Expected ${spellName} to exist in eberron-spells`).toBeDefined();
      expect(found.system.description.value).toBeTruthy();
    });
  });
});
