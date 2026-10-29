import React, { useState } from 'react';
import { TalentConfig, TalentTreeNode } from '../types/sim';
import { TALENT_NODES, calculateTalentPoints, DEFAULT_TALENTS_17_34, DEFAULT_TALENTS_2H } from '../data/talents';
import { Sparkles, Shield, RotateCcw, ArrowDown, Info, Award } from 'lucide-react';

interface TalentTreeProps {
  talents: TalentConfig;
  onChange: (talents: TalentConfig) => void;
}

const FOREVER_NEW_TALENT_IDS = new Set([
  'furiousPrecision',
  'ragingBlows',
  'goreDrinker',
  'lingeringRage',
  'weaponMastery',
]);

export const TalentTree: React.FC<TalentTreeProps> = ({ talents, onChange }) => {
  const [activeTab, setActiveTab] = useState<'arms' | 'fury' | 'protection'>('fury');
  const points = calculateTalentPoints(talents);
  const remainingPoints = 51 - points.total;

  const handleAddPoint = (node: TalentTreeNode, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const current = Number(talents[node.id] || 0);
    if (current >= node.maxRank || remainingPoints <= 0) return;

    onChange({
      ...talents,
      [node.id]: current + 1,
    });
  };

  const handleRemovePoint = (node: TalentTreeNode, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const current = Number(talents[node.id] || 0);
    if (current <= 0) return;

    onChange({
      ...talents,
      [node.id]: current - 1,
    });
  };

  const resetCurrentTree = () => {
    const updated = { ...talents };
    for (const node of TALENT_NODES) {
      if (node.tree === activeTab) {
        delete (updated as any)[node.id];
      }
    }
    onChange(updated);
  };

  const resetAllTalents = () => {
    onChange({});
  };

  const treeNodes = TALENT_NODES.filter((n) => n.tree === activeTab);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full overflow-y-auto">
      {/* Baseline Passives Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-xl p-3 mb-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                WoW: Forever Baseline Warrior Passives
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold uppercase tracking-wider">
                Active Baseline
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              <span className="text-amber-400 font-semibold">Tactical Mastery:</span> Retain 10 Rage baseline across all stance swaps &bull; <span className="text-amber-400 font-semibold">Victory Rush:</span> Available upon slaying any experience/honor-yielding target.
            </div>
          </div>
        </div>

        {/* Quick Talent Preset Loader */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onChange(DEFAULT_TALENTS_17_34)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
          >
            Load 17/34 DW Fury
          </button>
          <button
            onClick={() => onChange(DEFAULT_TALENTS_2H)}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Load 20/31 2H Fury
          </button>
          <button
            onClick={resetAllTalents}
            className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
            title="Reset All Talents"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Talent Points Counter & Tree Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
        {/* Tree Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('arms')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'arms'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Arms ({points.arms})
          </button>
          <button
            onClick={() => setActiveTab('fury')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'fury'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fury ({points.fury})
          </button>
          <button
            onClick={() => setActiveTab('protection')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'protection'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Protection ({points.protection})
          </button>
        </div>

        {/* Remaining Points Display */}
        <div className="flex items-center space-x-3">
          <div className="text-xs font-mono">
            Points Left:{' '}
            <span
              className={`font-bold ${
                remainingPoints === 0
                  ? 'text-emerald-400'
                  : remainingPoints < 0
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {remainingPoints} / 51
            </span>
          </div>

          <button
            onClick={resetCurrentTree}
            className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            Reset {activeTab}
          </button>
        </div>
      </div>

      {/* 7-Row x 4-Col Interactive Talent Tree Grid */}
      <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-4 overflow-y-auto">
        <div className="grid grid-rows-7 gap-4 min-w-[500px]">
          {[1, 2, 3, 4, 5, 6, 7].map((rowNum) => {
            return (
              <div key={rowNum} className="grid grid-cols-4 gap-4 items-center">
                {[1, 2, 3, 4].map((colNum) => {
                  const node = treeNodes.find((n) => n.row === rowNum && n.col === colNum);

                  if (!node) {
                    return <div key={colNum} className="h-16" />;
                  }

                  const rank = Number(talents[node.id] || 0);
                  const isMaxed = rank === node.maxRank;
                  const isAllocated = rank > 0;
                  const isForeverNew = FOREVER_NEW_TALENT_IDS.has(node.id);
                  const isDeathWish = node.id === 'deathWish';
                  const isFlurry = node.id === 'flurry';

                  const desc =
                    rank > 0
                      ? node.descriptions[rank - 1]
                      : node.descriptions[0] || 'Adds talent effect.';
                  const nextDesc =
                    rank < node.maxRank && rank > 0 ? node.descriptions[rank] : null;

                  return (
                    <div
                      key={colNum}
                      onContextMenu={(e) => handleRemovePoint(node, e)}
                      onClick={(e) => handleAddPoint(node, e)}
                      className={`relative group h-20 p-2 rounded-lg border cursor-pointer select-none transition-all flex flex-col justify-between ${
                        isMaxed
                          ? 'bg-amber-950/30 border-amber-400/80 ring-1 ring-amber-400/50 shadow-md shadow-amber-950/40'
                          : isAllocated
                          ? 'bg-slate-800/80 border-emerald-500/80 ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      {/* Top Row: Name & New Badge */}
                      <div className="flex items-start justify-between">
                        <span
                          className={`text-xs font-semibold leading-tight line-clamp-1 ${
                            isMaxed
                              ? 'text-amber-300'
                              : isAllocated
                              ? 'text-emerald-300'
                              : 'text-slate-300'
                          }`}
                        >
                          {node.name}
                        </span>

                        {isForeverNew && (
                          <span className="shrink-0 ml-1 px-1 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[8px] uppercase tracking-wider animate-pulse">
                            Forever New
                          </span>
                        )}
                      </div>

                      {/* Death Wish -> Flurry Visual Connector Link */}
                      {isDeathWish && (
                        <div className="text-[9px] text-amber-400 font-mono flex items-center space-x-1">
                          <span>Prereq for Flurry</span>
                          <ArrowDown className="w-2.5 h-2.5 animate-bounce" />
                        </div>
                      )}
                      {isFlurry && (
                        <div className="text-[9px] text-amber-400/80 font-mono flex items-center space-x-0.5">
                          <span>Requires Death Wish</span>
                        </div>
                      )}

                      {/* Bottom Row: Rank Counter & Controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isMaxed
                              ? 'text-amber-400'
                              : isAllocated
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {rank}/{node.maxRank}
                        </span>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePoint(node);
                            }}
                            disabled={rank === 0}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-red-300 text-xs flex items-center justify-center border border-slate-700"
                          >
                            -
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddPoint(node);
                            }}
                            disabled={rank >= node.maxRank || remainingPoints <= 0}
                            className="w-5 h-5 rounded bg-amber-600/80 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center shadow"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-30 text-left">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                          <span className="text-xs font-bold text-amber-300">{node.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Rank {rank}/{node.maxRank}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-200">{desc}</div>
                        {nextDesc && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                            <span className="text-amber-400/80">Next Rank:</span> {nextDesc}
                          </div>
                        )}
                        <div className="mt-1.5 text-[9px] text-slate-500 italic">
                          Left-click to add, right-click to remove.
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
