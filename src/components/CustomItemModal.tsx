import React, { useState } from 'react';
import { ItemStats, EquipmentSlot, ItemQuality, WeaponType } from '../types/sim';
import { fetchWowheadItemByIdOrUrl, getWowheadIconUrl } from '../utils/wowhead';
import { X, Download, AlertCircle } from 'lucide-react';

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
  const [icon, setIcon] = useState('inv_sword_39');
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

  const [wowheadInput, setWowheadInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [importJsonText, setImportJsonText] = useState('');
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'importExport'>('create');

  if (!isOpen) return null;

  const isWeapon = slot === 'mainhand' || slot === 'offhand' || slot === 'twohand' || slot === 'ranged';

  const handleWowheadImport = async () => {
    if (!wowheadInput.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const itemData = await fetchWowheadItemByIdOrUrl(wowheadInput.trim(), slot);
      if (itemData.name) setName(itemData.name);
      if (itemData.slot) setSlot(itemData.slot as EquipmentSlot);
      if (itemData.quality) setQuality(itemData.quality);
      if (itemData.source) setSource(itemData.source);
      if (itemData.phase) setPhase(itemData.phase);
      if (itemData.icon) setIcon(itemData.icon);
      if (itemData.str !== undefined) setStr(itemData.str);
      if (itemData.agi !== undefined) setAgi(itemData.agi);
      if (itemData.ap !== undefined) setAp(itemData.ap);
      if (itemData.crit !== undefined) setCrit(itemData.crit);
      if (itemData.hit !== undefined) setHit(itemData.hit);
      if (itemData.ohHit !== undefined) setOhHit(itemData.ohHit);
      if (itemData.haste !== undefined) setHaste(itemData.haste);
      if (itemData.weaponSkill !== undefined) setWeaponSkill(itemData.weaponSkill);
      if (itemData.speed !== undefined) setSpeed(itemData.speed);
      if (itemData.minDmg !== undefined) setMinDmg(itemData.minDmg);
      if (itemData.maxDmg !== undefined) setMaxDmg(itemData.maxDmg);
      if (itemData.weaponType !== undefined) setWeaponType(itemData.weaponType as WeaponType);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import item from Wowhead');
    } finally {
      setIsImporting(false);
    }
  };

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
      icon: icon || undefined,
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-black border border-[#d5d5d5] rounded shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col font-sans">
        {/* Header & Tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-[#cccccc]">
          <div className="flex bg-[#eeeeee] p-1 rounded border border-[#cccccc]">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'create'
                  ? 'bg-[#1861ac] text-white shadow-sm'
                  : 'text-black hover:bg-[#dddddd]'
              }`}
            >
              Create Custom Item
            </button>
            <button
              onClick={() => {
                setActiveTab('importExport');
                handleExport();
              }}
              className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'importExport'
                  ? 'bg-[#1861ac] text-white shadow-sm'
                  : 'text-black hover:bg-[#dddddd]'
              }`}
            >
              Import / Export JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#eeeeee] text-[#666666] hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Quick Import from Wowhead Header Bar */}
              <div className="bg-[#eeeeee] border border-[#d5d5d5] rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-[#1861ac]" />
                    <span>Quick Import from Wowhead</span>
                  </span>
                  <span className="text-[10px] text-[#666666]">
                    Accepts Item ID or Wowhead URL
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wowheadInput}
                    onChange={(e) => setWowheadInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleWowheadImport();
                      }
                    }}
                    placeholder="Paste Wowhead Item URL or ID (e.g. 19019 or classic/item=19364)..."
                    className="flex-1 bg-white border border-[#cccccc] rounded px-3 py-1.5 text-xs text-black placeholder-[#888888] focus:outline-none focus:border-[#1861ac]"
                  />
                  <button
                    type="button"
                    onClick={handleWowheadImport}
                    disabled={isImporting || !wowheadInput.trim()}
                    className="px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#1861ac] hover:bg-[#144e8c] text-white shadow-sm transition-all shrink-0 disabled:opacity-50"
                  >
                    {isImporting ? 'Fetching...' : 'Import'}
                  </button>
                </div>

                {importError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#b33939] font-medium pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-black">
                      Item Name *
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                      <span>Icon:</span>
                      <img
                        src={getWowheadIconUrl(icon, 'small')}
                        alt="icon preview"
                        className="w-5 h-5 border border-[#cccccc] object-cover"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grim Bastion of Karazhan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Slot</label>
                  <select
                    value={slot}
                    onChange={(e) => setSlot(e.target.value as EquipmentSlot)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  >
                    {ALL_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ItemQuality)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  >
                    <option value="epic">Epic (Purple)</option>
                    <option value="rare">Rare (Blue)</option>
                    <option value="legendary">Legendary (Orange)</option>
                    <option value="uncommon">Uncommon (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Source</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Phase</label>
                  <input
                    type="text"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="pt-3 border-t border-[#cccccc]">
                <span className="text-xs font-bold uppercase tracking-wider text-black block mb-2.5">
                  Item Attributes
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-sans tabular-nums">
                  <div>
                    <label className="text-[11px] text-[#555555] block">Strength</label>
                    <input
                      type="number"
                      value={str}
                      onChange={(e) => setStr(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">Agility</label>
                    <input
                      type="number"
                      value={agi}
                      onChange={(e) => setAgi(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">Attack Power</label>
                    <input
                      type="number"
                      value={ap}
                      onChange={(e) => setAp(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">Crit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={crit}
                      onChange={(e) => setCrit(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={hit}
                      onChange={(e) => setHit(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#1861ac] block font-bold">OH Hit %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={ohHit}
                      onChange={(e) => setOhHit(Number(e.target.value))}
                      className="w-full bg-white border border-[#1861ac] rounded px-2.5 py-1.5 text-[#1861ac] font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">Haste %</label>
                    <input
                      type="number"
                      step={0.1}
                      value={haste}
                      onChange={(e) => setHaste(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#555555] block">+Weapon Skill</label>
                    <input
                      type="number"
                      value={weaponSkill}
                      onChange={(e) => setWeaponSkill(Number(e.target.value))}
                      className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                    />
                  </div>
                </div>
              </div>

              {isWeapon && (
                <div className="pt-3 border-t border-[#cccccc]">
                  <span className="text-xs font-bold uppercase tracking-wider text-black block mb-2.5">
                    Weapon Properties
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-sans tabular-nums">
                    <div>
                      <label className="text-[11px] text-[#555555] block">Weapon Type</label>
                      <select
                        value={weaponType}
                        onChange={(e) => setWeaponType(e.target.value as WeaponType)}
                        className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                      >
                        {WEAPON_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#555555] block">Speed (sec)</label>
                      <input
                        type="number"
                        step={0.1}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#555555] block">Min Damage</label>
                      <input
                        type="number"
                        value={minDmg}
                        onChange={(e) => setMinDmg(Number(e.target.value))}
                        className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#555555] block">Max Damage</label>
                      <input
                        type="number"
                        value={maxDmg}
                        onChange={(e) => setMaxDmg(Number(e.target.value))}
                        className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1.5 text-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#cccccc]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded text-xs font-semibold bg-[#eeeeee] text-black border border-[#cccccc] hover:bg-[#dddddd] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded text-xs font-bold uppercase tracking-wider bg-[#1861ac] hover:bg-[#144e8c] text-white shadow-sm transition-all"
                >
                  Save &amp; Equip
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1">
                  Export Current Character Configuration (JSON)
                </label>
                <textarea
                  readOnly
                  rows={6}
                  value={exportedJsonText}
                  className="w-full bg-white border border-[#cccccc] rounded p-3 text-xs font-mono text-black focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportedJsonText);
                    alert('Copied to clipboard!');
                  }}
                  className="mt-1.5 px-3.5 py-1.5 text-xs font-medium rounded bg-[#1861ac] text-white hover:bg-[#144e8c] transition-all"
                >
                  Copy JSON to Clipboard
                </button>
              </div>

              <div className="pt-3 border-t border-[#cccccc]">
                <label className="text-xs font-bold text-black uppercase tracking-wider block mb-1">
                  Import Profile (Paste JSON)
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste previously exported JSON configuration here..."
                  className="w-full bg-white border border-[#cccccc] rounded p-3 text-xs font-mono text-black focus:outline-none focus:border-[#1861ac]"
                />
                <button
                  onClick={handleImport}
                  className="mt-1.5 px-4 py-1.5 text-xs font-bold uppercase rounded bg-[#1861ac] hover:bg-[#144e8c] text-white shadow-sm transition-all"
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
