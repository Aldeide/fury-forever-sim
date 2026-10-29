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
  legendary: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-950/20' },
  epic: { border: 'border-purple-500', text: 'text-purple-400', bg: 'bg-purple-950/20' },
  rare: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-950/20' },
  uncommon: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-950/20' },
  common: { border: 'border-slate-500', text: 'text-slate-300', bg: 'bg-slate-900/40' },
  poor: { border: 'border-neutral-600', text: 'text-neutral-400', bg: 'bg-neutral-900/40' },
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
        className={`group relative flex items-center p-2 rounded-lg cursor-pointer border transition-all duration-150 select-none ${
          isSelected
            ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-900/30'
            : item
            ? `${styling?.border} ${styling?.bg} hover:border-amber-500/70 hover:bg-slate-800/80`
            : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-800/40'
        }`}
      >
        {/* Slot Icon or Item Quality Box */}
        <div
          className={`w-10 h-10 rounded border flex items-center justify-center shrink-0 mr-2.5 text-xs font-bold overflow-hidden ${
            item
              ? `${styling?.border} bg-slate-950 shadow-inner`
              : 'border-dashed border-slate-700 text-slate-500 bg-slate-950/60'
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
            <span className="text-[10px] uppercase text-slate-500">{slot.slice(0, 3)}</span>
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {SLOT_LABELS[slot]}
            </span>
            {item?.phase && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-amber-300 font-mono">
                {item.phase}
              </span>
            )}
          </div>

          <div
            className={`text-xs font-medium truncate ${
              item ? styling?.text : 'text-slate-500 italic'
            }`}
          >
            {item ? item.name : 'Empty Slot'}
          </div>

          {item && statPreview && (
            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              {statPreview}
            </div>
          )}

          {enchant && (
            <div className="flex items-center text-[10px] text-emerald-400 truncate mt-0.5">
              <Sparkles className="w-2.5 h-2.5 mr-1 shrink-0" />
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
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-950/60 hover:text-red-400 text-slate-500 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Paper-Doll Header & Preset Selector */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Equipment Frame
          </h2>
        </div>

        {presets.length > 0 && onSelectPreset && (
          <div className="relative">
            <select
              value={currentPresetId || ''}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 hover:border-amber-500 text-amber-300 text-xs rounded-lg pl-2.5 pr-7 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
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
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Classic 2-Column Equipment Layout */}
      <div className="grid grid-cols-2 gap-2.5 flex-1 overflow-y-auto pr-1">
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
      <div className="pt-3 mt-3 border-t border-slate-800">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
          Weapons & Ranged
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BOTTOM_SLOTS.map(renderSlotCard)}
        </div>
      </div>
    </div>
  );
};
