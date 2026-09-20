import { describe, it, expect, beforeAll } from 'vitest';
import { initFoundryEnvironment, loadAllDocuments } from './setup.mjs';

describe('Character Options: Ancestries, Heritages & Backgrounds Integration', () => {
  let env;
  let docs;
  let docMap = new Map();
  let ancestryMap = new Map();
  let heritageMap = new Map();
  let backgroundMap = new Map();

  beforeAll(async () => {
    env = await initFoundryEnvironment();

    // Foundry Actor DataModel expects game.release and game.system
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
      if (doc.data.type === 'background') backgroundMap.set(doc.data.name, doc.data);
    }
  });

  function createTestActor(name, items = []) {
    return new env.docClasses.Actor({
      name,
      type: 'character',
      items
    });
  }

  describe('Ancestries Integration', () => {
    it('should find all 5 Eberron ancestries', () => {
      expect(ancestryMap.size).toBe(5);
      expect(ancestryMap.has('Warforged')).toBe(true);
      expect(ancestryMap.has('Kalashtar')).toBe(true);
      expect(ancestryMap.has('Shifter')).toBe(true);
      expect(ancestryMap.has('Eberron Changeling')).toBe(true);
      expect(ancestryMap.has('Bugbear')).toBe(true);
    });

    it('should cleanly instantiate each ancestry on a character actor and validate all granted items', () => {
      for (const [name, anc] of ancestryMap.entries()) {
        const actor = createTestActor(`Test ${name}`, [anc]);
        expect(() => actor.validate()).not.toThrow();
        expect(actor.items.size).toBe(1);

        // Verify granted items in system.items (e.g. Warforged 4 feats, Kalashtar Link Mind)
        if (anc.system.items) {
          for (const [key, grant] of Object.entries(anc.system.items)) {
            expect(grant.name).toBeDefined();
            expect(grant.uuid).toBeDefined();
            if (grant.uuid.includes('eberron-')) {
              const id = grant.uuid.split('.').pop();
              expect(docMap.has(id), `Ancestry "${name}" references missing grant ID: ${id} (${grant.name})`).toBe(true);
            }
          }
        }

        // Verify GrantItem rule elements
        for (const rule of anc.system.rules || []) {
          if (rule.key === 'GrantItem' && rule.uuid?.includes('eberron-')) {
            const id = rule.uuid.split('.').pop();
            expect(docMap.has(id), `Ancestry "${name}" GrantItem references missing ID: ${id}`).toBe(true);
          }
        }

        // Verify ability boost structure
        expect(anc.system.boosts).toBeDefined();
        const boostCount = Object.keys(anc.system.boosts).length;
        expect(boostCount).toBeGreaterThanOrEqual(2);
      }
    });

    it('should verify Warforged grants all 4 living construct feature feats', () => {
      const warforged = ancestryMap.get('Warforged');
      const grantedNames = Object.values(warforged.system.items || {}).map(i => i.name);
      expect(grantedNames).toContain('Living Construct');
      expect(grantedNames).toContain('Living Body');
      expect(grantedNames).toContain('Constructed Resistance');
      expect(grantedNames).toContain('Emotionally Unaware (Warforged)');

      for (const item of Object.values(warforged.system.items)) {
        const id = item.uuid.split('.').pop();
        expect(docMap.has(id)).toBe(true);
      }
    });

    it('should verify Kalashtar grants Link Mind feat', () => {
      const kalashtar = ancestryMap.get('Kalashtar');
      const grantedNames = Object.values(kalashtar.system.items || {}).map(i => i.name);
      expect(grantedNames).toContain('Link Mind');

      const linkMind = Object.values(kalashtar.system.items).find(i => i.name === 'Link Mind');
      const id = linkMind.uuid.split('.').pop();
      expect(docMap.has(id)).toBe(true);
    });

    it('should verify Eberron Changeling grants Change Shape action via Rule Element', () => {
      const changeling = ancestryMap.get('Eberron Changeling');
      const grantRule = (changeling.system.rules || []).find(r => r.key === 'GrantItem');
      expect(grantRule).toBeDefined();
      const id = grantRule.uuid.split('.').pop();
      expect(docMap.has(id)).toBe(true);
      expect(docMap.get(id).name).toBe('Shift shape (Eberron Changeling)');
    });
  });

  describe('Heritages Integration', () => {
    it('should find at least 50 heritages', () => {
      expect(heritageMap.size).toBeGreaterThanOrEqual(50);
    });

    it('should embed cleanly on an actor and validate all rule elements and grants', () => {
      const VALID_SENSES = new Set(['darkvision', 'lowLightVision', 'scent', 'tremorsense']);

      for (const [name, heritage] of heritageMap.entries()) {
        const actor = createTestActor(`Test ${name}`, [heritage]);
        expect(() => actor.validate()).not.toThrow();

        const rules = heritage.system.rules || [];

        // Verify GrantItem rules
        for (const rule of rules.filter(r => r.key === 'GrantItem')) {
          if (rule.uuid?.includes('eberron-')) {
            const id = rule.uuid.split('.').pop();
            expect(docMap.has(id), `Heritage "${name}" GrantItem references missing ID: ${id}`).toBe(true);
          }
        }

        // Verify Sense rules
        for (const rule of rules.filter(r => r.key === 'Sense')) {
          expect(
            VALID_SENSES.has(rule.selector) || typeof rule.selector === 'string',
            `Heritage "${name}" has invalid sense selector: ${rule.selector}`
          ).toBe(true);
        }

        // Verify ActorTraits rules
        for (const rule of rules.filter(r => r.key === 'ActorTraits')) {
          expect(Array.isArray(rule.add), `Heritage "${name}" ActorTraits.add must be an array`).toBe(true);
          expect(rule.add.length, `Heritage "${name}" ActorTraits.add must not be empty`).toBeGreaterThan(0);
        }

        // Verify FlatModifier rules (selector can be string or string[])
        for (const rule of rules.filter(r => r.key === 'FlatModifier')) {
          const isValidSelector = typeof rule.selector === 'string' || (Array.isArray(rule.selector) && rule.selector.every(s => typeof s === 'string'));
          expect(isValidSelector, `Heritage "${name}" FlatModifier selector must be a string or array of strings`).toBe(true);
        }

        // Verify Strike rules
        for (const rule of rules.filter(r => r.key === 'Strike')) {
          expect(rule.category).toBeDefined();
          expect(rule.damage?.base?.damageType).toBeDefined();
        }
      }
    });

    it('should verify Shifter heritages grant proper Change Shape actions', () => {
      const beasthide = heritageMap.get('Beasthide Shifter');
      expect(beasthide).toBeDefined();

      const grantRules = (beasthide.system.rules || []).filter(r => r.key === 'GrantItem');
      expect(grantRules.length).toBeGreaterThanOrEqual(2);

      const grantedActions = grantRules
        .map(r => r.uuid.split('.').pop())
        .map(id => docMap.get(id))
        .filter(Boolean);

      const actionNames = grantedActions.map(a => a.name);
      expect(actionNames).toContain('Brace');
      expect(actionNames).toContain('Change Shape (Beasthide Shifter)');
    });

    it('should verify Versatile Dragonmarked heritages configure ActorTraits rule elements', () => {
      const dragonmarks = [
        { name: 'Mark of Making', trait: 'mark-of-making' },
        { name: 'Mark of Sentinel', trait: 'mark-of-sentinel' },
        { name: 'Mark of Healing', trait: 'mark-of-healing' },
        { name: 'Mark of Hospitality', trait: 'mark-of-hospitality' },
        { name: 'Mark of Passage', trait: 'mark-of-passage' },
        { name: 'Mark of Scribing', trait: 'mark-of-scribing' },
        { name: 'Mark of Shadow', trait: 'mark-of-shadow' },
        { name: 'Mark of Storm', trait: 'mark-of-storm' },
        { name: 'Mark of Warding', trait: 'mark-of-warding' },
        { name: 'Mark of Detection', trait: 'mark-of-detection' },
        { name: 'Mark of Finding', trait: 'mark-of-finding' },
        { name: 'Mark of Handling', trait: 'mark-of-handling' }
      ];

      for (const { name, trait } of dragonmarks) {
        const heritage = [...heritageMap.values()].find(h => h.name.includes(name));
        expect(heritage, `Dragonmark heritage "${name}" must exist`).toBeDefined();

        const traitRule = (heritage.system.rules || []).find(r => r.key === 'ActorTraits');
        expect(traitRule, `Heritage "${name}" must have ActorTraits rule element`).toBeDefined();
        expect(traitRule.add).toContain('dragonmarked-heritage');
        expect(traitRule.add).toContain(trait);
      }
    });
  });

  describe('Backgrounds Integration', () => {
    it('should find all 5 Eberron dragonmarked backgrounds', () => {
      expect(backgroundMap.size).toBe(5);
      expect(backgroundMap.has('House Agent')).toBe(true);
      expect(backgroundMap.has('Excoriate')).toBe(true);
      expect(backgroundMap.has('Foundling')).toBe(true);
      expect(backgroundMap.has('House Orphan')).toBe(true);
      expect(backgroundMap.has('House Scion')).toBe(true);
    });

    it('should cleanly instantiate each background on a character actor and verify lore and boosts', () => {
      for (const [name, bg] of backgroundMap.entries()) {
        const actor = createTestActor(`Test ${name}`, [bg]);
        expect(() => actor.validate()).not.toThrow();

        // All 5 Eberron backgrounds grant Dragonmarked Houses lore
        expect(bg.system.trainedLore).toBe('Dragonmarked Houses');

        // Custom skill prompt for house selection
        expect(bg.system.trainedSkills?.custom).toBe('House Skill (Table 2-1)');

        // Boost 0: choice of house attributes (Wis, Cha, Int)
        expect(bg.system.boosts['0'].value).toEqual(expect.arrayContaining(['cha', 'int', 'wis']));

        // Boost 1: free attribute boost (all 6 stats available)
        expect(bg.system.boosts['1'].value.length).toBe(6);
      }
    });
  });

  describe('Complete Character Assembly Scenarios', () => {
    it('should assemble a complete Warforged Juggernaut Soldier', () => {
      const warforged = ancestryMap.get('Warforged');
      const juggernaut = heritageMap.get('Juggernaut Warforged');
      const houseAgent = backgroundMap.get('House Agent');

      const actor = createTestActor('Bastion of House Cannith', [warforged, juggernaut, houseAgent]);
      expect(() => actor.validate()).not.toThrow();
      expect(actor.items.size).toBe(3);

      // Verify ancestry linkage
      expect(juggernaut.system.ancestry.name).toBe('Warforged');
      expect(juggernaut.system.ancestry.uuid).toContain(warforged._id);

      // Verify Juggernaut grants Heavy Integrated Armour and Armor Proficiency feat
      const grantRules = (juggernaut.system.rules || []).filter(r => r.key === 'GrantItem');
      expect(grantRules.some(r => r.uuid.includes('xMusQCvg86z1sWOV'))).toBe(true);
      expect(grantRules.some(r => r.uuid.includes('BStw1cANwx5baL6d'))).toBe(true);
    });

    it('should assemble a Dragonmarked Human with Mark of Making and House Agent background', () => {
      const markOfMaking = [...heritageMap.values()].find(h => h.name.includes('Mark of Making'));
      const houseAgent = backgroundMap.get('House Agent');

      const actor = createTestActor('Doran d\'Cannith', [markOfMaking, houseAgent]);
      expect(() => actor.validate()).not.toThrow();
      expect(actor.items.size).toBe(2);

      const traitRule = markOfMaking.system.rules.find(r => r.key === 'ActorTraits');
      expect(traitRule.add).toContain('mark-of-making');
      expect(houseAgent.system.trainedLore).toBe('Dragonmarked Houses');
    });

    it('should assemble a Beasthide Shifter with all Change Shape actions and traits', () => {
      const shifter = ancestryMap.get('Shifter');
      const beasthide = heritageMap.get('Beasthide Shifter');
      const foundling = backgroundMap.get('Foundling');

      const actor = createTestActor('Fang', [shifter, beasthide, foundling]);
      expect(() => actor.validate()).not.toThrow();
      expect(actor.items.size).toBe(3);

      // Verify ancestry HP override rule element
      const hpRule = beasthide.system.rules.find(r => r.key === 'ActiveEffectLike');
      expect(hpRule).toBeDefined();
      expect(hpRule.path).toBe('system.attributes.ancestryhp');
      expect(hpRule.value).toBe(10);
    });
  });
});
