#!/usr/bin/env node

/**
 * Script to create reset/used/immunity effects in `src/packs/eberron-effects/`
 * for all feats, actions, and features with reset timers or cooldowns,
 * configure their PF2e time system duration expiry, and link them to parent abilities
 * via `system.frequency`, `system.selfEffect`, and `@UUID` links.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function generateId(name) {
  // Deterministic 16-character alphanumeric id based on effect name
  const hash = crypto.createHash('sha256').update(name).digest('hex');
  return hash.slice(0, 16);
}

// Registry of all reset timer items to process
const RESET_DEFINITIONS = [
  // Actions
  {
    pack: 'eberron-actions',
    file: 'Bark_Orders_IcughynerInKafPq.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedBarkOrder',
        name: 'Effect: Used Bark Orders',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.IcughynerInKafPq]{Bark Orders}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      },
      {
        id: 'EffBarkOrdersImm',
        name: 'Effect: Bark Orders Immunity',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have reacted to @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.IcughynerInKafPq]{Bark Orders} and are immune to bark orders for 10 minutes.</p>'
      }
    ]
  },
  {
    pack: 'eberron-actions',
    file: 'Encouraging_Words_3IYGhbqMKVwfR6KV.json',
    effects: [
      {
        id: 'EffEncouragWrdIm',
        name: 'Effect: Encouraging Words Immunity',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have received @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.3IYGhbqMKVwfR6KV]{Encouraging Words} and are temporarily immune until you either Take a Breather or rest for the day.</p>'
      }
    ]
  },
  {
    pack: 'eberron-actions',
    file: 'Rampage_WgQhI9QEh3edqlBT.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedRampage01',
        name: 'Effect: Used Rampage',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.WgQhI9QEh3edqlBT]{Rampage}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-actions',
    file: 'Rapid_Cover_Qhf72hhZjoyw5iDd.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedRapidCvr1',
        name: 'Effect: Used Rapid Cover',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.Qhf72hhZjoyw5iDd]{Rapid Cover}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-actions',
    file: 'Shift_shape__Eberron_Changeling__mRp2OajR9Xx7uZ5g.json',
    frequency: { max: 1, per: 'PT10M' },
    effects: [
      {
        id: 'EffUsedShiftShp1',
        name: 'Effect: Used Shift Shape',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-actions.mRp2OajR9Xx7uZ5g]{Shift shape (Eberron Changeling)}. You cannot use it again for 10 minutes.</p>',
        isSelfEffect: true
      }
    ]
  },

  // Ancestry & Class Feats
  {
    pack: 'eberron-feats',
    file: 'Beasthide_Endurance_cyRfNhHH9XNFJ9Yl.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedBeastEndu',
        name: 'Effect: Used Beasthide Endurance',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.cyRfNhHH9XNFJ9Yl]{Beasthide Endurance}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Bounce_Back_xfwuPkfpjtYvK9Oe.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedBounceBak',
        name: 'Effect: Used Bounce Back',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.xfwuPkfpjtYvK9Oe]{Bounce Back}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Bugbear_Endurance_MI3ryhSPG7xx5vXl.json',
    frequency: { max: 1, per: 'PT1H' },
    effects: [
      {
        id: 'EffUsedBugbearEn',
        name: 'Effect: Used Bugbear Endurance',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.MI3ryhSPG7xx5vXl]{Bugbear Endurance}. You cannot use it again for 1 hour.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Construct_Rejuvenation_hS2F0xvuC1bI9oeq.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedConstReju',
        name: 'Effect: Used Construct Rejuvenation',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.hS2F0xvuC1bI9oeq]{Construct Rejuvenation}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Emotional_Empathy_BB3dwfRUnNAlzr3K.json',
    frequency: { max: 1, per: 'PT1M' },
    effects: [
      {
        id: 'EffUsedEmotEmpat',
        name: 'Effect: Used Emotional Empathy',
        duration: { value: 1, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.BB3dwfRUnNAlzr3K]{Emotional Empathy}. You cannot use it again for 1 minute.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Enrage_UEpSIxzX5cNPAOnb.json',
    frequency: { max: 1, per: 'PT1H' },
    effects: [
      {
        id: 'EffUsedEnrage001',
        name: 'Effect: Used Enrage',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.UEpSIxzX5cNPAOnb]{Enrage}. You cannot use it again for 1 hour.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Gorebrute_Vengeance_CUaJa1eFTGJUpb9p.json',
    frequency: { max: 1, per: 'PT10M' },
    effects: [
      {
        id: 'EffUsedGorebrVng',
        name: 'Effect: Used Gorebrute Vengeance',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.CUaJa1eFTGJUpb9p]{Gorebrute Vengeance}. You cannot use it again for 10 minutes.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Incredible_Defense_gfouzAes8iqkOUiL.json',
    frequency: { max: 1, per: 'PT1H' },
    effects: [
      {
        id: 'EffUsedIncredDef',
        name: 'Effect: Used Incredible Defense',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.gfouzAes8iqkOUiL]{Incredible Defense}. You cannot use it again for 1 hour.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Juggernaut_Repair_edO7rm8k2L1xYp4u.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedJuggRep01',
        name: 'Effect: Used Juggernaut Repair',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.edO7rm8k2L1xYp4u]{Juggernaut Repair}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Juvenile_Flight_zCUOmp4lf2L6e2qC.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedJuvenlFlt',
        name: 'Effect: Used Juvenile Flight',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.zCUOmp4lf2L6e2qC]{Juvenile Flight}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Psi_Blades_M7GaqclEN6PxrDxH.json',
    frequency: { max: 1, per: 'PT10M' },
    effects: [
      {
        id: 'EffUsedPsiBlades',
        name: 'Effect: Used Psi-Blades',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.M7GaqclEN6PxrDxH]{Psi-Blades}. You cannot re-focus and change the form of your mind smith weapon again for 10 minutes.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Quori_Focus_NMfjJs5IzH91serp.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedQuoriFoc1',
        name: 'Effect: Used Quori Focus',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.NMfjJs5IzH91serp]{Quori Focus}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Rapid_Regeneration_qXfq3YkTUIlbsMj5.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedRapidReg1',
        name: 'Effect: Used Rapid Regeneration',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.qXfq3YkTUIlbsMj5]{Rapid Regeneration}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Skilled_Capability_t6XvhVdeELf1Y1Wq.json',
    frequency: { max: 1, per: 'PT1H' },
    effects: [
      {
        id: 'EffUsedSkillCap1',
        name: 'Effect: Used Skilled Capability',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.t6XvhVdeELf1Y1Wq]{Skilled Capability}. You cannot use it again for 1 hour.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Stand_by_the_Strong_gw8g4ZtV1CHDCyAL.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedStandBySt',
        name: 'Effect: Used Stand by the Strong',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.gw8g4ZtV1CHDCyAL]{Stand by the Strong}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Terrifying_Shift_gDqEXxDteHrG3QML.json',
    frequency: { max: 1, per: 'PT10M' },
    effects: [
      {
        id: 'EffUsedTerrifShf',
        name: 'Effect: Used Terrifying Shift',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.gDqEXxDteHrG3QML]{Terrifying Shift}. You cannot use it again for 10 minutes.</p>',
        isSelfEffect: true
      },
      {
        id: 'EffDemoralizeImm',
        name: 'Effect: Terrifying Shift Demoralize Immunity',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You were targeted by @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.gDqEXxDteHrG3QML]{Terrifying Shift} and are temporarily immune to Demoralize attempts from that creature for 10 minutes.</p>'
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'The_Traveller_s_Protection_ipJlSjh99o0b82R3.json',
    frequency: { max: 1, per: 'PT10M' },
    effects: [
      {
        id: 'EffUsedTravlProt',
        name: 'Effect: Used The Traveller\'s Protection',
        duration: { value: 10, unit: 'minutes' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.ipJlSjh99o0b82R3]{The Traveller\'s Protection}. You cannot use it again for 10 minutes.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Thoughtsinger_BOuxYHWSsGjfx0RP.json',
    effects: [
      {
        id: 'EffThoughtsngImm',
        name: 'Effect: Thoughtsinger Immunity',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have been aided by @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.BOuxYHWSsGjfx0RP]{Thoughtsinger} and are immune to Thoughtsinger for 1 hour.</p>'
      }
    ]
  },
  {
    pack: 'eberron-feats',
    file: 'Warforged_Offense_dgqKFr83kTyHG190.json',
    frequency: { max: 1, per: 'PT1H' },
    effects: [
      {
        id: 'EffUsedWarfOffen',
        name: 'Effect: Used Warforged Offense',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-feats.dgqKFr83kTyHG190]{Warforged Offense}. You cannot use it again for 1 hour.</p>',
        isSelfEffect: true
      }
    ]
  },

  // Dragonmarked Feats
  {
    pack: 'eberron-dragonmarks',
    file: 'Cannith_Forgecraft_al72YSuczegSJVJ7.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedCannithFo',
        name: 'Effect: Used Cannith Forgecraft',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.al72YSuczegSJVJ7]{Cannith Forgecraft}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Deneith_Battle_Fortitude_ZtI0A6GzXbr1XQZS.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedDeneithBt',
        name: 'Effect: Used Deneith Battle Fortitude',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.ZtI0A6GzXbr1XQZS]{Deneith Battle Fortitude}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Dragonmarked_Mastery_lmU4AQP0MIFf1PVR.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedDragonMst',
        name: 'Effect: Used Dragonmarked Mastery',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.lmU4AQP0MIFf1PVR]{Dragonmarked Mastery}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Eye_of_Medani_XN2xb38HO09hZtCr.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedEyeMedani',
        name: 'Effect: Used Eye of Medani',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.XN2xb38HO09hZtCr]{Eye of Medani}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Grace_of_Ghallanda_g3HRpwYDptyIOkTD.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedGraceGhal',
        name: 'Effect: Used Grace of Ghallanda',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.g3HRpwYDptyIOkTD]{Grace of Ghallanda}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Jorasco_Treatment_A9XL3CvbXdSO1yuq.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedJorascoTr',
        name: 'Effect: Used Jorasco Treatment',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.A9XL3CvbXdSO1yuq]{Jorasco Treatment}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Khyber_s_reaper_ul3dI8jf3W2tIzsX.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedKhyberRea',
        name: 'Effect: Used Khyber\'s reaper',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.ul3dI8jf3W2tIzsX]{Khyber\'s reaper}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Lyrandar_Stormrider_0bIOxDTXkUCgcBya.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedLyrandStm',
        name: 'Effect: Used Lyrandar Stormrider',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.0bIOxDTXkUCgcBya]{Lyrandar Stormrider}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Phiarlan_Performer_VL8oq9MSUB8lO5Gz.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedPhiarlPrf',
        name: 'Effect: Used Phiarlan Performer',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.VL8oq9MSUB8lO5Gz]{Phiarlan Performer}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Potent_Dragonmark_kP9n2XvYq8RtLmZb.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedPotentDrg',
        name: 'Effect: Used Potent Dragonmark',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.kP9n2XvYq8RtLmZb]{Potent Dragonmark}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Scribe_of_Sivis_FW4zXn0Ncu2GCAHA.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedScribeSiv',
        name: 'Effect: Used Scribe of Sivis',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.FW4zXn0Ncu2GCAHA]{Scribe of Sivis}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Tharashk_Survivalist_ebhWXBFIjXAx059o.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedTharashkS',
        name: 'Effect: Used Tharashk Survivalist',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.ebhWXBFIjXAx059o]{Tharashk Survivalist}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Thuranni_Spectre_kdiehhu11h0HQGaD.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedThuranniS',
        name: 'Effect: Used Thuranni Spectre',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.kdiehhu11h0HQGaD]{Thuranni Spectre}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-dragonmarks',
    file: 'Vadalis_Instincts_R62E3RkKcNnn5Bku.json',
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: 'EffUsedVadalisIn',
        name: 'Effect: Used Vadalis Instincts',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have used @UUID[Compendium.pathfinders-guide-to-eberron.eberron-dragonmarks.R62E3RkKcNnn5Bku]{Vadalis Instincts}. You cannot use it again until your next daily preparations.</p>',
        isSelfEffect: true
      }
    ]
  },

  // Focus Spells with Cooldown/Immunity
  {
    pack: 'eberron-spells',
    file: 'Corrupted_Replication_uEeKVaKhjOjUU3Zh.json',
    frequency: { max: 1, per: 'PT24H' },
    effects: [
      {
        id: 'EffCorruptedRepl',
        name: 'Effect: Corrupted Replication Cooldown',
        duration: { value: 24, unit: 'hours' },
        description: '<p>You have cast @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.uEeKVaKhjOjUU3Zh]{Corrupted Replication} and cannot cast it again for 24 hours.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-spells',
    file: 'Detect_Danger_gKrHW1yB2eld2GD4.json',
    effects: [
      {
        id: 'EffDetectDangImm',
        name: 'Effect: Detect Danger Immunity',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You were protected by @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.gKrHW1yB2eld2GD4]{Detect Danger} and are immune to Detect Danger for 1 hour.</p>'
      }
    ]
  },
  {
    pack: 'eberron-spells',
    file: 'Eyes_of_the_finder_oNmTXMxkw5UDdLz7.json',
    effects: [
      {
        id: 'EffEyesFinderImm',
        name: 'Effect: Eyes of the Finder Immunity',
        duration: { value: 1, unit: 'hours' },
        description: '<p>You have benefited from @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.oNmTXMxkw5UDdLz7]{Eyes of the finder} and are immune for 1 hour after the spell ends.</p>'
      }
    ]
  },
  {
    pack: 'eberron-spells',
    file: 'Long_March_3oJmEyUwCL1SXlUd.json',
    effects: [
      {
        id: 'EffLongMarchImm1',
        name: 'Effect: Long March Immunity',
        duration: { value: 1, unit: 'days' },
        description: '<p>You have marched with the aid of @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.3oJmEyUwCL1SXlUd]{Long March} and are immune to the effects of Long March for 1 day.</p>'
      }
    ]
  },
  {
    pack: 'eberron-spells',
    file: 'Spell_Guard_0hvF5tj3l8nlIqDr.json',
    frequency: { max: 1, per: 'PT24H' },
    effects: [
      {
        id: 'EffSpellGuardCld',
        name: 'Effect: Spell Guard Cooldown',
        duration: { value: 24, unit: 'hours' },
        description: '<p>You have cast @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.0hvF5tj3l8nlIqDr]{Spell Guard} and cannot cast it again for 24 hours.</p>',
        isSelfEffect: true
      }
    ]
  },
  {
    pack: 'eberron-spells',
    file: 'Wrath_of_Kyber_auqP7FEa2tWALBQa.json',
    frequency: { max: 1, per: 'PT24H' },
    effects: [
      {
        id: 'EffWrathKyberCld',
        name: 'Effect: Wrath of Kyber Cooldown',
        duration: { value: 24, unit: 'hours' },
        description: '<p>You have cast @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.auqP7FEa2tWALBQa]{Wrath of Kyber} and cannot cast it again for 24 hours.</p>',
        isSelfEffect: true
      }
    ]
  },

  // Dragonmarked Focus Spells with daily frequency
  ...[
    { file: 'Dragonmarked_Construction_GYHBNy6M5ITpVXD8.json', id: 'GYHBNy6M5ITpVXD8', name: 'Dragonmarked Construction', effId: 'EffUsedDrgConst1' },
    { file: 'Dragonmarked_Detector_hhoJzpesIKvgZquc.json', id: 'hhoJzpesIKvgZquc', name: 'Dragonmarked Detector', effId: 'EffUsedDrgDetect' },
    { file: 'Dragonmarked_Handler_XELXG6LaIXJjdgaG.json', id: 'XELXG6LaIXJjdgaG', name: 'Dragonmarked Handler', effId: 'EffUsedDrgHandl1' },
    { file: 'Dragonmarked_Healer_o9Y2wChR2AHd5MPB.json', id: 'o9Y2wChR2AHd5MPB', name: 'Dragonmarked Healer', effId: 'EffUsedDrgHeal01' },
    { file: 'Dragonmarked_Hospitality_ncL6PBxg6etVfMrm.json', id: 'ncL6PBxg6etVfMrm', name: 'Dragonmarked Hospitality', effId: 'EffUsedDrgHosp01' },
    { file: 'Dragonmarked_Hunter_FrJVb0UFNLt3X5i3.json', id: 'FrJVb0UFNLt3X5i3', name: 'Dragonmarked Hunter', effId: 'EffUsedDrgHunt01' },
    { file: 'Dragonmarked_Mobility_fU359ZyA7PMU3UoP.json', id: 'fU359ZyA7PMU3UoP', name: 'Dragonmarked Mobility', effId: 'EffUsedDrgMobl01' },
    { file: 'Dragonmarked_Scribe_Gtj7F0DyLTcqhYiR.json', id: 'Gtj7F0DyLTcqhYiR', name: 'Dragonmarked Scribe', effId: 'EffUsedDrgScrb01' },
    { file: 'Dragonmarked_Sentinel_aWXQ4WA9VnZrwg2l.json', id: 'aWXQ4WA9VnZrwg2l', name: 'Dragonmarked Sentinel', effId: 'EffUsedDrgSent01' },
    { file: 'Dragonmarked_Shadow_v5jSJLk1F5gg9PHj.json', id: 'v5jSJLk1F5gg9PHj', name: 'Dragonmarked Shadow', effId: 'EffUsedDrgShad01' },
    { file: 'Dragonmarked_Stormbringer_j6FtX5qobnmDDDO0.json', id: 'j6FtX5qobnmDDDO0', name: 'Dragonmarked Stormbringer', effId: 'EffUsedDrgStrm01' },
    { file: 'Dragonmarked_Warder_7STeejZ6SEQWghEt.json', id: '7STeejZ6SEQWghEt', name: 'Dragonmarked Warder', effId: 'EffUsedDrgWard01' },
    { file: 'Siberys__Reconstruction_7KGk8tBHW5DmezeY.json', id: '7KGk8tBHW5DmezeY', name: 'Siberys\' Reconstruction', effId: 'EffUsedSibRecon1' }
  ].map(s => ({
    pack: 'eberron-spells',
    file: s.file,
    frequency: { max: 1, per: 'day' },
    effects: [
      {
        id: s.effId,
        name: `Effect: Used ${s.name}`,
        duration: { value: 1, unit: 'days' },
        description: `<p>You have cast @UUID[Compendium.pathfinders-guide-to-eberron.eberron-spells.${s.id}]{${s.name}} and cannot cast it again until your next daily preparations.</p>`,
        isSelfEffect: true
      }
    ]
  }))
];

const effectsDir = path.resolve('src/packs/eberron-effects');
let createdEffectsCount = 0;
let updatedParentsCount = 0;

for (const def of RESET_DEFINITIONS) {
  const parentFilePath = path.resolve(`src/packs/${def.pack}/${def.file}`);
  if (!fs.existsSync(parentFilePath)) {
    console.error(`Missing parent file: ${parentFilePath}`);
    continue;
  }

  const parentJson = JSON.parse(fs.readFileSync(parentFilePath, 'utf8'));
  let parentModified = false;

  // 1. Update frequency if specified
  if (def.frequency) {
    parentJson.system.frequency = def.frequency;
    parentModified = true;
  }

  // 2. Create each effect
  for (const effDef of def.effects) {
    const effectId = effDef.id;
    // Format filename matching other effects in pack: <Sanitized_Name>_<ID>.json
    const sanitizedName = effDef.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const effectFileName = `${sanitizedName}_${effectId}.json`;
    const effectFilePath = path.join(effectsDir, effectFileName);

    // Pick icon: parent img if available, or appropriate fallback
    const icon = parentJson.img || 'systems/pf2e/icons/features/feats/feats.webp';

    const effectDoc = {
      _id: effectId,
      name: effDef.name,
      type: 'effect',
      img: icon,
      effects: [],
      folder: null,
      sort: 0,
      flags: {
        core: {
          sourceId: `Compendium.pathfinders-guide-to-eberron.eberron-effects.${effectId}`
        }
      },
      system: {
        description: {
          gm: '',
          value: effDef.description
        },
        source: {
          value: "Pathfinder's Guide to Eberron",
          page: 'N/A'
        },
        traits: {
          value: [],
          rarity: 'common',
          custom: ''
        },
        rules: [],
        slug: effDef.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        schema: {
          version: 0.959,
          lastMigration: {
            datetime: null,
            version: {
              schema: 0.959,
              foundry: '14.368',
              system: '8.5.1'
            }
          }
        },
        level: {
          value: parentJson.system?.level?.value || 1
        },
        duration: {
          value: effDef.duration.value,
          unit: effDef.duration.unit,
          sustained: false,
          expiry: 'turn-start'
        },
        start: {
          value: 0,
          initiative: null
        },
        tokenIcon: {
          show: true
        },
        badge: null,
        context: null,
        unidentified: false,
        publication: {
          title: "Pathfinder's Guide to Eberron",
          authors: '',
          license: 'ORC',
          remaster: true,
          page: 'N/A'
        },
        _migration: {
          version: 0.959,
          previous: null
        }
      },
      ownership: {
        default: 0
      },
      _stats: {
        systemId: 'pf2e',
        systemVersion: '8.5.1',
        coreVersion: '14.368'
      },
      _key: `!items!${effectId}`
    };

    fs.writeFileSync(effectFilePath, JSON.stringify(effectDoc, null, 2) + '\n', 'utf8');
    createdEffectsCount++;

    // Link effect in parent description if not present
    const effectUuid = `Compendium.pathfinders-guide-to-eberron.eberron-effects.${effectId}`;
    const linkStr = `@UUID[${effectUuid}]{${effDef.name}}`;
    if (!parentJson.system.description.value.includes(effectUuid)) {
      parentJson.system.description.value += `\n<p>${linkStr}</p>`;
      parentModified = true;
    }

    // Configure selfEffect if applicable (for actions & feats)
    if (effDef.isSelfEffect && (parentJson.type === 'action' || parentJson.type === 'feat')) {
      parentJson.system.selfEffect = {
        name: effDef.name,
        uuid: effectUuid
      };
      parentModified = true;
    }
  }

  if (parentModified) {
    fs.writeFileSync(parentFilePath, JSON.stringify(parentJson, null, 2) + '\n', 'utf8');
    updatedParentsCount++;
  }
}

console.log(`Created ${createdEffectsCount} reset/used/immunity effects in eberron-effects.`);
console.log(`Updated ${updatedParentsCount} parent items with frequency, selfEffect, and UUID links.`);
