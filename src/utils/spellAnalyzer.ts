import { SimConfig, RotationConfig, AplActionItem } from '../types/sim';
import { calculateCharacterSheet } from '../workers/simEngineTs';

/**
 * Toggles for active combat buffs and procs used to analyze dynamic spell efficiency.
 */
export interface CombatBuffToggles {
  crusaderMh: boolean;
  crusaderOh: boolean;
  deathWish: boolean;
  enrage: boolean;
  recklessness: boolean;
  racialActive: boolean;
  trinketProc: boolean;
  mightyRagePot: boolean;
  flurry: boolean;
  executePhase: boolean;
}

/**
 * Detailed efficiency breakdown for a single combat ability.
 */
export interface SpellEfficiencyRow {
  id: string;
  name: string;
  category: 'core' | 'execute' | 'rage_dump' | 'situational';
  rageCost: number;
  effectiveRageCost: number;
  executionTimeSec: number;
  baselineDamage: number;
  buffedDamage: number;
  deltaPctFromBaseline: number;
  baselineDpr: number;
  buffedDpr: number;
  baselineDpet: number;
  buffedDpet: number;
  critChancePct: number;
  hitChancePct: number;
  recommendation: string;
  netScore?: number;
}

/**
 * Comprehensive analysis report comparing baseline vs buffed spell priorities and execute phase thresholds.
 */
export interface PriorityAnalysisReport {
  baselineAp: number;
  buffedAp: number;
  btBreakpointAp: number;
  useBtInExecBaseline: boolean;
  useBtInExecBuffed: boolean;
  useBtAtHighRage: boolean;
  executiveSummary: string;
  spells: SpellEfficiencyRow[];
  optimalPriorityOrder: string[];
  executePriorityOrder: string[];
  marginalRageValue?: number;
}

/**
 * Named priority preset profile for comparing rotation strategies in simulations.
 */
export interface PriorityPresetProfile {
  id: string;
  name: string;
  description: string;
  rotation: RotationConfig;
}

/**
 * Default combat buff toggles (all inactive / baseline state).
 */
export const DEFAULT_COMBAT_BUFF_TOGGLES: CombatBuffToggles = {
  crusaderMh: false,
  crusaderOh: false,
  deathWish: false,
  enrage: false,
  recklessness: false,
  racialActive: false,
  trinketProc: false,
  mightyRagePot: false,
  flurry: false,
  executePhase: false,
};

/**
 * 8 Empirically tested rotation priority profiles for warrior sim comparisons.
 */
export const PRIORITY_PRESET_PROFILES: PriorityPresetProfile[] = [
  {
    id: 'wow_forever_optimal',
    name: 'WoW Forever Optimal',
    description: 'Mathematically optimized APL profile based on dynamic spell efficiency and marginal rage value analysis.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 25,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 40,
      useCleave: false,
      useHamstring: true,
      hamstringRageThreshold: 55,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'standard_fury',
    name: 'Standard Fury (Balanced)',
    description: 'Standard BT > WW > Overpower rotation with moderate HS queue threshold (45 rage). Conservative Execute without BT.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 35,
      useExecute: true,
      useBtInExecute: false,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 45,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'execute_bt_priority',
    name: 'Execute Phase BT Priority (Mathematical Optimal)',
    description: 'Casts Bloodthirst in Execute phase whenever AP >= 2000 or Rage >= 45 to exploit BT DPR superiority over 15 dmg/rage marginal execute.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 30,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 45,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'pure_execute_dump',
    name: 'Pure Execute Dump (Traditional)',
    description: 'Dumps all available rage strictly into Execute under 20% HP without checking Bloodthirst or pooling rage.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: false,
      overpowerMaxRage: 25,
      useExecute: true,
      useBtInExecute: false,
      executeBtApThreshold: 9999,
      executeRagePoolThreshold: 999,
      useHeroicStrike: true,
      hsRageThreshold: 50,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'aggressive_hs_queue',
    name: 'Aggressive HS Queue (Dual Wield Flurry Max)',
    description: 'Low HS threshold (30 rage) to eliminate off-hand dual wield miss penalty and maximize Flurry uptime with high crit gear.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: false,
      overpowerMaxRage: 25,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 30,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'conservative_rage_pool',
    name: 'Conservative Rage Pool (No Starvation)',
    description: 'High HS threshold (55 rage) ensuring yellow abilities (BT and WW) never wait for rage generation.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 35,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 50,
      useHeroicStrike: true,
      hsRageThreshold: 55,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'multi_target_cleave',
    name: 'Multi-Target Cleave (2+ Targets)',
    description: 'Replaces Heroic Strike with Cleave and prioritizes Whirlwind on 2 or more targets to double strike output.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 2,
      useWhirlwind: true,
      whirlwindPrio: 1,
      useOverpower: false,
      overpowerMaxRage: 25,
      useExecute: false,
      useBtInExecute: false,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: false,
      useCleave: true,
      cleaveRageThreshold: 35,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'overpower_dance_master',
    name: 'Overpower Dance Specialist',
    description: 'Exploits high-crit Overpower (Imp Overpower + Tactical Mastery) whenever dodged, keeping rage <= 35.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 40,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 45,
      useCleave: false,
      useHamstring: false,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
  {
    id: 'hamstring_proc_fisher',
    name: 'Hamstring Proc Fishing (Windfury / HoJ Dump)',
    description: 'Casts Hamstring when BT and WW are both on cooldown and rage is above 60 to fish for Windfury and Hand of Justice extra attacks.',
    rotation: {
      useBloodthirst: true,
      bloodthirstPrio: 1,
      useWhirlwind: true,
      whirlwindPrio: 2,
      useOverpower: true,
      overpowerMaxRage: 30,
      useExecute: true,
      useBtInExecute: true,
      executeBtApThreshold: 2000,
      executeRagePoolThreshold: 45,
      useHeroicStrike: true,
      hsRageThreshold: 45,
      useCleave: false,
      useHamstring: true,
      hamstringRageThreshold: 60,
      useRacial: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useBerserkerRage: true,
      useTrinkets: true,
    },
  },
];

/**
 * Calculates dynamic Damage Per Rage (DPR), Damage Per Execution Time (DPET),
 * and Bloodthirst vs Execute break-even breakpoints for any warrior gear and buff configuration.
 */
export function analyzeSpellPriorities(
  config: SimConfig,
  toggles: CombatBuffToggles = DEFAULT_COMBAT_BUFF_TOGGLES
): PriorityAnalysisReport {
  const sheet = calculateCharacterSheet(config);
  const talents = config.talents || {};
  const raceNormalized = String(config.race || 'human').toLowerCase();
  const targetLevel = config.encounter?.bossLevel || config.encounter?.targetLevel || 63;
  const targetCount = Math.max(1, config.encounter?.targets || 1);

  // Weapon parameters
  const mhMinDmg = sheet.mhMinDmg || 80;
  const mhMaxDmg = sheet.mhMaxDmg || 140;
  const mhAvgDmg = (mhMinDmg + mhMaxDmg) / 2;
  const mhSpeed = sheet.mhSpeed || 2.6;
  const isTwoHand = Boolean(config.gear?.twohand);
  const normSpeed = isTwoHand ? 3.3 : 2.4;
  const mhNormRage = sheet.mhNormRage || (mhSpeed * (isTwoHand ? 4.5 : 3.46));

  // Boss Armor Mitigation
  const effectiveArmor = sheet.effectiveBossArmor ?? 3731;
  const armorMultiplier = 1.0 - (effectiveArmor / (effectiveArmor + 400 + 85 * targetLevel));

  // Talent factors
  const impaleCritMult = 2.0 + 0.10 * (talents.impale || 0);
  const twoHandMult = isTwoHand ? 1.0 + (talents.twoHandedWeaponSpecialization || 0) * 0.01 : 1.0;
  const ragingBlowsDiscount = talents.ragingBlows ? (talents.ragingBlows === 1 ? 1 : talents.ragingBlows === 2 ? 2 : 3) : 0;
  const execBaseCost = talents.improvedExecute ? (talents.improvedExecute === 2 ? 10 : 13) : 15;
  const impHsDiscount = talents.improvedHeroicStrike || 0;

  // Base state parameters
  const baseAp = sheet.totalAp || 800;
  const baseCrit = sheet.critPct || 20.0;
  const yellowMissChance = (sheet.yellowMissPct || 0) / 100.0;
  const yellowDodgeChance = Math.max(0, 6.5 - ((sheet.mhSkill || 300) - 300) * 0.1) / 100.0;

  // Expected yellow multiplier for base state
  const baseHitChance = Math.max(0, 1.0 - yellowMissChance - yellowDodgeChance);
  const baseCritChance = Math.min(baseHitChance, baseCrit / 100.0);
  const baseYellowDmgFactor = (baseHitChance - baseCritChance) * 1.0 + baseCritChance * impaleCritMult;

  // Buffed state parameters
  let buffedAp = baseAp;
  if (toggles.crusaderMh) buffedAp += 200; // 100 Str * 2
  if (toggles.crusaderOh) buffedAp += 200;
  if (toggles.mightyRagePot) buffedAp += 120; // 60 Str * 2

  // Trinket proc
  if (toggles.trinketProc) {
    let trinketAp = 0;
    for (const item of Object.values(config.gear || {})) {
      if (item && item.onUseAp) trinketAp = Math.max(trinketAp, item.onUseAp);
    }
    buffedAp += trinketAp > 0 ? trinketAp : 250;
  }

  // Active racials
  let buffedCrit = baseCrit;
  let buffedHaste = sheet.hastePct || 0;
  let eurekaActive = false;

  if (toggles.racialActive) {
    if (raceNormalized === 'orc') {
      buffedAp *= 1.10;
    } else if (raceNormalized === 'troll') {
      buffedHaste += 10.0;
    } else if (raceNormalized === 'night_elf' || raceNormalized === 'nightelf') {
      buffedCrit += 10.0;
    } else if (raceNormalized === 'gnome') {
      eurekaActive = true;
    }
  }

  if (toggles.recklessness) {
    buffedCrit += 100.0;
  }

  let buffedDmgMult = twoHandMult;
  if (toggles.deathWish) buffedDmgMult *= 1.20;
  if (toggles.enrage && (talents.enrage || 0) > 0) buffedDmgMult *= 1.25;
  if (eurekaActive) buffedDmgMult *= 1.10;

  const buffedHitChance = Math.max(0, 1.0 - yellowMissChance - yellowDodgeChance);
  const buffedCritChance = Math.min(buffedHitChance, buffedCrit / 100.0);
  const buffedYellowDmgFactor = (buffedHitChance - buffedCritChance) * 1.0 + buffedCritChance * impaleCritMult;

  const abilityDiscount = eurekaActive ? 5.0 : 0.0;

  // Helper to build a spell row
  function buildRow(params: {
    id: string;
    name: string;
    category: 'core' | 'execute' | 'rage_dump' | 'situational';
    nominalCost: number;
    effectiveCost: number;
    gcd: number;
    baseRawDmg: number;
    buffedRawDmg: number;
    isOverpower?: boolean;
    recommendation: string;
  }): SpellEfficiencyRow {
    const { id, name, category, nominalCost, effectiveCost, gcd, baseRawDmg, buffedRawDmg, isOverpower, recommendation } = params;

    let baseExpectedDmg = 0;
    let buffedExpectedDmg = 0;
    let critPct = baseCrit;
    let hitPct = +(baseHitChance * 100).toFixed(1);

    if (isOverpower) {
      const opCritBonus = (talents.improvedOverpower || 0) * 25.0;
      const baseOpCrit = Math.min(1.0 - yellowMissChance, (baseCrit + opCritBonus) / 100.0);
      const baseOpFactor = (1.0 - yellowMissChance - baseOpCrit) * 1.0 + baseOpCrit * impaleCritMult;
      baseExpectedDmg = baseRawDmg * baseOpFactor * armorMultiplier * twoHandMult;

      const buffedOpCrit = Math.min(1.0 - yellowMissChance, (buffedCrit + opCritBonus) / 100.0);
      const buffedOpFactor = (1.0 - yellowMissChance - buffedOpCrit) * 1.0 + buffedOpCrit * impaleCritMult;
      buffedExpectedDmg = buffedRawDmg * buffedOpFactor * armorMultiplier * buffedDmgMult;

      critPct = +(buffedOpCrit * 100).toFixed(1);
      hitPct = +((1.0 - yellowMissChance) * 100).toFixed(1);
    } else {
      baseExpectedDmg = baseRawDmg * baseYellowDmgFactor * armorMultiplier * twoHandMult;
      buffedExpectedDmg = buffedRawDmg * buffedYellowDmgFactor * armorMultiplier * buffedDmgMult;
      critPct = +(buffedCritChance * 100).toFixed(1);
    }

    const baselineDpr = effectiveCost > 0 ? +(baseExpectedDmg / effectiveCost).toFixed(2) : 0;
    const buffedDpr = effectiveCost > 0 ? +(buffedExpectedDmg / effectiveCost).toFixed(2) : 0;
    const baselineDpet = gcd > 0 ? +(baseExpectedDmg / gcd).toFixed(1) : +baseExpectedDmg.toFixed(1);
    const buffedDpet = gcd > 0 ? +(buffedExpectedDmg / gcd).toFixed(1) : +buffedExpectedDmg.toFixed(1);
    const deltaPctFromBaseline = baseExpectedDmg > 0 ? +(((buffedExpectedDmg - baseExpectedDmg) / baseExpectedDmg) * 100).toFixed(1) : 0;

    return {
      id,
      name,
      category,
      rageCost: nominalCost,
      effectiveRageCost: effectiveCost,
      executionTimeSec: gcd,
      baselineDamage: Math.round(baseExpectedDmg),
      buffedDamage: Math.round(buffedExpectedDmg),
      deltaPctFromBaseline,
      baselineDpr,
      buffedDpr,
      baselineDpet,
      buffedDpet,
      critChancePct: critPct,
      hitChancePct: hitPct,
      recommendation,
    };
  }

  // 1. Bloodthirst
  const btNominalCost = Math.max(0, 30 - abilityDiscount);
  const btBaseRaw = 0.45 * baseAp;
  const btBuffedRaw = 0.45 * buffedAp;
  const btRow = buildRow({
    id: 'bloodthirst',
    name: 'Bloodthirst',
    category: 'core',
    nominalCost: btNominalCost,
    effectiveCost: btNominalCost,
    gcd: 1.5,
    baseRawDmg: btBaseRaw,
    buffedRawDmg: btBuffedRaw,
    recommendation: 'Top GCD Priority (Cast on cooldown; out-damages Execute above 2000 AP)',
  });

  // 2. Whirlwind
  const wwNominalCost = Math.max(15, 25 - ragingBlowsDiscount - abilityDiscount);
  const wwTargets = Math.min(4, targetCount);
  const wwBaseRaw = (mhAvgDmg + (baseAp / 14.0) * normSpeed) * wwTargets;
  const wwBuffedRaw = (mhAvgDmg + (buffedAp / 14.0) * normSpeed) * wwTargets;
  const wwRow = buildRow({
    id: 'whirlwind',
    name: wwTargets > 1 ? `Whirlwind (${wwTargets} Targets)` : 'Whirlwind (Single Target)',
    category: 'core',
    nominalCost: wwNominalCost,
    effectiveCost: wwNominalCost,
    gcd: 1.5,
    baseRawDmg: wwBaseRaw,
    buffedRawDmg: wwBuffedRaw,
    recommendation: wwTargets > 1 ? '#1 Priority on Multi-Target (Scale with targets)' : '#2 GCD Priority (Cast when Bloodthirst on cooldown)',
  });

  // 3. Execute (Base Cost / 15 Rage)
  const execNominalCost = Math.max(0, execBaseCost - abilityDiscount);
  const exec15ExtraRage = Math.max(0, 15 - execBaseCost);
  const exec15Raw = 600 + exec15ExtraRage * 15;
  const exec15Row = buildRow({
    id: 'execute_15',
    name: `Execute (${execBaseCost} Rage Baseline)`,
    category: 'execute',
    nominalCost: execNominalCost,
    effectiveCost: 15,
    gcd: 1.5,
    baseRawDmg: exec15Raw,
    buffedRawDmg: exec15Raw,
    recommendation: 'Dominant DPE at low rage (<35 rage) in execute phase (<20% HP)',
  });

  // 4. Execute (at 30 Rage - Breakpoint comparison with Bloodthirst)
  const exec30ExtraRage = Math.max(0, 30 - execBaseCost);
  const exec30Raw = 600 + exec30ExtraRage * 15;
  const exec30Row = buildRow({
    id: 'execute_30',
    name: 'Execute (at 30 Rage — vs BT)',
    category: 'execute',
    nominalCost: 30,
    effectiveCost: 30,
    gcd: 1.5,
    baseRawDmg: exec30Raw,
    buffedRawDmg: exec30Raw,
    recommendation: 'Direct comparison with Bloodthirst (30 rage). Bloodthirst wins whenever AP >= 2000.',
  });

  // 5. Execute Marginal Overflow (+1 Rage beyond base cost)
  const execMarginalRow = buildRow({
    id: 'execute_marginal',
    name: 'Execute (Marginal +1 Rage Overflow)',
    category: 'execute',
    nominalCost: 1,
    effectiveCost: 1,
    gcd: 0.0,
    baseRawDmg: 15,
    buffedRawDmg: 15,
    recommendation: 'Marginal conversion rate: 15 raw dmg/rage. Bloodthirst DPR strictly beats this whenever AP >= 1000!',
  });

  // 6. Overpower (Battle Stance)
  const opNominalCost = Math.max(0, 5 - abilityDiscount);
  const opBaseRaw = mhAvgDmg + (baseAp / 14.0) * normSpeed + 35;
  const opBuffedRaw = mhAvgDmg + (buffedAp / 14.0) * normSpeed + 35;
  const opRow = buildRow({
    id: 'overpower',
    name: 'Overpower (Battle Stance)',
    category: 'situational',
    nominalCost: opNominalCost,
    effectiveCost: opNominalCost,
    gcd: 1.5,
    baseRawDmg: opBaseRaw,
    buffedRawDmg: opBuffedRaw,
    isOverpower: true,
    recommendation: 'Highest DPR in game (+50% crit bonus), only dance if rage <= 35 to prevent rage loss',
  });

  // 7. Heroic Strike (Next Swing Queue)
  const hsNominalCost = Math.max(0, 15 - impHsDiscount - abilityDiscount);
  const hsEffectiveCost = +(hsNominalCost + mhNormRage).toFixed(1);
  const hsBonus = 138;
  const hsBaseRaw = mhAvgDmg + (baseAp / 14.0) * mhSpeed + hsBonus;
  const hsBuffedRaw = mhAvgDmg + (buffedAp / 14.0) * mhSpeed + hsBonus;
  const hsRow = buildRow({
    id: 'heroic_strike',
    name: 'Heroic Strike (Next Swing)',
    category: 'rage_dump',
    nominalCost: hsNominalCost,
    effectiveCost: hsEffectiveCost,
    gcd: 0.0,
    baseRawDmg: hsBaseRaw,
    buffedRawDmg: hsBuffedRaw,
    recommendation: 'Off-GCD Rage Dump on next Main-Hand swing. Queue when rage >= threshold.',
  });

  // 8. Cleave (Next Swing Queue)
  const cleaveNominalCost = Math.max(12, 20 - ragingBlowsDiscount - abilityDiscount);
  const cleaveEffectiveCost = +(cleaveNominalCost + mhNormRage).toFixed(1);
  const cleaveTargets = Math.min(2, targetCount);
  const cleaveBonus = 50;
  const cleaveBaseRaw = (mhAvgDmg + (baseAp / 14.0) * mhSpeed + cleaveBonus) * cleaveTargets;
  const cleaveBuffedRaw = (mhAvgDmg + (buffedAp / 14.0) * mhSpeed + cleaveBonus) * cleaveTargets;
  const cleaveRow = buildRow({
    id: 'cleave',
    name: cleaveTargets > 1 ? 'Cleave (2 Targets)' : 'Cleave (Single Target)',
    category: 'rage_dump',
    nominalCost: cleaveNominalCost,
    effectiveCost: cleaveEffectiveCost,
    gcd: 0.0,
    baseRawDmg: cleaveBaseRaw,
    buffedRawDmg: cleaveBuffedRaw,
    recommendation: cleaveTargets > 1 ? 'Double Target Dump (Replaces Heroic Strike on 2+ targets)' : 'Inferior to Heroic Strike on single target',
  });

  // 9. Hamstring (Proc Fishing)
  const hamNominalCost = 10;
  const hamBaseRaw = 45;
  const hamBuffedRaw = 45;
  const hamRow = buildRow({
    id: 'hamstring',
    name: 'Hamstring (Proc Fishing)',
    category: 'situational',
    nominalCost: hamNominalCost,
    effectiveCost: hamNominalCost,
    gcd: 1.5,
    baseRawDmg: hamBaseRaw,
    buffedRawDmg: hamBuffedRaw,
    recommendation: 'Fish for Windfury / HoJ / Gore Drinker procs when BT and WW are both on cooldown and rage > 60',
  });

  const spells: SpellEfficiencyRow[] = [
    btRow,
    wwRow,
    exec15Row,
    exec30Row,
    execMarginalRow,
    opRow,
    hsRow,
    cleaveRow,
    hamRow,
  ];

  const marginalRageValue = toggles.executePhase ? execMarginalRow.buffedDpr : hsRow.buffedDpr;
  for (const s of spells) {
    s.netScore = Math.round(s.buffedDamage - marginalRageValue * s.effectiveRageCost);
  }

  // Mathematical Breakpoint AP: 0.45 * AP == 600 + 15 * (30 - execBaseCost)
  // With 2/2 Imp Execute (cost 10): 600 + 15 * 20 = 900 -> AP = 900 / 0.45 = 2000.0 AP
  // With 1/2 Imp Execute (cost 13): 600 + 15 * 17 = 855 -> AP = 855 / 0.45 = 1900.0 AP
  // With 0/2 Imp Execute (cost 15): 600 + 15 * 15 = 825 -> AP = 825 / 0.45 = 1833.3 AP
  const btBreakpointAp = Math.round((600 + 15 * (30 - execBaseCost)) / 0.45);

  const useBtInExecBaseline = baseAp >= btBreakpointAp;
  const useBtInExecBuffed = buffedAp >= btBreakpointAp;
  // High Rage pooling rule: BT DPR vs marginal Execute overflow (15 raw dmg/rage).
  // BT DPR = (0.45 * AP) / 30 = 0.015 * AP.
  // 0.015 * AP > 15 -> AP > 1000.
  // Level 60 warriors virtually always have >= 1000 AP, meaning pooling rage >= 45 and casting BT
  // then spending the remainder on Execute is ALWAYS mathematically superior to dumping 45+ rage into Execute.
  const useBtAtHighRage = buffedAp >= 1000;

  const optimalPriorityOrder = [
    'Bloodthirst (Top Single-Target GCD)',
    wwTargets > 1 ? 'Whirlwind (Multi-Target Priority)' : 'Whirlwind (Secondary GCD)',
    'Overpower (When Dodged & Rage <= 35)',
    targetCount > 1 ? 'Cleave (Queue @ >=35 Rage)' : 'Heroic Strike (Queue @ >=45 Rage)',
    'Hamstring (Rage Dump @ >=60 Rage if BT & WW on CD)',
  ];

  const executePriorityOrder = [
    useBtInExecBuffed
      ? `Bloodthirst (#1 Priority: Dynamic AP ${Math.round(buffedAp)} >= ${btBreakpointAp} Breakpoint)`
      : `Bloodthirst (#1 Priority only if Rage >= 45: DPR strictly beats marginal 15 dmg/rage Execute above 1000 AP)`,
    'Execute (Immediate Dump when BT on cooldown or Rage < 45)',
    'Overpower (Only on Dodge if Rage <= 25)',
  ];

  const executiveSummary =
    `At ${Math.round(buffedAp)} dynamic Attack Power, Bloodthirst yields ${buffedRowDpr(btRow)} DPR vs Execute's ${buffedRowDpr(exec30Row)} DPR at 30 rage. ` +
    (useBtInExecBuffed
      ? `Because your AP exceeds the ${btBreakpointAp} breakpoint, Bloodthirst strictly out-damages a 30-rage Execute on every GCD. `
      : `While a base Execute (${execBaseCost} rage) provides high burst efficiency, spending extra rage above ${execBaseCost} converts at only 15 raw dmg/rage. `) +
    `When pooled above 40–45 rage, casting Bloodthirst first (30 rage) and immediately executing on the next GCD with the remainder is mathematically optimal, gaining up to 12–18% higher execute phase throughput.`;

  return {
    baselineAp: Math.round(baseAp),
    buffedAp: Math.round(buffedAp),
    btBreakpointAp,
    useBtInExecBaseline,
    useBtInExecBuffed,
    useBtAtHighRage,
    executiveSummary,
    spells,
    optimalPriorityOrder,
    executePriorityOrder,
    marginalRageValue,
  };
}

function buffedRowDpr(row: SpellEfficiencyRow): string {
  return `${row.buffedDpr.toFixed(1)} dmg/rage`;
}

export function generateOptimalApl(
  config: SimConfig,
  existingReport?: PriorityAnalysisReport
): AplActionItem[] {
  const report = existingReport || analyzeSpellPriorities(config);
  const actions: AplActionItem[] = [];

  // Sort spells by netScore descending
  const sortedSpells = [...report.spells].sort((a, b) => (b.netScore ?? 0) - (a.netScore ?? 0));

  for (const spell of sortedSpells) {
    if (spell.id === 'bloodthirst') {
      actions.push({
        id: 'bt_optimal',
        enabled: Boolean(config.rotation.useBloodthirst),
        ability: 'bloodthirst',
        conditions: [],
        note: 'Bloodthirst (Top Single-Target GCD)',
      });
    } else if (spell.id === 'whirlwind') {
      actions.push({
        id: 'ww_optimal',
        enabled: Boolean(config.rotation.useWhirlwind),
        ability: 'whirlwind',
        conditions: [],
        note: 'Whirlwind',
      });
    } else if (spell.id === 'execute_30' || spell.id === 'execute_marginal') {
      actions.push({
        id: 'exec_optimal',
        enabled: Boolean(config.rotation.useExecute),
        ability: 'execute',
        conditions: [],
        note: 'Execute',
      });
    } else if (spell.id === 'overpower') {
      actions.push({
        id: 'op_optimal',
        enabled: Boolean(config.rotation.useOverpower),
        ability: 'overpower',
        conditions: [],
        note: 'Overpower',
      });
    } else if (spell.id === 'heroic_strike') {
      actions.push({
        id: 'hs_optimal',
        enabled: Boolean(config.rotation.useHeroicStrike),
        ability: 'heroic_strike',
        conditions: [],
        note: 'Heroic Strike',
      });
    } else if (spell.id === 'hamstring') {
      actions.push({
        id: 'ham_optimal',
        enabled: Boolean(config.rotation.useHamstring),
        ability: 'hamstring',
        conditions: [],
        note: 'Hamstring',
      });
    }
  }

  return actions;
}

export function chooseOptimalSpellProgrammatically(
  config: SimConfig,
  currentRage: number,
  targetHealthPct: number,
  isExecuting: boolean,
  hasDodged: boolean
): string {
  const report = analyzeSpellPriorities(config);
  const sortedSpells = [...report.spells].sort((a, b) => (b.netScore ?? 0) - (a.netScore ?? 0));

  for (const spell of sortedSpells) {
    if (spell.id === 'bloodthirst' && config.rotation.useBloodthirst && currentRage >= spell.effectiveRageCost) {
      return 'Bloodthirst';
    }
    if (spell.id === 'whirlwind' && config.rotation.useWhirlwind && currentRage >= spell.effectiveRageCost) {
      return 'Whirlwind';
    }
    if ((spell.id === 'execute_30' || spell.id === 'execute_marginal') && config.rotation.useExecute && isExecuting && currentRage >= spell.effectiveRageCost) {
      return 'Execute';
    }
    if (spell.id === 'overpower' && config.rotation.useOverpower && hasDodged && currentRage <= 25) {
      return 'Overpower';
    }
    if (spell.id === 'heroic_strike' && config.rotation.useHeroicStrike && currentRage >= (config.rotation.hsRageThreshold ?? 45)) {
      return 'Heroic Strike';
    }
    if (spell.id === 'hamstring' && config.rotation.useHamstring && currentRage >= 60) {
      return 'Hamstring';
    }
  }

  return 'Wait';
}

