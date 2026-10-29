import React from 'react';
import { BuffConfig, EncounterConfig, Race } from '../types/sim';
import { BUFFS_DATABASE } from '../data/buffs';
import { getWowheadIconUrl } from '../utils/wowhead';
import {
  Shield,
  Flame,
  Swords,
  Sliders,
  Check,
  CheckCircle2,
  Info,
  Clock,
  Target,
  Users,
} from 'lucide-react';

export interface RaceRacialDefinition {
  id: Race;
  name: string;
  faction: 'Alliance' | 'Horde' | 'Neutral';
  racialsSummary: string;
  keyPerk: string;
  details: string[];
}

export const WOW_FOREVER_RACES: RaceRacialDefinition[] = [
  {
    id: 'orc',
    name: 'Orc',
    faction: 'Horde',
    racialsSummary: 'Blood Fury (+10% AP for 15s, 2m CD) • Hardiness (-20% Stun) • Command (+5% Pet Dmg)',
    keyPerk: 'Blood Fury (+10% AP, 2m CD)',
    details: [
      'Blood Fury: +10% Base Attack Power for 15s (2 min CD)',
      'Hardiness: -20% Stun duration and +20% Stun resist',
      'Command: +5% Pet damage',
    ],
  },
  {
    id: 'human',
    name: 'Human',
    faction: 'Alliance',
    racialsSummary: 'Ruthless (+1% Crit) • The Human Spirit (+10% Spirit) • Will to Survive',
    keyPerk: 'Ruthless (+1% Crit)',
    details: [
      'Ruthless: +1% Critical Strike chance on all physical attacks',
      'The Human Spirit: +10% Spirit',
      'Will to Survive: Removes Stun & Charm effects',
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    faction: 'Alliance',
    racialsSummary: "Artisan's Precision (+1% Hit) • Stoneform (-10% Phys Dmg, 8s) • Big Game Hunter (+5% vs Beasts)",
    keyPerk: "Artisan's Precision (+1% Hit)",
    details: [
      "Artisan's Precision: +1% Physical Hit chance",
      'Stoneform: -10% Physical Damage taken for 8s & Bleed/Poison immunity',
      'Big Game Hunter: +5% Damage against Beasts',
    ],
  },
  {
    id: 'night_elf',
    name: 'Night Elf',
    faction: 'Alliance',
    racialsSummary: "Elune's Light (+10% Crit for 15s, 3m CD) • Quickness (+1% Dodge, +2% Speed) • Shadowmeld",
    keyPerk: "Elune's Light (+10% Crit, 3m CD)",
    details: [
      "Elune's Light: +10% Critical Strike for 15s (3 min CD)",
      'Quickness: +1% Dodge, +2% Movement Speed',
      'Shadowmeld: Stealth out of combat',
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    faction: 'Alliance',
    racialsSummary: 'Expansive Mind (105 Max Rage) • Eureka! (+10% Dmg & -Cost on next 3 abilities) • Escape Artist',
    keyPerk: 'Expansive Mind (105 Max Rage) & Eureka!',
    details: [
      'Expansive Mind: Max Rage increased from 100 to 105',
      'Eureka!: Next 3 special abilities deal +10% damage & cost 5 less rage',
      'Escape Artist: Break immobilizing effects',
    ],
  },
  {
    id: 'troll',
    name: 'Troll',
    faction: 'Horde',
    racialsSummary: 'Berserking (+10% Haste for 15s, 3m CD) • Regeneration (20% Combat Regen) • Beast Slaying',
    keyPerk: 'Berserking (+10% Haste, 3m CD)',
    details: [
      'Berserking: +10% Attack Speed / Haste for 15s (3 min CD)',
      'Regeneration: 20% Health regen continues during combat',
      'Beast Slaying: +5% Damage against Beasts',
    ],
  },
  {
    id: 'tauren',
    name: 'Tauren',
    faction: 'Horde',
    racialsSummary: 'Endurance (+5% Total Health) • War Stomp (90s CD) • Plainsrunning (up to 60% Speed)',
    keyPerk: 'Endurance (+5% Total Health)',
    details: [
      'Endurance: +5% Total Maximum Health',
      'War Stomp: Stun up to 5 nearby enemies (90s CD)',
      'Plainsrunning: Seamless travel speed bonus',
    ],
  },
  {
    id: 'undead',
    name: 'Undead',
    faction: 'Horde',
    racialsSummary: 'Touch of the Grave (Shadow Drain Proc, 15s ICD) • Will of the Forsaken • Cannibalize',
    keyPerk: 'Touch of the Grave (Shadow Drain)',
    details: [
      'Touch of the Grave: Attacks have chance to drain life dealing Shadow damage (15s ICD)',
      'Will of the Forsaken: Immune to Fear, Sleep, and Charm',
      'Cannibalize: Regenerate 7% total health per 2s',
    ],
  },
  {
    id: 'skyborne_elf',
    name: 'Skyborne',
    faction: 'Neutral',
    racialsSummary: 'Wind-Blessed (+2% Haste) • Elemental Insight (+5% vs Elementals) • Walk on Air',
    keyPerk: 'Wind-Blessed (+2% Passive Haste)',
    details: [
      'Wind-Blessed: +2% Attack Speed / Haste permanently',
      'Elemental Insight: +5% Damage against Elementals',
      'Walk on Air: Slow fall and water-walking trait',
    ],
  },
];

interface BuffsPanelProps {
  buffs: BuffConfig;
  encounter: EncounterConfig;
  race: Race;
  onBuffChange: (buffs: BuffConfig) => void;
  onEncounterChange: (encounter: EncounterConfig) => void;
  onRaceChange: (race: Race) => void;
}

export const BuffsPanel: React.FC<BuffsPanelProps> = ({
  buffs,
  encounter,
  race,
  onBuffChange,
  onEncounterChange,
  onRaceChange,
}) => {
  // Normalize race string to match WOW_FOREVER_RACES id
  const normalizedRaceKey = String(race).toLowerCase().replace(/[^a-z]/g, '');
  const activeRaceInfo =
    WOW_FOREVER_RACES.find((r) => r.id.toLowerCase().replace(/[^a-z]/g, '') === normalizedRaceKey) ||
    WOW_FOREVER_RACES[0];

  const toggleBuff = (id: string) => {
    onBuffChange({
      ...buffs,
      [id]: !buffs[id],
    });
  };

  const setNumericBuff = (id: string, val: number) => {
    onBuffChange({
      ...buffs,
      [id]: val,
    });
  };

  const selectAllRaidBuffsAndConsumes = () => {
    const updated = { ...buffs };
    // Turn on all raid, consumable, and weapon buffs
    BUFFS_DATABASE.filter(
      (b) => b.category === 'raid' || b.category === 'consumable' || b.category === 'weapon'
    ).forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = b.max || 5;
      } else {
        updated[b.id] = true;
      }
    });
    // Set 5 sunder armor & curse of recklessness
    updated.sunderArmor = 5;
    updated.curseOfRecklessness = true;
    updated.faerieFire = true;
    onBuffChange(updated);
  };

  const clearAllConsumesAndBuffs = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.filter((b) => b.category !== 'world').forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = 0;
      } else {
        updated[b.id] = false;
      }
    });
    onBuffChange(updated);
  };

  const renderBuffCategory = (
    title: string,
    category: 'consumable' | 'weapon' | 'raid' | 'debuff',
    icon: React.ReactNode
  ) => {
    const items = BUFFS_DATABASE.filter((b) => b.category === category);

    return (
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#44474e]/30 pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#a8c7fa]">
            <span className="p-1 rounded-lg bg-[#284777]/30 text-[#a8c7fa]">{icon}</span>
            <span>{title}</span>
          </div>
          <span className="text-[11px] text-[#8e9099] font-mono bg-[#191c20] px-2.5 py-0.5 rounded-full border border-[#44474e]/30">
            {items.filter((b) => !!buffs[b.id]).length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((item) => {
            const isChecked = !!buffs[item.id];
            const isNumeric = item.type === 'number';

            return (
              <div
                key={item.id}
                onClick={() => !isNumeric && toggleBuff(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  isChecked
                    ? 'bg-[#284777]/30 border-[#a8c7fa]/60 text-[#e2e2e9] shadow-sm'
                    : 'bg-[#191c20] border-[#44474e]/30 text-[#8e9099] hover:border-[#44474e]/70 hover:bg-[#282a2f]/50'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden ${
                      isChecked
                        ? 'border-[#a8c7fa]/70 bg-[#111318]'
                        : 'border-[#44474e]/40 bg-[#111318]'
                    }`}
                  >
                    <img
                      src={getWowheadIconUrl(item.icon, 'medium')}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <span className="hidden text-xs font-bold text-[#8e9099]">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-xs font-semibold truncate ${isChecked ? 'text-[#e2e2e9]' : 'text-[#c4c6d0]'}`}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#8e9099] truncate font-sans">
                      {item.description}
                    </div>
                  </div>
                </div>

                {isNumeric ? (
                  <select
                    value={Number(buffs[item.id] || 0)}
                    onChange={(e) => setNumericBuff(item.id, Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#111318] border border-[#44474e]/50 text-[#a8c7fa] text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-[#a8c7fa]"
                  >
                    {Array.from({ length: (item.max || 5) + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      isChecked
                        ? 'bg-[#a8c7fa] border-[#a8c7fa] text-[#062e6f]'
                        : 'border-[#44474e]/60 bg-[#111318]'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#191c20] border border-[#44474e]/30 rounded-2xl p-4 shadow-sm flex flex-col h-full space-y-4 overflow-y-auto">
      {/* Material 3 Tonal Info Banner: WoW: Forever Raid Ruleset */}
      <div className="bg-[#1d2024] border border-[#a8c7fa]/30 rounded-2xl p-4 flex items-start gap-3.5 shadow-sm">
        <div className="w-9 h-9 rounded-full bg-[#284777] text-[#a8c7fa] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Info className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-[#d6e3ff] uppercase tracking-wider text-xs">
              WoW: Forever Raid Ruleset
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0f5223] text-[#81c995] border border-[#81c995]/30">
              World Buffs Disabled
            </span>
          </div>
          <p className="text-xs text-[#c4c6d0] leading-relaxed">
            Classic World Buffs (<span className="text-[#a8c7fa] italic font-medium">Rallying Cry, Warchief's Blessing, Songflower, Dire Maul Tribute, Spirit of Zandalar</span>) are disabled inside raid instances. Raid encounters are balanced around Party/Raid Buffs, Consumables, and Boss Debuffs.
          </p>
        </div>
      </div>

      {/* Race & Encounter Settings Bar */}
      <div className="bg-[#1d2024] border border-[#44474e]/40 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* Race Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#a8c7fa] mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Character Race &amp; Racials</span>
            </label>
            <select
              value={activeRaceInfo.id}
              onChange={(e) => onRaceChange(e.target.value as Race)}
              className="w-full bg-[#111318] border border-[#44474e]/50 hover:border-[#a8c7fa] text-[#e2e2e9] text-xs rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] transition-all cursor-pointer"
            >
              {WOW_FOREVER_RACES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.faction}) &bull; {r.keyPerk}
                </option>
              ))}
            </select>
          </div>

          {/* Fight Duration Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#a8c7fa] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Fight Duration</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] bg-[#284777]/40 px-2 py-0.5 rounded-full border border-[#a8c7fa]/30">
                {encounter.duration || encounter.durationSec || 60} seconds
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={180}
              step={5}
              value={encounter.duration || encounter.durationSec || 60}
              onChange={(e) => {
                const val = Number(e.target.value);
                onEncounterChange({ ...encounter, duration: val, durationSec: val });
              }}
              className="w-full cursor-pointer mt-2"
            />
          </div>

          {/* Boss Target Level & Armor */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#a8c7fa] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Boss Target Level</span>
              </label>
              <span className="text-xs font-mono font-bold text-[#d6e3ff] bg-[#284777]/40 px-2 py-0.5 rounded-full border border-[#a8c7fa]/30">
                Level {encounter.targetLevel || encounter.bossLevel || 63} (315 Def)
              </span>
            </div>
            <select
              value={encounter.targetLevel || encounter.bossLevel || 63}
              onChange={(e) => {
                const lvl = Number(e.target.value);
                onEncounterChange({ ...encounter, targetLevel: lvl, bossLevel: lvl });
              }}
              className="w-full bg-[#111318] border border-[#44474e]/50 hover:border-[#a8c7fa] text-[#e2e2e9] text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#a8c7fa] transition-all cursor-pointer"
            >
              <option value={63}>Level 63 - Raid Boss (Default: +3 Level Defense)</option>
              <option value={62}>Level 62 - High Dungeon Boss</option>
              <option value={60}>Level 60 - Standard Target</option>
            </select>
          </div>
        </div>

        {/* Selected Race WoW: Forever Racials Callout */}
        <div className="p-3 bg-[#111318] rounded-xl border border-[#44474e]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-[#a8c7fa]">{activeRaceInfo.name} Racials:</span>
            <span className="text-xs text-[#c4c6d0] font-sans">{activeRaceInfo.racialsSummary}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3e4759] text-[#dae2f9] border border-[#44474e]/40 shrink-0 self-start sm:self-auto">
            {activeRaceInfo.faction}
          </span>
        </div>
      </div>

      {/* Quick Action Buff Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#a8c7fa]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#e2e2e9]">
            Raid Buffs &amp; Consumables Setup
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={selectAllRaidBuffsAndConsumes}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#284777] hover:bg-[#34588e] text-[#d6e3ff] border border-[#a8c7fa]/40 transition-all shadow-sm"
          >
            Select All Raid Buffs &amp; Consumes
          </button>
          <button
            onClick={clearAllConsumesAndBuffs}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#282a2f] hover:bg-[#33353a] text-[#8e9099] hover:text-[#e2e2e9] border border-[#44474e]/40 transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Buff Categories (World Buffs Completely Removed) */}
      {renderBuffCategory('Consumables & Elixirs', 'consumable', <Flame className="w-4 h-4 text-[#f28b82]" />)}
      {renderBuffCategory('Weapon Enhancements', 'weapon', <Swords className="w-4 h-4 text-[#a8c7fa]" />)}
      {renderBuffCategory('Raid Auras & Totems', 'raid', <Shield className="w-4 h-4 text-[#d4bbff]" />)}
      {renderBuffCategory('Boss Armor Debuffs', 'debuff', <Sliders className="w-4 h-4 text-[#81c995]" />)}
    </div>
  );
};
