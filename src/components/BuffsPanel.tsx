import React from 'react';
import { BuffConfig, EncounterConfig, Race } from '../types/sim';
import { BUFFS_DATABASE, BuffDefinition } from '../data/buffs';
import { Sparkles, Swords, Shield, Flame, CheckSquare, Square, Sliders } from 'lucide-react';

interface BuffsPanelProps {
  buffs: BuffConfig;
  encounter: EncounterConfig;
  race: Race;
  onBuffChange: (buffs: BuffConfig) => void;
  onEncounterChange: (encounter: EncounterConfig) => void;
  onRaceChange: (race: Race) => void;
}

const RACES: { id: Race; name: string; faction: 'Alliance' | 'Horde'; racialDesc: string }[] = [
  { id: 'Orc', name: 'Orc', faction: 'Horde', racialDesc: '+5 Axes skill, Blood Fury' },
  { id: 'Human', name: 'Human', faction: 'Alliance', racialDesc: '+5 Swords & Maces skill' },
  { id: 'Troll', name: 'Troll', faction: 'Horde', racialDesc: 'Berserking (+10-30% Haste), Beast Slaying' },
  { id: 'Tauren', name: 'Tauren', faction: 'Horde', racialDesc: '+5% Total Health, War Stomp' },
  { id: 'Undead', name: 'Undead', faction: 'Horde', racialDesc: 'Will of the Forsaken' },
  { id: 'Gnome', name: 'Gnome', faction: 'Alliance', racialDesc: 'Escape Artist, Engineering bonus' },
  { id: 'Dwarf', name: 'Dwarf', faction: 'Alliance', racialDesc: '+5 Maces skill, Stoneform' },
  { id: 'NightElf', name: 'Night Elf', faction: 'Alliance', racialDesc: 'Quickness (+1% Dodge), Shadowmeld' },
];

export const BuffsPanel: React.FC<BuffsPanelProps> = ({
  buffs,
  encounter,
  race,
  onBuffChange,
  onEncounterChange,
  onRaceChange,
}) => {
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

  const selectAllWorldBuffs = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.filter((b) => b.category === 'world').forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = b.max || 10;
      } else {
        updated[b.id] = true;
      }
    });
    onBuffChange(updated);
  };

  const clearWorldBuffs = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.filter((b) => b.category === 'world').forEach((b) => {
      if (b.type === 'number') {
        updated[b.id] = 0;
      } else {
        updated[b.id] = false;
      }
    });
    onBuffChange(updated);
  };

  const selectAllRaidBuffsAndConsumes = () => {
    const updated = { ...buffs };
    BUFFS_DATABASE.filter((b) => b.category === 'raid' || b.category === 'consumable').forEach((b) => {
      updated[b.id] = true;
    });
    onBuffChange(updated);
  };

  const renderBuffCategory = (
    title: string,
    category: 'world' | 'consumable' | 'weapon' | 'raid' | 'debuff',
    icon: React.ReactNode
  ) => {
    const items = BUFFS_DATABASE.filter((b) => b.category === category);

    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            {icon}
            <span>{title}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {items.filter((b) => !!buffs[b.id]).length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((item) => {
            const isChecked = !!buffs[item.id];
            const isNumeric = item.type === 'number';

            return (
              <div
                key={item.id}
                onClick={() => !isNumeric && toggleBuff(item.id)}
                className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  isChecked
                    ? 'bg-amber-950/20 border-amber-500/50 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-1">
                  <div
                    className={`w-7 h-7 rounded border flex items-center justify-center shrink-0 text-xs font-bold overflow-hidden ${
                      isChecked
                        ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                        : 'border-slate-700 bg-slate-950 text-slate-500'
                    }`}
                  >
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.description}</div>
                  </div>
                </div>

                {isNumeric ? (
                  <select
                    value={Number(buffs[item.id] || 0)}
                    onChange={(e) => setNumericBuff(item.id, Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 border border-slate-700 text-amber-300 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:border-amber-500"
                  >
                    {Array.from({ length: (item.max || 5) + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="shrink-0 text-amber-400">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 fill-amber-500/20" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full space-y-4 overflow-y-auto">
      {/* Race & Encounter Settings Bar */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Race Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
            Character Race
          </label>
          <select
            value={race}
            onChange={(e) => onRaceChange(e.target.value as Race)}
            className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500 text-amber-300 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {RACES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.faction}) &bull; {r.racialDesc}
              </option>
            ))}
          </select>
        </div>

        {/* Fight Duration Slider */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fight Duration
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              {encounter.duration} seconds
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={180}
            step={5}
            value={encounter.duration}
            onChange={(e) =>
              onEncounterChange({ ...encounter, duration: Number(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Boss Target Level & Armor */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Boss Target Level
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">
              Level {encounter.targetLevel} (315 Def)
            </span>
          </div>
          <select
            value={encounter.targetLevel}
            onChange={(e) =>
              onEncounterChange({ ...encounter, targetLevel: Number(e.target.value) })
            }
            className="w-full bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            <option value={63}>Level 63 - Raid Boss (Default)</option>
            <option value={62}>Level 62 - High Dungeon Boss</option>
            <option value={60}>Level 60 - Standard Target</option>
          </select>
        </div>
      </div>

      {/* Quick Action Buff Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Buffs, Consumes & Debuffs Setup
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={selectAllWorldBuffs}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
          >
            Select All World Buffs
          </button>
          <button
            onClick={clearWorldBuffs}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Clear World Buffs
          </button>
          <button
            onClick={selectAllRaidBuffsAndConsumes}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
          >
            All Raid Buffs & Consumes
          </button>
        </div>
      </div>

      {/* Buff Categories */}
      {renderBuffCategory('World Buffs', 'world', <Sparkles className="w-4 h-4 text-amber-400" />)}
      {renderBuffCategory('Consumables & Elixirs', 'consumable', <Flame className="w-4 h-4 text-orange-400" />)}
      {renderBuffCategory('Weapon Enhancements', 'weapon', <Swords className="w-4 h-4 text-blue-400" />)}
      {renderBuffCategory('Raid Auras & Totems', 'raid', <Shield className="w-4 h-4 text-purple-400" />)}
      {renderBuffCategory('Boss Armor Debuffs', 'debuff', <Sliders className="w-4 h-4 text-red-400" />)}
    </div>
  );
};
