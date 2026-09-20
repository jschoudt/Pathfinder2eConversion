import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ClassicLevel } from 'classic-level';
import { initFoundryEnvironment, loadAllDocuments, PF2E_SYSTEM_DIR } from './setup.mjs';

describe('Ancestries & Heritages: Bestowed Feats, Items, Bonuses, and Traits', () => {
  let env;
  let docs;
  let docMap = new Map();
  let ancestryMap = new Map();
  let heritageMap = new Map();
  let validPf2ePacks = new Set();
  let pf2eFeatsDb;

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
    for (const alias of ['actions', 'conditions', 'equipment', 'feats', 'spells', 'ancestry-features', 'class-features']) {
      validPf2ePacks.add(alias);
    }

    // Connect to LevelDB for live verification of external PF2e items
    // We snapshot to a temp dir so that running Foundry instances do not cause LEVEL_LOCKED errors
    const featsPackDir = path.join(PF2E_SYSTEM_DIR, 'packs/feats');
    const { cp } = await import('node:fs/promises');
    const os = await import('node:os');
    const tempDir = path.join(os.tmpdir(), `pf2e-feats-snapshot-${process.pid}`);
    await cp(featsPackDir, tempDir, { recursive: true, filter: (src) => !src.endsWith('LOCK') });
    pf2eFeatsDb = new ClassicLevel(tempDir, { valueEncoding: 'json' });
    await pf2eFeatsDb.open();
  });

  afterAll(async () => {
    if (pf2eFeatsDb && pf2eFeatsDb.status === 'open') {
      await pf2eFeatsDb.close();
    }
  });

  function createTestActor(name, items = []) {
    return new env.docClasses.Actor({
      name,
      type: 'character',
      items
    });
  }

  async function resolveExternalFeat(featId) {
    try {
      return await pf2eFeatsDb.get(`!items!${featId}`);
    } catch {
      return null;
    }
  }

  describe('Core Ancestries: Attribute Boosts, Base Stats & Inherent Feature Grants', () => {
    const EXPECTED_ANCESTRIES = [
      {
        name: 'Warforged',
        hp: 8,
        speed: 25,
        traits: ['warforged', 'construct'],
        expectedBoosts: ['con'],
        flaw: 'cha',
        expectedGrants: [
          'Living Construct',
          'Living Body',
          'Constructed Resistance',
          'Emotionally Unaware (Warforged)'
        ]
      },
      {
        name: 'Kalashtar',
        hp: 6,
        speed: 25,
        traits: ['kalashtar', 'humanoid'],
        expectedBoosts: ['cha'],
        expectedGrants: ['Link Mind']
      },
      {
        name: 'Shifter',
        hp: 8,
        speed: 25,
        traits: ['shifter', 'humanoid'],
        expectedBoosts: ['con']
      },
      {
        name: 'Eberron Changeling',
        hp: 6,
        speed: 25,
        traits: ['eberron-changelings', 'humanoid'],
        expectedBoosts: ['cha'],
        hasShiftShapeRule: true
      },
      {
        name: 'Bugbear',
        hp: 10,
        speed: 25,
        traits: ['bugbear', 'humanoid'],
        expectedBoosts: ['str']
      }
    ];

    describe.each(EXPECTED_ANCESTRIES)('Ancestry: $name', (ancConfig) => {
      it(`should define proper base stats (HP: ${ancConfig.hp}, Speed: ${ancConfig.speed})`, () => {
        const anc = ancestryMap.get(ancConfig.name);
        expect(anc, `Ancestry ${ancConfig.name} must exist`).toBeDefined();
        expect(anc.system.hp).toBe(ancConfig.hp);
        expect(anc.system.speed).toBe(ancConfig.speed);
        expect(anc.system.size).toBe('med');

        // Traits
        for (const t of ancConfig.traits) {
          expect(anc.system.traits.value).toContain(t);
        }
      });

      it('should configure valid attribute boosts and flaws', () => {
        const anc = ancestryMap.get(ancConfig.name);
        const boosts = Object.values(anc.system.boosts || {});
        for (const b of ancConfig.expectedBoosts) {
          expect(boosts.some(boost => boost.value?.includes(b))).toBe(true);
        }
        if (ancConfig.flaw) {
          const flaws = Object.values(anc.system.flaws || {});
          expect(flaws.some(flaw => flaw.value?.includes(ancConfig.flaw))).toBe(true);
        }
      });

      if (ancConfig.expectedGrants) {
        it('should bestow all inherent feature feats via system.items', () => {
          const anc = ancestryMap.get(ancConfig.name);
          const grantedItems = Object.values(anc.system.items || {});
          const grantedNames = grantedItems.map(i => i.name);

          for (const expected of ancConfig.expectedGrants) {
            expect(grantedNames).toContain(expected);
          }

          for (const item of grantedItems) {
            const id = item.uuid.split('.').pop();
            expect(docMap.has(id), `Granted item ID ${id} (${item.name}) must exist in module compendium`).toBe(true);
            expect(item.uuid).toContain('Compendium.pathfinders-guide-to-eberron.');
          }
        });
      }

      if (ancConfig.hasShiftShapeRule) {
        it('should bestow Shift Shape action via GrantItem rule', () => {
          const anc = ancestryMap.get(ancConfig.name);
          const grantRule = (anc.system.rules || []).find(r => r.key === 'GrantItem');
          expect(grantRule).toBeDefined();
          const id = grantRule.uuid.split('.').pop();
          expect(docMap.has(id)).toBe(true);
          expect(docMap.get(id).name).toBe('Shift shape (Eberron Changeling)');
        });
      }
    });
  });

  describe('Warforged Heritages: Integrated Armour & Feat Bestowal', () => {
    const WARFORGED_HERITAGES = [
      {
        name: 'Skirmisher Warforged',
        armorName: 'Light Integrated Armour',
        armorId: 'LeV58Gc2GXzyRySq',
        featName: 'Fleet',
        featId: 'Ux73dmoF8KnavyUD'
      },
      {
        name: 'Juggernaut Warforged',
        armorName: 'Heavy Integrated Armour',
        armorId: 'xMusQCvg86z1sWOV',
        featName: 'Armor Proficiency',
        featId: 'BStw1cANwx5baL6d'
      },
      {
        name: 'Vanguard Warforged',
        armorName: 'Medium Integrated Armour',
        armorId: 'sj9KFDpPBWyI5Rv0',
        featName: 'Weapon Proficiency',
        featId: 'x9wxQ61HNkAVbDHr'
      },
      {
        name: 'Living Wand Warforged',
        armorName: 'Nominal Integrated Armour',
        armorId: 'mZ363pCsYIZXbOIV'
      }
    ];

    describe.each(WARFORGED_HERITAGES)('Heritage: $name', ({ name, armorName, armorId, featName, featId }) => {
      it(`should bestow ${armorName} (${armorId})`, () => {
        const heritage = heritageMap.get(name);
        expect(heritage).toBeDefined();

        const grantRules = (heritage.system.rules || []).filter(r => r.key === 'GrantItem');
        const hasArmorGrant = grantRules.some(r => r.uuid?.includes(armorId));
        expect(hasArmorGrant, `Heritage ${name} must grant armor ${armorName}`).toBe(true);

        const armorDoc = docMap.get(armorId);
        expect(armorDoc, `Armor ${armorId} must exist in module compendium`).toBeDefined();
        expect(armorDoc.name).toBe(armorName);
      });

      if (featId) {
        it(`should bestow ${featName} (${featId}) and verify against PF2e compendium`, async () => {
          const heritage = heritageMap.get(name);
          const grantRules = (heritage.system.rules || []).filter(r => r.key === 'GrantItem');
          const featGrant = grantRules.find(r => r.uuid?.includes(featId));
          expect(featGrant, `Heritage ${name} must grant feat ${featName}`).toBeDefined();

          // Must use feats-srd pack
          expect(featGrant.uuid).toBe(`Compendium.pf2e.feats-srd.Item.${featId}`);

          // Verify the feat exists in the external PF2e system database
          const featDoc = await resolveExternalFeat(featId);
          expect(featDoc, `External PF2e feat ${featName} (${featId}) must resolve`).not.toBeNull();
          expect(featDoc.name).toBe(featName);
        });
      }
    });
  });

  describe('Shifter Heritages: Actions, Senses, Strikes, and Bonuses', () => {
    it('Beasthide Shifter should bestow 10 HP override, Brace action, and Change Shape', () => {
      const beasthide = heritageMap.get('Beasthide Shifter');
      expect(beasthide).toBeDefined();

      const hpRule = beasthide.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(hpRule).toBeDefined();
      expect(hpRule.path).toBe('system.attributes.ancestryhp');
      expect(hpRule.value).toBe(10);

      const grantRules = beasthide.system.rules.filter(r => r.key === 'GrantItem');
      const actionNames = grantRules.map(r => docMap.get(r.uuid.split('.').pop())?.name);
      expect(actionNames).toContain('Brace');
      expect(actionNames).toContain('Change Shape (Beasthide Shifter)');
    });

    it('Cliffwalk Shifter should bestow Combat Climber feat and Change Shape', async () => {
      const cliffwalk = heritageMap.get('Cliffwalk Shifter');
      expect(cliffwalk).toBeDefined();

      const grantRules = cliffwalk.system.rules.filter(r => r.key === 'GrantItem');
      const featRule = grantRules.find(r => r.uuid.includes('09PurtIanNUPfNRq'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('09PurtIanNUPfNRq');
      expect(feat.name).toBe('Combat Climber');
    });

    it('Dreamsight Shifter should bestow Diplomacy and Nature circumstance bonuses', () => {
      const dreamsight = heritageMap.get('Dreamsight Shifter');
      expect(dreamsight).toBeDefined();

      const flatMods = dreamsight.system.rules.filter(r => r.key === 'FlatModifier');
      const selectors = flatMods.map(m => m.selector);
      expect(selectors).toContain('diplomacy');
      expect(selectors).toContain('nature');
    });

    it('Gorebrute Shifter should bestow Athletics bonus and Horns unarmed strike', () => {
      const gorebrute = heritageMap.get('Gorebrute Shifter');
      expect(gorebrute).toBeDefined();

      const strike = gorebrute.system.rules.find(r => r.key === 'Strike');
      expect(strike).toBeDefined();
      expect(strike.category).toBe('unarmed');
      expect(strike.damage.base.damageType).toBe('bludgeoning');
      expect(strike.damage.base.die).toBe('d6');
      expect(strike.traits).toContain('shove');
    });

    it('Longstride Shifter should bestow Cat Fall feat and Change Shape', async () => {
      const longstride = heritageMap.get('Longstride Shifter');
      expect(longstride).toBeDefined();

      const featGrant = longstride.system.rules.find(r => r.uuid?.includes('LQw0yIMDUJJkq1nD'));
      expect(featGrant).toBeDefined();

      const feat = await resolveExternalFeat('LQw0yIMDUJJkq1nD');
      expect(feat.name).toBe('Cat Fall');
    });

    it('Longtooth Shifter should bestow Intimidating Glare feat and Jaws unarmed strike', async () => {
      const longtooth = heritageMap.get('Longtooth Shifter');
      expect(longtooth).toBeDefined();

      const featGrant = longtooth.system.rules.find(r => r.uuid?.includes('xQMz6eDgX75WX2ce'));
      expect(featGrant).toBeDefined();

      const feat = await resolveExternalFeat('xQMz6eDgX75WX2ce');
      expect(feat.name).toBe('Intimidating Glare');

      const strike = longtooth.system.rules.find(r => r.key === 'Strike');
      expect(strike).toBeDefined();
      expect(strike.category).toBe('unarmed');
      expect(strike.damage.base.damageType).toBe('piercing');
      expect(strike.traits).toContain('grapple');
    });

    it('Razorclaw Shifter should bestow Claws unarmed strike', () => {
      const razorclaw = heritageMap.get('Razorclaw Shifter');
      expect(razorclaw).toBeDefined();

      const strike = razorclaw.system.rules.find(r => r.key === 'Strike');
      expect(strike).toBeDefined();
      expect(strike.category).toBe('unarmed');
      expect(strike.damage.base.die).toBe('d4');
      expect(strike.traits).toContain('agile');
      expect(strike.traits).toContain('finesse');
    });

    it('Truedive Shifter should bestow swim speed', () => {
      const truedive = heritageMap.get('Truedive Shifter');
      expect(truedive).toBeDefined();

      const speedRule = truedive.system.rules.find(r => r.key === 'BaseSpeed');
      expect(speedRule).toBeDefined();
      expect(speedRule.selector).toBe('swim');
      expect(speedRule.value).toBe(15);
    });

    it('Wildhunt Shifter should bestow Scent sense and Tracking survival bonus', () => {
      const wildhunt = heritageMap.get('Wildhunt Shifter');
      expect(wildhunt).toBeDefined();

      const senseRule = wildhunt.system.rules.find(r => r.key === 'Sense');
      expect(senseRule).toBeDefined();
      expect(senseRule.selector).toBe('scent');

      const flatMod = wildhunt.system.rules.find(r => r.key === 'FlatModifier');
      expect(flatMod.selector).toBe('survival');
      expect(flatMod.value).toBe(2);
    });
  });

  describe('Kalashtar Heritages: Skill Training & Feat Bestowal', () => {
    it('Hashalaq Kalashtar Insightful should bestow Lie to Me feat', async () => {
      const insightful = heritageMap.get('Hashalaq Kalashtar Insightful');
      expect(insightful).toBeDefined();

      const featRule = insightful.system.rules.find(r => r.uuid?.includes('Dvz54d6aPhjsmUux'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('Dvz54d6aPhjsmUux');
      expect(feat.name).toBe('Lie to Me');
    });

    it('Hashalaq Kalashtar Deceiver should bestow Charming Liar feat and Deception bonus', async () => {
      const deceiver = heritageMap.get('Hashalaq Kalashtar Deciever');
      expect(deceiver).toBeDefined();

      const featRule = deceiver.system.rules.find(r => r.uuid?.includes('B6HbYsLBWb1RR6Fx'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('B6HbYsLBWb1RR6Fx');
      expect(feat.name).toBe('Charming Liar');

      const flatMod = deceiver.system.rules.find(r => r.key === 'FlatModifier');
      expect(flatMod.selector).toBe('deception');
      expect(flatMod.value).toBe(1);
    });

    it('Kalaraq Kalashtar Commander should bestow Diplomacy training and Group Impression feat', async () => {
      const commander = heritageMap.get('Kalaraq Kalashtar Commander');
      expect(commander).toBeDefined();

      const dipRule = commander.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(dipRule.path).toBe('system.skills.dip.rank');

      const featRule = commander.system.rules.find(r => r.uuid?.includes('KpFetnUqTiweypZk'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('KpFetnUqTiweypZk');
      expect(feat.name).toBe('Group Impression');
    });

    it('Tsucora Kalashtar Intimidator should bestow Intimidation training and Intimidating Glare feat', async () => {
      const intimidator = heritageMap.get('Tsucora Kalashtar Intimidator');
      expect(intimidator).toBeDefined();

      const itmRule = intimidator.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(itmRule.path).toBe('system.skills.itm.rank');

      const featRule = intimidator.system.rules.find(r => r.uuid?.includes('xQMz6eDgX75WX2ce'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('xQMz6eDgX75WX2ce');
      expect(feat.name).toBe('Intimidating Glare');
    });
  });

  describe('Changeling Heritages: Skill Training & Feat Bestowal', () => {
    it('Changeling Traveler should bestow Society training and Streetwise feat', async () => {
      const traveler = heritageMap.get('Changeling Traveler');
      expect(traveler).toBeDefined();

      const socRule = traveler.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(socRule.path).toBe('system.skills.soc.rank');

      const featRule = traveler.system.rules.find(r => r.uuid?.includes('X2jGFfLU5qI5XVot'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('X2jGFfLU5qI5XVot');
      expect(feat.name).toBe('Streetwise');
    });

    it('Hidden Changeling should bestow Adopted Ancestry feat and Impersonate circumstance bonus', async () => {
      const hidden = heritageMap.get('Hidden Changeling');
      expect(hidden).toBeDefined();

      const featRule = hidden.system.rules.find(r => r.uuid?.includes('ihN8gkHSdPG9Trte'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('ihN8gkHSdPG9Trte');
      expect(feat.name).toBe('Adopted Ancestry');

      const flatMod = hidden.system.rules.find(r => r.key === 'FlatModifier');
      expect(flatMod.value).toBe(4);
      expect(flatMod.predicate).toContain('action:impersonate');
    });

    it('Persona Changeling should bestow Different Worlds feat', async () => {
      const persona = heritageMap.get('Persona Changeling');
      expect(persona).toBeDefined();

      const featRule = persona.system.rules.find(r => r.uuid?.includes('z1Z22gTp7J1VRLSR'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('z1Z22gTp7J1VRLSR');
      expect(feat.name).toBe('Different Worlds');
    });

    it('Watchful Changeling should bestow Deception training, Perception bonus, and Lie to Me feat', async () => {
      const watchful = heritageMap.get('Watchful Changeling');
      expect(watchful).toBeDefined();

      const decRule = watchful.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(decRule.path).toBe('system.skills.dec.rank');

      const flatMod = watchful.system.rules.find(r => r.key === 'FlatModifier');
      expect(flatMod.value).toBe(2);

      const featRule = watchful.system.rules.find(r => r.uuid?.includes('Dvz54d6aPhjsmUux'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('Dvz54d6aPhjsmUux');
      expect(feat.name).toBe('Lie to Me');
    });
  });

  describe('Bugbear Heritages: Skill Training & Feat Bestowal', () => {
    it('Ghaal Guul\'dar should bestow Athletics training and Assurance feat', async () => {
      const ghaal = heritageMap.get("Ghaal Guul'dar");
      expect(ghaal).toBeDefined();

      const athRule = ghaal.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(athRule.path).toBe('system.skills.ath.rank');

      const featRule = ghaal.system.rules.find(r => r.uuid?.includes('W6Gl9ePmItfDHji0'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('W6Gl9ePmItfDHji0');
      expect(feat.name).toBe('Assurance');
    });

    it('Khesh Guul\'dar should bestow Stealth training and Terrain Stalker feat', async () => {
      const khesh = heritageMap.get("Khesh Guul'dar");
      expect(khesh).toBeDefined();

      const sthRule = khesh.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(sthRule.path).toBe('system.skills.sth.rank');

      const featRule = khesh.system.rules.find(r => r.uuid?.includes('beyw5bdA5hkQbmaG'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('beyw5bdA5hkQbmaG');
      expect(feat.name).toBe('Terrain Stalker');
    });

    it('Thradaask Guul\'dar should bestow Recovery check bonus and Diehard feat', async () => {
      const thradaask = heritageMap.get("Thradaask Guul'dar");
      expect(thradaask).toBeDefined();

      const recRule = thradaask.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(recRule.path).toBe('system.attributes.dying.recoveryMod');
      expect(recRule.value).toBe(1);

      const featRule = thradaask.system.rules.find(r => r.uuid?.includes('I0BhPWqYf1bbzEYg'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('I0BhPWqYf1bbzEYg');
      expect(feat.name).toBe('Diehard');
    });
  });

  describe('Gnoll Clan Heritages: Feats, Actions, and Resistances', () => {
    it('Eyre Clan should bestow Crafting training and Quick Repair feat', async () => {
      const eyre = heritageMap.get('Eyre Clan');
      expect(eyre).toBeDefined();

      const featRule = eyre.system.rules.find(r => r.uuid?.includes('ASy9AKEIRxPYUi5o'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('ASy9AKEIRxPYUi5o');
      expect(feat.name).toBe('Quick Repair');
    });

    it('Olarune Clan should bestow Shield Block feat and Rapid Cover action', async () => {
      const olarune = heritageMap.get('Olarune Clan');
      expect(olarune).toBeDefined();

      const featRule = olarune.system.rules.find(r => r.uuid?.includes('jM72TjJ965jocBV8'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('jM72TjJ965jocBV8');
      expect(feat.name).toBe('Shield Block');

      const actionRule = olarune.system.rules.find(r => r.uuid?.includes('Qhf72hhZjoyw5iDd'));
      expect(actionRule).toBeDefined();
      expect(docMap.get('Qhf72hhZjoyw5iDd').name).toBe('Rapid Cover');
    });

    it('Therendor Clan should bestow Medicine training and Battle Medicine feat', async () => {
      const therendor = heritageMap.get('Therendor Clan');
      expect(therendor).toBeDefined();

      const featRule = therendor.system.rules.find(r => r.uuid?.includes('wYerMk6F1RZb0Fwt'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('wYerMk6F1RZb0Fwt');
      expect(feat.name).toBe('Battle Medicine');
    });

    it('Vult Clan should bestow Armor Proficiency feat', async () => {
      const vult = heritageMap.get('Vult Clan');
      expect(vult).toBeDefined();

      const featRule = vult.system.rules.find(r => r.uuid?.includes('BStw1cANwx5baL6d'));
      expect(featRule).toBeDefined();

      const feat = await resolveExternalFeat('BStw1cANwx5baL6d');
      expect(feat.name).toBe('Armor Proficiency');
    });

    it('Dravago Clan should bestow cold resistance', () => {
      const dravago = heritageMap.get('Dravago Clan');
      expect(dravago).toBeDefined();

      const resRule = dravago.system.rules.find(r => r.key === 'Resistance');
      expect(resRule.type).toBe('cold');
    });

    it('Sypheros Clan should bestow void resistance and darkvision', () => {
      const sypheros = heritageMap.get('Sypheros Clan');
      expect(sypheros).toBeDefined();

      const resRule = sypheros.system.rules.find(r => r.key === 'Resistance');
      expect(resRule).toBeDefined();

      const senseRule = sypheros.system.rules.find(r => r.key === 'Sense');
      expect(senseRule.selector).toBe('darkvision');
    });
  });

  describe('Versatile Dragonmarked Heritages: Trait Bestowal', () => {
    const DRAGONMARKS = [
      { name: 'Mark of Detection', trait: 'mark-of-detection', hasSense: true },
      { name: 'Mark of Finding', trait: 'mark-of-finding', hasSense: true },
      { name: 'Mark of Handling', trait: 'mark-of-handling' },
      { name: 'Mark of Healing', trait: 'mark-of-healing' },
      { name: 'Mark of Hospitality', trait: 'mark-of-hospitality' },
      { name: 'Mark of Making', trait: 'mark-of-making' },
      { name: 'Mark of Passage', trait: 'mark-of-passage' },
      { name: 'Mark of Scribing', trait: 'mark-of-scribing' },
      { name: 'Mark of Sentinel', trait: 'mark-of-sentinel' },
      { name: 'Mark of Shadow', trait: 'mark-of-shadow', hasSense: true },
      { name: 'Mark of Storm', trait: 'mark-of-storm', hasSense: true },
      { name: 'Mark of Warding', trait: 'mark-of-warding' },
      { name: 'Aberrant Mark', trait: 'aberrant-mark' }
    ];

    describe.each(DRAGONMARKS)('Heritage: $name', ({ name, trait, hasSense }) => {
      it(`should bestow dragonmarked-heritage and ${trait} traits`, () => {
        const heritage = [...heritageMap.values()].find(h => h.name.includes(name));
        expect(heritage, `Dragonmark heritage ${name} must exist`).toBeDefined();

        const traitRule = heritage.system.rules.find(r => r.key === 'ActorTraits');
        expect(traitRule, `Heritage ${name} must have ActorTraits rule element`).toBeDefined();
        expect(traitRule.add).toContain('dragonmarked-heritage');
        expect(traitRule.add).toContain(trait);

        if (hasSense) {
          const senseRule = heritage.system.rules.find(r => r.key === 'Sense');
          expect(senseRule).toBeDefined();
          expect(senseRule.selector).toBe('lowLightVision');
        }
      });
    });
  });

  describe('Comprehensive Permutations: PC Character Assembly & Grant Resolution', () => {
    const ANCESTRIES = ['Warforged', 'Kalashtar', 'Shifter', 'Eberron Changeling', 'Bugbear'];

    for (const ancestryName of ANCESTRIES) {
      describe(`Ancestry Permutations: ${ancestryName}`, () => {
        it(`should resolve all grants cleanly for all compatible heritages with ${ancestryName}`, async () => {
          const ancestry = ancestryMap.get(ancestryName);
          expect(ancestry).toBeDefined();

          const compatibleHeritages = [...heritageMap.values()].filter(h => {
            const linkedAncestry = h.system.ancestry?.name;
            const isVersatile = h.system.traits?.value?.includes('dragonmarked-heritage') || !linkedAncestry;
            return linkedAncestry === ancestryName || isVersatile;
          });

          expect(compatibleHeritages.length).toBeGreaterThan(0);

          for (const heritage of compatibleHeritages) {
            // Instantiate Foundry BaseActor with Ancestry and Heritage
            const actor = createTestActor(`${ancestryName} Character (${heritage.name})`, [ancestry, heritage]);
            expect(() => actor.validate()).not.toThrow();

            // Collect all GrantItem rules from ancestry and heritage
            const allRules = [...(ancestry.system.rules || []), ...(heritage.system.rules || [])];
            const grantRules = allRules.filter(r => r.key === 'GrantItem');

            for (const rule of grantRules) {
              expect(typeof rule.uuid).toBe('string');

              if (rule.uuid.includes('pathfinders-guide-to-eberron.')) {
                const id = rule.uuid.split('.').pop();
                expect(
                  docMap.has(id),
                  `Permutation ${ancestryName} + ${heritage.name} references missing internal document: ${rule.uuid}`
                ).toBe(true);
              } else if (rule.uuid.startsWith('Compendium.pf2e.')) {
                const parts = rule.uuid.split('.');
                const packName = parts[2];
                expect(
                  validPf2ePacks.has(packName),
                  `Permutation ${ancestryName} + ${heritage.name} references invalid PF2e pack: ${packName}`
                ).toBe(true);

                // If it's a feat, verify it exists in the external PF2e database
                if (packName === 'feats-srd') {
                  const featId = parts.pop();
                  const externalFeat = await resolveExternalFeat(featId);
                  expect(
                    externalFeat,
                    `Permutation ${ancestryName} + ${heritage.name} references missing external PF2e feat ID: ${featId}`
                  ).not.toBeNull();
                }
              }
            }
          }
        });
      });
    }
  });

  describe('Feats Trait Normalization & Ancestry Association', () => {
    it('should tag Alert Scout with the Warforged trait and ancestry category', () => {
      const alertScout = [...docMap.values()].find(d => d.name === 'Alert Scout' && d.type === 'feat');
      expect(alertScout, 'Alert Scout feat must exist').toBeDefined();
      expect(alertScout.system.category).toBe('ancestry');
      expect(alertScout.system.traits.value).toContain('warforged');
      expect(alertScout.system.traits.value).not.toContain('hb_warforged');
    });

    it('should ensure all ancestry feats are tagged with an appropriate ancestry trait', () => {
      const ancestryFeats = [...docMap.values()].filter(d => d.type === 'feat' && d.system?.category === 'ancestry');
      expect(ancestryFeats.length).toBeGreaterThan(150);

      const validAncestryTraits = new Set([
        'warforged',
        'shifter',
        'kalashtar',
        'bugbear',
        'eberron-changelings',
        'kholo',
        'gnoll',
        'dragonmarked-heritage',
        'gargoyle',
        'harpy',
        'medusa',
        'worg'
      ]);

      for (const feat of ancestryFeats) {
        const traits = feat.system.traits?.value || [];
        const hasAncestryTrait = traits.some(t => validAncestryTraits.has(t));
        expect(
          hasAncestryTrait,
          `Ancestry feat "${feat.name}" must have an ancestry trait (traits: ${JSON.stringify(traits)})`
        ).toBe(true);
      }
    });

    it('should ensure no documents contain legacy hb_ prefixed traits or rule elements', () => {
      for (const doc of docMap.values()) {
        const traits = doc.system?.traits?.value || [];
        for (const t of traits) {
          expect(t.startsWith('hb_'), `Document "${doc.name}" has legacy trait: ${t}`).toBe(false);
        }

        const rules = doc.system?.rules || [];
        for (const rule of rules) {
          if (Array.isArray(rule.add)) {
            for (const t of rule.add) {
              expect(t.startsWith('hb_'), `Document "${doc.name}" rule adds legacy trait: ${t}`).toBe(false);
            }
          }
        }
      }
    });
  });
});

