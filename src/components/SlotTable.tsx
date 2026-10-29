import React, { useState, useMemo } from 'react';
import {
  EquipmentSlot,
  ItemStats,
  EnchantInfo,
  ItemQuality,
  BatchItemResult,
} from '../types/sim';
import { getWowheadIconUrl, getWowheadItemUrl } from '../utils/wowhead';
import {
  Zap,
  Sparkles,
  Search,
  Filter,
  Check,
  PlusCircle,
  ArrowUpDown,
  ExternalLink,
  Trash2,
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
  uncommon: 'text-[#1eff00] font-medium',
  common: 'text-[#000000]',
  poor: 'text-[#666666]',
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

  const slotTitle =
    selectedSlot === 'mainhand'
      ? 'Main Hand'
      : selectedSlot === 'offhand'
      ? 'Off Hand'
      : selectedSlot === 'twohand'
      ? 'Two-Hand Weapon'
      : selectedSlot.charAt(0).toUpperCase() + selectedSlot.slice(1);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pl-3 bg-white text-black">
      {/* Header Row: Slot Title & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#dddddd]">
        <div>
          <h2 className="text-xl font-normal text-black capitalize">
            {slotTitle}
          </h2>
          <p className="text-[11px] text-[#666666]">
            {filteredItems.length} items available &bull; Click any item row to equip
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Simulate All in Slot Button (WrathWarrior style) */}
          <button
            onClick={() => onSimulateAllInSlot(selectedSlot, availableItems)}
            disabled={isSimulating || availableItems.length === 0}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-sm ${
              isSimulating
                ? 'bg-[#1861ac]/50 cursor-not-allowed'
                : 'bg-[#1861ac] hover:bg-[#144e8c] active:bg-[#0f3c6d]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse' : 'fill-current'}`} />
            <span>{isSimulating ? 'Simulating...' : 'Batch Sim Slot'}</span>
          </button>

          {/* Import / Custom Item Button */}
          <button
            onClick={onOpenCustomItemModal}
            className="flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-semibold border border-[#cccccc] bg-[#f8f9fa] hover:bg-[#eeeeee] text-[#333333] transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#1861ac]" />
            <span>+ Import Wowhead / Custom</span>
          </button>
        </div>
      </div>

      {/* Enchant Selector Row (WrathWarrior enchants.css style) */}
      {availableEnchants.length > 0 && (
        <div className="flex items-center gap-3 py-2 px-3 bg-[#f8f9fa] border border-[#dddddd] rounded mb-2 text-xs">
          <span className="font-semibold text-black shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#1861ac]" />
            <span>Enchant:</span>
          </span>

          <select
            value={equippedEnchant?.id || ''}
            onChange={(e) => {
              const ench = availableEnchants.find((en) => en.id === e.target.value);
              if (ench) onApplyEnchant(selectedSlot, ench);
            }}
            className="bg-white border border-[#ced4da] rounded px-2.5 py-1 text-xs text-black focus:outline-none focus:border-[#1861ac] flex-1 max-w-sm"
          >
            <option value="">(No enchant applied)</option>
            {availableEnchants.map((ench) => (
              <option key={ench.id} value={ench.id}>
                {ench.name} {ench.description ? `(${ench.description})` : ''}
              </option>
            ))}
          </select>

          {equippedEnchant && (
            <span className="text-[11px] text-[#26b050] font-semibold">
              ✓ Active
            </span>
          )}
        </div>
      )}

      {/* Progress Bar during Batch Simulation */}
      {isSimulating && simulationProgress && (
        <div className="mb-2 bg-[#f0f4f8] border border-[#1861ac] rounded p-2 text-xs">
          <div className="flex justify-between text-[#1861ac] font-mono font-medium mb-1">
            <span>Batch Simulating Candidate Items...</span>
            <span>
              {simulationProgress.completed} / {simulationProgress.total} ({simulationProgress.pct}%)
            </span>
          </div>
          <div className="w-full bg-[#dddddd] rounded h-1.5 overflow-hidden">
            <div
              className="bg-[#1861ac] h-1.5 transition-all duration-150"
              style={{ width: `${simulationProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-[#888888] absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items by name, source..."
            className="w-full bg-white border border-[#cccccc] rounded pl-8 pr-3 py-1 text-xs text-black placeholder-[#888888] focus:outline-none focus:border-[#1861ac]"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <Filter className="w-3.5 h-3.5 text-[#666666]" />
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-white border border-[#cccccc] text-[#333333] text-xs rounded px-2.5 py-1 focus:outline-none focus:border-[#1861ac]"
          >
            <option value="all">All Content Phases</option>
            <option value="WoW: Forever">WoW: Forever (Launch)</option>
            <option value="Phase 1">Phase 1 (MC / Onyxia)</option>
            <option value="Phase 3">Phase 3 (BWL)</option>
            <option value="Phase 5">Phase 5 (AQ40)</option>
            <option value="Phase 6">Phase 6 (Naxxramas)</option>
          </select>
        </div>
      </div>

      {/* Main Items Table (WrathWarrior app.css style) */}
      <div className="flex-1 overflow-y-auto border border-[#dddddd] bg-white">
        <table className="ww-table w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="w-7 text-center"></th>
              <th
                onClick={() => toggleSort('name')}
                className="cursor-pointer hover:underline"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="hidden md:table-cell">Source / Phase</th>
              {isWeaponSlot && <th>Speed / DPS</th>}
              <th
                onClick={() => toggleSort('str')}
                className="cursor-pointer hover:underline text-right"
              >
                Str
              </th>
              <th className="text-right">Agi</th>
              <th className="text-right">Sta</th>
              <th
                onClick={() => toggleSort('ap')}
                className="cursor-pointer hover:underline text-right"
              >
                AP
              </th>
              <th
                onClick={() => toggleSort('crit')}
                className="cursor-pointer hover:underline text-right"
              >
                Crit %
              </th>
              <th className="text-right">Hit %</th>
              <th className="text-right text-[#1861ac] font-bold" title="WoW: Forever Off-Hand Hit">
                OH Hit %
              </th>
              <th className="text-right">Haste %</th>
              <th
                onClick={() => toggleSort('simDps')}
                className="cursor-pointer hover:underline text-right font-bold text-[#1861ac]"
              >
                SIM DPS
              </th>
              <th className="text-right pr-4 font-bold">Δ DPS (BiS)</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={14} className="p-6 text-center text-[#888888] italic">
                  No items found for slot &quot;{selectedSlot}&quot;.
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
                    className={`ww-item-row ${isEquipped ? 'equipped' : ''}`}
                  >
                    <td className="p-1.5 text-center">
                      {isEquipped && (
                        <Check className="w-4 h-4 text-[#1861ac] stroke-[3] inline" />
                      )}
                    </td>

                    <td className="p-1.5">
                      <div className="flex items-center space-x-2">
                        {/* 26x26 Wowhead Icon */}
                        <div className="w-6 h-6 rounded border border-[#aaaaaa] shrink-0 overflow-hidden bg-black flex items-center justify-center">
                          <img
                            src={getWowheadIconUrl(item.icon, 'small')}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="flex items-center">
                          <span className={QUALITY_TEXT_COLORS[quality]}>{item.name}</span>
                          {item.isCustom && (
                            <span className="ml-1 px-1 py-0.2 text-[9px] rounded bg-[#4f378b] text-white font-mono">
                              Custom
                            </span>
                          )}
                          <a
                            href={getWowheadItemUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="View on Wowhead"
                            className="text-[#666666] hover:text-[#1861ac] inline-flex items-center ml-1 p-0.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </td>

                    <td className="p-1.5 hidden md:table-cell text-[11px] text-[#555555]">
                      {item.source || item.phase || '-'}
                    </td>

                    {isWeaponSlot && (
                      <td className="p-1.5 font-mono text-[11px] text-[#444444]">
                        {item.speed ? `${item.speed}s • ${item.dps} DPS` : '-'}
                      </td>
                    )}

                    <td className="p-1.5 text-right font-mono">{item.str || '-'}</td>
                    <td className="p-1.5 text-right font-mono">{item.agi || '-'}</td>
                    <td className="p-1.5 text-right font-mono">{item.sta || '-'}</td>
                    <td className="p-1.5 text-right font-mono font-medium">{item.ap || '-'}</td>
                    <td className="p-1.5 text-right font-mono">{item.crit ? `${item.crit}%` : '-'}</td>
                    <td className="p-1.5 text-right font-mono">{item.hit ? `${item.hit}%` : '-'}</td>
                    <td className="p-1.5 text-right font-mono text-[#1861ac] font-bold">
                      {item.ohHit ? `+${item.ohHit}%` : '-'}
                    </td>
                    <td className="p-1.5 text-right font-mono">{item.haste ? `${item.haste}%` : '-'}</td>

                    <td className="p-1.5 text-right font-mono font-bold text-[#1861ac]">
                      {batch ? dpsVal.toFixed(1) : '-'}
                    </td>

                    <td className="p-1.5 text-right pr-4 font-mono font-bold">
                      {isEquipped ? (
                        <span className="text-[#1861ac] text-[11px]">Equipped</span>
                      ) : batch ? (
                        <span
                          className={
                            isUpgrade
                              ? 'text-[#26b050]'
                              : isDowngrade
                              ? 'text-red-600'
                              : 'text-[#666666]'
                          }
                        >
                          {dpsDelta > 0 ? `+${dpsDelta}` : dpsDelta}
                        </span>
                      ) : (
                        <span className="text-[#999999]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
