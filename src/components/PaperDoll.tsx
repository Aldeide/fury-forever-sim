import React from 'react';
import { EquipmentSlot, ItemStats, EnchantInfo, ItemQuality } from '../types/sim';
import { getWowheadIconUrl } from '../utils/wowhead';
import { X, Sparkles } from 'lucide-react';

interface PaperDollProps {
  gear: Partial<Record<EquipmentSlot, ItemStats | null>>;
  enchants: Partial<Record<EquipmentSlot, EnchantInfo | null>>;
  selectedSlot: EquipmentSlot;
  onSelectSlot: (slot: EquipmentSlot) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  currentPresetId?: string;
  onSelectPreset?: (presetId: string) => void;
  presets?: { id: string; name: string; description?: string }[];
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
  { id: 'twohand', label: 'Two-Hand' },
  { id: 'ranged', label: 'Ranged' },
];

export const PaperDoll: React.FC<PaperDollProps> = ({
  gear,
  enchants,
  selectedSlot,
  onSelectSlot,
  onUnequip,
}) => {
  return (
    <div className="w-[190px] shrink-0 border-r border-[#dddddd] pr-2 flex flex-col h-full overflow-y-auto select-none">
      <div className="text-[11px] uppercase tracking-wider font-bold text-[#666666] px-2 mb-1.5">
        Equipment Slots
      </div>

      <div className="flex flex-col space-y-1">
        {ALL_SLOTS.map(({ id, label }) => {
          const item = gear[id];
          const isSelected = selectedSlot === id;

          return (
            <button
              key={id}
              onClick={() => onSelectSlot(id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-all text-xs ${
                isSelected
                  ? 'bg-[#1861ac] text-white font-medium shadow-sm'
                  : 'text-[#222222] hover:bg-[#eeeeee]'
              }`}
            >
              <div className="flex items-center space-x-2 min-w-0 pr-1">
                {/* 22x22 Wowhead Icon Frame */}
                <div
                  className={`w-5 h-5 rounded shrink-0 border overflow-hidden flex items-center justify-center text-[9px] ${
                    item
                      ? 'border-[#999999] bg-black'
                      : 'border-dashed border-[#cccccc] bg-[#f9f9f9] text-[#888888]'
                  }`}
                >
                  {item ? (
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
                  <div className="truncate font-semibold leading-tight">{label}</div>
                  <div
                    className={`text-[10px] truncate leading-tight ${
                      isSelected ? 'text-white/80' : 'text-[#666666]'
                    }`}
                  >
                    {item ? item.name : 'Empty'}
                  </div>
                </div>
              </div>

              {/* Quick Unequip Button */}
              {item && (
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
    </div>
  );
};
