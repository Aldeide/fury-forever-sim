import React, { useState } from 'react';
import { EquipmentSlot, ItemStats, EnchantInfo } from '../types/sim';
import { getWowheadIconUrl } from '../utils/wowhead';
import { X } from 'lucide-react';

interface PaperDollProps {
  gear: Partial<Record<EquipmentSlot, ItemStats | null>>;
  enchants: Partial<Record<EquipmentSlot, EnchantInfo | null>>;
  selectedSlot: EquipmentSlot;
  onSelectSlot: (slot: EquipmentSlot) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  currentPresetId?: string;
  onSelectPreset?: (presetId: string) => void;
  presets?: { id: string; name: string; description?: string }[];
  onSavePreset?: (name: string) => void;
  onDeletePreset?: (presetId: string) => void;
}

const ALL_SLOTS: { id: EquipmentSlot; label: string }[] = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'shoulder', label: 'Shoulders' },
  { id: 'back', label: 'Back' },
  { id: 'chest', label: 'Chest' },
  { id: 'wrist', label: 'Wrists' },
  { id: 'hands', label: 'Hands' },
  { id: 'waist', label: 'Waist' },
  { id: 'legs', label: 'Legs' },
  { id: 'feet', label: 'Feet' },
  { id: 'ring1', label: 'Ring 1' },
  { id: 'ring2', label: 'Ring 2' },
  { id: 'trinket1', label: 'Trinket 1' },
  { id: 'trinket2', label: 'Trinket 2' },
  { id: 'mainhand', label: 'Main Hand' },
  { id: 'offhand', label: 'Off Hand' },
  { id: 'ranged', label: 'Ranged' },
];

export const PaperDoll: React.FC<PaperDollProps> = ({
  gear,
  selectedSlot,
  onSelectSlot,
  onUnequip,
  currentPresetId,
  onSelectPreset,
  presets = [],
  onSavePreset,
  onDeletePreset,
}) => {
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const isTwoHandEquipped = !!(
    gear.mainhand &&
    (gear.mainhand.slot === 'twohand' || (gear.mainhand as any).itemType === '2H')
  );

  return (
    <div className="w-full bg-white p-2.5 flex flex-col h-full select-none overflow-y-auto">
      <div className="text-[11px] uppercase tracking-wider font-bold text-[#666666] px-2 mb-1.5">
        Equipment Slots
      </div>

      <div className="flex flex-col space-y-1">
        {ALL_SLOTS.map(({ id, label }) => {
          const item = gear[id];
          const isSelected = selectedSlot === id;
          const isOffHandDisabled = id === 'offhand' && isTwoHandEquipped;

          return (
            <button
              key={id}
              disabled={isOffHandDisabled}
              onClick={() => onSelectSlot(id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all text-xs ${
                isOffHandDisabled
                  ? 'opacity-50 bg-[#f5f5f5] text-[#888888] cursor-not-allowed border border-dashed border-[#cccccc]'
                  : isSelected
                  ? 'bg-[#1861ac] text-white font-medium shadow-sm'
                  : 'text-[#222222] hover:bg-[#eeeeee]'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-1">
                {/* 20x20 Wowhead Icon Frame */}
                <div
                  className={`w-5 h-5 rounded shrink-0 border overflow-hidden flex items-center justify-center text-[9px] ${
                    item && !isOffHandDisabled
                      ? 'border-[#999999] bg-black'
                      : 'border-dashed border-[#cccccc] bg-[#f9f9f9] text-[#888888]'
                  }`}
                >
                  {item && !isOffHandDisabled ? (
                    <img
                      src={getWowheadIconUrl(item.icon, 'small')}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{label.charAt(0)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate font-semibold leading-tight flex items-center gap-1.5">
                    <span>{label}</span>
                    {id === 'mainhand' && isTwoHandEquipped && (
                      <span className="text-[9px] bg-[#d93025] text-white px-1 py-0.2 rounded font-sans font-bold">
                        2H
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] truncate leading-tight ${
                      isOffHandDisabled
                        ? 'text-[#999999] italic'
                        : isSelected
                        ? 'text-white/80'
                        : 'text-[#666666]'
                    }`}
                  >
                    {isOffHandDisabled
                      ? 'Two-Handed Equipped'
                      : item
                      ? item.name
                      : 'Empty'}
                  </div>
                </div>
              </div>

              {/* Quick Unequip Button */}
              {item && !isOffHandDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnequip(id);
                  }}
                  title="Unequip slot"
                  className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
                    isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-red-100 text-red-600'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Gear Presets Section */}
      <div className="mt-3 pt-2.5 border-t border-[#dddddd]">
        <div className="text-[11px] uppercase tracking-wider font-bold text-[#666666] px-1 mb-1.5">
          Gear Presets
        </div>

        {presets && presets.length > 0 && (
          <div>
            <select
              value={currentPresetId || ''}
              onChange={(e) => onSelectPreset?.(e.target.value)}
              className="w-full bg-white border border-[#cccccc] rounded px-2 py-1 text-xs text-black focus:outline-none focus:border-[#1861ac]"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Save & Delete Preset Controls */}
            {isSavingPreset ? (
              <div className="flex gap-1 mt-1.5">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1 min-w-0 bg-white border border-[#cccccc] rounded px-1.5 py-0.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPresetName.trim() && onSavePreset) {
                      onSavePreset(newPresetName.trim());
                      setNewPresetName('');
                      setIsSavingPreset(false);
                    } else if (e.key === 'Escape') {
                      setIsSavingPreset(false);
                      setNewPresetName('');
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPresetName.trim() && onSavePreset) {
                      onSavePreset(newPresetName.trim());
                      setNewPresetName('');
                      setIsSavingPreset(false);
                    }
                  }}
                  className="px-2 py-0.5 bg-[#1861ac] hover:bg-[#144e8c] text-white rounded text-xs font-semibold shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSavingPreset(false);
                    setNewPresetName('');
                  }}
                  className="px-1.5 py-0.5 bg-[#eeeeee] hover:bg-[#e0e0e0] border border-[#cccccc] text-black rounded text-xs shrink-0"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1.5">
                {onSavePreset && (
                  <button
                    type="button"
                    onClick={() => setIsSavingPreset(true)}
                    className="flex-1 py-1 px-2 rounded bg-white hover:bg-[#f0f0f0] border border-[#cccccc] text-[11px] font-semibold text-black transition-colors"
                  >
                    + Save Preset
                  </button>
                )}
                {onDeletePreset && (
                  <button
                    type="button"
                    onClick={() => currentPresetId && onDeletePreset(currentPresetId)}
                    disabled={presets.length <= 1}
                    title="Delete current preset"
                    className="py-1 px-2 rounded bg-white hover:bg-red-50 border border-[#cccccc] text-[11px] font-semibold text-[#b33939] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    🗑 Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
