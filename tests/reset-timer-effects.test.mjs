import { describe, it, expect, beforeAll } from 'vitest';
import { loadAllDocuments } from './setup.mjs';

describe('Reset Timer Effects & PF2e Time System Integration', () => {
  let docs;
  let docMap = new Map();
  let effectsMap = new Map();
  let actionMap = new Map();
  let featMap = new Map();
  let spellMap = new Map();

  beforeAll(async () => {
    docs = await loadAllDocuments();
    for (const doc of docs) {
      docMap.set(doc.data._id, doc.data);
      if (doc.packName === 'eberron-effects') effectsMap.set(doc.data._id, doc.data);
      if (doc.packName === 'eberron-actions') actionMap.set(doc.data.name, doc.data);
      if (doc.packName === 'eberron-feats' || doc.packName === 'eberron-dragonmarks') featMap.set(doc.data.name, doc.data);
      if (doc.packName === 'eberron-spells') spellMap.set(doc.data.name, doc.data);
    }
  });

  describe('Effects Pack Validation', () => {
    it('should have at least 70 total effects in eberron-effects', () => {
      expect(effectsMap.size).toBeGreaterThanOrEqual(70);
    });

    it('should verify all effects have valid PF2e duration schemas for automatic time expiry', () => {
      const validUnits = new Set(['days', 'hours', 'minutes', 'rounds']);

      for (const effect of effectsMap.values()) {
        expect(effect.type).toBe('effect');
        expect(effect.system.duration, `Effect ${effect.name} must define duration`).toBeDefined();
        expect(effect.system.duration.value).toBeGreaterThan(0);
        expect(validUnits.has(effect.system.duration.unit), `Effect ${effect.name} unit ${effect.system.duration.unit} must be valid`).toBe(true);
        expect(effect.system.duration.expiry).toBe('turn-start');
        expect(effect.system.tokenIcon?.show).toBe(true);
      }
    });

    it('should correctly calculate duration in seconds for PF2e world time comparison', () => {
      function getDurationInSeconds(duration) {
        switch (duration.unit) {
          case 'days': return duration.value * 86400;
          case 'hours': return duration.value * 3600;
          case 'minutes': return duration.value * 60;
          case 'rounds': return duration.value * 6;
          default: return 0;
        }
      }

      // 1 day effect
      const dayEffect = [...effectsMap.values()].find(e => e.name === 'Effect: Used Juggernaut Repair');
      expect(dayEffect).toBeDefined();
      expect(getDurationInSeconds(dayEffect.system.duration)).toBe(86400);

      // 1 hour effect
      const hourEffect = [...effectsMap.values()].find(e => e.name === 'Effect: Used Bugbear Endurance');
      expect(hourEffect).toBeDefined();
      expect(getDurationInSeconds(hourEffect.system.duration)).toBe(3600);

      // 10 minute effect
      const tenMinEffect = [...effectsMap.values()].find(e => e.name === 'Effect: Used Gorebrute Vengeance');
      expect(tenMinEffect).toBeDefined();
      expect(getDurationInSeconds(tenMinEffect.system.duration)).toBe(600);

      // 1 minute effect
      const oneMinEffect = [...effectsMap.values()].find(e => e.name === 'Effect: Used Emotional Empathy');
      expect(oneMinEffect).toBeDefined();
      expect(getDurationInSeconds(oneMinEffect.system.duration)).toBe(60);
    });
  });

  describe('Parent Ability Integration: Frequencies & SelfEffect Links', () => {
    const TRACKED_RESET_FEATS = [
      { name: 'Beasthide Endurance', per: 'day', effectName: 'Effect: Used Beasthide Endurance' },
      { name: 'Bounce Back', per: 'day', effectName: 'Effect: Used Bounce Back' },
      { name: 'Bugbear Endurance', per: 'PT1H', effectName: 'Effect: Used Bugbear Endurance' },
      { name: 'Construct Rejuvenation', per: 'day', effectName: 'Effect: Used Construct Rejuvenation' },
      { name: 'Emotional Empathy', per: 'PT1M', effectName: 'Effect: Used Emotional Empathy' },
      { name: 'Enrage', per: 'PT1H', effectName: 'Effect: Used Enrage' },
      { name: 'Gorebrute Vengeance', per: 'PT10M', effectName: 'Effect: Used Gorebrute Vengeance' },
      { name: 'Incredible Defense', per: 'PT1H', effectName: 'Effect: Used Incredible Defense' },
      { name: 'Juggernaut Repair', per: 'day', effectName: 'Effect: Used Juggernaut Repair' },
      { name: 'Juvenile Flight', per: 'day', effectName: 'Effect: Used Juvenile Flight' },
      { name: 'Psi-Blades', per: 'PT10M', effectName: 'Effect: Used Psi-Blades' },
      { name: 'Quori Focus', per: 'day', effectName: 'Effect: Used Quori Focus' },
      { name: 'Rapid Regeneration', per: 'day', effectName: 'Effect: Used Rapid Regeneration' },
      { name: 'Skilled Capability', per: 'PT1H', effectName: 'Effect: Used Skilled Capability' },
      { name: 'Stand by the Strong', per: 'day', effectName: 'Effect: Used Stand by the Strong' },
      { name: 'Terrifying Shift', per: 'PT10M', effectName: 'Effect: Used Terrifying Shift' },
      { name: 'The Traveller\'s Protection', per: 'PT10M', effectName: 'Effect: Used The Traveller\'s Protection' },
      { name: 'Warforged Offense', per: 'PT1H', effectName: 'Effect: Used Warforged Offense' }
    ];

    describe.each(TRACKED_RESET_FEATS)('Feat: $name', ({ name, per, effectName }) => {
      it(`should configure frequency (${per}), selfEffect, and UUID link for ${effectName}`, () => {
        const feat = featMap.get(name);
        expect(feat, `Feat ${name} must exist`).toBeDefined();
        expect(feat.system.frequency, `Feat ${name} must define frequency`).toBeDefined();
        expect(feat.system.frequency.max).toBe(1);
        expect(feat.system.frequency.per).toBe(per);

        expect(feat.system.selfEffect, `Feat ${name} must have selfEffect`).toBeDefined();
        expect(feat.system.selfEffect.name).toBe(effectName);

        const effectId = feat.system.selfEffect.uuid.split('.').pop();
        const effect = effectsMap.get(effectId);
        expect(effect, `Effect ${effectName} (${effectId}) must exist in eberron-effects`).toBeDefined();
        expect(effect.name).toBe(effectName);

        // Verify description has the @UUID link
        expect(feat.system.description.value).toContain(feat.system.selfEffect.uuid);
      });
    });

    const TRACKED_RESET_ACTIONS = [
      { name: 'Bark Orders', per: 'day', effectName: 'Effect: Used Bark Orders' },
      { name: 'Rampage', per: 'day', effectName: 'Effect: Used Rampage' },
      { name: 'Rapid Cover', per: 'day', effectName: 'Effect: Used Rapid Cover' },
      { name: 'Shift shape (Eberron Changeling)', per: 'PT10M', effectName: 'Effect: Used Shift Shape' }
    ];

    describe.each(TRACKED_RESET_ACTIONS)('Action: $name', ({ name, per, effectName }) => {
      it(`should configure frequency (${per}), selfEffect, and UUID link for ${effectName}`, () => {
        const action = actionMap.get(name);
        expect(action, `Action ${name} must exist`).toBeDefined();
        expect(action.system.frequency).toBeDefined();
        expect(action.system.frequency.max).toBe(1);
        expect(action.system.frequency.per).toBe(per);

        expect(action.system.selfEffect).toBeDefined();
        expect(action.system.selfEffect.name).toBe(effectName);

        const effectId = action.system.selfEffect.uuid.split('.').pop();
        const effect = effectsMap.get(effectId);
        expect(effect, `Effect ${effectName} must exist in eberron-effects`).toBeDefined();
        expect(effect.name).toBe(effectName);

        expect(action.system.description.value).toContain(action.system.selfEffect.uuid);
      });
    });

    const TRACKED_DRAGONMARK_FEATS = [
      { name: 'Cannith Forgecraft', effectName: 'Effect: Used Cannith Forgecraft' },
      { name: 'Deneith Battle Fortitude', effectName: 'Effect: Used Deneith Battle Fortitude' },
      { name: 'Dragonmarked Mastery', effectName: 'Effect: Used Dragonmarked Mastery' },
      { name: 'Eye of Medani', effectName: 'Effect: Used Eye of Medani' },
      { name: 'Grace of Ghallanda', effectName: 'Effect: Used Grace of Ghallanda' },
      { name: 'Jorasco Treatment', effectName: 'Effect: Used Jorasco Treatment' },
      { name: 'Khyber\'s reaper', effectName: 'Effect: Used Khyber\'s reaper' },
      { name: 'Lyrandar Stormrider', effectName: 'Effect: Used Lyrandar Stormrider' },
      { name: 'Phiarlan Performer', effectName: 'Effect: Used Phiarlan Performer' },
      { name: 'Potent Dragonmark', effectName: 'Effect: Used Potent Dragonmark' },
      { name: 'Scribe of Sivis', effectName: 'Effect: Used Scribe of Sivis' },
      { name: 'Tharashk Survivalist', effectName: 'Effect: Used Tharashk Survivalist' },
      { name: 'Thuranni Spectre', effectName: 'Effect: Used Thuranni Spectre' },
      { name: 'Vadalis Instincts', effectName: 'Effect: Used Vadalis Instincts' }
    ];

    describe.each(TRACKED_DRAGONMARK_FEATS)('Dragonmarked Feat: $name', ({ name, effectName }) => {
      it(`should configure once per day frequency and selfEffect for ${effectName}`, () => {
        const feat = featMap.get(name);
        expect(feat, `Feat ${name} must exist`).toBeDefined();
        expect(feat.system.frequency).toBeDefined();
        expect(feat.system.frequency.max).toBe(1);
        expect(feat.system.frequency.per).toBe('day');

        expect(feat.system.selfEffect).toBeDefined();
        expect(feat.system.selfEffect.name).toBe(effectName);

        const effectId = feat.system.selfEffect.uuid.split('.').pop();
        const effect = effectsMap.get(effectId);
        expect(effect, `Effect ${effectName} must exist in eberron-effects`).toBeDefined();
      });
    });
  });

  describe('Immunity Effects Verification', () => {
    const IMMUNITY_EFFECTS = [
      { name: 'Effect: Bark Orders Immunity', unit: 'minutes', value: 10 },
      { name: 'Effect: Encouraging Words Immunity', unit: 'days', value: 1 },
      { name: 'Effect: Terrifying Shift Demoralize Immunity', unit: 'minutes', value: 10 },
      { name: 'Effect: Thoughtsinger Immunity', unit: 'hours', value: 1 },
      { name: 'Effect: Detect Danger Immunity', unit: 'hours', value: 1 },
      { name: 'Effect: Eyes of the Finder Immunity', unit: 'hours', value: 1 },
      { name: 'Effect: Long March Immunity', unit: 'days', value: 1 },
      { name: 'Effect: Guidance of the Healer Immunity', unit: 'hours', value: 1 }
    ];

    describe.each(IMMUNITY_EFFECTS)('Immunity: $name', ({ name, unit, value }) => {
      it(`should define immunity effect with duration ${value} ${unit}`, () => {
        const effect = [...effectsMap.values()].find(e => e.name === name);
        expect(effect, `Immunity effect "${name}" must exist`).toBeDefined();
        expect(effect.system.duration.unit).toBe(unit);
        expect(effect.system.duration.value).toBe(value);
        expect(effect.system.duration.expiry).toBe('turn-start');
      });
    });
  });
});
