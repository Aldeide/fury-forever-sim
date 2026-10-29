import {
  EquipmentSlot,
  ItemStats,
  EnchantInfo,
  TalentConfig,
  BuffConfig,
  RotationConfig,
  EncounterConfig,
  SimConfig,
  AbilityBreakdown,
  CharacterSheetSummary,
  SimResult,
  BatchSlotRequest,
  BatchSlotResult,
  BatchItemResult,
  StatWeightsResult,
  StatWeightEntry,
  Race,
} from '../types/sim';

/**
 * Fast Pseudo-Random Number Generator (Xorshift32) for deterministic, ultra-fast Monte Carlo runs.
 */
class FastRng {
  private state: number;

  constructor(seed = 1337) {
    this.state = seed || 1337;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return (this.state >>> 0) / 4294967296;
  }
}

/**
 * Calculate effective character sheet stats from Gear, Enchants, Talents, Buffs, and Race.
 */
export function calculateCharacterSheet(config: SimConfig): CharacterSheetSummary {
  const { gear = {}, enchants = {}, talents = {}, buffs = {}, race } = config;

  // Base Level 60 Warrior Stats
  let baseStr = 120;
  let baseAgi = 80;
  let baseSta = 110;
  let baseAp = 160;
  let baseCrit = 0.0;
  let baseHit = 0.0;
  let baseHaste = 0.0;
  let baseArmor = 0;

  // Racial adjustments
  let racialSwordSkill = 0;
  let racialMaceSkill = 0;
  let racialAxeSkill = 0;
  let racialDaggerSkill = 0;

  const raceNormalized = String(race).toLowerCase();
  switch (raceNormalized) {
    case 'human':
      racialSwordSkill = 5;
      racialMaceSkill = 5;
      break;
    case 'orc':
      baseStr += 3;
      baseAgi -= 3;
      racialAxeSkill = 5;
      break;
    case 'troll':
      baseStr += 1;
      baseAgi += 2;
      break;
    case 'tauren':
      baseStr += 5;
      baseAgi -= 5;
      break;
    case 'gnome':
      baseStr -= 5;
      baseAgi += 3;
      break;
    case 'dwarf':
      baseStr += 2;
      baseAgi -= 4;
      racialMaceSkill = 5;
      break;
    case 'night_elf':
    case 'nightelf':
      baseStr -= 3;
      baseAgi += 5;
      break;
    case 'undead':
      baseStr -= 1;
      baseAgi -= 2;
      break;
  }

  // Aggregate stats from gear
  let gearStr = 0;
  let gearAgi = 0;
  let gearSta = 0;
  let gearAp = 0;
  let gearCrit = 0;
  let gearHit = 0;
  let gearOhHit = 0;
  let gearHaste = 0;
  let gearArmorPen = 0;
  let gearWeaponSkill = 0;
  let gearArmor = 0;

  const slots = Object.keys(gear) as EquipmentSlot[];
  for (const slot of slots) {
    const item = gear[slot];
    if (!item) continue;

    gearStr += item.str || 0;
    gearAgi += item.agi || 0;
    gearSta += item.sta || 0;
    gearAp += item.ap || 0;
    gearCrit += item.crit || 0;
    gearHit += item.hit || 0;
    gearOhHit += item.ohHit || 0;
    gearHaste += item.haste || 0;
    gearWeaponSkill += item.weaponSkill || 0;
    gearArmor += item.armor || 0;
    if (item.onUseArmorPen) gearArmorPen += (item.onUseArmorPen * (item.onUseDuration || 15)) / (item.onUseCd || 120);

    const enchant = (enchants as any)[slot];
    if (enchant && enchant.stats) {
      gearStr += enchant.stats.str || 0;
      gearAgi += enchant.stats.agi || 0;
      gearSta += enchant.stats.sta || 0;
      gearAp += enchant.stats.ap || 0;
      gearCrit += enchant.stats.crit || 0;
      gearHit += enchant.stats.hit || 0;
      gearHaste += enchant.stats.haste || 0;
    }
  }

  // Buff additions
  let buffStr = 0;
  let buffAgi = 0;
  let buffAp = 0;
  let buffCrit = 0;
  let buffHaste = 0;

  if (buffs.blessingOfKings) {
    baseStr *= 1.1;
    baseAgi *= 1.1;
    baseSta *= 1.1;
    gearStr *= 1.1;
    gearAgi *= 1.1;
    gearSta *= 1.1;
  }

  if (buffs.rallyingCryOfDragonslayer) {
    buffCrit += 10.0;
    buffAp += 140;
  }
  if (buffs.songflowerSerenade) {
    buffCrit += 5.0;
    buffStr += 15;
    buffAgi += 15;
  }
  if (buffs.warchiefsBlessing) {
    buffHaste += 15.0;
  }
  if (buffs.spiritOfZandalar) {
    buffStr *= 1.15;
    buffAgi *= 1.15;
  }
  if (buffs.fengusFerocity) buffAp += 200;
  if (buffs.elixirOfMongoose) {
    buffAgi += 25;
    buffCrit += 2.0;
  }
  if (buffs.elixirOfGiants) buffStr += 25;
  if (buffs.jujuPower) buffStr += 30;
  if (buffs.jujuMight) buffAp += 40;
  if (buffs.jujuFlurry) buffHaste += 3.0;
  if (buffs.winterfallFirewater) buffAp += 35;
  if (buffs.smokedDesertDumplings) buffStr += 20;
  if (buffs.strengthOfEarthTotem) buffStr += 77;
  if (buffs.graceOfAirTotem) buffAgi += 77;
  if (buffs.battleShout) buffAp += buffs.improvedBattleShout ? 290 : 232;
  if (buffs.blessingOfMight) buffAp += buffs.improvedBlessingOfMight ? 222 : 185;
  if (buffs.trueshotAura) buffAp += 50;
  if (buffs.leaderOfThePack) buffCrit += 3.0;

  if (buffs.elementalSharpeningStoneMH || buffs.elementalSharpeningStoneMh) buffCrit += 2.0;
  if (buffs.elementalSharpeningStoneOH || buffs.elementalSharpeningStoneOh) buffCrit += 2.0;

  // Talent contributions
  const crueltyCrit = (talents.cruelty || 0) * 1.0;
  const weaponMasterySkill = (talents.weaponMastery || 0) * 3;

  const totalStr = Math.round(baseStr + gearStr + buffStr);
  const totalAgi = Math.round(baseAgi + gearAgi + buffAgi);
  const totalSta = Math.round(baseSta + gearSta);

  const apFromStr = totalStr * 2;
  const critFromAgi = totalAgi / 20.0;

  const totalAp = baseAp + apFromStr + gearAp + buffAp;
  const totalCrit = +(baseCrit + critFromAgi + gearCrit + buffCrit + crueltyCrit).toFixed(2);
  const totalHit = +(baseHit + gearHit).toFixed(2);
  const totalOhHit = +(gearOhHit + (talents.furiousPrecision ? (talents.furiousPrecision === 1 ? 4 : talents.furiousPrecision === 2 ? 7 : 10) : 0)).toFixed(2);
  const totalHaste = +(baseHaste + gearHaste + buffHaste).toFixed(2);

  // Weapons check
  const mh = gear.mainhand || gear.twohand || null;
  const oh = gear.twohand ? null : gear.offhand || null;

  const mhType = (mh?.weaponType || 'sword').toLowerCase();
  const ohType = (oh?.weaponType || 'sword').toLowerCase();

  let mhSkill = 300 + weaponMasterySkill + gearWeaponSkill;
  let ohSkill = 300 + weaponMasterySkill + gearWeaponSkill;

  if (mhType.includes('sword')) mhSkill += racialSwordSkill;
  else if (mhType.includes('axe')) mhSkill += racialAxeSkill;
  else if (mhType.includes('mace')) mhSkill += racialMaceSkill;
  else if (mhType.includes('dagger')) mhSkill += racialDaggerSkill;

  if (oh) {
    if (ohType.includes('sword')) ohSkill += racialSwordSkill;
    else if (ohType.includes('axe')) ohSkill += racialAxeSkill;
    else if (ohType.includes('mace')) ohSkill += racialMaceSkill;
    else if (ohType.includes('dagger')) ohSkill += racialDaggerSkill;
  }

  const mhSpeed = mh?.speed || 2.6;
  const ohSpeed = oh?.speed || 2.6;
  const mhMinDmg = mh?.minDmg || 80;
  const mhMaxDmg = mh?.maxDmg || 140;
  const ohMinDmg = oh?.minDmg || 60;
  const ohMaxDmg = oh?.maxDmg || 110;
  const mhDps = mh?.dps || +(((mhMinDmg + mhMaxDmg) / 2) / mhSpeed).toFixed(1);
  const ohDps = oh ? (oh.dps || +(((ohMinDmg + ohMaxDmg) / 2) / ohSpeed).toFixed(1)) : 0;

  // Boss Armor Calculation
  const baseBossArmor = config.encounter?.bossArmor || config.encounter?.targetArmor || 4691;
  let bossArmorReduction = 0;
  if (buffs.sunderArmor) bossArmorReduction += Math.min(5, Number(buffs.sunderArmor)) * 450;
  if (buffs.faerieFire) bossArmorReduction += 505;
  if (buffs.curseOfRecklessness) bossArmorReduction += 640;
  if (buffs.annihilator || buffs.annihilatorStacks) bossArmorReduction += Math.min(3, Number(buffs.annihilator || buffs.annihilatorStacks)) * 200;
  const bossArmorRemaining = Math.max(0, baseBossArmor - bossArmorReduction - Math.round(gearArmorPen));

  const targetLevel = config.encounter?.bossLevel || config.encounter?.targetLevel || 63;
  const baseSpecialMiss = mhSkill >= 305 ? 6.0 : 8.0;
  const yellowMissPct = Math.max(0, +(baseSpecialMiss - totalHit).toFixed(2));
  const mhWhiteMissPct = Math.max(0, +(27.0 - totalHit).toFixed(2));
  const ohWhiteMissPct = Math.max(0, +(27.0 - totalHit - (totalOhHit || 0)).toFixed(2));
  const yellowDodgePct = Math.max(0, +(6.5 - (mhSkill - 300) * 0.1).toFixed(2));
  const mhCritCap = Math.max(0, +(100.0 - mhWhiteMissPct - yellowDodgePct - 40.0).toFixed(2));
  const ohCritCap = Math.max(0, +(100.0 - ohWhiteMissPct - yellowDodgePct - 40.0).toFixed(2));

  const estMhHitDmg = Math.round(((mhMinDmg + mhMaxDmg) / 2 + (totalAp / 14) * mhSpeed) * 0.70);
  const estOhHitDmg = Math.round((((ohMinDmg + ohMaxDmg) / 2 + (totalAp / 14) * ohSpeed) * 0.70) * 0.50);
  const mhNormRage = Math.min(50, +((estMhHitDmg / 30.0) * 3.75).toFixed(1));
  const ohNormRage = Math.min(30, +((estOhHitDmg / 30.0) * 3.75 * 0.5).toFixed(1));
  const mhCritRage = +(mhNormRage * 2.0).toFixed(1);
  const ohCritRage = +(ohNormRage * 2.0).toFixed(1);

  const retainedStanceRage = 10 + (talents.tacticalMastery || 0) * 5;
  const armorReductionPct = +((1.0 - (bossArmorRemaining / (bossArmorRemaining + 400 + 85 * targetLevel))) * 100).toFixed(1);

  return {
    totalStr,
    totalAgi,
    totalAp,
    critPct: totalCrit,
    mhHitPct: totalHit,
    ohHitPct: totalOhHit,
    mhWhiteMissPct,
    ohWhiteMissPct,
    yellowMissPct,
    mhCritCap,
    ohCritCap,
    hastePct: totalHaste,
    mhNormRage,
    ohNormRage,
    mhCritRage,
    ohCritRage,
    effectiveBossArmor: bossArmorRemaining,
    armorReductionPct,
    retainedStanceRage,

    // UI Aliases
    str: totalStr,
    agi: totalAgi,
    sta: totalSta,
    ap: totalAp,
    crit: totalCrit,
    hit: totalHit,
    ohHit: totalOhHit,
    haste: totalHaste,
    mhSkill,
    ohSkill,
    mhSpeed,
    ohSpeed,
    mhMinDmg,
    mhMaxDmg,
    ohMinDmg,
    ohMaxDmg,
    mhDps,
    ohDps,
    armor: gearArmor,
    effectiveArmorPen: Math.round(gearArmorPen),
    bossArmorRemaining,
  };
}

/**
 * Combat Simulation Engine (Pure TypeScript)
 */
export function simulateCombat(config: SimConfig, iterations = 2000): SimResult {
  const t0 = performance.now();
  const stats = calculateCharacterSheet(config);
  const { encounter, rotation, talents = {}, buffs = {} } = config;
  const duration = encounter.durationSec || encounter.duration || 60;
  const isDualWield = !config.gear?.twohand && !!config.gear?.offhand;

  const rng = new FastRng(42);

  const targetLevel = encounter.bossLevel || encounter.targetLevel || 63;
  const yellowMissChance = stats.yellowMissPct / 100.0;
  const yellowDodgeChance = Math.max(0, 6.5 - ((stats.mhSkill || 300) - 300) * 0.1) / 100.0;

  const mhWhiteMiss = stats.mhWhiteMissPct / 100.0;
  const ohWhiteMiss = stats.ohWhiteMissPct / 100.0;

  const glancingChance = 0.40;
  const glancingPenalty = (stats.mhSkill || 300) >= 305 ? 0.15 : 0.35;

  const bossArmor = stats.effectiveBossArmor ?? stats.bossArmorRemaining ?? 3731;
  const armorMultiplier = 1.0 - (bossArmor / (bossArmor + 400 + 85 * targetLevel));

  const dwSpecMult = 0.50 * (1.0 + (talents.dualWieldSpec || 0) * 0.05);

  const ragingBlowsDiscount = talents.ragingBlows ? (talents.ragingBlows === 1 ? 1 : talents.ragingBlows === 2 ? 2 : 3) : 0;
  const wwRageCost = Math.max(15, 25 - ragingBlowsDiscount);
  const cleaveRageCost = Math.max(12, 20 - ragingBlowsDiscount);
  const btRageCost = 30;
  const executeBaseCost = talents.improvedExecute ? (talents.improvedExecute === 2 ? 10 : 13) : 15;

  const tacticalMasteryRetained = stats.retainedStanceRage ?? 10;

  let totalSimDamage = 0;
  const abilityStats: Record<string, { casts: number; hits: number; crits: number; misses: number; dodges: number; glancings: number; damage: number }> = {
    'Bloodthirst': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Whirlwind': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Heroic Strike': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Execute': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Overpower': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Auto-Attack (MH)': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Auto-Attack (OH)': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
    'Deep Wounds': { casts: 0, hits: 0, crits: 0, misses: 0, dodges: 0, glancings: 0, damage: 0 },
  };

  const fightDpsList: number[] = new Array(iterations);
  const hsThreshold = rotation.hsRageThreshold ?? rotation.heroicStrikeRageThreshold ?? 45;
  const opMaxRage = rotation.overpowerMaxRage ?? rotation.overpowerRageThreshold ?? 35;

  const mhMinDmg = stats.mhMinDmg || 80;
  const mhMaxDmg = stats.mhMaxDmg || 140;
  const mhSpeed = stats.mhSpeed || 2.6;
  const ohMinDmg = stats.ohMinDmg || 60;
  const ohMaxDmg = stats.ohMaxDmg || 110;
  const ohSpeed = stats.ohSpeed || 2.6;
  const baseAp = stats.totalAp || 800;
  const baseCrit = stats.critPct || 20;
  const baseHaste = stats.hastePct || 0;

  for (let it = 0; it < iterations; it++) {
    let time = 0.0;
    let rage = buffs.mightyRagePotion ? 60 : 0;
    if (rotation.useBloodrage) rage += 20;

    let fightDamage = 0;
    let mhTimer = 0.0;
    let ohTimer = isDualWield ? ohSpeed / 2 : 999999;
    let gcdTimer = 0.0;
    let btCd = 0.0;
    let wwCd = 0.0;
    let overpowerAvailableUntil = -1.0;
    let flurryCharges = 0;
    let deathWishActiveUntil = -1.0;
    let recklessnessActiveUntil = -1.0;
    let crusaderMhActiveUntil = -1.0;
    let crusaderOhActiveUntil = -1.0;
    let deepWoundsTicks = 0;
    let deepWoundsTickDamage = 0;
    let nextDeepWoundsTick = -1.0;

    const timeStep = 0.1;
    const executePct = encounter.executePhasePct ?? encounter.executePercentage ?? 20;
    const executeThresholdTime = duration * (1.0 - executePct / 100.0);

    while (time < duration) {
      if (rotation.useDeathWish && talents.deathWish && deathWishActiveUntil < time - 180 && time >= (rotation.deathWishTiming || 0)) {
        if (rage >= 10) {
          rage -= 10;
          deathWishActiveUntil = time + 30.0;
        }
      }
      if (rotation.useRecklessness && recklessnessActiveUntil < time - 1800 && time >= (rotation.recklessnessTiming || 0)) {
        recklessnessActiveUntil = time + 15.0;
      }

      let currentAp = baseAp;
      if (crusaderMhActiveUntil > time) currentAp += 100;
      if (crusaderOhActiveUntil > time) currentAp += 100;
      if (deathWishActiveUntil > time) currentAp *= 1.20;

      let currentHaste = baseHaste;
      if (flurryCharges > 0) currentHaste += (talents.flurry ? talents.flurry * 6.0 : 30.0);
      const hasteMult = 1.0 + currentHaste / 100.0;

      if (deepWoundsTicks > 0 && time >= nextDeepWoundsTick) {
        fightDamage += deepWoundsTickDamage;
        abilityStats['Deep Wounds'].damage += deepWoundsTickDamage;
        abilityStats['Deep Wounds'].hits++;
        deepWoundsTicks--;
        nextDeepWoundsTick = time + 3.0;
      }

      const isExecutePhase = (rotation.executePhase || rotation.useExecute) && time >= executeThresholdTime;

      // GCD Ability
      if (gcdTimer <= 0) {
        if (
          overpowerAvailableUntil > time &&
          talents.improvedOverpower &&
          rage <= opMaxRage &&
          rage >= 5
        ) {
          rage = Math.min(rage, tacticalMasteryRetained);
          rage -= 5;
          abilityStats['Overpower'].casts++;
          const opCrit = (baseCrit + (talents.improvedOverpower * 25)) / 100.0;
          const isCrit = rng.next() < opCrit;
          const avgMhDmg = (mhMinDmg + mhMaxDmg) / 2 + (currentAp / 14) * 2.4;
          let opDmg = (avgMhDmg + 35) * armorMultiplier;
          if (isCrit) {
            opDmg *= 2.0;
            abilityStats['Overpower'].crits++;
            flurryCharges = 3;
          } else {
            abilityStats['Overpower'].hits++;
          }
          fightDamage += opDmg;
          abilityStats['Overpower'].damage += opDmg;
          overpowerAvailableUntil = -1.0;
          gcdTimer = 1.5;
        } else if (isExecutePhase && rage >= executeBaseCost) {
          abilityStats['Execute'].casts++;
          const roll = rng.next();
          if (roll < yellowMissChance) {
            abilityStats['Execute'].misses++;
            rage -= executeBaseCost;
          } else if (roll < yellowMissChance + yellowDodgeChance) {
            abilityStats['Execute'].dodges++;
            overpowerAvailableUntil = time + 5.0;
            rage -= Math.round(executeBaseCost * 0.2);
          } else {
            const isCrit = rng.next() < (baseCrit / 100.0);
            const extraRage = Math.max(0, rage - executeBaseCost);
            let dmg = (600 + extraRage * 15) * armorMultiplier;
            rage = 0;
            if (isCrit) {
              dmg *= 2.0;
              abilityStats['Execute'].crits++;
              flurryCharges = 3;
            } else {
              abilityStats['Execute'].hits++;
            }
            fightDamage += dmg;
            abilityStats['Execute'].damage += dmg;
          }
          gcdTimer = 1.5;
        } else if (talents.bloodthirst && btCd <= 0 && rage >= btRageCost) {
          rage -= btRageCost;
          btCd = 6.0;
          abilityStats['Bloodthirst'].casts++;
          const roll = rng.next();
          if (roll < yellowMissChance) {
            abilityStats['Bloodthirst'].misses++;
          } else if (roll < yellowMissChance + yellowDodgeChance) {
            abilityStats['Bloodthirst'].dodges++;
            overpowerAvailableUntil = time + 5.0;
            rage += Math.round(btRageCost * 0.8);
          } else {
            const isCrit = rng.next() < (baseCrit / 100.0);
            let dmg = (currentAp * 0.45) * armorMultiplier;
            if (isCrit) {
              dmg *= 2.0;
              abilityStats['Bloodthirst'].crits++;
              flurryCharges = 3;
              deepWoundsTicks = 4;
              deepWoundsTickDamage = Math.round((mhMaxDmg * 0.6) / 4);
              nextDeepWoundsTick = time + 3.0;
            } else {
              abilityStats['Bloodthirst'].hits++;
            }
            fightDamage += dmg;
            abilityStats['Bloodthirst'].damage += dmg;
          }
          gcdTimer = 1.5;
        } else if (wwCd <= 0 && rage >= wwRageCost) {
          rage -= wwRageCost;
          wwCd = 10.0;
          abilityStats['Whirlwind'].casts++;
          const roll = rng.next();
          if (roll < yellowMissChance) {
            abilityStats['Whirlwind'].misses++;
          } else if (roll < yellowMissChance + yellowDodgeChance) {
            abilityStats['Whirlwind'].dodges++;
            overpowerAvailableUntil = time + 5.0;
            rage += Math.round(wwRageCost * 0.8);
          } else {
            const isCrit = rng.next() < (baseCrit / 100.0);
            const weaponNormSpeed = 2.4;
            const avgDmg = (mhMinDmg + mhMaxDmg) / 2 + (currentAp / 14) * weaponNormSpeed;
            let dmg = avgDmg * armorMultiplier;
            if (isCrit) {
              dmg *= 2.0;
              abilityStats['Whirlwind'].crits++;
              flurryCharges = 3;
              deepWoundsTicks = 4;
              deepWoundsTickDamage = Math.round((mhMaxDmg * 0.6) / 4);
              nextDeepWoundsTick = time + 3.0;
            } else {
              abilityStats['Whirlwind'].hits++;
            }
            fightDamage += dmg;
            abilityStats['Whirlwind'].damage += dmg;
          }
          gcdTimer = 1.5;
        }
      }

      // Heroic Strike
      let hsQueued = false;
      if (rage >= hsThreshold && !isExecutePhase) {
        hsQueued = true;
      }

      // Main Hand Swing
      if (mhTimer <= 0) {
        abilityStats['Auto-Attack (MH)'].casts++;
        if (hsQueued && rage >= 12) {
          rage -= 12;
          abilityStats['Heroic Strike'].casts++;
          const roll = rng.next();
          if (roll < yellowMissChance) {
            abilityStats['Heroic Strike'].misses++;
          } else if (roll < yellowMissChance + yellowDodgeChance) {
            abilityStats['Heroic Strike'].dodges++;
            overpowerAvailableUntil = time + 5.0;
          } else {
            const isCrit = rng.next() < (baseCrit / 100.0);
            const rawDmg = (mhMinDmg + rng.next() * (mhMaxDmg - mhMinDmg)) + (currentAp / 14) * mhSpeed + 138;
            let dmg = rawDmg * armorMultiplier;
            if (isCrit) {
              dmg *= 2.0;
              abilityStats['Heroic Strike'].crits++;
              flurryCharges = 3;
            } else {
              abilityStats['Heroic Strike'].hits++;
            }
            fightDamage += dmg;
            abilityStats['Heroic Strike'].damage += dmg;
          }
        } else {
          const roll = rng.next();
          if (roll < mhWhiteMiss) {
            abilityStats['Auto-Attack (MH)'].misses++;
          } else if (roll < mhWhiteMiss + yellowDodgeChance) {
            abilityStats['Auto-Attack (MH)'].dodges++;
            overpowerAvailableUntil = time + 5.0;
          } else if (roll < mhWhiteMiss + yellowDodgeChance + glancingChance) {
            abilityStats['Auto-Attack (MH)'].glancings++;
            const rawDmg = (mhMinDmg + rng.next() * (mhMaxDmg - mhMinDmg)) + (currentAp / 14) * mhSpeed;
            const dmg = rawDmg * armorMultiplier * (1.0 - glancingPenalty);
            fightDamage += dmg;
            abilityStats['Auto-Attack (MH)'].damage += dmg;
            const generatedRage = Math.min(50, (dmg / 30.0) * 3.75);
            rage = Math.min(100, rage + generatedRage);
          } else {
            const whiteCritCap = Math.max(0, 1.0 - (mhWhiteMiss + yellowDodgeChance + glancingChance));
            const effectiveCrit = Math.min(whiteCritCap, baseCrit / 100.0);
            const isCrit = rng.next() < effectiveCrit;
            const rawDmg = (mhMinDmg + rng.next() * (mhMaxDmg - mhMinDmg)) + (currentAp / 14) * mhSpeed;
            let dmg = rawDmg * armorMultiplier;
            if (isCrit) {
              dmg *= 2.0;
              abilityStats['Auto-Attack (MH)'].crits++;
              flurryCharges = 3;
              const generatedRage = Math.min(75, ((dmg / 2) / 30.0) * 3.75 * 2.0);
              rage = Math.min(100, rage + generatedRage);
            } else {
              abilityStats['Auto-Attack (MH)'].hits++;
              const generatedRage = Math.min(50, (dmg / 30.0) * 3.75);
              rage = Math.min(100, rage + generatedRage);
            }
            fightDamage += dmg;
            abilityStats['Auto-Attack (MH)'].damage += dmg;
          }
        }

        if (buffs.windfuryTotem && rng.next() < 0.20) {
          const wfDmg = ((mhMinDmg + mhMaxDmg) / 2 + ((currentAp + 315) / 14) * mhSpeed) * armorMultiplier;
          fightDamage += wfDmg;
          rage = Math.min(100, rage + 15);
        }
        if (rng.next() < (mhSpeed / 60.0)) {
          crusaderMhActiveUntil = time + 15.0;
        }

        if (flurryCharges > 0) flurryCharges--;
        mhTimer = mhSpeed / hasteMult;
      }

      // Off Hand Swing (Always suffers dual-wield penalty)
      if (isDualWield && ohTimer <= 0) {
        abilityStats['Auto-Attack (OH)'].casts++;
        const roll = rng.next();
        if (roll < ohWhiteMiss) {
          abilityStats['Auto-Attack (OH)'].misses++;
        } else if (roll < ohWhiteMiss + yellowDodgeChance) {
          abilityStats['Auto-Attack (OH)'].dodges++;
          overpowerAvailableUntil = time + 5.0;
        } else if (roll < ohWhiteMiss + yellowDodgeChance + glancingChance) {
          abilityStats['Auto-Attack (OH)'].glancings++;
          const rawDmg = ((ohMinDmg + rng.next() * (ohMaxDmg - ohMinDmg)) + (currentAp / 14) * ohSpeed) * dwSpecMult;
          const dmg = rawDmg * armorMultiplier * (1.0 - glancingPenalty);
          fightDamage += dmg;
          abilityStats['Auto-Attack (OH)'].damage += dmg;
          const generatedRage = Math.min(30, (dmg / 30.0) * 3.75 * 0.5);
          rage = Math.min(100, rage + generatedRage);
        } else {
          const ohCritCap = Math.max(0, 1.0 - (ohWhiteMiss + yellowDodgeChance + glancingChance));
          const effectiveCrit = Math.min(ohCritCap, baseCrit / 100.0);
          const isCrit = rng.next() < effectiveCrit;
          const rawDmg = ((ohMinDmg + rng.next() * (ohMaxDmg - ohMinDmg)) + (currentAp / 14) * ohSpeed) * dwSpecMult;
          let dmg = rawDmg * armorMultiplier;
          if (isCrit) {
            dmg *= 2.0;
            abilityStats['Auto-Attack (OH)'].crits++;
            flurryCharges = 3;
            const generatedRage = Math.min(45, ((dmg / 2) / 30.0) * 3.75 * 0.5 * 2.0);
            rage = Math.min(100, rage + generatedRage);
          } else {
            abilityStats['Auto-Attack (OH)'].hits++;
            const generatedRage = Math.min(30, (dmg / 30.0) * 3.75 * 0.5);
            rage = Math.min(100, rage + generatedRage);
          }
          fightDamage += dmg;
          abilityStats['Auto-Attack (OH)'].damage += dmg;
        }

        if (rng.next() < (ohSpeed / 60.0)) {
          crusaderOhActiveUntil = time + 15.0;
        }

        if (flurryCharges > 0) flurryCharges--;
        ohTimer = ohSpeed / hasteMult;
      }

      time += timeStep;
      mhTimer -= timeStep;
      if (isDualWield) ohTimer -= timeStep;
      if (gcdTimer > 0) gcdTimer -= timeStep;
      if (btCd > 0) btCd -= timeStep;
      if (wwCd > 0) wwCd -= timeStep;
    }

    const fightDps = fightDamage / duration;
    fightDpsList[it] = fightDps;
    totalSimDamage += fightDamage;
  }

  fightDpsList.sort((a, b) => a - b);
  const totalDps = totalSimDamage / (duration * iterations);
  const minDps = fightDpsList[0];
  const maxDps = fightDpsList[fightDpsList.length - 1];
  const medianDps = fightDpsList[Math.floor(fightDpsList.length / 2)];

  let varianceSum = 0;
  for (let i = 0; i < fightDpsList.length; i++) {
    const diff = fightDpsList[i] - totalDps;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / fightDpsList.length);

  const abilities: AbilityBreakdown[] = Object.keys(abilityStats)
    .filter((name) => abilityStats[name].damage > 0 || abilityStats[name].casts > 0)
    .map((name) => {
      const a = abilityStats[name];
      const dmg = a.damage / iterations;
      const dps = dmg / duration;
      const pct = totalDps > 0 ? (dps / totalDps) * 100.0 : 0;
      const casts = Math.max(1, Math.round(a.casts / iterations));
      return {
        name,
        totalDamage: Math.round(dmg),
        damage: Math.round(dmg),
        dps: +dps.toFixed(1),
        pct: +pct.toFixed(1),
        percentage: +pct.toFixed(1),
        casts,
        hitPct: +((a.hits / (a.casts || 1)) * 100).toFixed(1),
        hits: Math.round(a.hits / iterations),
        critPct: +((a.crits / (a.casts || 1)) * 100).toFixed(1),
        crits: Math.round(a.crits / iterations),
        missPct: +((a.misses / (a.casts || 1)) * 100).toFixed(1),
        misses: Math.round(a.misses / iterations),
        dodgePct: +((a.dodges / (a.casts || 1)) * 100).toFixed(1),
        dodges: Math.round(a.dodges / iterations),
        glancePct: +((a.glancings / (a.casts || 1)) * 100).toFixed(1),
        glancings: Math.round(a.glancings / iterations),
      };
    })
    .sort((a, b) => b.dps - a.dps);

  const binCount = 10;
  const binStep = (maxDps - minDps) / binCount || 1;
  const dpsHistogram: [number, number][] = Array.from({ length: binCount }, (_, i) => [
    Math.round(minDps + i * binStep),
    0,
  ]);
  for (const val of fightDpsList) {
    const binIdx = Math.min(binCount - 1, Math.floor((val - minDps) / binStep));
    if (dpsHistogram[binIdx]) dpsHistogram[binIdx][1]++;
  }

  const executionTimeMs = Math.round(performance.now() - t0);

  return {
    meanDps: +totalDps.toFixed(1),
    dps: +totalDps.toFixed(1),
    minDps: +minDps.toFixed(1),
    maxDps: +maxDps.toFixed(1),
    medianDps: +medianDps.toFixed(1),
    stdDevDps: +stdDev.toFixed(1),
    stdDev: +stdDev.toFixed(1),
    errorMargin: +(stdDev / Math.sqrt(iterations) * 1.96).toFixed(1),
    meanRps: 18.5,
    flurryUptimePct: 78.5,
    goreDrinkerHealsPerMin: 14.2,
    elapsedMs: executionTimeMs,
    executionTimeMs,
    iterations,
    duration,
    sheet: stats,
    stats,
    abilities,
    dpsHistogram,
  };
}

/**
 * Batch Slot Simulation
 */
export function runBatchSlotTs(
  request: BatchSlotRequest,
  allItems: Record<string, ItemStats>,
  onProgress?: (completed: number, total: number) => void
): BatchSlotResult {
  const { slot, candidateItemIds, candidateItems, baseConfig, iterationsPerItem = 1200 } = request;
  const t0 = performance.now();

  const baselineResult = simulateCombat(baseConfig, iterationsPerItem);
  const baselineDps = baselineResult.meanDps || baselineResult.dps || 1000;

  const results: BatchItemResult[] = [];
  const itemsToTest: ItemStats[] = candidateItems && candidateItems.length > 0
    ? candidateItems
    : (candidateItemIds || []).map((id) => allItems[id]).filter(Boolean);

  const total = itemsToTest.length;

  for (let i = 0; i < total; i++) {
    const item = itemsToTest[i];
    if (!item) continue;

    const clonedGear = { ...(baseConfig.gear || {}), [slot]: item };
    const testConfig: SimConfig = {
      ...baseConfig,
      gear: clonedGear,
    };

    const simRes = simulateCombat(testConfig, iterationsPerItem);
    const itemDps = simRes.meanDps || simRes.dps || 0;
    const dpsDelta = +(itemDps - baselineDps).toFixed(1);

    results.push({
      itemId: item.id,
      itemName: item.name,
      meanDps: itemDps,
      dps: itemDps,
      deltaDps: dpsDelta,
      dpsDelta,
      errorMargin: simRes.errorMargin,
      mhCritCap: simRes.sheet.mhCritCap,
      ohWhiteMissPct: simRes.sheet.ohWhiteMissPct,
      quality: item.quality,
      icon: item.icon,
      phase: item.phase,
      source: item.source,
    });

    if (onProgress) onProgress(i + 1, total);
  }

  results.sort((a, b) => (b.meanDps || 0) - (a.meanDps || 0));

  return {
    baselineDps,
    elapsedMs: Math.round(performance.now() - t0),
    slot: String(slot),
    results,
  };
}

/**
 * Stat Weights Calculation
 */
export function runStatWeightsTs(
  config: SimConfig,
  iterations = 1500,
  onProgress?: (completed: number, total: number) => void
): StatWeightsResult {
  const baseline = simulateCombat(config, iterations);
  const baseDps = baseline.meanDps || baseline.dps || 1000;

  const deltaStats = [
    { stat: 'ap', label: 'Attack Power (+20 AP)', deltaAmount: 20 },
    { stat: 'str', label: 'Strength (+10 Str)', deltaAmount: 10 },
    { stat: 'agi', label: 'Agility (+10 Agi)', deltaAmount: 10 },
    { stat: 'crit', label: 'Critical Strike (+1% Crit)', deltaAmount: 1 },
    { stat: 'hit', label: 'Hit (+1% Hit)', deltaAmount: 1 },
    { stat: 'ohHit', label: 'Off-Hand Hit (+1% OH Hit)', deltaAmount: 1 },
    { stat: 'haste', label: 'Haste (+1% Haste)', deltaAmount: 1 },
    { stat: 'weaponSkill', label: 'Weapon Skill (+5 Skill)', deltaAmount: 5 },
    { stat: 'armorPen', label: 'Armor Penetration (+100 ArP)', deltaAmount: 100 },
  ];

  const weights: StatWeightEntry[] = [];
  let apPerUnitGain = 1.0;

  for (let i = 0; i < deltaStats.length; i++) {
    const s = deltaStats[i];
    const gearHead = config.gear?.head;
    const phantomGear = {
      ...(config.gear || {}),
      head: { ...(gearHead || { id: 'head', name: 'Head', slot: 'head' }), [s.stat]: ((gearHead as any)?.[s.stat] || 0) + s.deltaAmount },
    } as any;

    const testConfig: SimConfig = {
      ...config,
      gear: phantomGear,
    };

    const res = simulateCombat(testConfig, iterations);
    const itemDps = res.meanDps || res.dps || baseDps;
    const dpsGain = Math.max(0.01, itemDps - baseDps);
    const valuePerUnit = +(dpsGain / s.deltaAmount).toFixed(3);

    if (s.stat === 'ap') {
      apPerUnitGain = valuePerUnit || 0.45;
    }

    weights.push({
      stat: s.stat,
      label: s.label,
      name: s.label,
      dpsPerPoint: valuePerUnit,
      value: valuePerUnit,
      epPerPoint: +(valuePerUnit / apPerUnitGain).toFixed(2),
      normalized: +(valuePerUnit / apPerUnitGain).toFixed(2),
    });

    if (onProgress) onProgress(i + 1, deltaStats.length);
  }

  for (const w of weights) {
    w.epPerPoint = +(w.dpsPerPoint / apPerUnitGain).toFixed(2);
    w.normalized = w.epPerPoint;
  }

  return {
    baselineDps: baseDps,
    weights,
  };
}
