import React, { useState, useMemo } from 'react';
import {
  EquipmentSlot,
  ItemStats,
  EnchantInfo,
  ItemQuality,
  BatchItemResult,
} from '../types/sim';
import {
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  PlusCircle,
  ArrowUpDown,
} from 'lucide-react';

interface SlotTableProps {
  selectedSlot: EquipmentSlot;
  equippedItem: ItemStats | null;
  equippedEnchant: EnchantInfo | null;
  availableItems: ItemStats[];
  availableEnchants: EnchantInfo[];
  batchResults: Record<string, BatchItemResult>;
  isSimulating: boolean;
  simulationProgress?: { completed: number; total: number; pct: number } | null;
  onEquipItem: (slot: EquipmentSlot, item: ItemStats) => void;
  onApplyEnchant: (slot: EquipmentSlot, enchant: EnchantInfo) => void;
  onSimulateAllInSlot: (slot: EquipmentSlot, items: ItemStats[]) => void;
  onOpenCustomItemModal: () => void;
}

const QUALITY_TEXT_COLORS: Record<ItemQuality, string> = {
  legendary: 'text-amber-400 font-semibold',
  epic: 'text-purple-400 font-semibold',
  rare: 'text-blue-400 font-medium',
  uncommon: 'text-emerald-400',
  common: 'text-slate-200',
  poor: 'text-neutral-400',
};

const QUALITY_BORDER_COLORS: Record<ItemQuality, string> = {
  legendary: 'border-amber-500',
  epic: 'border-purple-500',
  rare: 'border-blue-500',
  uncommon: 'border-emerald-500',
  common: 'border-slate-600',
  poor: 'border-neutral-600',
};

export const SlotTable: React.FC<SlotTableProps> = ({
  selectedSlot,
  equippedItem,
  equippedEnchant,
  availableItems,
  availableEnchants,
  batchResults,
  isSimulating,
  simulationProgress,
  onEquipItem,
  onApplyEnchant,
  onSimulateAllInSlot,
  onOpenCustomItemModal,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'enchants'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'simDps' | 'name' | 'str' | 'ap' | 'crit'>('simDps');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (phaseFilter !== 'all' && item.phase !== phaseFilter) {
        return false;
      }
      return true;
    });
  }, [availableItems, searchTerm, phaseFilter]);

  // Sort items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aBatch = batchResults[a.id];
      const bBatch = batchResults[b.id];

      if (sortBy === 'simDps') {
        const aDps = aBatch ? (aBatch.meanDps ?? aBatch.dps ?? 0) : a.id === equippedItem?.id ? 1000 : 0;
        const bDps = bBatch ? (bBatch.meanDps ?? bBatch.dps ?? 0) : b.id === equippedItem?.id ? 1000 : 0;
        return sortAsc ? aDps - bDps : bDps - aDps;
      }
      if (sortBy === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'str') {
        return sortAsc ? (a.str || 0) - (b.str || 0) : (b.str || 0) - (a.str || 0);
      }
      if (sortBy === 'ap') {
        return sortAsc ? (a.ap || 0) - (b.ap || 0) : (b.ap || 0) - (a.ap || 0);
      }
      if (sortBy === 'crit') {
        return sortAsc ? (a.crit || 0) - (b.crit || 0) : (b.crit || 0) - (a.crit || 0);
      }
      return 0;
    });
  }, [filteredItems, batchResults, equippedItem, sortBy, sortAsc]);

  // Max DPS Delta for visual bar scale
  const maxAbsDelta = useMemo(() => {
    let max = 10;
    for (const key in batchResults) {
      const delta = batchResults[key].deltaDps ?? batchResults[key].dpsDelta ?? 0;
      const abs = Math.abs(delta);
      if (abs > max) max = abs;
    }
    return max;
  }, [batchResults]);

  const toggleSort = (field: 'simDps' | 'name' | 'str' | 'ap' | 'crit') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const isWeaponSlot = selectedSlot === 'mainhand' || selectedSlot === 'offhand' || selectedSlot === 'twohand' || selectedSlot === 'ranged';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === 'items'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Equipment ({availableItems.length})
            </button>
            <button
              onClick={() => setActiveTab('enchants')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center transition-colors ${
                activeTab === 'enchants'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Enchants ({availableEnchants.length})
            </button>
          </div>

          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest pl-2">
            Slot: <span className="text-amber-400 font-bold">{selectedSlot}</span>
          </span>
        </div>

        {/* Guybrush-Style Batch Simulate Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSimulateAllInSlot(selectedSlot, availableItems)}
            disabled={isSimulating || availableItems.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg transition-all ${
              isSimulating
                ? 'bg-amber-600/50 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : 'text-slate-950 fill-current'}`} />
            <span>{isSimulating ? 'Simulating Batch...' : '⚡ Simulate All in Slot'}</span>
          </button>

          <button
            onClick={onOpenCustomItemModal}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 transition-colors"
            title="Create Custom Item"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Custom Item</span>
          </button>
        </div>
      </div>

      {/* Progress Bar during Batch Simulation */}
      {isSimulating && simulationProgress && (
        <div className="mb-3 bg-slate-950 border border-amber-500/40 rounded-lg p-2.5 animate-pulse">
          <div className="flex justify-between text-xs font-mono mb-1 text-amber-300">
            <span>Evaluating Candidate Items...</span>
            <span>
              {simulationProgress.completed} / {simulationProgress.total} ({simulationProgress.pct}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-400 h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${simulationProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item name, source, stats..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Content Phases</option>
            <option value="WoW: Forever">WoW: Forever (Nov 4 Launch)</option>
            <option value="Phase 1">Phase 1 (MC / Onyxia / Pre-BiS)</option>
            <option value="Phase 3">Phase 3 (BWL)</option>
            <option value="Phase 5">Phase 5 (AQ40)</option>
            <option value="Phase 6">Phase 6 (Naxxramas)</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950/60">
        {activeTab === 'items' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="p-2 w-8 text-center">Status</th>
                <th
                  onClick={() => toggleSort('name')}
                  className="p-2 cursor-pointer hover:text-amber-300 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Item Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2 hidden md:table-cell">Source / Phase</th>
                {isWeaponSlot && <th className="p-2">Speed / DPS</th>}
                <th
                  onClick={() => toggleSort('str')}
                  className="p-2 cursor-pointer hover:text-amber-300 text-right"
                >
                  Str
                </th>
                <th className="p-2 text-right">Agi</th>
                <th
                  onClick={() => toggleSort('ap')}
                  className="p-2 cursor-pointer hover:text-amber-300 text-right"
                >
                  AP
                </th>
                <th
                  onClick={() => toggleSort('crit')}
                  className="p-2 cursor-pointer hover:text-amber-300 text-right"
                >
                  Crit
                </th>
                <th className="p-2 text-right">Hit</th>
                <th className="p-2 text-right text-amber-400" title="WoW: Forever Off-Hand Hit">
                  OH Hit
                </th>
                <th className="p-2 text-right">Haste</th>
                <th
                  onClick={() => toggleSort('simDps')}
                  className="p-2 cursor-pointer hover:text-amber-300 text-right font-bold text-amber-400 bg-amber-950/20"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>⚡ SIM DPS</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="p-2 text-right pr-4 font-bold">Δ DPS (BiS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-slate-500 italic">
                    No items found for slot &quot;{selectedSlot}&quot; with active filters.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const isEquipped = item.id === equippedItem?.id;
                  const batch = batchResults[item.id];
                  const quality = item.quality || 'common';
                  const dpsVal = batch ? (batch.meanDps ?? batch.dps ?? 0) : 0;
                  const dpsDelta = batch ? (batch.deltaDps ?? batch.dpsDelta ?? 0) : 0;
                  const isUpgrade = dpsDelta > 0;
                  const isDowngrade = dpsDelta < 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onEquipItem(selectedSlot, item)}
                      className={`cursor-pointer transition-colors hover:bg-slate-800/60 ${
                        isEquipped ? 'bg-amber-950/25 border-l-2 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="p-2 text-center">
                        {isEquipped ? (
                          <span
                            title="Equipped"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50"
                          >
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 block" />
                        )}
                      </td>

                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 text-[10px] bg-slate-900 ${
                              QUALITY_BORDER_COLORS[quality]
                            }`}
                          >
                            {item.icon ? (
                              <img
                                src={item.icon}
                                alt={item.name}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span>{item.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <span className={QUALITY_TEXT_COLORS[quality]}>{item.name}</span>
                            {item.isCustom && (
                              <span className="ml-1.5 px-1 py-0.2 text-[9px] rounded bg-purple-900/60 text-purple-300 font-mono">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-2 hidden md:table-cell">
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {item.source || '-'}
                        </div>
                        {item.phase && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-amber-300/80 font-mono">
                            {item.phase}
                          </span>
                        )}
                      </td>

                      {isWeaponSlot && (
                        <td className="p-2 font-mono text-[11px] text-slate-300">
                          {item.speed ? `${item.speed}s • ${item.dps} DPS` : '-'}
                        </td>
                      )}

                      <td className="p-2 text-right font-mono text-slate-300">
                        {item.str ? `+${item.str}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {item.agi ? `+${item.agi}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {item.ap ? `+${item.ap}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-amber-400">
                        {item.crit ? `+${item.crit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {item.hit ? `+${item.hit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-amber-300 font-bold">
                        {item.ohHit ? `+${item.ohHit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {item.haste ? `+${item.haste}%` : '-'}
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-amber-400 bg-amber-950/10">
                        {batch ? dpsVal.toFixed(1) : '-'}
                      </td>

                      <td className="p-2 text-right pr-4">
                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Equipped
                          </span>
                        ) : batch ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  isUpgrade ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                                style={{
                                  width: `${Math.min(100, (Math.abs(dpsDelta) / maxAbsDelta) * 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                                isUpgrade
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : isDowngrade
                                  ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                  : 'text-slate-400'
                              }`}
                            >
                              {dpsDelta > 0 ? `+${dpsDelta}` : dpsDelta}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-3 space-y-2">
            {availableEnchants.length === 0 ? (
              <div className="p-6 text-center text-slate-500 italic">
                No enchants available for {selectedSlot}.
              </div>
            ) : (
              availableEnchants.map((ench) => {
                const isEquippedEnchant = equippedEnchant?.id === ench.id;
                return (
                  <div
                    key={ench.id}
                    onClick={() => onApplyEnchant(selectedSlot, ench)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isEquippedEnchant
                        ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-emerald-300">{ench.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {ench.description || 'Stat upgrade'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isEquippedEnchant ? (
                        <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                          Active
                        </span>
                      ) : (
                        <button className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                          Apply Enchant
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
