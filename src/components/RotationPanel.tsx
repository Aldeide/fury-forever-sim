import React, { useState, useMemo } from 'react';
import {
  RotationConfig,
  SimConfig,
  CharacterSheetSummary,
  Race,
  TalentConfig,
} from '../types/sim';
import {
  analyzeSpellPriorities,
  DEFAULT_COMBAT_BUFF_TOGGLES,
  PRIORITY_PRESET_PROFILES,
  CombatBuffToggles,
} from '../utils/spellAnalyzer';
import { runSimulation } from '../workers/simRunner';
import { getAbilityIconUrl } from '../utils/wowhead';

export interface RotationPanelProps {
  rotation: RotationConfig;
  onChange: (rotation: RotationConfig) => void;
  characterSheet?: CharacterSheetSummary;
  simConfig?: SimConfig;
  race?: Race;
  talents?: TalentConfig;
}

interface RankedProfile {
  id: string;
  name: string;
  description: string;
  rotation: RotationConfig;
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
  const updateField = <K extends keyof RotationConfig>(key: K, value: RotationConfig[K]) => {
    onChange({ ...rotation, [key]: value });
  };

  // Dynamic Combat Buff Inspector State ("What-If" Procs & Cooldowns)
  const [combatBuffs, setCombatBuffs] = useState<CombatBuffToggles>(DEFAULT_COMBAT_BUFF_TOGGLES);
  const toggleCombatBuff = (key: keyof CombatBuffToggles) => {
    setCombatBuffs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const normalizedRace = String(race || 'orc').toLowerCase();
  const isOrc = normalizedRace.includes('orc');
  const isTroll = normalizedRace.includes('troll');
  const isNightElf = normalizedRace.includes('night');
  const isGnome = normalizedRace.includes('gnome');
  const racialName = isOrc ? 'Blood Fury' : isTroll ? 'Berserking' : isNightElf ? "Elune's Light" : isGnome ? 'Eureka!' : 'Racial Cooldown';

  const PROCS_CONFIG: { key: keyof CombatBuffToggles; label: string; ability: string }[] = [
    { key: 'crusaderMh', label: 'Crusader MH', ability: 'Crusader (MH)' },
    { key: 'crusaderOh', label: 'Crusader OH', ability: 'Crusader (OH)' },
    { key: 'deathWish', label: 'Death Wish', ability: 'Death Wish' },
    { key: 'enrage', label: 'Enrage', ability: 'Enrage' },
    { key: 'recklessness', label: 'Recklessness', ability: 'Recklessness' },
    { key: 'racialActive', label: 'Racial Cooldown', ability: racialName },
    { key: 'trinketProc', label: 'Trinket Proc', ability: 'Earthstrike' },
    { key: 'mightyRagePot', label: 'Mighty Rage Pot', ability: 'Mighty Rage Potion' },
    { key: 'flurry', label: 'Flurry', ability: 'Flurry' },
    { key: 'executePhase', label: 'Execute Phase', ability: 'Execute' },
  ];

  const effectiveSimConfig: SimConfig = useMemo(() => {
    return {
      race: race || 'orc',
      talents: talents || {},
      gear: {},
      buffs: {},
      encounter: { duration: 60, targetLevel: 63, bossLevel: 63, targets: 1 },
      ...(simConfig || {}),
      rotation,
    };
  }, [simConfig, rotation, race, talents]);

  const report = useMemo(() => {
    try {
      return analyzeSpellPriorities(effectiveSimConfig, combatBuffs);
    } catch (err) {
      console.error('analyzeSpellPriorities error:', err);
      return null;
    }
  }, [effectiveSimConfig, combatBuffs]);

  const baselineAp = report?.baselineAp ?? characterSheet?.totalAp ?? characterSheet?.ap ?? 1650;
  const activeAp = report?.buffedAp ?? baselineAp;
  const deltaAp = activeAp - baselineAp;
  const deltaApPct = baselineAp > 0 ? (deltaAp / baselineAp) * 100 : 0;
  const impExecuteRank = talents?.improvedExecute !== undefined ? talents.improvedExecute : 2;
  const btBreakpoint = impExecuteRank === 2 ? 2000 : 1833;

  // Batch Priority Simulation
  const [profiles, setProfiles] = useState<RankedProfile[]>(() => PRIORITY_PRESET_PROFILES.map((p) => ({ ...p })));
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const handleRunBatchProfiles = async () => {
    if (!simConfig) {
      alert('Simulation configuration is not ready. Please verify gear & buffs.');
      return;
    }
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: PRIORITY_PRESET_PROFILES.length });
    try {
      const baseResult = await runSimulation(simConfig, 1200);
      const baselineSimDps = baseResult.meanDps || baseResult.dps || 1000;
      const updated: RankedProfile[] = [];
      for (let i = 0; i < PRIORITY_PRESET_PROFILES.length; i++) {
        const p = PRIORITY_PRESET_PROFILES[i];
        setBatchProgress({ current: i + 1, total: PRIORITY_PRESET_PROFILES.length });
        const testConfig: SimConfig = {
          ...simConfig,
          rotation: { ...simConfig.rotation, ...p.rotation },
          iterations: 1200,
        };
        const res = await runSimulation(testConfig, 1200);
        const dps = res.meanDps || res.dps || 0;
        updated.push({ ...p, simDps: +dps.toFixed(1), dpsDelta: +(dps - baselineSimDps).toFixed(1) });
      }
      updated.sort((a, b) => (b.simDps || 0) - (a.simDps || 0));
      setProfiles(updated);
    } catch (err) {
      console.error('Batch priority simulation failed:', err);
    } finally {
      setIsBatchRunning(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="bg-[#ffffff] text-[#000000] p-4 flex flex-col space-y-6 overflow-y-auto h-full">
      {/* 1. TOP SECTION — Rotation & Cooldowns */}
      <section className="space-y-3">
        <div className="border-b border-[#000000] pb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">Rotation & Cooldown Settings</h2>
          <span className="text-[11px] text-[#555555]">Configure ability usage rules & rage pooling thresholds</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
          {/* Bloodthirst */}
          <div className="flex items-start space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useBloodthirst !== false} onChange={(e) => updateField('useBloodthirst', e.target.checked)} className="w-4 h-4 text-[#1861ac] mt-2.5 cursor-pointer" />
            <img src={getAbilityIconUrl('Bloodthirst', 'large')} alt="Bloodthirst" className={`ww-icon-40 shrink-0 ${rotation.useBloodthirst !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Bloodthirst <span className="font-normal text-[#555555]">(Cast on cooldown)</span></div>
              <div className="flex items-center flex-wrap gap-1 mt-1 text-[#333333]">
                <span>In Execute phase:</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" checked={!!rotation.useBtInExecute} onChange={(e) => updateField('useBtInExecute', e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
                  <span>cast if AP &ge;</span>
                </label>
                <input type="number" className="ww-inline-input" value={rotation.executeBtApThreshold ?? 2000} onChange={(e) => updateField('executeBtApThreshold', +e.target.value)} />
                <span>or Rage &ge;</span>
                <input type="number" className="ww-inline-input" value={rotation.executeRagePoolThreshold ?? 45} onChange={(e) => updateField('executeRagePoolThreshold', +e.target.value)} />
              </div>
            </div>
          </div>

          {/* Whirlwind */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useWhirlwind !== false} onChange={(e) => updateField('useWhirlwind', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Whirlwind', 'large')} alt="Whirlwind" className={`ww-icon-40 shrink-0 ${rotation.useWhirlwind !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Whirlwind</div>
              <div className="text-[#555555]">Cast on cooldown (fill between Bloodthirst GCDs)</div>
            </div>
          </div>

          {/* Heroic Strike */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useHeroicStrike !== false} onChange={(e) => updateField('useHeroicStrike', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Heroic Strike', 'large')} alt="Heroic Strike" className={`ww-icon-40 shrink-0 ${rotation.useHeroicStrike !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Heroic Strike</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Queue over</span>
                <input type="number" className="ww-inline-input" value={rotation.hsRageThreshold ?? rotation.heroicStrikeRageThreshold ?? 45} onChange={(e) => { const v = +e.target.value; onChange({ ...rotation, hsRageThreshold: v, heroicStrikeRageThreshold: v }); }} />
                <span>rage (off-GCD rage dump & anti-glance aura)</span>
              </div>
            </div>
          </div>

          {/* Execute */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.executePhase !== false && rotation.useExecute !== false} onChange={(e) => onChange({ ...rotation, executePhase: e.target.checked, useExecute: e.target.checked })} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Execute', 'large')} alt="Execute" className={`ww-icon-40 shrink-0 ${(rotation.executePhase !== false && rotation.useExecute !== false) ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Execute</div>
              <div className="text-[#555555]">Cast in Execute phase (&lt;20% boss HP)</div>
            </div>
          </div>

          {/* Overpower */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={!!rotation.useOverpower} onChange={(e) => updateField('useOverpower', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Overpower', 'large')} alt="Overpower" className={`ww-icon-40 shrink-0 ${rotation.useOverpower ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Overpower</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Weave in Battle Stance at or below</span>
                <input type="number" className="ww-inline-input" value={rotation.overpowerMaxRage ?? rotation.overpowerRageThreshold ?? 35} onChange={(e) => { const v = +e.target.value; onChange({ ...rotation, overpowerMaxRage: v, overpowerRageThreshold: v }); }} />
                <span>rage</span>
              </div>
            </div>
          </div>

          {/* Hamstring */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={!!rotation.useHamstring} onChange={(e) => updateField('useHamstring', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Hamstring', 'large')} alt="Hamstring" className={`ww-icon-40 shrink-0 ${rotation.useHamstring ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Hamstring</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Windfury / proc fishing over</span>
                <input type="number" className="ww-inline-input" value={rotation.hamstringRageThreshold ?? 70} onChange={(e) => updateField('hamstringRageThreshold', +e.target.value)} />
                <span>rage</span>
              </div>
            </div>
          </div>

          {/* Death Wish */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useDeathWish !== false} onChange={(e) => updateField('useDeathWish', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Death Wish', 'large')} alt="Death Wish" className={`ww-icon-40 shrink-0 ${rotation.useDeathWish !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Death Wish</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Activate in last</span>
                <input type="number" className="ww-inline-input" value={rotation.deathWishTiming ?? 30} onChange={(e) => updateField('deathWishTiming', +e.target.value)} />
                <span>sec (+20% physical damage)</span>
              </div>
            </div>
          </div>

          {/* Recklessness */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useRecklessness !== false} onChange={(e) => updateField('useRecklessness', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Recklessness', 'large')} alt="Recklessness" className={`ww-icon-40 shrink-0 ${rotation.useRecklessness !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Recklessness</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Activate in last</span>
                <input type="number" className="ww-inline-input" value={rotation.recklessnessTiming ?? 15} onChange={(e) => updateField('recklessnessTiming', +e.target.value)} />
                <span>sec (+100% critical strike chance)</span>
              </div>
            </div>
          </div>

          {/* Racial Cooldown */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useRacial !== false} onChange={(e) => updateField('useRacial', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl(racialName, 'large')} alt="Racial" className={`ww-icon-40 shrink-0 ${rotation.useRacial !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-[#000000]">Racial Cooldown</div>
              <div className="text-[#555555]">Use active racial ({racialName})</div>
            </div>
          </div>

          {/* Bloodrage & Mighty Rage Potion */}
          <div className="flex items-center space-x-4 p-2 bg-white border border-[#dddddd] rounded">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={rotation.useBloodrage !== false} onChange={(e) => updateField('useBloodrage', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
              <img src={getAbilityIconUrl('Bloodrage', 'large')} alt="Bloodrage" className={`ww-icon-40 shrink-0 ${rotation.useBloodrage !== false ? '' : 'ww-grayscale'}`} />
              <span className="font-semibold text-[#000000]">Bloodrage</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={!!rotation.useMightyRagePotion} onChange={(e) => updateField('useMightyRagePotion', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
              <img src={getAbilityIconUrl('Mighty Rage Potion', 'large')} alt="Mighty Rage Potion" className={`ww-icon-40 shrink-0 ${rotation.useMightyRagePotion ? '' : 'ww-grayscale'}`} />
              <span className="font-semibold text-[#000000]">Mighty Rage Pot</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION 2 — Dynamic Combat State Inspector */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#000000] pb-1.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">Dynamic Combat State Inspector ("What-If" Procs & Cooldowns)</h2>
            <div className="text-[11px] text-[#555555]">Toggle active procs to inspect dynamic AP scaling and priority breakpoints in real-time</div>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-[#eeeeee] px-3 py-1 rounded border border-[#cccccc]">
            <div><span className="text-[#666666]">Baseline AP:</span> <strong className="text-[#000000]">{baselineAp}</strong></div>
            <div className="text-[#999999]">|</div>
            <div><span className="text-[#666666]">Active AP:</span> <strong className="text-[#1861ac]">{activeAp}</strong></div>
            <span className={`font-semibold ${deltaAp >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ({deltaAp >= 0 ? `+${deltaAp}` : deltaAp} AP, {deltaAp >= 0 ? `+${deltaApPct.toFixed(1)}%` : `${deltaApPct.toFixed(1)}%`})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-[#dddddd] rounded">
          {PROCS_CONFIG.map((proc) => {
            const isActive = !!combatBuffs[proc.key];
            return (
              <div key={proc.key} onClick={() => toggleCombatBuff(proc.key)} className="flex flex-col items-center cursor-pointer group" title={`${proc.label}: Click to toggle (${isActive ? 'Active' : 'Inactive'})`}>
                <img src={getAbilityIconUrl(proc.ability, 'large')} alt={proc.label} className={`ww-icon-40 transition-transform group-hover:scale-105 ${isActive ? 'border-[#1861ac] shadow-sm' : 'ww-grayscale'}`} />
                <span className={`text-[10px] mt-1 text-center font-medium leading-tight max-w-[60px] truncate ${isActive ? 'text-[#1861ac] font-bold' : 'text-[#777777]'}`}>{proc.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECTION 3 — Breakpoint Advisor & DPR/DPET Spell Efficiency */}
      <section className="space-y-3">
        <div className="border-b border-[#000000] pb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">Bloodthirst vs. Execute Breakpoint Advisor & Spell Efficiency</h2>
          <span className="text-[11px] text-[#555555]">Target Breakpoint: {impExecuteRank === 2 ? '2,000 AP' : '1,833 AP (0/2 Imp Execute)'}</span>
        </div>

        <div className="p-3 bg-[#eeeeee] border-l-4 border-[#1861ac] text-xs text-[#000000] rounded-r space-y-1">
          <div className="font-bold flex items-center justify-between">
            <span>Breakpoint Analysis: Bloodthirst (30 Rage) vs Execute (30 Rage)</span>
            <span className="font-semibold text-[#1861ac]">Baseline: {baselineAp} AP | Active: {activeAp} AP</span>
          </div>
          <p className="text-[#333333] leading-relaxed">
            {activeAp >= btBreakpoint
              ? `Active AP (${activeAp}) is AT OR ABOVE the ${btBreakpoint} AP breakpoint. Bloodthirst (0.45 AP) delivers higher DPR than a 30-rage Execute and strictly surpasses the 15 dmg/rage marginal execute overflow. In Execute phase, cast Bloodthirst on cooldown whenever AP >= ${btBreakpoint} or Rage >= 45.`
              : `Active AP (${activeAp}) is BELOW the ${btBreakpoint} AP breakpoint (${btBreakpoint} AP required). Prioritize Execute at low rage (<35 rage), but cast Bloodthirst when pooling ≥ 45 Rage to prevent rage overflow.`}
          </p>
        </div>

        <div className="overflow-x-auto border border-[#dddddd] bg-white">
          <table className="ww-table w-full text-xs text-left border-collapse">
            <thead>
              <tr>
                <th className="w-10 text-center">Rank</th>
                <th>Ability</th>
                <th className="text-right">Rage (Nom/Eff)</th>
                <th className="text-right">Exec Time</th>
                <th className="text-right">Baseline Avg</th>
                <th className="text-right">Active Avg</th>
                <th className="text-right">Δ Base %</th>
                <th className="text-right">DPR</th>
                <th className="text-right">DPET</th>
                <th>Priority Role</th>
              </tr>
            </thead>
            <tbody>
              {report?.spells?.map((spell, index) => (
                <tr key={spell.id || spell.name} className="ww-item-row">
                  <td className="text-center font-bold text-[#000000]">{index + 1}</td>
                  <td className="font-medium">
                    <div className="flex items-center space-x-2">
                      <img src={getAbilityIconUrl(spell.name, 'small')} alt={spell.name} className="w-6 h-6 border border-[#aaaaaa] object-cover inline-block shrink-0" />
                      <span className="text-[#000000]">{spell.name}</span>
                    </div>
                  </td>
                  <td className="text-right">{spell.rageCost} / {spell.effectiveRageCost}</td>
                  <td className="text-right">{spell.executionTimeSec > 0 ? `${spell.executionTimeSec}s` : 'Instant'}</td>
                  <td className="text-right">{Math.round(spell.baselineDamage)}</td>
                  <td className="text-right font-semibold text-[#000000]">{Math.round(spell.buffedDamage)}</td>
                  <td className="text-right text-[#1861ac] font-medium">+{spell.deltaPctFromBaseline.toFixed(1)}%</td>
                  <td className="text-right font-bold text-[#000000]">{spell.buffedDpr.toFixed(1)}</td>
                  <td className="text-right">{Math.round(spell.buffedDpet)}</td>
                  <td className="text-[#555555] text-[11px] max-w-xs">{spell.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. SECTION 4 — Priority Profile Batch Simulator */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#000000] pb-1.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">Priority Profile Batch Simulator</h2>
            <div className="text-[11px] text-[#555555]">Benchmark empirically tested rotation strategies under your exact gear, enchants & talents</div>
          </div>
          <button
            type="button"
            disabled={isBatchRunning}
            onClick={handleRunBatchProfiles}
            className="bg-[#1861ac] text-white px-4 py-1.5 text-xs font-semibold hover:bg-[#144e8c] disabled:opacity-50 rounded cursor-pointer transition-colors"
          >
            {isBatchRunning ? `Simulating (${batchProgress?.current || 0}/${batchProgress?.total || PRIORITY_PRESET_PROFILES.length})...` : 'Simulate All Profiles'}
          </button>
        </div>

        <div className="overflow-x-auto border border-[#dddddd] bg-white">
          <table className="ww-table w-full text-xs text-left border-collapse">
            <thead>
              <tr>
                <th className="w-52">Profile</th>
                <th>Description</th>
                <th className="w-24 text-right">Sim DPS</th>
                <th className="w-24 text-right">Δ DPS</th>
                <th className="w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="ww-item-row">
                  <td className="font-semibold text-[#000000]">{p.name}</td>
                  <td className="text-[#555555] text-[11px]">{p.description}</td>
                  <td className="text-right font-bold text-[#000000]">{p.simDps !== undefined ? `${p.simDps.toFixed(1)}` : '—'}</td>
                  <td className="text-right font-semibold">
                    {p.dpsDelta !== undefined ? (
                      <span className={p.dpsDelta >= 0 ? 'text-green-700' : 'text-red-700'}>
                        {p.dpsDelta >= 0 ? `+${p.dpsDelta.toFixed(1)}` : p.dpsDelta.toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => onChange({ ...rotation, ...p.rotation })}
                      className="bg-[#1861ac] text-white px-3 py-1 text-xs font-semibold hover:bg-[#144e8c] rounded cursor-pointer transition-colors"
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
