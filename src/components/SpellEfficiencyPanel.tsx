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
  CombatBuffToggles,
  generateOptimalApl,
} from '../utils/spellAnalyzer';
import { getAbilityIconUrl } from '../utils/wowhead';

export interface SpellEfficiencyPanelProps {
  rotation: RotationConfig;
  characterSheet?: CharacterSheetSummary;
  simConfig?: SimConfig;
  race?: Race;
  talents?: TalentConfig;
  onRotationChange?: (rotation: RotationConfig) => void;
}

export const SpellEfficiencyPanel: React.FC<SpellEfficiencyPanelProps> = ({
  rotation,
  characterSheet,
  simConfig,
  race = 'orc',
  talents = {},
  onRotationChange,
}) => {
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

  return (
    <div className="bg-[#ffffff] text-[#000000] p-4 flex flex-col space-y-6 overflow-y-auto h-full">
      {/* Dynamic Combat State Inspector ("What-If" Procs & Cooldowns) */}
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#000000] pb-1.5">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">
              Dynamic Combat State Inspector ("What-If" Procs & Cooldowns)
            </h2>
            <div className="text-[11px] text-[#555555]">
              Toggle active procs to inspect dynamic AP scaling and priority breakpoints in real-time
            </div>
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
              <div
                key={proc.key}
                onClick={() => toggleCombatBuff(proc.key)}
                className="flex flex-col items-center cursor-pointer group"
                title={`${proc.label}: Click to toggle (${isActive ? 'Active' : 'Inactive'})`}
              >
                <img
                  src={getAbilityIconUrl(proc.ability, 'large')}
                  alt={proc.label}
                  className={`ww-icon-40 transition-transform group-hover:scale-105 ${
                    isActive ? 'border-[#1861ac] shadow-sm' : 'ww-grayscale'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 text-center font-medium leading-tight max-w-[60px] truncate ${
                    isActive ? 'text-[#1861ac] font-bold' : 'text-[#777777]'
                  }`}
                >
                  {proc.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bloodthirst vs. Execute Breakpoint Advisor & Spell Efficiency Table */}
      <section className="space-y-3">
        <div className="border-b border-[#000000] pb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase text-[#000000]">
            Bloodthirst vs. Execute Breakpoint Advisor & Spell Efficiency
          </h2>
          <div className="flex items-center space-x-3">
            {onRotationChange && (
              <button
                onClick={() =>
                  onRotationChange({
                    ...rotation,
                    apl: generateOptimalApl(effectiveSimConfig, report || undefined),
                    useBtInExecute: true,
                    executeBtApThreshold: report?.btBreakpointAp || 2000,
                    executeRagePoolThreshold: 45,
                    overpowerMaxRage: 25,
                  })
                }
                className="px-2.5 py-1 text-xs font-bold text-white bg-[#1861ac] hover:bg-[#134e8a] rounded shadow-sm flex items-center space-x-1"
              >
                <span>⚡ Apply Optimal APL to Rotation</span>
              </button>
            )}
            <span className="text-[11px] text-[#555555]">
              Target Breakpoint: {impExecuteRank === 2 ? '2,000 AP' : '1,833 AP (0/2 Imp Execute)'}
            </span>
          </div>
        </div>

        {/* Clean #eeeeee Summary Banner */}
        <div className="p-3 bg-[#eeeeee] border-l-4 border-[#1861ac] text-xs text-[#000000] rounded-r space-y-1">
          <div className="font-bold flex flex-wrap items-center justify-between gap-2">
            <span>Breakpoint Analysis: Bloodthirst (30 Rage) vs Execute (30 Rage)</span>
            <div className="flex items-center space-x-3">
              <span className="text-[#1861ac]">
                Marginal Rage Value (λ_R): {(report?.marginalRageValue ?? 12.5).toFixed(1)} dmg/rage
              </span>
              <span className="font-semibold text-[#1861ac]">
                Baseline: {baselineAp} AP | Active: {activeAp} AP
              </span>
            </div>
          </div>
          <p className="text-[#333333] leading-relaxed">
            {activeAp >= btBreakpoint
              ? `Active AP (${activeAp}) is AT OR ABOVE the ${btBreakpoint} AP breakpoint. Bloodthirst (0.45 AP) delivers higher DPR than a 30-rage Execute and strictly surpasses the 15 dmg/rage marginal execute overflow. In Execute phase, cast Bloodthirst on cooldown whenever AP >= ${btBreakpoint} or Rage >= 45.`
              : `Active AP (${activeAp}) is BELOW the ${btBreakpoint} AP breakpoint (${btBreakpoint} AP required). Prioritize Execute at low rage (<35 rage), but cast Bloodthirst when pooling ≥ 45 Rage to prevent rage overflow.`}
          </p>
        </div>

        {/* .ww-table Spell Efficiency Table */}
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
                <th className="text-right">Net Score</th>
                <th>Priority Role</th>
              </tr>
            </thead>
            <tbody>
              {report?.spells?.map((spell, index) => (
                <tr key={spell.id || spell.name} className="ww-item-row">
                  <td className="text-center font-bold text-[#000000]">{index + 1}</td>
                  <td className="font-medium">
                    <div className="flex items-center space-x-2">
                      <img
                        src={getAbilityIconUrl(spell.name, 'small')}
                        alt={spell.name}
                        className="w-6 h-6 border border-[#aaaaaa] object-cover inline-block shrink-0"
                      />
                      <span className="text-[#000000]">{spell.name}</span>
                    </div>
                  </td>
                  <td className="text-right">
                    {spell.rageCost} / {spell.effectiveRageCost}
                  </td>
                  <td className="text-right">
                    {spell.executionTimeSec > 0 ? `${spell.executionTimeSec}s` : 'Instant'}
                  </td>
                  <td className="text-right">{Math.round(spell.baselineDamage)}</td>
                  <td className="text-right font-semibold text-[#000000]">
                    {Math.round(spell.buffedDamage)}
                  </td>
                  <td className="text-right text-[#1861ac] font-medium">
                    +{spell.deltaPctFromBaseline.toFixed(1)}%
                  </td>
                  <td className="text-right font-bold text-[#000000]">{spell.buffedDpr.toFixed(1)}</td>
                  <td className="text-right">{Math.round(spell.buffedDpet)}</td>
                  <td className="text-right font-bold text-[#1861ac]">
                    {spell.netScore ?? Math.round(spell.buffedDamage - (report?.marginalRageValue ?? 12.5) * spell.effectiveRageCost)}
                  </td>
                  <td className="text-[#555555] text-[11px] max-w-xs">{spell.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
