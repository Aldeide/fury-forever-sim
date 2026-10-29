import React from 'react';
import { BuffConfig, EncounterConfig, Race } from '../types/sim';
import { BUFFS_DATABASE, BuffDefinition } from '../data/buffs';
import { getWowheadIconUrl } from '../utils/wowhead';

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

export interface BuffsPanelProps {
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
  const normalizedRaceKey = String(race).toLowerCase().replace(/[^a-z]/g, '');
  const activeRaceInfo =
    WOW_FOREVER_RACES.find((r) => r.id.toLowerCase().replace(/[^a-z]/g, '') === normalizedRaceKey) ||
    WOW_FOREVER_RACES[0];

  const toggleBuff = (buff: BuffDefinition) => {
    if (buff.type === 'number') {
      const current = Number(buffs[buff.id] || 0);
      const maxVal = buff.max || 5;
      onBuffChange({
        ...buffs,
        [buff.id]: current > 0 ? 0 : maxVal,
      });
    } else {
      onBuffChange({
        ...buffs,
        [buff.id]: !buffs[buff.id],
      });
    }
  };

  const setNumericBuff = (id: string, val: number) => {
    onBuffChange({
      ...buffs,
      [id]: val,
    });
  };

  const selectAllRaidBuffsAndConsumes = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.filter(
      (b) => b.category === 'raid' || b.category === 'consumable' || b.category === 'weapon'
    ).forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = b.max || 5;
      } else {
        updated[b.id] = true;
      }
    });
    updated.sunderArmor = 5;
    updated.curseOfRecklessness = true;
    updated.faerieFire = true;
    updated.annihilator = 3;
    onBuffChange(updated);
  };

  const clearAllConsumesAndBuffs = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = 0;
      } else {
        updated[b.id] = false;
      }
    });
    onBuffChange(updated);
  };

  const categories: Array<{
    id: 'raid' | 'debuff' | 'weapon' | 'consumable';
    title: string;
  }> = [
    { id: 'raid', title: 'Raid Auras & Party Totems' },
    { id: 'debuff', title: 'Boss Armor Debuffs' },
    { id: 'weapon', title: 'Weapon Enhancements' },
    { id: 'consumable', title: 'Consumables & Elixirs' },
  ];

  return (
    <div className="bg-white text-black p-4 flex flex-col h-full overflow-y-auto">
      {/* Top note bar with WrathWarrior styling */}
      <div className="bg-[#eeeeee] border-l-4 border-[#1861ac] p-2.5 text-xs text-black mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="leading-snug max-w-3xl">
          <span className="font-bold text-[#1861ac]">WoW: Forever Raid Ruleset:</span> Classic World Buffs
          (Rallying Cry, Warchief's Blessing, Songflower, Dire Maul Tribute, Spirit of Zandalar) are
          disabled inside raid instances. Encounters are balanced exclusively around Raid Buffs, Consumables, and Boss Debuffs.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAllRaidBuffsAndConsumes}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-[#1861ac] hover:bg-[#144e8c] text-white transition-all shadow-sm"
          >
            Enable All Raid Buffs
          </button>
          <button
            onClick={clearAllConsumesAndBuffs}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] transition-all shadow-sm"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Race & Encounter Settings Bar */}
      <div className="bg-[#f9f9f9] border border-[#dddddd] p-3 rounded mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="font-bold text-black uppercase tracking-wider text-[11px] block mb-1">
            Character Race
          </label>
          <select
            value={activeRaceInfo.id}
            onChange={(e) => onRaceChange(e.target.value as Race)}
            className="w-full bg-white border border-[#cccccc] text-black text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1861ac]"
          >
            {WOW_FOREVER_RACES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.faction}) — {r.keyPerk}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-black uppercase tracking-wider text-[11px]">
              Fight Duration
            </label>
            <span className="font-mono font-semibold text-[#1861ac]">
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
            className="w-full cursor-pointer mt-1"
          />
        </div>

        <div>
          <label className="font-bold text-black uppercase tracking-wider text-[11px] block mb-1">
            Boss Target Level
          </label>
          <select
            value={encounter.targetLevel || encounter.bossLevel || 63}
            onChange={(e) => {
              const lvl = Number(e.target.value);
              onEncounterChange({ ...encounter, targetLevel: lvl, bossLevel: lvl });
            }}
            className="w-full bg-white border border-[#cccccc] text-black text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#1861ac]"
          >
            <option value={63}>Level 63 - Raid Boss (+3 Level Defense)</option>
            <option value={62}>Level 62 - High Dungeon Boss</option>
            <option value={60}>Level 60 - Target Dummy</option>
          </select>
        </div>
      </div>

      <div className="text-[11px] text-[#555555] mb-4 px-1">
        <span className="font-bold text-black">{activeRaceInfo.name} Racials:</span>{' '}
        {activeRaceInfo.racialsSummary}
      </div>

      {/* Categorized Buff Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1">
        {categories.map((cat) => {
          const items = BUFFS_DATABASE.filter((b) => b.category === cat.id);
          const activeCount = items.filter((b) => !!buffs[b.id]).length;

          return (
            <div
              key={cat.id}
              className="bg-white border border-[#dddddd] rounded shadow-sm flex flex-col"
            >
              <div className="bg-[#eeeeee] px-3 py-2 border-b border-[#dddddd] flex items-center justify-between font-bold text-xs uppercase tracking-wider text-black">
                <span>{cat.title}</span>
                <span className="text-[11px] font-mono text-[#666666]">
                  {activeCount} Active
                </span>
              </div>

              <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                {items.map((buff) => {
                  const isChecked = !!buffs[buff.id];
                  const isNumeric = buff.type === 'number';

                  return (
                    <div
                      key={buff.id}
                      onClick={() => toggleBuff(buff)}
                      className={`p-2 rounded border flex items-center gap-2.5 cursor-pointer select-none transition-colors ${
                        isChecked
                          ? 'bg-[#f0f7ff] border-[#1861ac]'
                          : 'bg-white border-[#e5e5e5] hover:bg-[#fafafa] hover:border-[#cccccc]'
                      }`}
                    >
                      <img
                        src={getWowheadIconUrl(buff.icon, 'large')}
                        alt={buff.name}
                        className={`ww-icon-40 rounded shrink-0 ${
                          isChecked ? 'border-[#1861ac]' : 'ww-grayscale border-[#aaaaaa]'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.visibility = 'hidden';
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-semibold truncate leading-tight ${
                            isChecked ? 'text-black' : 'text-[#444444]'
                          }`}
                        >
                          {buff.name}
                        </div>
                        <div className="text-[11px] text-[#666666] truncate font-sans leading-tight mt-0.5">
                          {buff.description}
                        </div>
                      </div>

                      {isNumeric ? (
                        <select
                          value={Number(buffs[buff.id] || 0)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setNumericBuff(buff.id, Number(e.target.value));
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="ww-inline-input text-xs border border-[#999999] rounded px-1 py-0.5 ml-1 font-mono font-bold"
                        >
                          {Array.from({ length: (buff.max || 5) + 1 }, (_, i) => (
                            <option key={i} value={i}>
                              {i}x
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-1 ${
                            isChecked
                              ? 'bg-[#1861ac] border-[#1861ac] text-white'
                              : 'border-[#cccccc] bg-white'
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                              <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
