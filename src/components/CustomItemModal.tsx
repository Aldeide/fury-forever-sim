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
      weaponType: isWeapon ? weaponType : undefined,
      speed: isWeapon ? speed : undefined,
      minDmg: isWeapon ? minDmg : undefined,
      maxDmg: isWeapon ? maxDmg : undefined,
      dps: isWeapon ? +(((minDmg + maxDmg) / 2) / speed).toFixed(1) : undefined,
    };

    onSaveCustomItem(customItem);
    onClose();
  };

  const handleExport = () => {
    const json = onExportGearJson();
    setExportedJsonText(json);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    try {
      onImportGearJson(importJsonText);
      onClose();
    } catch (e) {
      alert('Invalid JSON format!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100">
              Custom Item &amp; Configuration Manager
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Item
          </button>
          <button
            onClick={() => {
              setActiveTab('importExport');
              handleExport();
            }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'importExport'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Import / Export JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cryptstalker Warblade"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Slot</label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value as EquipmentSlot)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {ALL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ItemQuality)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="epic">Epic (Purple)</option>
                    <option value="rare">Rare (Blue)</option>
                    <option value="legendary">Legendary (Orange)</option>
                    <option value="uncommon">Uncommon (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phase</label>
                  <input
                    type="text"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                  Item Attributes
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[11px] text-slate-400 block">Strength</label>
                    <input
                      type="number"
                      value={str}
                      onChange={(e) => setStr(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Agility</label>
                    <input
                      type="number"
                      value={agi}
                      onChange={(e) => setAgi(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Attack Power</label>
                    <input
                      type="number"
                      value={ap}
                      onChange={(e) => setAp(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Crit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={crit}
                      onChange={(e) => setCrit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={hit}
                      onChange={(e) => setHit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-amber-400 block font-bold">OH Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={ohHit}
                      onChange={(e) => setOhHit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">Haste %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={haste}
                      onChange={(e) => setHaste(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block">+Weapon Skill</label>
                    <input
                      type="number"
                      value={weaponSkill}
                      onChange={(e) => setWeaponSkill(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {isWeapon && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                    Weapon Properties
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[11px] text-slate-400 block">Weapon Type</label>
                      <select
                        value={weaponType}
                        onChange={(e) => setWeaponType(e.target.value as WeaponType)}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                      >
                        {WEAPON_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Speed (s)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Min Damage</label>
                      <input
                        type="number"
                        value={minDmg}
                        onChange={(e) => setMinDmg(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block">Max Damage</label>
                      <input
                        type="number"
                        value={maxDmg}
                        onChange={(e) => setMaxDmg(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Export Current Build &amp; Custom Items
                </label>
                <textarea
                  readOnly
                  value={exportedJsonText}
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Import Profile / Items JSON
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste exported profile JSON here..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleImport}
                  className="mt-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                >
                  Import Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
