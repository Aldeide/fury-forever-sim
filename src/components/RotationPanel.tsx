import React, { useEffect } from 'react';
import {
  RotationConfig,
  AplActionItem,
  AplCondition,
  CharacterSheetSummary,
  SimConfig,
  Race,
  TalentConfig,
} from '../types/sim';
import { getAbilityIconUrl } from '../utils/wowhead';
import * as SpellAnalyzerModule from '../utils/spellAnalyzer';

export interface RotationPanelProps {
  rotation: RotationConfig;
  onChange: (rotation: RotationConfig) => void;
  characterSheet?: CharacterSheetSummary;
  simConfig?: SimConfig;
  race?: Race;
  talents?: TalentConfig;
}

export const DEFAULT_FURY_APL: AplActionItem[] = [
  { id: 'f1', enabled: true, ability: 'death_wish', conditions: [{ type: 'rage_gte', value: 10 }, { type: 'time_remaining_lte', value: 32 }] },
  { id: 'f2', enabled: true, ability: 'recklessness', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
  { id: 'f3', enabled: true, ability: 'racial', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
  { id: 'f4', enabled: true, ability: 'trinkets', conditions: [{ type: 'always' }] },
  { id: 'f5', enabled: true, ability: 'mighty_rage_potion', conditions: [{ type: 'buff_active', buff: 'death_wish' }, { type: 'rage_lte', value: 35 }] },
  { id: 'f6', enabled: true, ability: 'bloodrage', conditions: [{ type: 'rage_lte', value: 75 }] },
  { id: 'f7', enabled: true, ability: 'berserker_rage', conditions: [{ type: 'always' }] },
  { id: 'f8', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'execute_phase' }, { type: 'ap_gte', value: 2000 }, { type: 'rage_gte', value: 30 }] },
  { id: 'f9', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'execute_phase' }, { type: 'ap_gte', value: 1000 }, { type: 'rage_gte', value: 45 }] },
  { id: 'f10', enabled: true, ability: 'execute', conditions: [{ type: 'execute_phase' }, { type: 'rage_gte', value: 10 }] },
  { id: 'f11', enabled: true, ability: 'whirlwind', conditions: [{ type: 'non_execute_phase' }, { type: 'targets_gte', value: 2 }, { type: 'rage_gte', value: 22 }] },
  { id: 'f12', enabled: true, ability: 'overpower', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_lte', value: 25 }, { type: 'bt_ww_cd' }] },
  { id: 'f13', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 30 }] },
  { id: 'f14', enabled: true, ability: 'whirlwind', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 22 }] },
  { id: 'f15', enabled: true, ability: 'hamstring', conditions: [{ type: 'non_execute_phase' }, { type: 'bt_ww_cd' }, { type: 'rage_gte', value: 55 }] },
  { id: 'f16', enabled: true, ability: 'cleave', conditions: [{ type: 'non_execute_phase' }, { type: 'targets_gte', value: 2 }, { type: 'rage_gte', value: 40 }] },
  { id: 'f17', enabled: true, ability: 'heroic_strike', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 40 }] },
];

export const DEFAULT_ARMS_APL: AplActionItem[] = [
  { id: 'a1', enabled: true, ability: 'death_wish', conditions: [{ type: 'rage_gte', value: 10 }, { type: 'time_remaining_lte', value: 32 }] },
  { id: 'a2', enabled: true, ability: 'recklessness', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
  { id: 'a3', enabled: true, ability: 'racial', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
  { id: 'a4', enabled: true, ability: 'trinkets', conditions: [{ type: 'always' }] },
  { id: 'a5', enabled: true, ability: 'mighty_rage_potion', conditions: [{ type: 'buff_active', buff: 'death_wish' }, { type: 'rage_lte', value: 35 }] },
  { id: 'a6', enabled: true, ability: 'bloodrage', conditions: [{ type: 'rage_lte', value: 75 }] },
  { id: 'a7', enabled: true, ability: 'berserker_rage', conditions: [{ type: 'always' }] },
  { id: 'a8', enabled: true, ability: 'execute', conditions: [{ type: 'execute_phase' }, { type: 'rage_gte', value: 13 }] },
  { id: 'a9', enabled: true, ability: 'mortal_strike', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 30 }] },
  { id: 'a10', enabled: true, ability: 'whirlwind', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 25 }] },
  { id: 'a11', enabled: true, ability: 'overpower', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_lte', value: 25 }, { type: 'bt_ww_cd' }] },
  { id: 'a12', enabled: true, ability: 'slam', conditions: [{ type: 'non_execute_phase' }, { type: 'bt_ww_cd' }, { type: 'rage_gte', value: 30 }] },
  { id: 'a13', enabled: true, ability: 'cleave', conditions: [{ type: 'non_execute_phase' }, { type: 'targets_gte', value: 2 }, { type: 'rage_gte', value: 45 }] },
  { id: 'a14', enabled: true, ability: 'heroic_strike', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 50 }] },
];

const APL_ABILITIES: Array<{ value: AplActionItem['ability']; label: string }> = [
  { value: 'bloodthirst', label: 'Bloodthirst' },
  { value: 'whirlwind', label: 'Whirlwind' },
  { value: 'execute', label: 'Execute' },
  { value: 'heroic_strike', label: 'Heroic Strike' },
  { value: 'cleave', label: 'Cleave' },
  { value: 'overpower', label: 'Overpower' },
  { value: 'hamstring', label: 'Hamstring' },
  { value: 'slam', label: 'Slam' },
  { value: 'mortal_strike', label: 'Mortal Strike' },
  { value: 'death_wish', label: 'Death Wish' },
  { value: 'recklessness', label: 'Recklessness' },
  { value: 'bloodrage', label: 'Bloodrage' },
  { value: 'berserker_rage', label: 'Berserker Rage' },
  { value: 'mighty_rage_potion', label: 'Mighty Rage Potion' },
  { value: 'racial', label: 'Racial Cooldown' },
  { value: 'trinkets', label: 'Trinkets' },
  { value: 'sapper', label: 'Goblin Sapper Charge' },
];

const COND_LABELS: Record<string, string> = {
  always: 'Always',
  rage_gte: 'Rage ≥',
  rage_lte: 'Rage ≤',
  execute_phase: '<20% HP',
  non_execute_phase: '≥20% HP',
  ap_gte: 'AP ≥',
  time_remaining_lte: 'Time ≤',
  bt_ww_cd: 'BT/WW on CD',
  targets_gte: 'Targets ≥',
  buff_active: 'Buff Active',
  buff_inactive: 'Buff Inactive',
};

const BUFF_CHOICES: Array<{ value: string; label: string }> = [
  { value: 'death_wish', label: 'Death Wish' },
  { value: 'recklessness', label: 'Recklessness' },
  { value: 'flurry', label: 'Flurry' },
  { value: 'crusader', label: 'Crusader' },
  { value: 'eureka', label: 'Eureka!' },
  { value: 'blood_fury', label: 'Blood Fury' },
  { value: 'berserking', label: 'Berserking' },
  { value: 'enrage', label: 'Enrage' },
  { value: 'earthstrike', label: 'Earthstrike' },
  { value: 'diamond_flask', label: 'Diamond Flask' },
  { value: 'mighty_rage_potion', label: 'Mighty Rage Potion' },
];

export const RotationPanel: React.FC<RotationPanelProps> = ({
  rotation,
  onChange,
  simConfig,
  race,
  talents,
}) => {
  const apl = rotation.apl || DEFAULT_FURY_APL;

  const syncApl = (newApl: AplActionItem[]) => {
    const updated: RotationConfig = { ...rotation, apl: newApl };
    const has = (ab: AplActionItem['ability']) => newApl.some((a) => a.ability === ab && a.enabled);
    updated.useBloodthirst = has('bloodthirst');
    updated.useWhirlwind = has('whirlwind');
    updated.useHeroicStrike = has('heroic_strike');
    updated.useCleave = has('cleave');
    updated.useExecute = has('execute');
    updated.executePhase = has('execute');
    updated.useOverpower = has('overpower');
    updated.useHamstring = has('hamstring');
    updated.useDeathWish = has('death_wish');
    updated.useRecklessness = has('recklessness');
    updated.useBloodrage = has('bloodrage');
    updated.useBerserkerRage = has('berserker_rage');
    updated.useMightyRagePotion = has('mighty_rage_potion');

    for (const item of newApl) {
      if (!item.enabled) continue;
      if (item.ability === 'bloodthirst') {
        const apCond = item.conditions.find((c) => c.type === 'ap_gte');
        if (apCond) {
          updated.useBtInExecute = true;
          if (apCond.value !== undefined) updated.executeBtApThreshold = apCond.value;
        }
      } else if (item.ability === 'heroic_strike') {
        const rCond = item.conditions.find((c) => c.type === 'rage_gte');
        if (rCond?.value !== undefined) {
          updated.hsRageThreshold = rCond.value;
          updated.heroicStrikeRageThreshold = rCond.value;
        }
      } else if (item.ability === 'cleave') {
        const rCond = item.conditions.find((c) => c.type === 'rage_gte');
        if (rCond?.value !== undefined) {
          updated.cleaveRageThreshold = rCond.value;
        }
      } else if (item.ability === 'overpower') {
        const rCond = item.conditions.find((c) => c.type === 'rage_lte');
        if (rCond?.value !== undefined) {
          updated.overpowerMaxRage = rCond.value;
          updated.overpowerRageThreshold = rCond.value;
        }
      } else if (item.ability === 'hamstring') {
        const rCond = item.conditions.find((c) => c.type === 'rage_gte');
        if (rCond?.value !== undefined) updated.hamstringRageThreshold = rCond.value;
      }
    }
    onChange(updated);
  };

  useEffect(() => {
    if (rotation.apl && rotation.apl.length > 0) {
      syncApl(rotation.apl);
    }
  }, []);

  const handleAutoOptimizeApl = () => {
    try {
      const spellModule = SpellAnalyzerModule as any;
      let optimal: AplActionItem[] | undefined;

      const effectiveConfig: SimConfig = {
        race: race || 'orc',
        talents: talents || {},
        gear: {},
        buffs: {},
        encounter: { duration: 60, targetLevel: 63, bossLevel: 63, targets: 1 },
        ...(simConfig || {}),
        rotation,
      };

      if (typeof spellModule.generateOptimalApl === 'function') {
        optimal = spellModule.generateOptimalApl(effectiveConfig);
      }

      if (!optimal || optimal.length === 0) {
        const hasMs = !!talents?.mortalStrike;
        if (hasMs) {
          optimal = DEFAULT_ARMS_APL;
        } else {
          const impExec = talents?.improvedExecute ?? 2;
          const btBreak = impExec === 2 ? 2000 : impExec === 1 ? 1900 : 1833;
          optimal = [
            { id: 'o1', enabled: true, ability: 'death_wish', conditions: [{ type: 'rage_gte', value: 10 }, { type: 'time_remaining_lte', value: 32 }] },
            { id: 'o2', enabled: true, ability: 'recklessness', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
            { id: 'o3', enabled: true, ability: 'racial', conditions: [{ type: 'buff_active', buff: 'death_wish' }] },
            { id: 'o4', enabled: true, ability: 'trinkets', conditions: [{ type: 'always' }] },
            { id: 'o5', enabled: true, ability: 'mighty_rage_potion', conditions: [{ type: 'buff_active', buff: 'death_wish' }, { type: 'rage_lte', value: 35 }] },
            { id: 'o6', enabled: true, ability: 'bloodrage', conditions: [{ type: 'rage_lte', value: 75 }] },
            { id: 'o7', enabled: true, ability: 'berserker_rage', conditions: [{ type: 'always' }] },
            { id: 'o8', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'execute_phase' }, { type: 'ap_gte', value: btBreak }, { type: 'rage_gte', value: 30 }] },
            { id: 'o9', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'execute_phase' }, { type: 'ap_gte', value: 1000 }, { type: 'rage_gte', value: 45 }] },
            { id: 'o10', enabled: true, ability: 'execute', conditions: [{ type: 'execute_phase' }, { type: 'rage_gte', value: 10 }] },
            { id: 'o11', enabled: true, ability: 'whirlwind', conditions: [{ type: 'non_execute_phase' }, { type: 'targets_gte', value: 2 }, { type: 'rage_gte', value: 22 }] },
            { id: 'o12', enabled: true, ability: 'overpower', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_lte', value: 25 }, { type: 'bt_ww_cd' }] },
            { id: 'o13', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 30 }] },
            { id: 'o14', enabled: true, ability: 'whirlwind', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 22 }] },
            { id: 'o15', enabled: true, ability: 'hamstring', conditions: [{ type: 'non_execute_phase' }, { type: 'bt_ww_cd' }, { type: 'rage_gte', value: 55 }] },
            { id: 'o16', enabled: true, ability: 'cleave', conditions: [{ type: 'non_execute_phase' }, { type: 'targets_gte', value: 2 }, { type: 'rage_gte', value: 40 }] },
            { id: 'o17', enabled: true, ability: 'heroic_strike', conditions: [{ type: 'non_execute_phase' }, { type: 'rage_gte', value: 40 }] },
          ];
        }
      }

      syncApl(optimal);
    } catch (err) {
      console.error('Failed to auto-optimize APL:', err);
      syncApl(DEFAULT_FURY_APL);
    }
  };

  const addRow = () => syncApl([...apl, { id: String(Date.now()), enabled: true, ability: 'heroic_strike', conditions: [{ type: 'always' }] }]);
  const toggleRow = (idx: number) => { const n = [...apl]; n[idx] = { ...n[idx], enabled: !n[idx].enabled }; syncApl(n); };
  const changeAbility = (idx: number, ability: AplActionItem['ability']) => { const n = [...apl]; n[idx] = { ...n[idx], ability }; syncApl(n); };
  const moveRow = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= apl.length) return;
    const n = [...apl];
    const temp = n[idx];
    n[idx] = n[target];
    n[target] = temp;
    syncApl(n);
  };
  const deleteRow = (idx: number) => syncApl(apl.filter((_, i) => i !== idx));

  const addCondition = (idx: number, type: AplCondition['type']) => {
    if (!type) return;
    const defaultVal = type.includes('rage')
      ? 45
      : type === 'ap_gte'
      ? 2000
      : type === 'time_remaining_lte'
      ? 30
      : type === 'targets_gte'
      ? 2
      : undefined;
    const defaultBuff = (type === 'buff_active' || type === 'buff_inactive') ? 'death_wish' : undefined;
    const n = [...apl];
    n[idx] = { ...n[idx], conditions: [...n[idx].conditions, { type, value: defaultVal, buff: defaultBuff }] };
    syncApl(n);
  };

  const updateCondValue = (idx: number, cIdx: number, val: number) => {
    const n = [...apl];
    const conds = [...n[idx].conditions];
    conds[cIdx] = { ...conds[cIdx], value: val };
    n[idx] = { ...n[idx], conditions: conds };
    syncApl(n);
  };

  const updateCondBuff = (idx: number, cIdx: number, buff: string) => {
    const n = [...apl];
    const conds = [...n[idx].conditions];
    conds[cIdx] = { ...conds[cIdx], buff };
    n[idx] = { ...n[idx], conditions: conds };
    syncApl(n);
  };

  const removeCondition = (idx: number, cIdx: number) => {
    const n = [...apl];
    n[idx] = { ...n[idx], conditions: n[idx].conditions.filter((_, i) => i !== cIdx) };
    syncApl(n);
  };

  return (
    <div className="bg-white text-black p-4 flex flex-col space-y-6 overflow-y-auto h-full">
      {/* APL (Action Priority List) */}
      <section className="space-y-3">
        <div className="border-b border-black pb-1.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-black">APL — Action Priority List</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoOptimizeApl}
              className="px-2.5 py-1 text-xs font-bold rounded bg-[#1861ac] hover:bg-[#144e8c] text-white shadow-sm flex items-center gap-1 transition-colors"
              title="Automatically generate mathematically optimal APL prioritizing highest DPR/DPE abilities for your current gear and talents"
            >
              <span>⚡</span> Auto-Optimize APL (DPR/DPE)
            </button>
            <button onClick={() => syncApl(DEFAULT_FURY_APL)} className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] shadow-sm">Default Fury (DW)</button>
            <button onClick={() => syncApl(DEFAULT_ARMS_APL)} className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] shadow-sm">2H Arms / Fury</button>
            <button onClick={addRow} className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] shadow-sm">+ Add Action Row</button>
          </div>
        </div>

        <div className="space-y-2">
          {apl.map((item, idx) => (
            <div key={item.id || idx} className="flex flex-wrap md:flex-nowrap items-center gap-2.5 p-2 bg-white border border-[#dddddd] rounded hover:border-[#bbbbbb] transition-colors">
              <span className="font-sans text-xs font-bold text-[#888888] w-6 shrink-0 tabular-nums">#{idx + 1}</span>
              <input type="checkbox" checked={item.enabled} onChange={() => toggleRow(idx)} className="w-4 h-4 text-[#1861ac] cursor-pointer shrink-0" />
              <img
                src={getAbilityIconUrl(APL_ABILITIES.find((a) => a.value === item.ability)?.label || item.ability, 'medium')}
                alt=""
                className={`w-8 h-8 rounded border border-[#aaaaaa] shrink-0 object-cover ${item.enabled ? '' : 'ww-grayscale'}`}
              />
              <select
                value={item.ability}
                onChange={(e) => changeAbility(idx, e.target.value as AplActionItem['ability'])}
                className="text-xs border border-[#cccccc] rounded px-2 py-1 bg-white font-semibold text-black cursor-pointer"
              >
                {APL_ABILITIES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>

              <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
                {item.conditions.map((cond, cIdx) => (
                  <span key={cIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-[#eeeeee] border border-[#cccccc] text-black font-medium">
                    <span>{COND_LABELS[cond.type] || cond.type}</span>
                    {['rage_gte', 'rage_lte', 'ap_gte', 'time_remaining_lte', 'targets_gte'].includes(cond.type) && (
                      <input
                        type="number"
                        value={cond.value ?? 0}
                        onChange={(e) => updateCondValue(idx, cIdx, +e.target.value)}
                        className="ww-inline-input w-12 text-[11px] font-sans tabular-nums px-0.5"
                      />
                    )}
                    {['buff_active', 'buff_inactive'].includes(cond.type) && (
                      <select
                        value={cond.buff || 'death_wish'}
                        onChange={(e) => updateCondBuff(idx, cIdx, e.target.value)}
                        className="text-[11px] font-semibold bg-white border border-[#cccccc] rounded px-1 py-0.5 text-[#1861ac] cursor-pointer"
                      >
                        {BUFF_CHOICES.map((b) => (
                          <option key={b.value} value={b.value}>{b.label}</option>
                        ))}
                        {cond.buff && !BUFF_CHOICES.some((b) => b.value === cond.buff) && (
                          <option value={cond.buff}>{cond.buff}</option>
                        )}
                      </select>
                    )}
                    <button onClick={() => removeCondition(idx, cIdx)} className="text-[#888888] hover:text-[#c00] font-bold text-xs ml-0.5" title="Remove condition">×</button>
                  </span>
                ))}
                <select
                  value=""
                  onChange={(e) => { addCondition(idx, e.target.value as AplCondition['type']); e.target.value = ''; }}
                  className="text-[10px] bg-white text-[#1861ac] border border-dashed border-[#1861ac]/50 rounded px-1.5 py-0.5 cursor-pointer font-medium hover:border-[#1861ac]"
                >
                  <option value="">+ Cond</option>
                  <option value="always">Always</option>
                  <option value="rage_gte">Rage &ge;</option>
                  <option value="rage_lte">Rage &le;</option>
                  <option value="execute_phase">&lt;20% HP</option>
                  <option value="non_execute_phase">&ge;20% HP</option>
                  <option value="ap_gte">AP &ge;</option>
                  <option value="time_remaining_lte">Time &le;</option>
                  <option value="targets_gte">Targets &ge;</option>
                  <option value="bt_ww_cd">BT/WW on CD</option>
                  <option value="buff_active">Buff Active</option>
                  <option value="buff_inactive">Buff Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                <button onClick={() => moveRow(idx, -1)} disabled={idx === 0} className="px-1.5 py-0.5 text-xs text-[#555555] hover:text-black disabled:opacity-20 font-bold" title="Move Up">↑</button>
                <button onClick={() => moveRow(idx, 1)} disabled={idx === apl.length - 1} className="px-1.5 py-0.5 text-xs text-[#555555] hover:text-black disabled:opacity-20 font-bold" title="Move Down">↓</button>
                <button onClick={() => deleteRow(idx)} className="px-1.5 py-0.5 text-xs text-[#888888] hover:text-[#c00] font-bold" title="Delete Row">✕</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
