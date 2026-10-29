import React from 'react';
import { TalentConfig, TalentTreeNode } from '../types/sim';
import {
  TALENT_NODES,
  calculateTalentPoints,
  DEFAULT_TALENTS_17_34,
  DEFAULT_TALENTS_2H,
} from '../data/talents';
import { getWowheadIconUrl } from '../utils/wowhead';

export interface TalentTreeProps {
  talents: TalentConfig;
  onChange: (talents: TalentConfig) => void;
}

export const TalentTree: React.FC<TalentTreeProps> = ({ talents, onChange }) => {
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

    const updated = { ...talents };
    if (current - 1 <= 0) {
      delete updated[node.id];
    } else {
      updated[node.id] = current - 1;
    }
    onChange(updated);
  };

  const resetTree = (treeName: 'arms' | 'fury' | 'protection') => {
    const updated = { ...talents };
    for (const node of TALENT_NODES) {
      if (node.tree === treeName) {
        delete updated[node.id];
      }
    }
    onChange(updated);
  };

  const resetAllTalents = () => {
    onChange({});
  };

  const trees: Array<{
    id: 'arms' | 'fury' | 'protection';
    name: string;
    points: number;
  }> = [
    { id: 'arms', name: 'Arms', points: points.arms },
    { id: 'fury', name: 'Fury', points: points.fury },
    { id: 'protection', name: 'Protection', points: points.protection },
  ];

  return (
    <div className="bg-white text-black p-4 flex flex-col h-full overflow-y-auto">
      {/* Top header bar with points and presets */}
      <div className="bg-[#eeeeee] border-l-4 border-[#1861ac] p-2.5 text-xs text-black mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-bold text-black">
            Points Remaining:{' '}
            <span
              className={`font-mono font-bold ${
                remainingPoints === 0
                  ? 'text-[#2e7d32]'
                  : remainingPoints < 0
                  ? 'text-[#c00]'
                  : 'text-[#1861ac]'
              }`}
            >
              {51 - points.total} / 51
            </span>
          </div>
          <div className="text-xs text-[#555555]">
            <span className="font-semibold text-black">WoW: Forever Baseline:</span>{' '}
            Tactical Mastery 10 Rage baseline across stance swaps &bull; Victory Rush
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(DEFAULT_TALENTS_17_34)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-[#1861ac] hover:bg-[#144e8c] text-white transition-all shadow-sm"
          >
            Load 17/34 DW Fury
          </button>
          <button
            onClick={() => onChange(DEFAULT_TALENTS_2H)}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] transition-all shadow-sm"
          >
            Load 20/31 2H Fury
          </button>
          <button
            onClick={resetAllTalents}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-[#c00] border border-[#cccccc] transition-all shadow-sm"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* 3 Talent Trees Side-by-Side in 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {trees.map((tree) => (
          <div
            key={tree.id}
            className="bg-white border border-[#dddddd] rounded shadow-sm flex flex-col"
          >
            <div className="bg-[#eeeeee] px-4 py-2.5 border-b border-[#dddddd] flex items-center justify-between font-bold text-sm text-black">
              <span>
                {tree.name} ({tree.points})
              </span>
              <button
                onClick={() => resetTree(tree.id)}
                className="text-xs font-normal text-[#666666] hover:text-[#c00] hover:underline"
                title={`Reset ${tree.name} tree`}
              >
                Reset
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col items-center justify-center">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 7].map((rowNum) => (
                  <div key={rowNum} className="flex gap-4 justify-center">
                    {[1, 2, 3, 4].map((colNum) => {
                      const node = TALENT_NODES.find(
                        (n) => n.tree === tree.id && n.row === rowNum && n.col === colNum
                      );

                      if (!node) {
                        return <div key={colNum} className="w-[40px] h-[40px]" />;
                      }

                      const rank = Number(talents[node.id] || 0);
                      const isMaxed = rank === node.maxRank;
                      const isAllocated = rank > 0;
                      const desc = isAllocated
                        ? node.descriptions[rank - 1]
                        : node.descriptions[0];
                      const nextDesc = isAllocated && !isMaxed ? node.descriptions[rank] : null;

                      return (
                        <div
                          key={colNum}
                          onClick={(e) => handleAddPoint(node, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleRemovePoint(node, e);
                          }}
                          className="relative group w-[40px] h-[40px] select-none cursor-pointer"
                        >
                          <img
                            src={getWowheadIconUrl(node.icon, 'large')}
                            alt={node.name}
                            className={`ww-icon-40 rounded ${
                              rank === 0
                                ? 'ww-grayscale'
                                : isMaxed
                                ? 'border-[#ff9800]'
                                : 'border-[#1861ac]'
                            }`}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />

                          <span
                            className={`absolute -bottom-1 -right-1 ww-talent-badge pointer-events-none ${
                              isMaxed
                                ? 'ww-talent-orange'
                                : isAllocated
                                ? 'ww-talent-green'
                                : 'ww-talent-muted'
                            }`}
                          >
                            {rank}/{node.maxRank}
                          </span>

                          {/* Dark Tooltip */}
                          <div
                            className={`absolute z-50 hidden group-hover:block w-64 p-2.5 bg-[#111111] text-white border border-[#444444] rounded shadow-2xl pointer-events-none text-left text-xs ${
                              rowNum <= 2 ? 'top-full mt-2' : 'bottom-full mb-2'
                            } ${
                              colNum === 1
                                ? 'left-0'
                                : colNum === 4
                                ? 'right-0'
                                : 'left-1/2 -translate-x-1/2'
                            }`}
                          >
                            <div className="font-bold text-sm text-white mb-0.5">
                              {node.name}
                            </div>
                            <div className="text-[11px] text-[#ff9800] mb-1 font-medium">
                              Rank {rank}/{node.maxRank}
                            </div>
                            <div className="text-xs text-[#dddddd] leading-snug">{desc}</div>
                            {nextDesc && (
                              <div className="mt-2 pt-1.5 border-t border-[#333333]">
                                <div className="text-[10px] uppercase font-bold text-[#888888]">
                                  Next Rank:
                                </div>
                                <div className="text-[11px] text-[#aaaaaa] leading-snug">
                                  {nextDesc}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
