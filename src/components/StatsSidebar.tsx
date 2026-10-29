import React from 'react';
import {
  SimResult,
  CharacterSheetSummary,
  StatWeightsResult,
  TalentConfig,
  Race,
} from '../types/sim';
import { Swords, Play, Cpu, Sparkles } from 'lucide-react';
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
  presets?: { id: string; name: string }[];
  currentPresetId?: string;
  onSelectPreset?: (presetId: string) => void;
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
  presets = [],
  currentPresetId,
  onSelectPreset,
}) => {
  const mhSkill = stats.mhSkill || 300;
  const ohSkill = stats.ohSkill || 300;
  const hit = stats.mhHitPct ?? stats.hit ?? 0;
  const ohHit = stats.ohHitPct ?? stats.ohHit ?? 0;
  const crit = stats.critPct ?? stats.crit ?? 0;
  const ap = stats.totalAp ?? stats.ap ?? 0;
  const str = stats.totalStr ?? stats.str ?? 0;
  const agi = stats.totalAgi ?? stats.agi ?? 0;
  const sta = stats.totalSta ?? stats.sta ?? 0;
  const armor = stats.armor || 2500;
  const haste = stats.hastePct ?? stats.haste ?? 0;
  const health = 1689 + Math.max(0, (sta || 350) - 20) * 10 + 20;

  // Attack Table Calculations
  const yellowMiss = stats.yellowMissPct ?? Math.max(0, +((mhSkill >= 305 ? 6.0 : 8.0) - hit).toFixed(2));
  const mhWhiteMiss = stats.mhWhiteMissPct ?? Math.max(0, +(27.0 - hit).toFixed(2));
  const ohWhiteMiss = stats.ohWhiteMissPct ?? Math.max(0, +(27.0 - hit - ohHit).toFixed(2));
  const dodgeChance = 6.5;
  const glancingChance = 40.0;
  const mhCritCap = stats.mhCritCap ?? 45.0;
  const critOverCap = +(crit - Number(mhCritCap)).toFixed(2);

  // Active race details
  const normalizedRaceKey = String(race).toLowerCase().replace(/[^a-z]/g, '');
  const activeRace =
    WOW_FOREVER_RACES.find((r) => r.id.toLowerCase().replace(/[^a-z]/g, '') === normalizedRaceKey) ||
    WOW_FOREVER_RACES[0];

  const dpsVal = simResult ? (simResult.meanDps ?? simResult.dps ?? 0) : null;
  const stdDevVal = simResult ? (simResult.stdDevDps ?? simResult.stdDev ?? 0) : 0;

  return (
    <aside className="ww-summary-sidebar h-full p-4 flex flex-col overflow-y-auto select-none text-xs font-sans">
      {/* Title Header: <Race> Warrior */}
      <div className="text-center pb-3 border-b border-[#cccccc] mb-3">
        <h3 className="text-lg font-normal text-black tracking-tight">
          {activeRace.name} Warrior
        </h3>
        <p className="text-[11px] text-[#666666] font-mono">
          Level 60 &bull; {engineMode === 'wasm' ? 'Rust WASM' : 'TypeScript'}
        </p>

        {/* Preset Selector */}
        {presets.length > 0 && onSelectPreset && (
          <div className="mt-2">
            <select
              value={currentPresetId || ''}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-white border border-[#cccccc] rounded px-2 py-1 text-xs text-black focus:outline-none focus:border-[#1861ac]"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Big Simulate Button */}
        <div className="mt-2.5">
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className={`w-full py-2 px-3 rounded font-medium text-xs text-white uppercase tracking-wider transition-all shadow-sm ${
              isSimulating
                ? 'bg-[#1861ac]/60 cursor-not-allowed'
                : 'bg-[#1861ac] hover:bg-[#144e8c] active:bg-[#0f3c6d]'
            }`}
          >
            {isSimulating ? 'Simulating...' : '▶ Simulate DPS'}
          </button>
        </div>
      </div>

      {/* DPS Banner if simulated */}
      {dpsVal !== null && (
        <div className="bg-white border-2 border-[#1861ac] rounded p-2.5 mb-3 text-center shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider">
            Simulated DPS
          </div>
          <div className="text-2xl font-bold text-[#1861ac] font-mono">
            {dpsVal.toFixed(1)}
          </div>
          <div className="text-[10px] text-[#777777] font-mono">
            ±{stdDevVal.toFixed(1)} SD &bull; [{(simResult?.minDps || 0).toFixed(0)} - {(simResult?.maxDps || 0).toFixed(0)}]
          </div>
        </div>
      )}

      {/* Core Attributes */}
      <div className="space-y-1 pb-3 border-b border-[#cccccc] mb-3">
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Health</span>
          <span className="font-semibold text-black">{health}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Strength</span>
          <span className="font-semibold text-black">{str}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Agility</span>
          <span className="font-semibold text-black">{agi}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Stamina</span>
          <span className="font-semibold text-black">{sta || 350}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Armor</span>
          <span className="font-semibold text-black">{armor}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Attack Power</span>
          <span className="font-bold text-[#1861ac]">{ap}</span>
        </div>
      </div>

      {/* Secondary Combat Stats */}
      <div className="space-y-1 pb-3 border-b border-[#cccccc] mb-3">
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Melee Critical Chance (%)</span>
          <span className="font-bold text-black">
            {crit.toFixed(2)}% ({Math.max(0, crit - 3.0).toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Hit Chance (%)</span>
          <span className="font-semibold text-black">{hit.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#1861ac] font-medium" title="WoW: Forever Off-Hand Hit">OH Hit Chance (%)</span>
          <span className="font-bold text-[#1861ac]">{ohHit.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Melee Haste (%)</span>
          <span className="font-semibold text-black">{haste.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Main-Hand Weapon Skill</span>
          <span className="font-semibold text-black">{mhSkill}</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#333333]">Off-Hand Weapon Skill</span>
          <span className="font-semibold text-black">{ohSkill}</span>
        </div>
      </div>

      {/* Combat Roll Table (WrathWarrior Debug Section) */}
      <div className="space-y-1 pb-3 border-b border-[#cccccc] mb-3">
        <div className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">
          Combat Roll Table (Boss 63)
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">Glancing Chance</span>
          <span className="text-black font-mono">{glancingChance}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">Yellow Miss Chance</span>
          <span className={`font-mono ${yellowMiss === 0 ? 'text-[#26b050] font-bold' : 'text-black'}`}>
            {yellowMiss}% {yellowMiss === 0 ? '(Capped)' : ''}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">MH White Miss Chance</span>
          <span className="text-black font-mono">{mhWhiteMiss}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">OH White Miss Chance</span>
          <span className="text-[#1861ac] font-bold font-mono">{ohWhiteMiss}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">Dodge Chance</span>
          <span className="text-black font-mono">{dodgeChance}%</span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-[#555555]">MH White Crit Cap</span>
          <span className="text-black font-mono">
            {mhCritCap}%
            {critOverCap > 0 ? (
              <span className="text-[#d93025] font-bold ml-1">(Over by {critOverCap.toFixed(2)}%)</span>
            ) : (
              <span className="text-[#26b050] ml-1">(Under by {Math.abs(critOverCap).toFixed(2)}%)</span>
            )}
          </span>
        </div>
      </div>

      {/* Active Racial Traits (WoW: Forever Oct 26-28 Ruleset) */}
      <div className="space-y-1 pb-2">
        <div className="text-[11px] font-bold text-black uppercase tracking-wider mb-1">
          {activeRace.name} Racial Traits
        </div>
        <p className="text-[11px] text-[#444444] leading-snug">
          {activeRace.racialsSummary}
        </p>
      </div>
    </aside>
  );
};
