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
  legendary: 'text-[#ff8000] font-semibold',
  epic: 'text-[#a335ee] font-semibold',
  rare: 'text-[#0070dd] font-medium',
  uncommon: 'text-[#1eff00]',
  common: 'text-[#e2e2e9]',
  poor: 'text-[#8e9099]',
};

const QUALITY_BORDER_COLORS: Record<ItemQuality, string> = {
  legendary: 'border-[#ff8000]/60',
  epic: 'border-[#a335ee]/60',
  rare: 'border-[#0070dd]/60',
  uncommon: 'border-[#1eff00]/60',
  common: 'border-[#44474e]/50',
  poor: 'border-[#44474e]/30',
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

  const isWeaponSlot =
    selectedSlot === 'mainhand' ||
    selectedSlot === 'offhand' ||
    selectedSlot === 'twohand' ||
    selectedSlot === 'ranged';

  return (
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col h-full">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#44474e]/30">
        <div className="flex items-center space-x-2.5">
          <div className="flex bg-[#111318] p-1 rounded-full border border-[#44474e]/40">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'items'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9]'
              }`}
            >
              Equipment ({availableItems.length})
            </button>
            <button
              onClick={() => setActiveTab('enchants')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center transition-all ${
                activeTab === 'enchants'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9]'
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Enchants ({availableEnchants.length})
            </button>
          </div>

          <span className="text-xs font-mono text-[#8e9099] uppercase tracking-widest pl-1">
            Slot: <span className="text-[#a8c7fa] font-bold">{selectedSlot}</span>
          </span>
        </div>

        {/* Batch Simulate Button & Custom Item */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSimulateAllInSlot(selectedSlot, availableItems)}
            disabled={isSimulating || availableItems.length === 0}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
              isSimulating
                ? 'bg-[#284777]/50 text-[#8e9099] cursor-not-allowed'
                : 'bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#062e6f] hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : 'text-[#062e6f] fill-current'}`} />
            <span>{isSimulating ? 'Simulating...' : 'Simulate All in Slot'}</span>
          </button>

          <button
            onClick={onOpenCustomItemModal}
            className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium border border-[#44474e]/50 bg-[#1d2024] hover:bg-[#282a2f] text-[#c4c6d0] hover:text-[#e2e2e9] transition-all"
            title="Create Custom Item"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="hidden sm:inline">Custom Item</span>
          </button>
        </div>
      </div>

      {/* Progress Bar during Batch Simulation */}
      {isSimulating && simulationProgress && (
        <div className="mb-3 bg-[#111318] border border-[#a8c7fa]/40 rounded-xl p-2.5 shadow-sm animate-pulse">
          <div className="flex justify-between text-xs font-mono mb-1 text-[#d6e3ff]">
            <span>Evaluating Candidate Items in Slot...</span>
            <span>
              {simulationProgress.completed} / {simulationProgress.total} ({simulationProgress.pct}%)
            </span>
          </div>
          <div className="w-full bg-[#1d2024] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#a8c7fa] h-1.5 rounded-full transition-all duration-150"
              style={{ width: `${simulationProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-[#8e9099] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item name, source, stats..."
            className="w-full bg-[#111318] border border-[#44474e]/40 rounded-full pl-8 pr-3 py-1.5 text-xs text-[#e2e2e9] placeholder-[#8e9099] focus:outline-none focus:border-[#a8c7fa] font-mono transition-all"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-[#8e9099]" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-[#111318] border border-[#44474e]/40 text-[#c4c6d0] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#a8c7fa] cursor-pointer"
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
      <div className="flex-1 overflow-y-auto border border-[#44474e]/30 rounded-xl bg-[#111318]/60">
        {activeTab === 'items' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#191c20] text-[#8e9099] uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-[#44474e]/40 font-mono">
              <tr>
                <th className="p-2 w-8 text-center">Status</th>
                <th
                  onClick={() => toggleSort('name')}
                  className="p-2 cursor-pointer hover:text-[#a8c7fa] transition-colors"
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
                  className="p-2 cursor-pointer hover:text-[#a8c7fa] text-right"
                >
                  Str
                </th>
                <th className="p-2 text-right">Agi</th>
                <th
                  onClick={() => toggleSort('ap')}
                  className="p-2 cursor-pointer hover:text-[#a8c7fa] text-right"
                >
                  AP
                </th>
                <th
                  onClick={() => toggleSort('crit')}
                  className="p-2 cursor-pointer hover:text-[#a8c7fa] text-right"
                >
                  Crit
                </th>
                <th className="p-2 text-right">Hit</th>
                <th className="p-2 text-right text-[#a8c7fa]" title="WoW: Forever Off-Hand Hit">
                  OH Hit
                </th>
                <th className="p-2 text-right">Haste</th>
                <th
                  onClick={() => toggleSort('simDps')}
                  className="p-2 cursor-pointer hover:text-[#a8c7fa] text-right font-bold text-[#a8c7fa] bg-[#284777]/20"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>SIM DPS</span>
                    <ArrowUpDown className="w-3 h-3 text-[#a8c7fa]" />
                  </div>
                </th>
                <th className="p-2 text-right pr-4 font-bold">Δ DPS (BiS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#44474e]/20">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-6 text-center text-[#8e9099] italic">
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
                      className={`cursor-pointer transition-colors hover:bg-[#282a2f]/40 ${
                        isEquipped ? 'bg-[#284777]/20 border-l-2 border-l-[#a8c7fa]' : ''
                      }`}
                    >
                      <td className="p-2 text-center">
                        {isEquipped ? (
                          <span
                            title="Equipped"
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#284777] text-[#a8c7fa] border border-[#a8c7fa]/40"
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
                            className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 text-[10px] bg-[#111318] ${
                              QUALITY_BORDER_COLORS[quality]
                            }`}
                          >
                            {item.icon ? (
                              <img
                                src={item.icon}
                                alt={item.name}
                                className="w-full h-full object-cover rounded-md"
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
                              <span className="ml-1.5 px-1.5 py-0.2 text-[9px] rounded-full bg-[#4f378b] text-[#eddcff] font-mono">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-2 hidden md:table-cell">
                        <div className="text-[11px] text-[#8e9099] truncate max-w-[140px]">
                          {item.source || '-'}
                        </div>
                        {item.phase && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1d2024] text-[#a8c7fa] font-mono border border-[#44474e]/30">
                            {item.phase}
                          </span>
                        )}
                      </td>

                      {isWeaponSlot && (
                        <td className="p-2 font-mono text-[11px] text-[#c4c6d0]">
                          {item.speed ? `${item.speed}s • ${item.dps} DPS` : '-'}
                        </td>
                      )}

                      <td className="p-2 text-right font-mono text-[#c4c6d0]">
                        {item.str ? `+${item.str}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#c4c6d0]">
                        {item.agi ? `+${item.agi}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#c4c6d0]">
                        {item.ap ? `+${item.ap}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#81c995]">
                        {item.crit ? `+${item.crit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#c4c6d0]">
                        {item.hit ? `+${item.hit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#a8c7fa] font-bold">
                        {item.ohHit ? `+${item.ohHit}%` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-[#c4c6d0]">
                        {item.haste ? `+${item.haste}%` : '-'}
                      </td>

                      <td className="p-2 text-right font-mono font-bold text-[#a8c7fa] bg-[#284777]/10">
                        {batch ? dpsVal.toFixed(1) : '-'}
                      </td>

                      <td className="p-2 text-right pr-4">
                        {isEquipped ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40">
                            Equipped
                          </span>
                        ) : batch ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <div className="w-12 h-1.5 bg-[#1d2024] rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  isUpgrade ? 'bg-[#81c995]' : 'bg-[#f28b82]'
                                }`}
                                style={{
                                  width: `${Math.min(100, (Math.abs(dpsDelta) / maxAbsDelta) * 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                                isUpgrade
                                  ? 'bg-[#0f5223] text-[#81c995] border border-[#81c995]/40'
                                  : isDowngrade
                                  ? 'bg-[#8c1d18] text-[#f28b82] border border-[#f28b82]/40'
                                  : 'text-[#8e9099]'
                              }`}
                            >
                              {dpsDelta > 0 ? `+${dpsDelta}` : dpsDelta}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#8e9099] font-mono text-[11px]">-</span>
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
              <div className="p-6 text-center text-[#8e9099] italic">
                No enchants available for {selectedSlot}.
              </div>
            ) : (
              availableEnchants.map((ench) => {
                const isEquippedEnchant = equippedEnchant?.id === ench.id;
                return (
                  <div
                    key={ench.id}
                    onClick={() => onApplyEnchant(selectedSlot, ench)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isEquippedEnchant
                        ? 'bg-[#0f5223]/30 border-[#81c995]/80 ring-1 ring-[#81c995]'
                        : 'bg-[#191c20] border-[#44474e]/30 hover:border-[#44474e]/70 hover:bg-[#282a2f]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0f5223]/40 border border-[#81c995]/40 flex items-center justify-center text-[#81c995]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#81c995]">{ench.name}</div>
                        <div className="text-xs text-[#c4c6d0] font-mono">
                          {ench.description || 'Stat upgrade'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isEquippedEnchant ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0f5223] text-[#81c995] border border-[#81c995]/50">
                          Active
                        </span>
                      ) : (
                        <button className="px-3 py-1 rounded-full text-xs font-medium bg-[#1d2024] hover:bg-[#282a2f] text-[#c4c6d0] border border-[#44474e]/40">
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
