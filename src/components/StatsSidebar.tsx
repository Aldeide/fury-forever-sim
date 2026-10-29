import React from 'react';
import {
  SimResult,
  CharacterSheetSummary,
  StatWeightsResult,
  TalentConfig,
} from '../types/sim';
import {
  Swords,
  Scale,
  Zap,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-4 h-full overflow-y-auto">
      {/* Simulation Result Big Gold Display */}
      <div className="bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 border border-amber-500/40 rounded-xl p-4 text-center relative overflow-hidden shadow-lg">
        <div className="flex items-center justify-between text-[11px] font-mono text-amber-400 mb-1">
          <span className="uppercase tracking-wider">Simulated DPS</span>
          <span className="flex items-center space-x-1 text-[10px] text-slate-400">
            <Cpu className="w-3 h-3 text-amber-400" />
            <span className="capitalize">{engineMode === 'wasm' ? 'Rust WASM' : engineMode === 'native' ? 'Rust Native' : 'TypeScript Worker'}</span>
          </span>
        </div>

        <div className="py-1">
          <div className="text-4xl font-extrabold tracking-tight text-amber-400 font-mono drop-shadow-md">
            {dpsVal !== null ? dpsVal.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {simResult ? (
              <span>
                ± {stdDevVal.toFixed(1)} SD &bull; Range: [{(simResult.minDps || 0).toFixed(0)} - {(simResult.maxDps || 0).toFixed(0)}]
              </span>
            ) : (
              'Ready to simulate'
            )}
          </div>
        </div>

        {/* Execution Speed Badge */}
        {simResult && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[10px] text-amber-300 font-mono">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>
              {simResult.iterations.toLocaleString()} fights in {simResult.elapsedMs || simResult.executionTimeMs || 100}ms
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md transition-all ${
              isSimulating
                ? 'bg-amber-600/50 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Swords className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Simulating...' : '⚔️ Simulate'}</span>
          </button>

          <button
            onClick={onCalculateWeights}
            disabled={isCalculatingWeights}
            className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
              isCalculatingWeights
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Scale className={`w-3.5 h-3.5 ${isCalculatingWeights ? 'animate-spin' : ''}`} />
            <span>{isCalculatingWeights ? 'Running...' : '⚖️ Stat Weights'}</span>
          </button>
        </div>
      </div>

      {/* Core Attributes Sheet */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
        <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
          <span>Character Attributes</span>
          <span className="text-[10px] text-amber-400 font-mono">Level 60</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Strength:</span>
            <span className="text-slate-100 font-semibold">{str}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Agility:</span>
            <span className="text-slate-100 font-semibold">{agi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Attack Power:</span>
            <span className="text-amber-300 font-bold">{ap}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Crit Chance:</span>
            <span className="text-amber-400 font-bold">{crit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Hit Chance:</span>
            <span className="text-slate-100 font-semibold">{hit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-400" title="WoW: Forever Off-Hand Hit">OH Hit:</span>
            <span className="text-amber-300 font-bold">{ohHit}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Melee Haste:</span>
            <span className="text-slate-100 font-semibold">{haste}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Armor Pen:</span>
            <span className="text-slate-100 font-semibold">{stats.effectiveArmorPen || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">MH Weapon Skill:</span>
            <span className="text-slate-100 font-semibold">{mhSkill}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">OH Weapon Skill:</span>
            <span className="text-slate-100 font-semibold">{ohSkill}</span>
          </div>
        </div>
      </div>

      {/* WoW: Forever Attack Table & Rage Mechanics */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Forever Attack Table (Boss 63)</span>
          </div>
          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
            Anti-Queue Bug
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-slate-400">Yellow Special Miss (BT/WW/HS):</span>
            <span className={yellowMiss === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {yellowMiss}% {yellowMiss === 0 ? '(Hit Capped)' : ''}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <span className="text-slate-400">Main-Hand White Miss:</span>
            <span className="text-slate-200">{mhWhiteMiss}%</span>
          </div>

          <div className="flex justify-between border-b border-slate-800/60 pb-1">
            <div>
              <span className="text-amber-300">Off-Hand White Miss:</span>
              {fpHitBonus > 0 && (
                <span className="text-[10px] text-emerald-400 ml-1">
                  (-{fpHitBonus}% FP)
                </span>
              )}
            </div>
            <span className="text-amber-400 font-bold">{ohWhiteMiss}%</span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">MH White Crit Cap:</span>
              <div className="flex items-center space-x-1">
                <span className={`font-bold ${isMhCritCapped ? 'text-red-400' : 'text-slate-200'}`}>
                  {mhCritCap}%
                </span>
                {isMhCritCapped && (
                  <span title="Crit exceeds White Crit Cap!" className="text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">OH White Crit Cap:</span>
              <div className="flex items-center space-x-1">
                <span className={`font-bold ${isOhCritCapped ? 'text-red-400' : 'text-slate-200'}`}>
                  {ohCritCap}%
                </span>
                {isOhCritCapped && (
                  <span title="Crit exceeds OH White Crit Cap!" className="text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rage Generation Breakdown */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between">
            <span>Rage Breakdown (2x Crit Rage)</span>
            <Flame className="w-3 h-3 text-red-400" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">MH Hit Rage:</div>
              <div className="text-slate-200 font-semibold">{mhNormalRage} rage</div>
              <div className="text-amber-400 text-[10px] mt-0.5">Crit: {mhCritRage} rage</div>
            </div>

            <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
              <div className="text-slate-400 text-[10px]">OH Hit Rage:</div>
              <div className="text-slate-200 font-semibold">{ohNormalRage} rage</div>
              <div className="text-amber-400 text-[10px] mt-0.5">Crit: {ohCritRage} rage</div>
            </div>
          </div>

          <div className="mt-2 flex justify-between text-[11px] font-mono bg-slate-900/40 p-1.5 rounded border border-slate-800/60">
            <span className="text-slate-400">Retained Stance Rage:</span>
            <span className="text-amber-300 font-bold">
              {tacticalMasteryRetained} Rage <span className="text-[10px] text-slate-500">(10 Base + Imp TM)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Stat Weights / Equivalence Points (EP) Table */}
      {statWeights && statWeights.weights && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase font-bold text-amber-400 tracking-wider flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Stat Weights (1 AP = 1.00 EP)</span>
            </div>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {statWeights.weights.map((w) => {
              const label = w.label || w.name || w.stat;
              const dpsPerPoint = w.dpsPerPoint ?? w.value ?? 0;
              const ep = w.epPerPoint ?? w.normalized ?? 0;
              return (
                <div
                  key={w.stat}
                  className="flex items-center justify-between py-0.5 border-b border-slate-800/40"
                >
                  <span className="text-slate-300 text-[11px]">{label}:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-[10px]">
                      +{dpsPerPoint.toFixed(2)} DPS
                    </span>
                    <span className="text-amber-400 font-bold w-12 text-right">
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
