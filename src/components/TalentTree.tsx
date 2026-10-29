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
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col h-full overflow-y-auto">
      {/* Baseline Passives Banner */}
      <div className="bg-[#1d2024] border border-[#a8c7fa]/30 rounded-2xl p-4 mb-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#284777] text-[#a8c7fa] flex items-center justify-center shrink-0 border border-[#a8c7fa]/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
                WoW: Forever Baseline Warrior Passives
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f5223] text-[#81c995] border border-[#81c995]/30 font-semibold uppercase tracking-wider">
                Active Baseline
              </span>
            </div>
            <div className="text-xs text-[#c4c6d0] mt-0.5">
              <span className="text-[#a8c7fa] font-semibold">Tactical Mastery:</span> Retain 10 Rage baseline across all stance swaps &bull; <span className="text-[#a8c7fa] font-semibold">Victory Rush:</span> Available upon slaying any experience/honor-yielding target.
            </div>
          </div>
        </div>

        {/* Quick Talent Preset Loader */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onChange(DEFAULT_TALENTS_17_34)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#284777] hover:bg-[#34588e] text-[#d6e3ff] border border-[#a8c7fa]/40 transition-all shadow-sm"
          >
            Load 17/34 DW Fury
          </button>
          <button
            onClick={() => onChange(DEFAULT_TALENTS_2H)}
            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#1d2024] hover:bg-[#282a2f] text-[#c4c6d0] border border-[#44474e]/40 transition-all"
          >
            Load 20/31 2H Fury
          </button>
          <button
            onClick={resetAllTalents}
            className="p-2 text-[#8e9099] hover:text-[#f28b82] rounded-full hover:bg-[#111318] transition-all"
            title="Reset All Talents"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Talent Points Counter & Tree Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#44474e]/30">
        {/* Tree Selector Tabs */}
        <div className="flex bg-[#111318] p-1 rounded-full border border-[#44474e]/40">
          <button
            onClick={() => setActiveTab('arms')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'arms'
                ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                : 'text-[#8e9099] hover:text-[#e2e2e9]'
            }`}
          >
            Arms ({points.arms})
          </button>
          <button
            onClick={() => setActiveTab('fury')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'fury'
                ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                : 'text-[#8e9099] hover:text-[#e2e2e9]'
            }`}
          >
            Fury ({points.fury})
          </button>
          <button
            onClick={() => setActiveTab('protection')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'protection'
                ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                : 'text-[#8e9099] hover:text-[#e2e2e9]'
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
                  ? 'text-[#81c995]'
                  : remainingPoints < 0
                  ? 'text-[#f28b82]'
                  : 'text-[#a8c7fa]'
              }`}
            >
              {remainingPoints} / 51
            </span>
          </div>

          <button
            onClick={resetCurrentTree}
            className="text-[11px] px-3 py-1 rounded-full bg-[#1d2024] hover:bg-[#282a2f] text-[#8e9099] hover:text-[#e2e2e9] border border-[#44474e]/40 transition-all"
          >
            Reset {activeTab}
          </button>
        </div>
      </div>

      {/* 7-Row x 4-Col Interactive Talent Tree Grid */}
      <div className="flex-1 bg-[#111318]/70 border border-[#44474e]/30 rounded-2xl p-4 overflow-y-auto">
        <div className="grid grid-rows-7 gap-3.5 min-w-[500px]">
          {[1, 2, 3, 4, 5, 6, 7].map((rowNum) => {
            return (
              <div key={rowNum} className="grid grid-cols-4 gap-3.5 items-center">
                {[1, 2, 3, 4].map((colNum) => {
                  const node = treeNodes.find((n) => n.row === rowNum && n.col === colNum);

                  if (!node) {
                    return <div key={colNum} className="h-20" />;
                  }

                  const rank = Number(talents[node.id] || 0);
                  const isMaxed = rank === node.maxRank;
                  const isAllocated = rank > 0;
                  const isForeverNew = FOREVER_NEW_TALENT_IDS.has(node.id);

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
                      className={`relative group h-20 p-2.5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                        isMaxed
                          ? 'bg-[#0f5223]/20 border-[#81c995]/70 ring-1 ring-[#81c995]/40 shadow-sm'
                          : isAllocated
                          ? 'bg-[#284777]/30 border-[#a8c7fa]/70 ring-1 ring-[#a8c7fa]/30'
                          : 'bg-[#191c20] border-[#44474e]/30 hover:border-[#44474e]/60 hover:bg-[#282a2f]/40'
                      }`}
                    >
                      {/* Top Row: Name & New Badge */}
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`text-xs font-semibold leading-tight line-clamp-1 ${
                            isMaxed
                              ? 'text-[#81c995]'
                              : isAllocated
                              ? 'text-[#d6e3ff]'
                              : 'text-[#c4c6d0]'
                          }`}
                        >
                          {node.name}
                        </span>

                        {isForeverNew && (
                          <span className="shrink-0 text-[8px] font-mono uppercase px-1 py-0.2 rounded-full bg-[#4f378b] text-[#eddcff]">
                            New
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Rank Indicator */}
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span
                          className={`text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                            isMaxed
                              ? 'bg-[#0f5223] text-[#81c995] border border-[#81c995]/40'
                              : isAllocated
                              ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40'
                              : 'bg-[#111318] text-[#8e9099]'
                          }`}
                        >
                          {rank} / {node.maxRank}
                        </span>

                        <span className="text-[10px] text-[#8e9099] opacity-0 group-hover:opacity-100 transition-opacity">
                          L-Click + &bull; R-Click -
                        </span>
                      </div>

                      {/* Tooltip on Hover */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-[#111318] border border-[#44474e]/60 rounded-xl shadow-xl pointer-events-none text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-[#e2e2e9]">{node.name}</span>
                          <span className="text-[10px] font-mono text-[#a8c7fa]">
                            Rank {rank}/{node.maxRank}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#c4c6d0] leading-snug">{desc}</div>

                        {nextDesc && (
                          <div className="mt-2 pt-1.5 border-t border-[#44474e]/30">
                            <div className="text-[10px] font-bold text-[#8e9099] uppercase">
                              Next Rank:
                            </div>
                            <div className="text-[11px] text-[#8e9099] leading-snug">
                              {nextDesc}
                            </div>
                          </div>
                        )}
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
