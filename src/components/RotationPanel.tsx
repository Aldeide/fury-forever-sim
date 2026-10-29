import React from 'react';
import { RotationConfig } from '../types/sim';
import { Sliders, Flame, Zap, Shield, ToggleLeft, ToggleRight, CheckSquare, Square } from 'lucide-react';

interface RotationPanelProps {
  rotation: RotationConfig;
  onChange: (rotation: RotationConfig) => void;
}

export const RotationPanel: React.FC<RotationPanelProps> = ({ rotation, onChange }) => {
  const updateField = <K extends keyof RotationConfig>(key: K, value: RotationConfig[K]) => {
    onChange({
      ...rotation,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
        <Sliders className="w-5 h-5 text-amber-400" />
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Combat Rotation & Priority Settings
          </h2>
          <p className="text-xs text-slate-400">
            Tune rage queues, Overpower stance-dancing, Execute phase, and major cooldowns.
          </p>
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Heroic Strike Rage Threshold */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Heroic Strike Rage Threshold
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
              {rotation.heroicStrikeRageThreshold} Rage
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Queue Heroic Strike (or Cleave) only when current Rage is at or above this threshold, preserving Rage for Bloodthirst and Whirlwind.
          </p>
          <input
            type="range"
            min={15}
            max={85}
            step={5}
            value={rotation.heroicStrikeRageThreshold}
            onChange={(e) => updateField('heroicStrikeRageThreshold', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Overpower Stance-Dance Max Rage */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Overpower Stance-Dance Max Rage
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
              {rotation.overpowerRageThreshold || 35} Rage
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Swap to Battle Stance for Overpower when target dodges, but only if Rage is below this cap to avoid losing excess Rage (WoW: Forever Tactical Mastery retains up to 35).
          </p>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={rotation.overpowerRageThreshold || 35}
            onChange={(e) => updateField('overpowerRageThreshold', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Hamstring Rage Threshold */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Hamstring Fishing Rage Threshold
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
              {rotation.hamstringSpamRageThreshold || 70} Rage
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Dump excess rage with Hamstring to fish for extra Windfury, Flurry, and Hand of Justice procs when bloodthirst & whirlwind are on cooldown.
          </p>
          <input
            type="range"
            min={40}
            max={90}
            step={5}
            value={rotation.hamstringSpamRageThreshold || 70}
            onChange={(e) => updateField('hamstringSpamRageThreshold', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Death Wish Timing */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Death Wish Activation Second
            </span>
            <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/50 border border-amber-500/30">
              {rotation.deathWishTiming || 0}s into fight
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Set delay before popping Death Wish (+20% damage for 30s) to align with lust/haste cooldowns or execute burn phases.
          </p>
          <input
            type="range"
            min={0}
            max={60}
            step={5}
            value={rotation.deathWishTiming || 0}
            onChange={(e) => updateField('deathWishTiming', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Toggles & Cooldowns Section */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center space-x-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Major Cooldown & Phase Toggles</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Death Wish Toggle */}
          <div
            onClick={() => updateField('useDeathWish', !rotation.useDeathWish)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              rotation.useDeathWish
                ? 'bg-amber-950/30 border-amber-500/60 text-slate-100'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-amber-400">Death Wish</div>
              <div className="text-[10px] text-slate-400">+20% Damage for 30s</div>
            </div>
            {rotation.useDeathWish ? (
              <CheckSquare className="w-5 h-5 text-amber-400" />
            ) : (
              <Square className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Recklessness Toggle */}
          <div
            onClick={() => updateField('useRecklessness', !rotation.useRecklessness)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              rotation.useRecklessness
                ? 'bg-amber-950/30 border-amber-500/60 text-slate-100'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-amber-400">Recklessness</div>
              <div className="text-[10px] text-slate-400">+100% Crit for 15s</div>
            </div>
            {rotation.useRecklessness ? (
              <CheckSquare className="w-5 h-5 text-amber-400" />
            ) : (
              <Square className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Bloodrage Toggle */}
          <div
            onClick={() => updateField('useBloodrage', !rotation.useBloodrage)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              rotation.useBloodrage
                ? 'bg-amber-950/30 border-amber-500/60 text-slate-100'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-amber-400">Bloodrage</div>
              <div className="text-[10px] text-slate-400">Generate rage on pull</div>
            </div>
            {rotation.useBloodrage ? (
              <CheckSquare className="w-5 h-5 text-amber-400" />
            ) : (
              <Square className="w-5 h-5 text-slate-600" />
            )}
          </div>

          {/* Mighty Rage Potion */}
          <div
            onClick={() => updateField('useMightyRagePotion', !rotation.useMightyRagePotion)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
              rotation.useMightyRagePotion
                ? 'bg-amber-950/30 border-amber-500/60 text-slate-100'
                : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-amber-400">Mighty Rage Potion</div>
              <div className="text-[10px] text-slate-400">+60 Rage, +60 Str</div>
            </div>
            {rotation.useMightyRagePotion ? (
              <CheckSquare className="w-5 h-5 text-amber-400" />
            ) : (
              <Square className="w-5 h-5 text-slate-600" />
            )}
          </div>
        </div>

        {/* Execute Phase Toggle */}
        <div
          onClick={() => updateField('executePhase', !rotation.executePhase)}
          className={`mt-3 p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
            rotation.executePhase
              ? 'bg-red-950/20 border-red-500/60 text-slate-100'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-red-400">Execute Phase Priority (Boss &lt; 20% HP)</div>
            <div className="text-[10px] text-slate-400">
              When active, Execute replaces all standard abilities and is prioritized on every GCD during the final 20% of the fight.
            </div>
          </div>
          {rotation.executePhase ? (
            <CheckSquare className="w-5 h-5 text-red-400" />
          ) : (
            <Square className="w-5 h-5 text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
};
