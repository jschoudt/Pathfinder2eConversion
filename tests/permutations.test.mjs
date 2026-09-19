import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { initFoundryEnvironment, loadAllDocuments, PF2E_SYSTEM_DIR } from './setup.mjs';
import path from 'node:path';

describe('Ancestry & Heritage Permutations and Grants Validation', () => {
  let env;
  let docs;
  let docMap = new Map();
  let ancestryMap = new Map();
  let heritageMap = new Map();
  let validPf2ePacks = new Set();

  beforeAll(async () => {
    env = await initFoundryEnvironment();

    globalThis.game.release = { version: '12.331' };
    globalThis.game.system = {
      id: 'pf2e',
      version: '6.4.0',
      primaryTokenAttribute: 'attributes.hp',
      secondaryTokenAttribute: null
    };

    docs = await loadAllDocuments();
    for (const doc of docs) {
      docMap.set(doc.data._id, doc.data);
      if (doc.data.type === 'ancestry') ancestryMap.set(doc.data.name, doc.data);
      if (doc.data.type === 'heritage') heritageMap.set(doc.data.name, doc.data);
    }

    // Load registered PF2e system packs from system.json
    const systemJsonPath = path.join(PF2E_SYSTEM_DIR, 'system.json');
    const systemJson = JSON.parse(await readFile(systemJsonPath, 'utf-8'));
    for (const p of systemJson.packs || []) {
      validPf2ePacks.add(p.name);
    }
  });

  function createTestActor(name, items = []) {
    return new env.docClasses.Actor({
      name,
      type: 'character',
      items
    });
  }

  describe('PF2e System Pack Registry Integrity', () => {
    it('should verify that no rule element references non-existent pf2e compendium packs', () => {
      const invalidRefs = [];

      for (const doc of docs) {
        for (const rule of doc.data.system?.rules || []) {
          if (typeof rule.uuid === 'string' && rule.uuid.startsWith('Compendium.pf2e.')) {
            const parts = rule.uuid.split('.');
            const packName = parts[2];
            if (!validPf2ePacks.has(packName)) {
              invalidRefs.push({
                file: doc.relPath,
                ruleKey: rule.key,
                uuid: rule.uuid,
                invalidPack: packName
              });
            }
          }
        }
      }

      expect(invalidRefs, 'Found rule elements referencing non-existent pf2e packs').toEqual([]);
    });
  });

  describe('Warforged Heritages: Integrated Armour & Feat Grants', () => {
    const WARFORGED_HERITAGE_CONFIGS = [
      {
        name: 'Skirmisher Warforged',
        expectedArmorId: 'LeV58Gc2GXzyRySq',
        expectedArmorName: 'Light Integrated Armour',
        expectedFeatId: 'Ux73dmoF8KnavyUD',
        expectedFeatName: 'Fleet'
      },
      {
        name: 'Juggernaut Warforged',
        expectedArmorId: 'xMusQCvg86z1sWOV',
        expectedArmorName: 'Heavy Integrated Armour',
        expectedFeatId: 'BStw1cANwx5baL6d',
        expectedFeatName: 'Armor Proficiency'
      },
      {
        name: 'Vanguard Warforged',
        expectedArmorId: 'sj9KFDpPBWyI5Rv0',
        expectedArmorName: 'Medium Integrated Armour',
        expectedFeatId: 'x9wxQ61HNkAVbDHr',
        expectedFeatName: 'Weapon Proficiency'
      },
      {
        name: 'Living Wand Warforged',
        expectedArmorId: 'mZ363pCsYIZXbOIV',
        expectedArmorName: 'Nominal Integrated Armour'
      }
    ];

    describe.each(WARFORGED_HERITAGE_CONFIGS)(
      'Heritage: $name',
      ({ name, expectedArmorId, expectedArmorName, expectedFeatId, expectedFeatName }) => {
        it(`should grant ${expectedArmorName} via GrantItem rule`, () => {
          const heritage = heritageMap.get(name);
          expect(heritage, `Heritage ${name} not found`).toBeDefined();

          const grantRules = (heritage.system.rules || []).filter(r => r.key === 'GrantItem');
          const hasArmorGrant = grantRules.some(r => r.uuid?.includes(expectedArmorId));
          expect(hasArmorGrant, `Heritage ${name} is missing GrantItem rule for ${expectedArmorName} (${expectedArmorId})`).toBe(true);

          // Verify the armor document itself exists in eberron-items
          const armorDoc = docMap.get(expectedArmorId);
          expect(armorDoc, `Armor item ${expectedArmorId} not found in compendium`).toBeDefined();
          expect(armorDoc.name).toBe(expectedArmorName);
        });

        if (expectedFeatId) {
          it(`should grant ${expectedFeatName} via valid pf2e.feats-srd GrantItem rule`, () => {
            const heritage = heritageMap.get(name);
            const grantRules = (heritage.system.rules || []).filter(r => r.key === 'GrantItem');
            const featRule = grantRules.find(r => r.uuid?.includes(expectedFeatId));
            expect(featRule, `Heritage ${name} is missing GrantItem rule for ${expectedFeatName} (${expectedFeatId})`).toBeDefined();

            // Must use feats-srd pack name, not the invalid 'feats'
            expect(featRule.uuid).toContain('Compendium.pf2e.feats-srd.');
          });
        }
      }
    );
  });

  describe('Ancestry × Heritage Permutations Execution', () => {
    const ancestries = ['Warforged', 'Kalashtar', 'Shifter', 'Eberron Changeling', 'Bugbear'];

    for (const ancestryName of ancestries) {
      describe(`Ancestry: ${ancestryName}`, () => {
        it(`should successfully build and validate all valid heritages for ${ancestryName}`, () => {
          const ancestry = ancestryMap.get(ancestryName);
          expect(ancestry).toBeDefined();

          // Find specific heritages linked to this ancestry + all versatile heritages
          const matchingHeritages = [...heritageMap.values()].filter(h => {
            const linkedAncestry = h.system.ancestry?.name;
            const isVersatile = h.system.traits?.value?.includes('hb_dragonmarked-heritage') || !linkedAncestry;
            return linkedAncestry === ancestryName || isVersatile;
          });

          expect(matchingHeritages.length).toBeGreaterThan(0);

          for (const heritage of matchingHeritages) {
            // Build the actor with ancestry + heritage
            const actor = createTestActor(`Test ${ancestryName} - ${heritage.name}`, [ancestry, heritage]);
            expect(() => actor.validate()).not.toThrow();

            // Collect all GrantItem rules from both ancestry and heritage
            const allRules = [...(ancestry.system.rules || []), ...(heritage.system.rules || [])];
            const grantRules = allRules.filter(r => r.key === 'GrantItem');

            for (const rule of grantRules) {
              if (typeof rule.uuid === 'string') {
                if (rule.uuid.includes('eberron-')) {
                  const id = rule.uuid.split('.').pop();
                  expect(
                    docMap.has(id),
                    `Permutation ${ancestryName} + ${heritage.name} references missing Eberron grant: ${rule.uuid}`
                  ).toBe(true);
                } else if (rule.uuid.startsWith('Compendium.pf2e.')) {
                  const parts = rule.uuid.split('.');
                  const packName = parts[2];
                  expect(
                    validPf2ePacks.has(packName),
                    `Permutation ${ancestryName} + ${heritage.name} references invalid pf2e pack: ${packName}`
                  ).toBe(true);
                }
              }
            }
          }
        });
      });
    }
  });

  describe('Actor Simulation: Warforged + Skirmisher Selection', () => {
    it('should verify that creating a PC with Warforged + Skirmisher yields integrated armor and fleet grants', () => {
      const warforged = ancestryMap.get('Warforged');
      const skirmisher = heritageMap.get('Skirmisher Warforged');

      const actor = createTestActor('Skirmisher Scout', [warforged, skirmisher]);
      expect(() => actor.validate()).not.toThrow();

      // Collect all grants that Foundry would apply
      const grants = (skirmisher.system.rules || [])
        .filter(r => r.key === 'GrantItem')
        .map(r => r.uuid);

      // Light Integrated Armour is granted
      const armorGrant = grants.find(u => u.includes('LeV58Gc2GXzyRySq'));
      expect(armorGrant).toBeDefined();

      // Fleet general feat is granted via valid feats-srd pack
      const fleetGrant = grants.find(u => u.includes('Ux73dmoF8KnavyUD'));
      expect(fleetGrant).toBeDefined();
      expect(fleetGrant).toBe('Compendium.pf2e.feats-srd.Item.Ux73dmoF8KnavyUD');
    });
  });
});
