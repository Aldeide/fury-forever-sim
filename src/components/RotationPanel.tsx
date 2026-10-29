import React, { useState, useMemo } from 'react';
import {
  RotationConfig,
  SimConfig,
  CharacterSheetSummary,
  Race,
  TalentConfig,
} from '../types/sim';
import { runSimulation } from '../workers/simRunner';
import {
  Sliders,
  Flame,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Award,
  Layers,
  BarChart,
  HelpCircle,
  Check,
} from 'lucide-react';

interface RotationPanelProps {
  rotation: RotationConfig;
  onChange: (rotation: RotationConfig) => void;
  characterSheet?: CharacterSheetSummary;
  simConfig?: SimConfig;
  race?: Race;
  talents?: TalentConfig;
}

interface SpellEfficiencyRow {
  rank: number;
  ability: string;
  nominalRage: number;
  effectiveRage: number;
  execTimeSec: number;
  isOffGcd: boolean;
  baselineDmg: number;
  activeDmg: number;
  dpr: number;
  dpet: number;
  priorityRole: string;
}

interface PriorityProfile {
  id: string;
  name: string;
  description: string;
  config: Partial<RotationConfig>;
  simDps?: number;
  dpsDelta?: number;
}

export const RotationPanel: React.FC<RotationPanelProps> = ({
  rotation,
  onChange,
  characterSheet,
  simConfig,
  race = 'orc',
  talents = {},
}) => {
  // =========================================================================
  // SECTION A: Dynamic Combat State / Procs Inspector State ("What-If")
  // =========================================================================
  const [procs, setProcs] = useState({
    crusaderMh: false,
    crusaderOh: false,
    deathWish: false,
    enrage: false,
    recklessness: false,
    racialCooldown: false,
    trinketProc: false,
    mightyRage: false,
    flurry: true,
    executePhase: false,
  });

  const toggleProc = (key: keyof typeof procs) => {
    setProcs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // =========================================================================
  // Baseline & Active State AP / Multipliers Computation
  // =========================================================================
  const baselineAp = characterSheet?.totalAp || characterSheet?.ap || 1650;
  const mhWeaponDps = characterSheet?.mhDps || 48.5;
  const mhSpeed = characterSheet?.mhSpeed || 2.6;
  const mhAvgWeaponDmg = mhWeaponDps * mhSpeed;

  // Active state AP calculations
  let addedAp = 0;
  if (procs.crusaderMh) addedAp += 200; // 100 Str = 200 AP
  if (procs.crusaderOh) addedAp += 200;
  if (procs.mightyRage) addedAp += 120; // 60 Str = 120 AP
  if (procs.trinketProc) addedAp += 280; // Earthstrike / Badge / Diamond Flask proc

  // Racial cooldown AP
  const normalizedRace = String(race).toLowerCase();
  const isOrc = normalizedRace.includes('orc');
  const isNightElf = normalizedRace.includes('night');
  const isTroll = normalizedRace.includes('troll');
  const isGnome = normalizedRace.includes('gnome');

  let racialApPercent = 0;
  let racialCritBonus = 0;
  if (procs.racialCooldown) {
    if (isOrc) racialApPercent = 0.10; // Blood Fury +10% Base AP
    if (isNightElf) racialCritBonus = 10.0; // Elune's Light +10% Crit
  }

  const activeAp = Math.round((baselineAp + addedAp) * (1 + racialApPercent));
  const apDelta = activeAp - baselineAp;
  const apDeltaPct = ((activeAp - baselineAp) / baselineAp) * 100;

  // Damage multipliers
  let dmgMultiplier = 1.0;
  if (procs.deathWish) dmgMultiplier *= 1.20;
  if (procs.enrage) dmgMultiplier *= 1.25;
  if (procs.racialCooldown && isGnome) dmgMultiplier *= 1.10; // Eureka!

  // Imp Execute talent
  const impExecuteRank = talents.improvedExecute !== undefined ? talents.improvedExecute : 2;
  const executeBaseCost = impExecuteRank === 2 ? 10 : impExecuteRank === 1 ? 12 : 15;
  const extraRageAt30 = 30 - executeBaseCost; // 20 rage at 2/2

  // Breakpoint: Bloodthirst(30) = 0.45 * AP. Execute(30) = 600 + (extraRage * 15)
  // Execute(30) = 600 + (20 * 15) = 900 dmg.
  // 900 / 0.45 = 2,000 AP (or 1,833 AP if 0/2 Imp Execute)
  const executeDmgAt30 = 600 + extraRageAt30 * 15;
  const apBreakpoint = Math.round(executeDmgAt30 / 0.45);

  const baselineBtDmg = Math.round(baselineAp * 0.45);
  const activeBtDmg = Math.round(activeAp * 0.45 * dmgMultiplier);
  const baselineExec30Dmg = Math.round(executeDmgAt30);
  const activeExec30Dmg = Math.round(executeDmgAt30 * dmgMultiplier);

  // Verdict flags
  const isBtOverExecuteBaseline = baselineAp >= apBreakpoint;
  const isBtOverExecuteActive = activeAp >= apBreakpoint;

  // =========================================================================
  // SECTION C: Spell Efficiency Data Table (DPR / DPET)
  // =========================================================================
  const spellEfficiencyRows: SpellEfficiencyRow[] = useMemo(() => {
    // 1. Bloodthirst
    const btBaseDmg = baselineAp * 0.45;
    const btActDmg = activeAp * 0.45 * dmgMultiplier;
    const btDpr = btActDmg / 30;
    const btDpet = btActDmg / 1.5;

    // 2. Whirlwind (MH weapon damage + AP normalized contribution * 4 hits on single target)
    // Classic WW: normalized weapon damage + bonus AP
    const wwBaseDmg = (mhAvgWeaponDmg + (baselineAp / 14) * 2.4);
    const wwActDmg = (mhAvgWeaponDmg + (activeAp / 14) * 2.4) * dmgMultiplier;
    const wwCost = (talents.ragingBlows || 0) >= 2 ? 22 : 25;
    const wwDpr = wwActDmg / wwCost;
    const wwDpet = wwActDmg / 1.5;

    // 3. Execute (Min 10-15 Rage base)
    const exMinBaseDmg = 600;
    const exMinActDmg = 600 * dmgMultiplier;
    const exMinCost = executeBaseCost;
    const exMinDpr = exMinActDmg / exMinCost;
    const exMinDpet = exMinActDmg / 1.5;

    // 4. Execute (30 Rage — direct BT comparison)
    const ex30BaseDmg = executeDmgAt30;
    const ex30ActDmg = executeDmgAt30 * dmgMultiplier;
    const ex30Dpr = ex30ActDmg / 30;
    const ex30Dpet = ex30ActDmg / 1.5;

    // 5. Execute (+1 Marginal Rage Overflow)
    const exMarginalDmg = 15 * dmgMultiplier;
    const exMarginalDpr = 15 * dmgMultiplier; // 15 dmg / 1 rage

    // 6. Overpower (Battle Stance)
    const opBaseDmg = (mhAvgWeaponDmg + (baselineAp / 14) * 2.4 + 35) * 1.35; // +50% crit bonus factored
    const opActDmg = (mhAvgWeaponDmg + (activeAp / 14) * 2.4 + 35) * 1.35 * dmgMultiplier;
    const opDpr = opActDmg / 5;
    const opDpet = opActDmg / 1.5;

    // 7. Heroic Strike (Off-GCD, replaces white swing, converts to yellow, removes glance)
    // Effective rage = nominal 12 (with 3/3 Imp HS) + ~18 lost white rage = ~30 rage
    const hsNominalCost = (talents.improvedHeroicStrike || 0) === 3 ? 12 : (talents.improvedHeroicStrike || 0) === 2 ? 13 : (talents.improvedHeroicStrike || 0) === 1 ? 14 : 15;
    const hsWhiteRageLost = 18;
    const hsEffectiveCost = hsNominalCost + hsWhiteRageLost;
    const hsBaseDmg = (mhAvgWeaponDmg + (baselineAp / 14) * mhSpeed + 138);
    const hsActDmg = (mhAvgWeaponDmg + (activeAp / 14) * mhSpeed + 138) * dmgMultiplier;
    const hsDpr = hsActDmg / hsEffectiveCost;
    const hsDpet = hsActDmg; // Instant off-GCD!

    // 8. Cleave (Off-GCD)
    const cleaveNominalCost = 20;
    const cleaveEffectiveCost = cleaveNominalCost + hsWhiteRageLost;
    const cleaveBaseDmg = (mhAvgWeaponDmg + (baselineAp / 14) * mhSpeed + 50);
    const cleaveActDmg = (mhAvgWeaponDmg + (activeAp / 14) * mhSpeed + 50) * dmgMultiplier;
    const cleaveDpr = cleaveActDmg / cleaveEffectiveCost;
    const cleaveDpet = cleaveActDmg;

    // 9. Hamstring (Fishing GCD)
    const hamBaseDmg = 45;
    const hamActDmg = 45 * dmgMultiplier;
    const hamDpr = hamActDmg / 10;
    const hamDpet = hamActDmg / 1.5;

    const rawRows: Omit<SpellEfficiencyRow, 'rank'>[] = [
      {
        ability: 'Bloodthirst',
        nominalRage: 30,
        effectiveRage: 30,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(btBaseDmg),
        activeDmg: Math.round(btActDmg),
        dpr: +(btDpr.toFixed(1)),
        dpet: Math.round(btDpet),
        priorityRole: isBtOverExecuteActive ? '#1 in Execute & Normal (AP >= Breakpoint)' : '#1 Normal Phase GCD; Secondary in Execute',
      },
      {
        ability: 'Execute (Min 10-15 Rage)',
        nominalRage: exMinCost,
        effectiveRage: exMinCost,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(exMinBaseDmg),
        activeDmg: Math.round(exMinActDmg),
        dpr: +(exMinDpr.toFixed(1)),
        dpet: Math.round(exMinDpet),
        priorityRole: 'Highest DPR spell in execute when low rage (<30)',
      },
      {
        ability: 'Execute (30 Rage — vs BT)',
        nominalRage: 30,
        effectiveRage: 30,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(ex30BaseDmg),
        activeDmg: Math.round(ex30ActDmg),
        dpr: +(ex30Dpr.toFixed(1)),
        dpet: Math.round(ex30Dpet),
        priorityRole: isBtOverExecuteActive ? 'Execute yields to BT at 30+ Rage during procs' : 'Dominates BT below 2,000 AP at 30 Rage',
      },
      {
        ability: 'Execute (Marginal +1 Overflow)',
        nominalRage: 1,
        effectiveRage: 1,
        execTimeSec: 0,
        isOffGcd: true,
        baselineDmg: 15,
        activeDmg: Math.round(exMarginalDmg),
        dpr: +(exMarginalDpr.toFixed(1)),
        dpet: Math.round(exMarginalDmg * 10),
        priorityRole: 'Fixed 15 dmg/rage (inferior to BT pooling >= 45 rage)',
      },
      {
        ability: 'Whirlwind',
        nominalRage: wwCost,
        effectiveRage: wwCost,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(wwBaseDmg),
        activeDmg: Math.round(wwActDmg),
        dpr: +(wwDpr.toFixed(1)),
        dpet: Math.round(wwDpet),
        priorityRole: '#2 GCD Ability; fill between Bloodthirst cooldowns',
      },
      {
        ability: 'Overpower (Battle Stance)',
        nominalRage: 5,
        effectiveRage: 5,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(opBaseDmg),
        activeDmg: Math.round(opActDmg),
        dpr: +(opDpr.toFixed(1)),
        dpet: Math.round(opDpet),
        priorityRole: 'Ultra-high DPR on Dodge when Rage <= 35',
      },
      {
        ability: 'Heroic Strike (Effective Cost)',
        nominalRage: hsNominalCost,
        effectiveRage: hsEffectiveCost,
        execTimeSec: 0,
        isOffGcd: true,
        baselineDmg: Math.round(hsBaseDmg),
        activeDmg: Math.round(hsActDmg),
        dpr: +(hsDpr.toFixed(1)),
        dpet: Math.round(hsDpet),
        priorityRole: 'Off-GCD rage dump & anti-glance aura for OH hit',
      },
      {
        ability: 'Cleave (Effective Cost)',
        nominalRage: cleaveNominalCost,
        effectiveRage: cleaveEffectiveCost,
        execTimeSec: 0,
        isOffGcd: true,
        baselineDmg: Math.round(cleaveBaseDmg),
        activeDmg: Math.round(cleaveActDmg),
        dpr: +(cleaveDpr.toFixed(1)),
        dpet: Math.round(cleaveDpet),
        priorityRole: 'Multi-target off-GCD replacement for HS',
      },
      {
        ability: 'Hamstring',
        nominalRage: 10,
        effectiveRage: 10,
        execTimeSec: 1.5,
        isOffGcd: false,
        baselineDmg: Math.round(hamBaseDmg),
        activeDmg: Math.round(hamActDmg),
        dpr: +(hamDpr.toFixed(1)),
        dpet: Math.round(hamDpet),
        priorityRole: 'Fish for Windfury / HoJ / Flurry when pooled >= 65 rage',
      },
    ];

    // Sort descending by DPR
    return rawRows
      .sort((a, b) => b.dpr - a.dpr)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [baselineAp, activeAp, dmgMultiplier, mhAvgWeaponDmg, mhSpeed, talents, executeBaseCost, executeDmgAt30, isBtOverExecuteActive]);

  // Max DPR for relative progress bar
  const maxDpr = Math.max(...spellEfficiencyRows.map((r) => r.dpr), 1);

  // =========================================================================
  // SECTION D: Batch Sim Priority Profiles Runner
  // =========================================================================
  const defaultProfiles: PriorityProfile[] = [
    {
      id: 'pure_execute',
      name: 'Pure Execute (<20% No BT)',
      description: 'Strict Execute-only in burn phase. Never cast Bloodthirst below 20% boss HP.',
      config: {
        executePhase: true,
        executeBtApThreshold: 99999,
        overpowerRageThreshold: 0,
        heroicStrikeRageThreshold: 45,
      },
    },
    {
      id: 'bt_execute_2000',
      name: 'BT in Execute (AP >= 2,000)',
      description: 'Mathematical optimum: cast Bloodthirst in execute whenever AP >= 2,000 threshold.',
      config: {
        executePhase: true,
        executeBtApThreshold: 2000,
        overpowerRageThreshold: 35,
        heroicStrikeRageThreshold: 45,
      },
    },
    {
      id: 'bt_execute_procs_1750',
      name: 'BT in Execute During Procs (AP >= 1,750)',
      description: 'Cast BT whenever Crusader or Death Wish is active during Execute.',
      config: {
        executePhase: true,
        executeBtApThreshold: 1750,
        overpowerRageThreshold: 35,
        heroicStrikeRageThreshold: 40,
      },
    },
    {
      id: 'bt_always_execute',
      name: 'BT Always on Cooldown (<20% Boss HP)',
      description: 'Never stall Bloodthirst GCD; Execute only when BT is on cooldown.',
      config: {
        executePhase: true,
        executeBtApThreshold: 0,
        overpowerRageThreshold: 35,
        heroicStrikeRageThreshold: 45,
      },
    },
    {
      id: 'op_stance_dancing',
      name: 'Overpower Stance-Dancing (<35 Rage)',
      description: 'Swap to Battle Stance for 5-Rage Overpower (+50% Crit) whenever target dodges.',
      config: {
        useOverpower: true,
        overpowerRageThreshold: 35,
        overpowerMaxRage: 35,
        heroicStrikeRageThreshold: 45,
      },
    },
    {
      id: 'aggressive_hs',
      name: 'Aggressive HS Queuing (>=35 Rage)',
      description: 'Heavy HS queuing to maintain dual-wield anti-queue hit table for off-hand.',
      config: {
        heroicStrikeRageThreshold: 35,
        hsRageThreshold: 35,
        overpowerRageThreshold: 35,
      },
    },
    {
      id: 'conservative_hs',
      name: 'Conservative HS Queuing (>=55 Rage)',
      description: 'Strict rage preservation: never risk delaying Bloodthirst or Whirlwind.',
      config: {
        heroicStrikeRageThreshold: 55,
        hsRageThreshold: 55,
        overpowerRageThreshold: 35,
      },
    },
    {
      id: 'hamstring_fishing',
      name: 'Hamstring Fishing (>=65 Rage)',
      description: 'Dump excess rage into Hamstring to fish for extra Windfury & HoJ procs.',
      config: {
        useHamstring: true,
        hamstringSpamRageThreshold: 65,
        hamstringRageThreshold: 65,
        heroicStrikeRageThreshold: 45,
      },
    },
  ];

  const [profiles, setProfiles] = useState<PriorityProfile[]>(defaultProfiles);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const handleRunBatchProfiles = async () => {
    if (!simConfig) {
      alert('Simulation configuration is not ready. Please check gear setup.');
      return;
    }

    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: defaultProfiles.length });

    try {
      // First get current baseline DPS
      const baseResult = await runSimulation(simConfig, 1200);
      const baselineSimDps = baseResult.meanDps || baseResult.dps || 1000;

      const updated: PriorityProfile[] = [];

      for (let i = 0; i < defaultProfiles.length; i++) {
        const p = defaultProfiles[i];
        setBatchProgress({ current: i + 1, total: defaultProfiles.length });

        const testConfig: SimConfig = {
          ...simConfig,
          rotation: {
            ...simConfig.rotation,
            ...p.config,
          },
          iterations: 1500,
        };

        const res = await runSimulation(testConfig, 1500);
        const dps = res.meanDps || res.dps || 0;
        const delta = dps - baselineSimDps;

        updated.push({
          ...p,
          simDps: +dps.toFixed(1),
          dpsDelta: +delta.toFixed(1),
        });
      }

      // Sort profiles descending by simDps
      updated.sort((a, b) => (b.simDps || 0) - (a.simDps || 0));
      setProfiles(updated);
    } catch (err) {
      console.error('Batch priority sim failed:', err);
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  const handleApplyProfile = (profile: PriorityProfile) => {
    onChange({
      ...rotation,
      ...profile.config,
    });
  };

  // Helper for Section E slider changes
  const updateField = <K extends keyof RotationConfig>(key: K, value: RotationConfig[K]) => {
    onChange({
      ...rotation,
      [key]: value,
    });
  };

  return (
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col h-full space-y-4 overflow-y-auto">
      {/* ===================================================================== */}
      {/* SECTION A: What-If Active Combat State Inspector                      */}
      {/* ===================================================================== */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#44474e]/30 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
                Dynamic Combat State Inspector ("What-If" Procs &amp; Cooldowns)
              </h2>
              <p className="text-[11px] text-[#8e9099]">
                Toggle active combat procs on top of your gear to evaluate real-time ability scaling and priority shifts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-[#8e9099]">Baseline AP: <strong className="text-[#e2e2e9]">{baselineAp}</strong></span>
            <ArrowRight className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="text-[#a8c7fa]">
              Active AP: <strong className="text-[#81c995]">{activeAp}</strong> ({apDelta >= 0 ? `+${apDelta}` : apDelta} &bull; {apDeltaPct >= 0 ? `+${apDeltaPct.toFixed(1)}%` : `${apDeltaPct.toFixed(1)}%`})
            </span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => toggleProc('crusaderMh')}
            className={`m3-chip ${procs.crusaderMh ? 'm3-chip-selected' : ''}`}
          >
            <span>⚔️ Crusader MH (+100 Str / +200 AP)</span>
          </button>

          <button
            onClick={() => toggleProc('crusaderOh')}
            className={`m3-chip ${procs.crusaderOh ? 'm3-chip-selected' : ''}`}
          >
            <span>⚔️ Crusader OH (+100 Str / +200 AP)</span>
          </button>

          <button
            onClick={() => toggleProc('deathWish')}
            className={`m3-chip ${procs.deathWish ? 'm3-chip-selected' : ''}`}
          >
            <span>🔥 Death Wish (+20% Dmg)</span>
          </button>

          <button
            onClick={() => toggleProc('enrage')}
            className={`m3-chip ${procs.enrage ? 'm3-chip-selected' : ''}`}
          >
            <span>🩸 Enrage (+25% Dmg)</span>
          </button>

          <button
            onClick={() => toggleProc('recklessness')}
            className={`m3-chip ${procs.recklessness ? 'm3-chip-selected' : ''}`}
          >
            <span>⚡ Recklessness (+100% Crit)</span>
          </button>

          <button
            onClick={() => toggleProc('racialCooldown')}
            className={`m3-chip ${procs.racialCooldown ? 'm3-chip-selected' : ''}`}
          >
            <span>
              🛡️ Racial Cooldown ({isOrc ? 'Blood Fury +10% AP' : isNightElf ? "Elune's Light +10% Crit" : isTroll ? 'Berserking +10% Haste' : isGnome ? 'Eureka! +10% Dmg' : 'Active'})
            </span>
          </button>

          <button
            onClick={() => toggleProc('trinketProc')}
            className={`m3-chip ${procs.trinketProc ? 'm3-chip-selected' : ''}`}
          >
            <span>💎 Trinket Proc (+280 AP)</span>
          </button>

          <button
            onClick={() => toggleProc('mightyRage')}
            className={`m3-chip ${procs.mightyRage ? 'm3-chip-selected' : ''}`}
          >
            <span>🧪 Mighty Rage Potion (+120 AP)</span>
          </button>

          <button
            onClick={() => toggleProc('flurry')}
            className={`m3-chip ${procs.flurry ? 'm3-chip-selected' : ''}`}
          >
            <span>💨 Flurry (+Attack Speed)</span>
          </button>

          <button
            onClick={() => toggleProc('executePhase')}
            className={`m3-chip ${procs.executePhase ? 'bg-[#8c1d18] border-[#f28b82]/60 text-[#fce8e6]' : ''}`}
          >
            <span>💀 Execute Phase (&lt; 20% Boss HP)</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION B: Bloodthirst vs. Execute Breakpoint & Advisor Card         */}
      {/* ===================================================================== */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#44474e]/30 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
              Bloodthirst vs. Execute (30 Rage) Breakpoint Advisor
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/30">
            AP Threshold: {apBreakpoint} AP
          </span>
        </div>

        {/* Comparison Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Baseline AP Card */}
          <div className="bg-[#111318] p-3.5 rounded-xl border border-[#44474e]/30 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8e9099]">
              1. Baseline Gear AP
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-[#a8c7fa]">{baselineAp}</span>
              <span className="text-xs text-[#8e9099] font-mono">AP</span>
            </div>
            <div className="text-xs font-sans text-[#c4c6d0]">
              BT (30r): <strong className="text-[#e2e2e9] font-mono">{baselineBtDmg}</strong> vs Ex (30r): <strong className="text-[#e2e2e9] font-mono">{baselineExec30Dmg}</strong>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isBtOverExecuteBaseline
                  ? 'bg-[#0f5223] text-[#81c995] border border-[#81c995]/40'
                  : 'bg-[#3e4759] text-[#dae2f9] border border-[#44474e]/40'
              }`}>
                {isBtOverExecuteBaseline ? 'Verdict: Bloodthirst > Execute' : 'Verdict: Execute > Bloodthirst'}
              </span>
            </div>
          </div>

          {/* Active Procs AP Card */}
          <div className="bg-[#111318] p-3.5 rounded-xl border border-[#44474e]/30 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8e9099]">
              2. During Active Procs
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-[#81c995]">{activeAp}</span>
              <span className="text-xs text-[#81c995] font-mono">
                ({apDelta >= 0 ? `+${apDelta}` : apDelta} AP)
              </span>
            </div>
            <div className="text-xs font-sans text-[#c4c6d0]">
              BT (30r): <strong className="text-[#81c995] font-mono">{activeBtDmg}</strong> vs Ex (30r): <strong className="text-[#e2e2e9] font-mono">{activeExec30Dmg}</strong>
            </div>
            <div className="pt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isBtOverExecuteActive
                  ? 'bg-[#0f5223] text-[#81c995] border border-[#81c995]/40'
                  : 'bg-[#8c1d18] text-[#f28b82] border border-[#f28b82]/40'
              }`}>
                {isBtOverExecuteActive ? 'Verdict: Bloodthirst Overtakes Execute!' : 'Verdict: Execute Still Wins'}
              </span>
            </div>
          </div>

          {/* High Rage Pooling Rule Card */}
          <div className="bg-[#111318] p-3.5 rounded-xl border border-[#44474e]/30 space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#a8c7fa]">
              3. High Rage Rule (&ge; 45 Rage)
            </div>
            <div className="text-xs font-sans text-[#c4c6d0] leading-relaxed">
              Extra rage beyond 15 in Execute only converts at a flat <strong className="text-[#f28b82]">15 dmg/rage</strong>. Bloodthirst converts at <strong className="text-[#81c995]">{(activeAp * 0.015).toFixed(1)} dmg/rage</strong>!
            </div>
            <div className="pt-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40">
                Rule: BT First if Rage &ge; 45
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar to AP Breakpoint */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-[#8e9099]">
            <span>Current Active AP: <strong className="text-[#81c995]">{activeAp}</strong></span>
            <span>Breakpoint Threshold: <strong className="text-[#a8c7fa]">{apBreakpoint} AP</strong> (2/2 Imp Execute)</span>
          </div>
          <div className="w-full bg-[#111318] h-2.5 rounded-full overflow-hidden border border-[#44474e]/30 flex">
            <div
              className={`h-full transition-all duration-300 ${activeAp >= apBreakpoint ? 'bg-[#81c995]' : 'bg-[#a8c7fa]'}`}
              style={{ width: `${Math.min(100, (activeAp / (apBreakpoint * 1.3)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION C: Spell Efficiency Data Table (DPR / DPET)                   */}
      {/* ===================================================================== */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#44474e]/30 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
              <BarChart className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
              Warrior Spell Efficiency Ranking (DPR &amp; DPET)
            </h3>
          </div>
          <span className="text-[11px] text-[#8e9099] font-mono">
            Sorted by DPR (Damage Per Rage)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#44474e]/40 text-[#8e9099] text-[10px] uppercase tracking-wider">
                <th className="py-2 px-2.5">Rank &amp; Ability</th>
                <th className="py-2 px-2">Rage (Nom/Eff)</th>
                <th className="py-2 px-2">Exec Time</th>
                <th className="py-2 px-2 text-right">Base Avg</th>
                <th className="py-2 px-2 text-right">Active Avg</th>
                <th className="py-2 px-2 text-center">&Delta; Base</th>
                <th className="py-2 px-3 text-right">DPR (Dmg/Rage)</th>
                <th className="py-2 px-2 text-right">DPET</th>
                <th className="py-2 px-3">Priority Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#44474e]/20">
              {spellEfficiencyRows.map((row) => {
                const deltaPct = ((row.activeDmg - row.baselineDmg) / row.baselineDmg) * 100;
                const dprRatio = Math.min(100, Math.round((row.dpr / maxDpr) * 100));

                return (
                  <tr
                    key={row.ability}
                    className="hover:bg-[#282a2f]/40 transition-colors"
                  >
                    <td className="py-2.5 px-2.5 font-sans font-medium text-[#e2e2e9]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#111318] text-[#a8c7fa] border border-[#44474e]/40 text-[10px] font-mono flex items-center justify-center shrink-0">
                          {row.rank}
                        </span>
                        <span>{row.ability}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[#c4c6d0]">
                      {row.nominalRage}r {row.effectiveRage !== row.nominalRage && <span className="text-[10px] text-[#8e9099]">({row.effectiveRage}r eff)</span>}
                    </td>
                    <td className="py-2.5 px-2 text-[#8e9099]">
                      {row.isOffGcd ? <span className="text-[#a8c7fa]">0.0s (Off-GCD)</span> : `${row.execTimeSec.toFixed(2)}s GCD`}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#c4c6d0]">
                      {row.baselineDmg.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#81c995] font-bold">
                      {row.activeDmg.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0f5223] text-[#81c995] border border-[#81c995]/30">
                        +{deltaPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-[#111318] h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-[#a8c7fa] h-full rounded-full"
                            style={{ width: `${dprRatio}%` }}
                          />
                        </div>
                        <span className="font-bold text-[#d6e3ff]">{row.dpr}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#c4c6d0]">
                      {row.dpet.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-sans text-[#8e9099]">
                      {row.priorityRole}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION D: Empirical Batch Sim Priority Lists Runner                  */}
      {/* ===================================================================== */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#44474e]/30 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
                Batch Sim All Priority Profiles (Current Gear)
              </h3>
              <p className="text-[11px] text-[#8e9099]">
                Simulate 8 distinct combat priority algorithms using your current gear and talents to determine empirical BiS rotation.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunBatchProfiles}
            disabled={isBatchRunning}
            className={`m3-pill-btn shadow-sm ${
              isBatchRunning
                ? 'bg-[#284777]/50 text-[#8e9099] cursor-not-allowed'
                : 'bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#062e6f] font-bold'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isBatchRunning ? 'animate-spin' : ''}`} />
            <span>
              {isBatchRunning
                ? `Simulating Profile ${batchProgress?.current}/${batchProgress?.total}...`
                : 'Batch Sim All Priority Profiles'}
            </span>
          </button>
        </div>

        {/* Priority Profiles Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {profiles.map((p, idx) => (
            <div
              key={p.id}
              className="bg-[#111318] p-3 rounded-xl border border-[#44474e]/30 flex items-start justify-between gap-3 hover:border-[#a8c7fa]/50 transition-all"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#284777] text-[#d6e3ff]">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#e2e2e9] truncate font-sans">
                    {p.name}
                  </span>
                </div>
                <p className="text-[11px] text-[#8e9099] line-clamp-2 font-sans">
                  {p.description}
                </p>
                {p.simDps !== undefined && (
                  <div className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-[#a8c7fa] font-bold">{p.simDps} DPS</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                        (p.dpsDelta || 0) >= 0
                          ? 'bg-[#0f5223] text-[#81c995]'
                          : 'bg-[#8c1d18] text-[#f28b82]'
                      }`}
                    >
                      {(p.dpsDelta || 0) >= 0 ? `+${p.dpsDelta}` : p.dpsDelta} &Delta; DPS
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleApplyProfile(p)}
                className="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[#284777] hover:bg-[#34588e] text-[#d6e3ff] border border-[#a8c7fa]/40 transition-all flex items-center gap-1 shadow-sm mt-1"
                title="Apply this priority configuration"
              >
                <Check className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION E: Manual Rotation & Threshold Controls                       */}
      {/* ===================================================================== */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 border-b border-[#44474e]/30 pb-2.5">
          <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
            <Sliders className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
            Manual Priority &amp; Threshold Controls
          </h3>
        </div>

        {/* Main Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Execute BT AP Threshold */}
          <div className="bg-[#111318] border border-[#44474e]/30 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa]">
                Execute Phase BT AP Threshold
              </span>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] px-2.5 py-0.5 rounded-full bg-[#284777] border border-[#a8c7fa]/30">
                {rotation.executeBtApThreshold !== undefined ? `${rotation.executeBtApThreshold} AP` : '2000 AP'}
              </span>
            </div>
            <p className="text-[11px] text-[#8e9099]">
              In execute (&lt;20% HP), cast Bloodthirst instead of Execute when Attack Power reaches or exceeds this value.
            </p>
            <input
              type="range"
              min={1400}
              max={2600}
              step={25}
              value={rotation.executeBtApThreshold !== undefined ? rotation.executeBtApThreshold : 2000}
              onChange={(e) => updateField('executeBtApThreshold', Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Heroic Strike Rage Threshold */}
          <div className="bg-[#111318] border border-[#44474e]/30 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa]">
                Heroic Strike Rage Threshold
              </span>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] px-2.5 py-0.5 rounded-full bg-[#284777] border border-[#a8c7fa]/30">
                {rotation.heroicStrikeRageThreshold || rotation.hsRageThreshold || 45} Rage
              </span>
            </div>
            <p className="text-[11px] text-[#8e9099]">
              Queue Heroic Strike only when Rage is at or above this threshold, preserving Rage for Bloodthirst and Whirlwind.
            </p>
            <input
              type="range"
              min={15}
              max={85}
              step={5}
              value={rotation.heroicStrikeRageThreshold || rotation.hsRageThreshold || 45}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateField('heroicStrikeRageThreshold', val);
                updateField('hsRageThreshold', val);
              }}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Overpower Stance-Dance Max Rage */}
          <div className="bg-[#111318] border border-[#44474e]/30 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa]">
                Overpower Stance-Dance Max Rage
              </span>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] px-2.5 py-0.5 rounded-full bg-[#284777] border border-[#a8c7fa]/30">
                {rotation.overpowerRageThreshold || rotation.overpowerMaxRage || 35} Rage
              </span>
            </div>
            <p className="text-[11px] text-[#8e9099]">
              Swap to Battle Stance for Overpower when target dodges, but only if Rage is at or below this cap to avoid losing excess Rage.
            </p>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={rotation.overpowerRageThreshold || rotation.overpowerMaxRage || 35}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateField('overpowerRageThreshold', val);
                updateField('overpowerMaxRage', val);
              }}
              className="w-full cursor-pointer"
            />
          </div>

          {/* Hamstring Rage Threshold */}
          <div className="bg-[#111318] border border-[#44474e]/30 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa]">
                Hamstring Fishing Rage Threshold
              </span>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] px-2.5 py-0.5 rounded-full bg-[#284777] border border-[#a8c7fa]/30">
                {rotation.hamstringSpamRageThreshold || rotation.hamstringRageThreshold || 70} Rage
              </span>
            </div>
            <p className="text-[11px] text-[#8e9099]">
              Dump excess rage with Hamstring to fish for extra Windfury, Flurry, and Hand of Justice procs when bloodthirst &amp; whirlwind are on cooldown.
            </p>
            <input
              type="range"
              min={40}
              max={90}
              step={5}
              value={rotation.hamstringSpamRageThreshold || rotation.hamstringRageThreshold || 70}
              onChange={(e) => {
                const val = Number(e.target.value);
                updateField('hamstringSpamRageThreshold', val);
                updateField('hamstringRageThreshold', val);
              }}
              className="w-full cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles & Cooldowns Section */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#c4c6d0] mb-3 flex items-center space-x-2">
            <Flame className="w-4 h-4 text-[#a8c7fa]" />
            <span>Major Cooldown &amp; Phase Toggles</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Death Wish Toggle */}
            <div
              onClick={() => updateField('useDeathWish', !rotation.useDeathWish)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                rotation.useDeathWish
                  ? 'bg-[#284777]/40 border-[#a8c7fa]/60 text-[#e2e2e9]'
                  : 'bg-[#111318] border-[#44474e]/30 text-[#8e9099]'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#d6e3ff]">Death Wish</div>
                <div className="text-[10px] text-[#8e9099]">+20% Damage for 30s</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  rotation.useDeathWish
                    ? 'bg-[#a8c7fa] border-[#a8c7fa] text-[#062e6f]'
                    : 'border-[#44474e]/60 bg-[#191c20]'
                }`}
              >
                {rotation.useDeathWish && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Recklessness Toggle */}
            <div
              onClick={() => updateField('useRecklessness', !rotation.useRecklessness)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                rotation.useRecklessness
                  ? 'bg-[#284777]/40 border-[#a8c7fa]/60 text-[#e2e2e9]'
                  : 'bg-[#111318] border-[#44474e]/30 text-[#8e9099]'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#d6e3ff]">Recklessness</div>
                <div className="text-[10px] text-[#8e9099]">+100% Crit for 15s</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  rotation.useRecklessness
                    ? 'bg-[#a8c7fa] border-[#a8c7fa] text-[#062e6f]'
                    : 'border-[#44474e]/60 bg-[#191c20]'
                }`}
              >
                {rotation.useRecklessness && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Bloodrage Toggle */}
            <div
              onClick={() => updateField('useBloodrage', !rotation.useBloodrage)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                rotation.useBloodrage
                  ? 'bg-[#284777]/40 border-[#a8c7fa]/60 text-[#e2e2e9]'
                  : 'bg-[#111318] border-[#44474e]/30 text-[#8e9099]'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#d6e3ff]">Bloodrage</div>
                <div className="text-[10px] text-[#8e9099]">Generate rage on pull</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  rotation.useBloodrage
                    ? 'bg-[#a8c7fa] border-[#a8c7fa] text-[#062e6f]'
                    : 'border-[#44474e]/60 bg-[#191c20]'
                }`}
              >
                {rotation.useBloodrage && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Mighty Rage Potion */}
            <div
              onClick={() => updateField('useMightyRagePotion', !rotation.useMightyRagePotion)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                rotation.useMightyRagePotion
                  ? 'bg-[#284777]/40 border-[#a8c7fa]/60 text-[#e2e2e9]'
                  : 'bg-[#111318] border-[#44474e]/30 text-[#8e9099]'
              }`}
            >
              <div>
                <div className="text-xs font-bold text-[#d6e3ff]">Mighty Rage Potion</div>
                <div className="text-[10px] text-[#8e9099]">+60 Rage, +60 Str</div>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                  rotation.useMightyRagePotion
                    ? 'bg-[#a8c7fa] border-[#a8c7fa] text-[#062e6f]'
                    : 'border-[#44474e]/60 bg-[#191c20]'
                }`}
              >
                {rotation.useMightyRagePotion && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Execute Phase Toggle */}
          <div
            onClick={() => updateField('executePhase', !rotation.executePhase)}
            className={`mt-3 p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
              rotation.executePhase
                ? 'bg-[#8c1d18]/30 border-[#f28b82]/50 text-[#e2e2e9]'
                : 'bg-[#111318] border-[#44474e]/30 text-[#8e9099]'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-[#f28b82]">
                Execute Phase Priority (Boss &lt; 20% HP)
              </div>
              <div className="text-[11px] text-[#c4c6d0]">
                When active, Execute algorithm activates during the final 20% of the fight with AP breakpoint switching.
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                rotation.executePhase
                  ? 'bg-[#f28b82] border-[#f28b82] text-[#8c1d18]'
                  : 'border-[#44474e]/60 bg-[#191c20]'
              }`}
            >
              {rotation.executePhase && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
