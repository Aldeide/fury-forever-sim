import React from 'react';
import {
  SimResult,
  CharacterSheetSummary,
  StatWeightsResult,
  TalentConfig,
  Race,
} from '../types/sim';
import {
  Swords,
  Scale,
  Zap,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Cpu,
  Sparkles,
  Award,
} from 'lucide-react';
import { WOW_FOREVER_RACES } from './BuffsPanel';

interface StatsSidebarProps {
  stats: CharacterSheetSummary;
  simResult: SimResult | null;
  statWeights: StatWeightsResult | null;
  talents: TalentConfig;
  isSimulating: boolean;
  isCalculatingWeights: boolean;
  onSimulate: () => void;
  onCalculateWeights: () => void;
  engineMode?: 'wasm' | 'native' | 'ts';
  race?: Race;
}

export const StatsSidebar: React.FC<StatsSidebarProps> = ({
  stats,
  simResult,
  statWeights,
  talents,
  isSimulating,
  isCalculatingWeights,
  onSimulate,
  onCalculateWeights,
  engineMode = 'wasm',
  race = 'orc',
}) => {
  const mhSkill = stats.mhSkill || 300;
  const ohSkill = stats.ohSkill || 300;
  const hit = stats.mhHitPct ?? stats.hit ?? 0;
  const ohHit = stats.ohHitPct ?? stats.ohHit ?? 0;
  const crit = stats.critPct ?? stats.crit ?? 0;
  const ap = stats.totalAp ?? stats.ap ?? 0;
  const str = stats.totalStr ?? stats.str ?? 0;
  const agi = stats.totalAgi ?? stats.agi ?? 0;
  const haste = stats.hastePct ?? stats.haste ?? 0;

  // Attack Table Calculations
  const yellowMiss = stats.yellowMissPct ?? Math.max(0, +((mhSkill >= 305 ? 6.0 : 8.0) - hit).toFixed(2));
  const mhWhiteMiss = stats.mhWhiteMissPct ?? Math.max(0, +(27.0 - hit).toFixed(2));
  const ohWhiteMiss = stats.ohWhiteMissPct ?? Math.max(0, +(27.0 - hit - ohHit).toFixed(2));

  // Furious Precision rank
  const fpRank = talents.furiousPrecision || 0;
  const fpHitBonus = fpRank === 1 ? 4 : fpRank === 2 ? 7 : fpRank === 3 ? 10 : 0;

  // White Crit Caps
  const mhCritCap = stats.mhCritCap ?? 45.0;
  const ohCritCap = stats.ohCritCap ?? 45.0;

  const isMhCritCapped = crit > mhCritCap;
  const isOhCritCapped = crit > ohCritCap;

  // Normalized Rage formula
  const mhNormalRage = stats.mhNormRage ?? 18.5;
  const mhCritRage = stats.mhCritRage ?? +(mhNormalRage * 2.0).toFixed(1);

  const ohNormalRage = stats.ohNormRage ?? 9.2;
  const ohCritRage = stats.ohCritRage ?? +(ohNormalRage * 2.0).toFixed(1);

  // Stance Retention
  const tacticalMasteryRetained = stats.retainedStanceRage ?? (10 + (talents.tacticalMastery || 0) * 5);

  const dpsVal = simResult ? (simResult.meanDps ?? simResult.dps ?? 0) : null;
  const stdDevVal = simResult ? (simResult.stdDevDps ?? simResult.stdDev ?? 0) : 0;

  // Selected race info
  const normalizedRaceKey = String(race).toLowerCase().replace(/[^a-z]/g, '');
  const activeRace =
    WOW_FOREVER_RACES.find((r) => r.id.toLowerCase().replace(/[^a-z]/g, '') === normalizedRaceKey) ||
    WOW_FOREVER_RACES[0];

  return (
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col space-y-3.5 h-full overflow-y-auto">
      {/* Simulation Result Big Material 3 Display Card */}
      <div className="bg-[#1d2024] border border-[#a8c7fa]/40 rounded-2xl p-4 text-center relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#a8c7fa] mb-1">
          <span className="uppercase tracking-wider font-semibold">Simulated DPS</span>
          <span className="flex items-center space-x-1 text-[10px] text-[#8e9099] bg-[#111318] px-2 py-0.5 rounded-full border border-[#44474e]/30">
            <Cpu className="w-3 h-3 text-[#a8c7fa]" />
            <span className="capitalize">{engineMode === 'wasm' ? 'Rust WASM' : engineMode === 'native' ? 'Rust Native' : 'TypeScript Worker'}</span>
          </span>
        </div>

        <div className="py-1">
          <div className="text-4xl font-extrabold tracking-tight text-[#a8c7fa] font-mono drop-shadow-sm">
            {dpsVal !== null ? dpsVal.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-[#c4c6d0] font-mono mt-0.5">
            {simResult ? (
              <span>
                ± {stdDevVal.toFixed(1)} SD &bull; [{(simResult.minDps || 0).toFixed(0)} - {(simResult.maxDps || 0).toFixed(0)}]
              </span>
            ) : (
              'Ready to simulate'
            )}
          </div>
        </div>

        {/* Execution Speed Badge */}
        {simResult && (
          <div className="mt-2 pt-2 border-t border-[#44474e]/30 flex items-center justify-center space-x-1.5 text-[10px] text-[#81c995] font-mono">
            <Zap className="w-3 h-3 text-[#81c995]" />
            <span>
              {simResult.iterations.toLocaleString()} iterations in {simResult.elapsedMs || simResult.executionTimeMs || 100}ms
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-3.5">
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              isSimulating
                ? 'bg-[#284777]/50 text-[#8e9099] cursor-not-allowed'
                : 'bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#062e6f] hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Swords className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate'}</span>
          </button>

          <button
            onClick={onCalculateWeights}
            disabled={isCalculatingWeights}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
              isCalculatingWeights
                ? 'bg-[#1d2024] text-[#8e9099] border-[#44474e]/30 cursor-not-allowed'
                : 'bg-[#284777] hover:bg-[#34588e] text-[#d6e3ff] border-[#a8c7fa]/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Scale className={`w-3.5 h-3.5 ${isCalculatingWeights ? 'animate-spin' : ''}`} />
            <span>{isCalculatingWeights ? 'Running...' : 'Stat Weights'}</span>
          </button>
        </div>
      </div>

      {/* Selected Race Racials Card (WoW: Forever Ruleset) */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-3.5 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#a8c7fa]">
          <span className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>{activeRace.name} Racials</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3e4759] text-[#dae2f9]">
            {activeRace.faction}
          </span>
        </div>
        <div className="text-xs text-[#c4c6d0] font-sans leading-relaxed">
          {activeRace.racialsSummary}
        </div>
      </div>

      {/* Core Attributes Sheet */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-3.5 shadow-sm">
        <div className="text-[11px] uppercase font-bold text-[#a8c7fa] tracking-wider mb-2.5 flex items-center justify-between">
          <span>Character Attributes</span>
          <span className="text-[10px] text-[#d6e3ff] font-mono bg-[#284777] px-2 py-0.5 rounded-full">
            Level 60
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Strength:</span>
            <span className="text-[#e2e2e9] font-semibold">{str}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Agility:</span>
            <span className="text-[#e2e2e9] font-semibold">{agi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Attack Power:</span>
            <span className="text-[#a8c7fa] font-bold">{ap}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Crit Chance:</span>
            <span className="text-[#81c995] font-bold">{crit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Hit Chance:</span>
            <span className="text-[#e2e2e9] font-semibold">{hit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#a8c7fa]" title="WoW: Forever Off-Hand Hit">OH Hit:</span>
            <span className="text-[#d6e3ff] font-bold">{ohHit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Melee Haste:</span>
            <span className="text-[#e2e2e9] font-semibold">{haste}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">Armor Pen:</span>
            <span className="text-[#e2e2e9] font-semibold">{stats.effectiveArmorPen || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">MH Weapon Skill:</span>
            <span className="text-[#e2e2e9] font-semibold">{mhSkill}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8e9099]">OH Weapon Skill:</span>
            <span className="text-[#e2e2e9] font-semibold">{ohSkill}</span>
          </div>
        </div>
      </div>

      {/* WoW: Forever Attack Table & Rage Mechanics */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase font-bold text-[#a8c7fa] tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Forever Attack Table (Boss 63)</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#284777] text-[#d6e3ff] font-mono">
            Anti-Queue Fix
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-[#44474e]/30 pb-1.5">
            <span className="text-[#8e9099]">Yellow Special Miss (BT/WW/HS):</span>
            <span className={yellowMiss === 0 ? 'text-[#81c995] font-bold' : 'text-[#f28b82]'}>
              {yellowMiss}% {yellowMiss === 0 ? '(Hit Capped)' : ''}
            </span>
          </div>

          <div className="flex justify-between border-b border-[#44474e]/30 pb-1.5">
            <span className="text-[#8e9099]">Main-Hand White Miss:</span>
            <span className="text-[#e2e2e9]">{mhWhiteMiss}%</span>
          </div>

          <div className="flex justify-between border-b border-[#44474e]/30 pb-1.5">
            <div>
              <span className="text-[#c4c6d0]">Off-Hand White Miss:</span>
              {fpHitBonus > 0 && (
                <span className="text-[10px] text-[#81c995] ml-1">
                  (-{fpHitBonus}% FP)
                </span>
              )}
            </div>
            <span className="text-[#d6e3ff] font-bold">{ohWhiteMiss}%</span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[#8e9099]">MH White Crit Cap:</span>
              <div className="flex items-center space-x-1">
                <span className={`font-bold ${isMhCritCapped ? 'text-[#f28b82]' : 'text-[#e2e2e9]'}`}>
                  {mhCritCap}%
                </span>
                {isMhCritCapped && (
                  <span title="Crit exceeds White Crit Cap!" className="text-[#f28b82]">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#8e9099]">OH White Crit Cap:</span>
              <div className="flex items-center space-x-1">
                <span className={`font-bold ${isOhCritCapped ? 'text-[#f28b82]' : 'text-[#e2e2e9]'}`}>
                  {ohCritCap}%
                </span>
                {isOhCritCapped && (
                  <span title="Crit exceeds OH White Crit Cap!" className="text-[#f28b82]">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rage Generation Breakdown */}
        <div className="pt-2.5 border-t border-[#44474e]/30">
          <div className="text-[10px] uppercase font-bold text-[#8e9099] tracking-wider mb-2 flex items-center justify-between">
            <span>Rage Breakdown (2x Crit Rage)</span>
            <Flame className="w-3 h-3 text-[#f28b82]" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-[#111318] p-2 rounded-xl border border-[#44474e]/30">
              <div className="text-[#8e9099] text-[10px]">MH Hit Rage:</div>
              <div className="text-[#e2e2e9] font-semibold">{mhNormalRage} rage</div>
              <div className="text-[#81c995] text-[10px] mt-0.5">Crit: {mhCritRage} rage</div>
            </div>

            <div className="bg-[#111318] p-2 rounded-xl border border-[#44474e]/30">
              <div className="text-[#8e9099] text-[10px]">OH Hit Rage:</div>
              <div className="text-[#e2e2e9] font-semibold">{ohNormalRage} rage</div>
              <div className="text-[#81c995] text-[10px] mt-0.5">Crit: {ohCritRage} rage</div>
            </div>
          </div>

          <div className="mt-2.5 flex justify-between text-[11px] font-mono bg-[#111318] p-2 rounded-xl border border-[#44474e]/30">
            <span className="text-[#8e9099]">Retained Stance Rage:</span>
            <span className="text-[#a8c7fa] font-bold">
              {tacticalMasteryRetained} Rage <span className="text-[10px] text-[#8e9099]">(10 Base + Imp TM)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stat Weights / Equivalence Points (EP) Table */}
      {statWeights && statWeights.weights && (
        <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase font-bold text-[#a8c7fa] tracking-wider flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Stat Weights (1 AP = 1.00 EP)</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {statWeights.weights.map((w) => {
              const label = w.label || w.name || w.stat;
              const dpsPerPoint = w.dpsPerPoint ?? w.value ?? 0;
              const ep = w.epPerPoint ?? w.normalized ?? 0;
              return (
                <div
                  key={w.stat}
                  className="flex items-center justify-between py-1 border-b border-[#44474e]/20"
                >
                  <span className="text-[#c4c6d0] text-[11px]">{label}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#81c995] text-[10px] font-semibold">
                      +{dpsPerPoint.toFixed(2)} DPS
                    </span>
                    <span className="text-[#a8c7fa] font-bold w-14 text-right">
                      {ep.toFixed(2)} EP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
