import React, { useState } from 'react';
import { ItemStats, EquipmentSlot, ItemQuality, WeaponType } from '../types/sim';
import { X, Sparkles } from 'lucide-react';

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomItem: (item: ItemStats) => void;
  onImportGearJson: (jsonStr: string) => void;
  onExportGearJson: () => string;
  defaultSlot: EquipmentSlot;
}

const ALL_SLOTS: EquipmentSlot[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'wrist',
  'hands',
  'waist',
  'legs',
  'feet',
  'ring1',
  'ring2',
  'trinket1',
  'trinket2',
  'mainhand',
  'offhand',
  'twohand',
  'ranged',
];

const WEAPON_TYPES: { label: string; value: WeaponType }[] = [
  { label: 'Sword (1H)', value: 'sword' },
  { label: 'Axe (1H)', value: 'axe' },
  { label: 'Mace (1H)', value: 'mace' },
  { label: 'Dagger', value: 'dagger' },
  { label: 'Fist Weapon', value: 'fist' },
  { label: 'Two-Hand Sword', value: 'twohand_sword' },
  { label: 'Two-Hand Axe', value: 'twohand_axe' },
  { label: 'Two-Hand Mace', value: 'twohand_mace' },
  { label: 'Polearm', value: 'polearm' },
  { label: 'Bow', value: 'bow' },
  { label: 'Crossbow', value: 'crossbow' },
  { label: 'Gun', value: 'gun' },
];

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomItem,
  onImportGearJson,
  onExportGearJson,
  defaultSlot,
}) => {
  const [name, setName] = useState('');
  const [slot, setSlot] = useState<EquipmentSlot>(defaultSlot || 'mainhand');
  const [quality, setQuality] = useState<ItemQuality>('epic');
  const [source, setSource] = useState('Karazhan Crypts (WoW: Forever)');
  const [phase, setPhase] = useState('WoW: Forever');
  const [str, setStr] = useState<number>(0);
  const [agi, setAgi] = useState<number>(0);
  const [ap, setAp] = useState<number>(0);
  const [crit, setCrit] = useState<number>(0);
  const [hit, setHit] = useState<number>(0);
  const [ohHit, setOhHit] = useState<number>(0);
  const [haste, setHaste] = useState<number>(0);
  const [weaponSkill, setWeaponSkill] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(2.6);
  const [minDmg, setMinDmg] = useState<number>(100);
  const [maxDmg, setMaxDmg] = useState<number>(190);
  const [weaponType, setWeaponType] = useState<WeaponType>('sword');

  const [importJsonText, setImportJsonText] = useState('');
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'importExport'>('create');

  if (!isOpen) return null;

  const isWeapon = slot === 'mainhand' || slot === 'offhand' || slot === 'twohand' || slot === 'ranged';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const customItem: ItemStats = {
      id: `custom_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name: name.trim(),
      slot,
      quality,
      source,
      phase,
      isCustom: true,
      str: str || undefined,
      agi: agi || undefined,
      ap: ap || undefined,
      crit: crit || undefined,
      hit: hit || undefined,
      ohHit: ohHit || undefined,
      haste: haste || undefined,
      weaponSkill: weaponSkill || undefined,
      speed: isWeapon ? speed : undefined,
      minDmg: isWeapon ? minDmg : undefined,
      maxDmg: isWeapon ? maxDmg : undefined,
      dps: isWeapon ? +(((minDmg + maxDmg) / 2 / speed).toFixed(1)) : undefined,
      weaponType: isWeapon ? weaponType : undefined,
    };

    onSaveCustomItem(customItem);
    onClose();
  };

  const handleExport = () => {
    const jsonStr = onExportGearJson();
    setExportedJsonText(jsonStr);
  };

  const handleImport = () => {
    try {
      if (!importJsonText.trim()) return;
      onImportGearJson(importJsonText);
      alert('Gear profile successfully imported!');
      onClose();
    } catch (err) {
      alert('Failed to parse JSON gear configuration: ' + err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1d2024] border border-[#44474e]/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-[#44474e]/30">
          <div className="flex bg-[#111318] p-1 rounded-full border border-[#44474e]/40">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'create'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9]'
              }`}
            >
              Create Custom Item
            </button>
            <button
              onClick={() => {
                setActiveTab('importExport');
                handleExport();
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === 'importExport'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9]'
              }`}
            >
              Import / Export JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#282a2f] text-[#8e9099] hover:text-[#e2e2e9] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#c4c6d0] block mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grim Bastion of Kharazan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-3 py-2 text-xs text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#c4c6d0] block mb-1">Slot</label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value as EquipmentSlot)}
                    className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-3 py-2 text-xs text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                  >
                    {ALL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#c4c6d0] block mb-1">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ItemQuality)}
                    className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-3 py-2 text-xs text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                  >
                    <option value="epic">Epic (Purple)</option>
                    <option value="rare">Rare (Blue)</option>
                    <option value="legendary">Legendary (Orange)</option>
                    <option value="uncommon">Uncommon (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#c4c6d0] block mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-3 py-2 text-xs text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#c4c6d0] block mb-1">Phase</label>
                  <input
                    type="text"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-3 py-2 text-xs text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="pt-3 border-t border-[#44474e]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa] block mb-2.5">
                  Item Attributes
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Strength</label>
                    <input
                      type="number"
                      value={str}
                      onChange={(e) => setStr(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Agility</label>
                    <input
                      type="number"
                      value={agi}
                      onChange={(e) => setAgi(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Attack Power</label>
                    <input
                      type="number"
                      value={ap}
                      onChange={(e) => setAp(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Crit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={crit}
                      onChange={(e) => setCrit(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={hit}
                      onChange={(e) => setHit(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#a8c7fa] block font-bold">OH Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={ohHit}
                      onChange={(e) => setOhHit(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#a8c7fa]/40 rounded-xl px-2.5 py-1.5 text-[#a8c7fa] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">Haste %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={haste}
                      onChange={(e) => setHaste(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8e9099] block">+Weapon Skill</label>
                    <input
                      type="number"
                      value={weaponSkill}
                      onChange={(e) => setWeaponSkill(Number(e.target.value))}
                      className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                    />
                  </div>
                </div>
              </div>

              {isWeapon && (
                <div className="pt-3 border-t border-[#44474e]/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a8c7fa] block mb-2.5">
                    Weapon Properties
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div>
                      <label className="text-[11px] text-[#8e9099] block">Weapon Type</label>
                      <select
                        value={weaponType}
                        onChange={(e) => setWeaponType(e.target.value as WeaponType)}
                        className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                      >
                        {WEAPON_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#8e9099] block">Speed (sec)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#8e9099] block">Min Damage</label>
                      <input
                        type="number"
                        value={minDmg}
                        onChange={(e) => setMinDmg(Number(e.target.value))}
                        className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#8e9099] block">Max Damage</label>
                      <input
                        type="number"
                        value={maxDmg}
                        onChange={(e) => setMaxDmg(Number(e.target.value))}
                        className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl px-2.5 py-1.5 text-[#e2e2e9]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#44474e]/30">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-[#282a2f] text-[#c4c6d0] hover:bg-[#33353a] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#062e6f] shadow-sm transition-all"
                >
                  Save &amp; Equip
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#a8c7fa] uppercase tracking-wider block mb-1">
                  Export Current Character Configuration (JSON)
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={exportedJsonText}
                  className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl p-3 text-xs font-mono text-[#c4c6d0] focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportedJsonText);
                    alert('Copied to clipboard!');
                  }}
                  className="mt-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full bg-[#284777] text-[#d6e3ff] hover:bg-[#34588e] transition-all"
                >
                  Copy JSON to Clipboard
                </button>
              </div>

              <div className="pt-3 border-t border-[#44474e]/30">
                <label className="text-xs font-bold text-[#a8c7fa] uppercase tracking-wider block mb-1">
                  Import Profile (Paste JSON)
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste previously exported JSON configuration here..."
                  className="w-full bg-[#111318] border border-[#44474e]/40 rounded-xl p-3 text-xs font-mono text-[#e2e2e9] focus:outline-none focus:border-[#a8c7fa]"
                />
                <button
                  onClick={handleImport}
                  className="mt-1.5 px-4 py-1.5 text-xs font-bold uppercase rounded-full bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#062e6f] shadow-sm transition-all"
                >
                  Load Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
