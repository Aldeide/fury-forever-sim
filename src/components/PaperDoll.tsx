import React from 'react';
import { EquipmentSlot, ItemStats, EnchantInfo, ItemQuality } from '../types/sim';
import { Shield, Sparkles, X, ChevronDown } from 'lucide-react';

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

const QUALITY_COLORS: Record<ItemQuality, { border: string; text: string; bg: string }> = {
  legendary: { border: 'border-[#ff8000]/70', text: 'text-[#ff8000]', bg: 'bg-[#ff8000]/10' },
  epic: { border: 'border-[#a335ee]/70', text: 'text-[#a335ee]', bg: 'bg-[#a335ee]/10' },
  rare: { border: 'border-[#0070dd]/70', text: 'text-[#0070dd]', bg: 'bg-[#0070dd]/10' },
  uncommon: { border: 'border-[#1eff00]/70', text: 'text-[#1eff00]', bg: 'bg-[#1eff00]/10' },
  common: { border: 'border-[#44474e]/60', text: 'text-[#e2e2e9]', bg: 'bg-[#1d2024]' },
  poor: { border: 'border-[#44474e]/40', text: 'text-[#8e9099]', bg: 'bg-[#191c20]' },
};

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  head: 'Head',
  neck: 'Neck',
  shoulder: 'Shoulder',
  back: 'Back',
  chest: 'Chest',
  wrist: 'Wrist',
  hands: 'Hands',
  waist: 'Waist',
  legs: 'Legs',
  feet: 'Feet',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  trinket1: 'Trinket 1',
  trinket2: 'Trinket 2',
  mainhand: 'Main Hand',
  offhand: 'Off Hand',
  twohand: '2-Hand Weapon',
  ranged: 'Ranged',
};

const LEFT_SLOTS: EquipmentSlot[] = ['head', 'neck', 'shoulder', 'back', 'chest', 'wrist'];
const RIGHT_SLOTS: EquipmentSlot[] = ['hands', 'waist', 'legs', 'feet', 'ring1', 'ring2', 'trinket1', 'trinket2'];
const BOTTOM_SLOTS: EquipmentSlot[] = ['mainhand', 'offhand', 'twohand', 'ranged'];

export const PaperDoll: React.FC<PaperDollProps> = ({
  gear,
  enchants,
  selectedSlot,
  onSelectSlot,
  onUnequip,
  currentPresetId,
  onSelectPreset,
  presets = [],
}) => {
  const renderSlotCard = (slot: EquipmentSlot) => {
    const item = gear[slot];
    const enchant = enchants[slot];
    const isSelected = selectedSlot === slot;
    const quality = item?.quality || 'common';
    const styling = item ? QUALITY_COLORS[quality] : null;

    // Stat summary for item
    let statPreview = '';
    if (item) {
      const parts: string[] = [];
      if (item.str) parts.push(`+${item.str} Str`);
      if (item.agi) parts.push(`+${item.agi} Agi`);
      if (item.ap) parts.push(`+${item.ap} AP`);
      if (item.crit) parts.push(`+${item.crit}% Crit`);
      if (item.hit) parts.push(`+${item.hit}% Hit`);
      if (item.ohHit) parts.push(`+${item.ohHit}% OH Hit`);
      if (item.haste) parts.push(`+${item.haste}% Haste`);
      if (item.weaponSkill) parts.push(`+${item.weaponSkill} Skill`);
      if (item.speed) parts.push(`${item.speed}s (${item.dps} DPS)`);
      statPreview = parts.slice(0, 3).join(' • ');
    }

    return (
      <div
        key={slot}
        onClick={() => onSelectSlot(slot)}
        className={`group relative flex items-center p-2 rounded-xl cursor-pointer border transition-all duration-150 select-none ${
          isSelected
            ? 'ring-2 ring-[#a8c7fa] border-[#a8c7fa] bg-[#284777]/35 shadow-sm'
            : item
            ? `${styling?.border} ${styling?.bg} hover:border-[#a8c7fa]/60 hover:bg-[#282a2f]/60`
            : 'border-[#44474e]/30 bg-[#1d2024]/60 hover:border-[#44474e]/60 hover:bg-[#282a2f]/40'
        }`}
      >
        {/* Slot Icon or Item Quality Box */}
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 mr-2.5 text-xs font-bold overflow-hidden ${
            item
              ? `${styling?.border} bg-[#111318] shadow-inner`
              : 'border-dashed border-[#44474e]/50 text-[#8e9099] bg-[#111318]/60'
          }`}
        >
          {item ? (
            item.icon ? (
              <img
                src={item.icon}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span className={styling?.text}>
                {item.itemType === '2H' ? '2H' : slot.slice(0, 2).toUpperCase()}
              </span>
            )
          ) : (
            <span className="text-[10px] uppercase text-[#8e9099] font-mono">{slot.slice(0, 3)}</span>
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8e9099]">
              {SLOT_LABELS[slot]}
            </span>
            {item?.phase && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#111318] text-[#a8c7fa] font-mono border border-[#44474e]/30">
                {item.phase}
              </span>
            )}
          </div>

          <div
            className={`text-xs font-semibold truncate ${
              item ? styling?.text : 'text-[#8e9099] italic'
            }`}
          >
            {item ? item.name : 'Empty Slot'}
          </div>

          {item && statPreview && (
            <div className="text-[10px] text-[#c4c6d0] truncate mt-0.5 font-mono">
              {statPreview}
            </div>
          )}

          {enchant && (
            <div className="flex items-center text-[10px] text-[#81c995] truncate mt-0.5">
              <Sparkles className="w-2.5 h-2.5 mr-1 shrink-0 text-[#81c995]" />
              <span className="truncate">{enchant.name}</span>
            </div>
          )}
        </div>

        {/* Unequip Button on Hover */}
        {item && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnequip(slot);
            }}
            title="Unequip item"
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-[#8c1d18]/50 hover:text-[#f28b82] text-[#8e9099] transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col h-full">
      {/* Paper-Doll Header & Preset Selector */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#44474e]/30">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#284777]/40 text-[#a8c7fa]">
            <Shield className="w-4 h-4" />
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#d6e3ff]">
            Equipment Frame
          </h2>
        </div>

        {presets.length > 0 && onSelectPreset && (
          <div className="relative">
            <select
              value={currentPresetId || ''}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="appearance-none bg-[#1d2024] border border-[#44474e]/50 hover:border-[#a8c7fa] text-[#d6e3ff] text-xs rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] cursor-pointer transition-all font-medium"
            >
              <option value="" disabled>
                Select Gear Preset...
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#a8c7fa] absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Classic 2-Column Equipment Layout */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-1">
        {/* Left Column (Head to Wrist) */}
        <div className="space-y-2">
          {LEFT_SLOTS.map(renderSlotCard)}
        </div>

        {/* Right Column (Hands to Trinket 2) */}
        <div className="space-y-2">
          {RIGHT_SLOTS.map(renderSlotCard)}
        </div>
      </div>

      {/* Bottom Row Weapons (Main Hand, Off Hand, 2-Hand, Ranged) */}
      <div className="pt-3 mt-3 border-t border-[#44474e]/30">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-[#8e9099] mb-2 flex items-center justify-between">
          <span>Weapons &amp; Ranged</span>
          <span className="text-[9px] font-mono text-[#a8c7fa]">Anti-Queue BiS Active</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BOTTOM_SLOTS.map(renderSlotCard)}
        </div>
      </div>
    </div>
  );
};
