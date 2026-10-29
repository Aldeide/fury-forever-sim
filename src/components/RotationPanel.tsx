import React from 'react';
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

export interface RotationPanelProps {
  rotation: RotationConfig;
  onChange: (rotation: RotationConfig) => void;
  characterSheet?: CharacterSheetSummary;
  simConfig?: SimConfig;
  race?: Race;
  talents?: TalentConfig;
}

const DEFAULT_FURY_APL: AplActionItem[] = [
  { id: '1', enabled: true, ability: 'death_wish', conditions: [{ type: 'time_remaining_lte', value: 30 }] },
  { id: '2', enabled: true, ability: 'recklessness', conditions: [{ type: 'time_remaining_lte', value: 15 }] },
  { id: '3', enabled: true, ability: 'bloodrage', conditions: [{ type: 'always' }] },
  { id: '4', enabled: true, ability: 'mighty_rage_potion', conditions: [{ type: 'execute_phase' }] },
  { id: '5', enabled: true, ability: 'bloodthirst', conditions: [{ type: 'always' }] },
  { id: '6', enabled: true, ability: 'whirlwind', conditions: [{ type: 'always' }] },
  { id: '7', enabled: true, ability: 'execute', conditions: [{ type: 'execute_phase' }] },
  { id: '8', enabled: true, ability: 'overpower', conditions: [{ type: 'rage_lte', value: 35 }] },
  { id: '9', enabled: true, ability: 'heroic_strike', conditions: [{ type: 'rage_gte', value: 45 }] },
];

const DEFAULT_ARMS_APL: AplActionItem[] = [
  { id: 'a1', enabled: true, ability: 'death_wish', conditions: [{ type: 'time_remaining_lte', value: 30 }] },
  { id: 'a2', enabled: true, ability: 'bloodrage', conditions: [{ type: 'always' }] },
  { id: 'a3', enabled: true, ability: 'mortal_strike', conditions: [{ type: 'always' }] },
  { id: 'a4', enabled: true, ability: 'whirlwind', conditions: [{ type: 'always' }] },
  { id: 'a5', enabled: true, ability: 'overpower', conditions: [{ type: 'rage_lte', value: 40 }] },
  { id: 'a6', enabled: true, ability: 'execute', conditions: [{ type: 'execute_phase' }] },
  { id: 'a7', enabled: true, ability: 'slam', conditions: [{ type: 'bt_ww_cd' }] },
  { id: 'a8', enabled: true, ability: 'heroic_strike', conditions: [{ type: 'rage_gte', value: 50 }] },
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
  { value: 'mighty_rage_potion', label: 'Mighty Rage Potion' },
  { value: 'racial', label: 'Racial Cooldown' },
  { value: 'trinkets', label: 'Trinkets' },
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
};

export const RotationPanel: React.FC<RotationPanelProps> = ({ rotation, onChange }) => {
  const apl = rotation.apl || DEFAULT_FURY_APL;

  const updateField = <K extends keyof RotationConfig>(key: K, value: RotationConfig[K]) => {
    onChange({ ...rotation, [key]: value });
  };

  const syncApl = (newApl: AplActionItem[]) => {
    const updated: RotationConfig = { ...rotation, apl: newApl };
    const has = (ab: AplActionItem['ability']) => newApl.some((a) => a.ability === ab && a.enabled);
    updated.useBloodthirst = has('bloodthirst');
    updated.useWhirlwind = has('whirlwind');
    updated.useHeroicStrike = has('heroic_strike');
    updated.useExecute = has('execute');
    updated.executePhase = has('execute');
    updated.useOverpower = has('overpower');
    updated.useHamstring = has('hamstring');
    updated.useDeathWish = has('death_wish');
    updated.useRecklessness = has('recklessness');
    updated.useBloodrage = has('bloodrage');
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
    const defaultVal = type.includes('rage') ? 45 : type === 'ap_gte' ? 2000 : type === 'time_remaining_lte' ? 30 : undefined;
    const n = [...apl];
    n[idx] = { ...n[idx], conditions: [...n[idx].conditions, { type, value: defaultVal }] };
    syncApl(n);
  };

  const updateCondValue = (idx: number, cIdx: number, val: number) => {
    const n = [...apl];
    const conds = [...n[idx].conditions];
    conds[cIdx] = { ...conds[cIdx], value: val };
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
      {/* 1. TOP SECTION — Rotation & Cooldowns */}
      <section className="space-y-3">
        <div className="border-b border-black pb-1.5 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight uppercase text-black">Rotation &amp; Cooldown Settings</h2>
          <span className="text-[11px] text-[#555555]">Configure ability usage rules &amp; rage pooling thresholds</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 text-xs">
          {/* Bloodthirst */}
          <div className="flex items-start space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useBloodthirst !== false} onChange={(e) => updateField('useBloodthirst', e.target.checked)} className="w-4 h-4 text-[#1861ac] mt-2.5 cursor-pointer" />
            <img src={getAbilityIconUrl('Bloodthirst', 'large')} alt="Bloodthirst" className={`ww-icon-40 shrink-0 ${rotation.useBloodthirst !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Bloodthirst <span className="font-normal text-[#555555]">(Cast on cooldown)</span></div>
              <div className="flex items-center flex-wrap gap-1 mt-1 text-[#333333]">
                <span>In Execute phase:</span>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" checked={!!rotation.useBtInExecute} onChange={(e) => updateField('useBtInExecute', e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
                  <span>cast if AP &ge;</span>
                </label>
                <input type="number" className="ww-inline-input" value={rotation.executeBtApThreshold ?? 2000} onChange={(e) => updateField('executeBtApThreshold', +e.target.value)} />
                <span>or Rage &ge;</span>
                <input type="number" className="ww-inline-input" value={rotation.executeRagePoolThreshold ?? 45} onChange={(e) => updateField('executeRagePoolThreshold', +e.target.value)} />
              </div>
            </div>
          </div>

          {/* Whirlwind */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useWhirlwind !== false} onChange={(e) => updateField('useWhirlwind', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Whirlwind', 'large')} alt="Whirlwind" className={`ww-icon-40 shrink-0 ${rotation.useWhirlwind !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Whirlwind</div>
              <div className="text-[#555555]">Cast on cooldown (fill between Bloodthirst GCDs)</div>
            </div>
          </div>

          {/* Heroic Strike */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useHeroicStrike !== false} onChange={(e) => updateField('useHeroicStrike', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Heroic Strike', 'large')} alt="Heroic Strike" className={`ww-icon-40 shrink-0 ${rotation.useHeroicStrike !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Heroic Strike</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Queue over</span>
                <input type="number" className="ww-inline-input" value={rotation.hsRageThreshold ?? rotation.heroicStrikeRageThreshold ?? 45} onChange={(e) => { const v = +e.target.value; onChange({ ...rotation, hsRageThreshold: v, heroicStrikeRageThreshold: v }); }} />
                <span>rage (off-GCD rage dump)</span>
              </div>
            </div>
          </div>

          {/* Execute */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.executePhase !== false && rotation.useExecute !== false} onChange={(e) => onChange({ ...rotation, executePhase: e.target.checked, useExecute: e.target.checked })} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Execute', 'large')} alt="Execute" className={`ww-icon-40 shrink-0 ${(rotation.executePhase !== false && rotation.useExecute !== false) ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Execute</div>
              <div className="text-[#555555]">Cast in Execute phase (&lt;20% boss HP)</div>
            </div>
          </div>

          {/* Overpower */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={!!rotation.useOverpower} onChange={(e) => updateField('useOverpower', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Overpower', 'large')} alt="Overpower" className={`ww-icon-40 shrink-0 ${rotation.useOverpower ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Overpower</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Weave in Battle Stance &le;</span>
                <input type="number" className="ww-inline-input" value={rotation.overpowerMaxRage ?? rotation.overpowerRageThreshold ?? 35} onChange={(e) => { const v = +e.target.value; onChange({ ...rotation, overpowerMaxRage: v, overpowerRageThreshold: v }); }} />
                <span>rage</span>
              </div>
            </div>
          </div>

          {/* Hamstring */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={!!rotation.useHamstring} onChange={(e) => updateField('useHamstring', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Hamstring', 'large')} alt="Hamstring" className={`ww-icon-40 shrink-0 ${rotation.useHamstring ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Hamstring</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Windfury / proc fishing &gt;</span>
                <input type="number" className="ww-inline-input" value={rotation.hamstringRageThreshold ?? 70} onChange={(e) => updateField('hamstringRageThreshold', +e.target.value)} />
                <span>rage</span>
              </div>
            </div>
          </div>

          {/* Death Wish */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useDeathWish !== false} onChange={(e) => updateField('useDeathWish', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Death Wish', 'large')} alt="Death Wish" className={`ww-icon-40 shrink-0 ${rotation.useDeathWish !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Death Wish</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Activate in last</span>
                <input type="number" className="ww-inline-input" value={rotation.deathWishTiming ?? 30} onChange={(e) => updateField('deathWishTiming', +e.target.value)} />
                <span>sec (+20% damage)</span>
              </div>
            </div>
          </div>

          {/* Recklessness */}
          <div className="flex items-center space-x-2.5 p-2 bg-white border border-[#dddddd] rounded">
            <input type="checkbox" checked={rotation.useRecklessness !== false} onChange={(e) => updateField('useRecklessness', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
            <img src={getAbilityIconUrl('Recklessness', 'large')} alt="Recklessness" className={`ww-icon-40 shrink-0 ${rotation.useRecklessness !== false ? '' : 'ww-grayscale'}`} />
            <div className="flex-1 leading-snug">
              <div className="font-semibold text-black">Recklessness</div>
              <div className="flex items-center space-x-1 mt-0.5 text-[#333333]">
                <span>Activate in last</span>
                <input type="number" className="ww-inline-input" value={rotation.recklessnessTiming ?? 15} onChange={(e) => updateField('recklessnessTiming', +e.target.value)} />
                <span>sec (+100% crit)</span>
              </div>
            </div>
          </div>

          {/* Bloodrage & Mighty Rage Potion */}
          <div className="flex items-center space-x-4 p-2 bg-white border border-[#dddddd] rounded">
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={rotation.useBloodrage !== false} onChange={(e) => updateField('useBloodrage', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
              <img src={getAbilityIconUrl('Bloodrage', 'large')} alt="Bloodrage" className={`ww-icon-40 shrink-0 ${rotation.useBloodrage !== false ? '' : 'ww-grayscale'}`} />
              <span className="font-semibold text-black">Bloodrage</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" checked={!!rotation.useMightyRagePotion} onChange={(e) => updateField('useMightyRagePotion', e.target.checked)} className="w-4 h-4 text-[#1861ac] cursor-pointer" />
              <img src={getAbilityIconUrl('Mighty Rage Potion', 'large')} alt="Mighty Rage Potion" className={`ww-icon-40 shrink-0 ${rotation.useMightyRagePotion ? '' : 'ww-grayscale'}`} />
              <span className="font-semibold text-black">Mighty Rage Pot</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BOTTOM SECTION — APL (Action Priority List) */}
      <section className="space-y-3">
        <div className="border-b border-black pb-1.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold tracking-tight uppercase text-black">APL — Action Priority List (WoWSims Style)</h2>
            <div className="text-[11px] text-[#555555]">Priority-ordered decision tree evaluated every GCD &amp; swing update</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => syncApl(DEFAULT_FURY_APL)} className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] shadow-sm">Default Fury (DW)</button>
            <button onClick={() => syncApl(DEFAULT_ARMS_APL)} className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-[#f5f5f5] text-black border border-[#cccccc] shadow-sm">2H Arms / Fury</button>
            <button onClick={addRow} className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1861ac] hover:bg-[#144e8c] text-white shadow-sm">+ Add Action Row</button>
          </div>
        </div>

        <div className="space-y-2">
          {apl.map((item, idx) => (
            <div key={item.id || idx} className="flex flex-wrap md:flex-nowrap items-center gap-2.5 p-2 bg-white border border-[#dddddd] rounded hover:border-[#bbbbbb] transition-colors">
              <span className="font-mono text-xs font-bold text-[#888888] w-6 shrink-0">#{idx + 1}</span>
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
                        className="ww-inline-input w-10 text-[11px] font-mono px-0.5"
                      />
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
                  <option value="bt_ww_cd">BT/WW on CD</option>
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
