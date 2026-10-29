import React, { useState, useEffect, useMemo } from 'react';
import {
  EquipmentSlot,
  ItemStats,
  EnchantInfo,
  TalentConfig,
  BuffConfig,
  RotationConfig,
  EncounterConfig,
  SimConfig,
  SimResult,
  StatWeightsResult,
  BatchItemResult,
  Race,
  PresetDefinition,
} from './types/sim';
import { PaperDoll } from './components/PaperDoll';
import { SlotTable } from './components/SlotTable';
import { StatsSidebar } from './components/StatsSidebar';
import { TalentTree } from './components/TalentTree';
import { BuffsPanel, WOW_FOREVER_RACES } from './components/BuffsPanel';
import { RotationPanel, DEFAULT_FURY_APL } from './components/RotationPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { CustomItemModal } from './components/CustomItemModal';
import { SpellEfficiencyPanel } from './components/SpellEfficiencyPanel';
import {
  ITEMS_DATABASE,
  getItemsForSlot,
  getItemById,
} from './data/items';
import {
  getEnchantsForSlot,
  getEnchantById,
} from './data/enchants';
import {
  DEFAULT_TALENTS_17_34,
} from './data/talents';
import {
  DEFAULT_BUFF_CONFIG,
} from './data/buffs';
import {
  PRESETS,
} from './data/presets';
import {
  calculateCharacterSheet,
  runSimulation,
  runBatchSlot,
  runStatWeights,
} from './workers/simRunner';
import {
  Swords,
  Sliders,
  BarChart3,
  Play,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SavedSimState {
  currentPresetId?: string;
  gearIds?: Partial<Record<EquipmentSlot, string | null>>;
  enchantIds?: Partial<Record<EquipmentSlot, string | null>>;
  talents?: TalentConfig;
  buffs?: BuffConfig;
  rotation?: RotationConfig;
  encounter?: EncounterConfig;
  race?: Race;
  selectedSlot?: EquipmentSlot;
}

const getSavedSimState = (): SavedSimState | null => {
  try {
    const raw = localStorage.getItem('wow_forever_sim_state_v2');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const App: React.FC = () => {
  const savedState = useMemo(() => getSavedSimState(), []);

  // Navigation State: 'gear' | 'settings' | 'efficiency' | 'results'
  const [activeTab, setActiveTab] = useState<'gear' | 'settings' | 'efficiency' | 'results'>('gear');

  // Currently selected equipment slot in Paper-Doll
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>(() => savedState?.selectedSlot || 'mainhand');

  // Custom Items saved to localStorage
  const [customItems, setCustomItems] = useState<ItemStats[]>(() => {
    try {
      const saved = localStorage.getItem('wow_forever_custom_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Modal State
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // All Items combining default database and custom items
  const allItems = useMemo(() => {
    return [...ITEMS_DATABASE, ...customItems];
  }, [customItems]);

  const allItemsMap = useMemo(() => {
    const map: Record<string, ItemStats> = {};
    for (const item of allItems) {
      map[item.id] = item;
    }
    return map;
  }, [allItems]);

  // Custom Presets saved to localStorage
  const [customPresets, setCustomPresets] = useState<PresetDefinition[]>(() => {
    try {
      const saved = localStorage.getItem('wow_forever_saved_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Deleted Preset IDs (built-in presets removed by user) saved to localStorage
  const [deletedPresetIds, setDeletedPresetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wow_forever_deleted_presets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const allPresets = useMemo(() => {
    return [
      ...PRESETS.filter((p) => !deletedPresetIds.includes(p.id)),
      ...customPresets,
    ];
  }, [deletedPresetIds, customPresets]);

  // Initial preset
  const defaultPreset = allPresets[0] || PRESETS[0];

  // Character Configuration State
  const [currentPresetId, setCurrentPresetId] = useState<string>(() => savedState?.currentPresetId || defaultPreset.id);

  // Equipped Items Map
  const [gear, setGear] = useState<Partial<Record<EquipmentSlot, ItemStats | null>>>(() => {
    if (savedState?.gearIds && Object.keys(savedState.gearIds).length > 0) {
      const restored: Partial<Record<EquipmentSlot, ItemStats | null>> = {};
      for (const slotKey in savedState.gearIds) {
        const slot = slotKey as EquipmentSlot;
        const itemId = savedState.gearIds[slot];
        restored[slot] = itemId ? (customItems.find((i) => i.id === itemId) || getItemById(itemId) || null) : null;
      }
      if (restored.mainhand) {
        return restored;
      }
    }
    const initialGear: Partial<Record<EquipmentSlot, ItemStats | null>> = {};
    for (const slotKey in defaultPreset.gear) {
      const slot = slotKey as EquipmentSlot;
      const itemId = (defaultPreset.gear as any)[slot];
      if (itemId) {
        initialGear[slot] = getItemById(itemId) || null;
      }
    }
    if ((defaultPreset.gear as any).twohand) {
      const twoHandId = (defaultPreset.gear as any).twohand;
      initialGear.mainhand = getItemById(twoHandId) || null;
      initialGear.offhand = null;
    }
    return initialGear;
  });

  // Equipped Enchants Map
  const [enchants, setEnchants] = useState<Partial<Record<EquipmentSlot, EnchantInfo | null>>>(() => {
    if (savedState?.enchantIds && Object.keys(savedState.enchantIds).length > 0) {
      const restored: Partial<Record<EquipmentSlot, EnchantInfo | null>> = {};
      for (const slotKey in savedState.enchantIds) {
        const slot = slotKey as EquipmentSlot;
        const enchantId = savedState.enchantIds[slot];
        restored[slot] = enchantId ? (getEnchantById(enchantId) || null) : null;
      }
      return restored;
    }
    const initialEnchants: Partial<Record<EquipmentSlot, EnchantInfo | null>> = {};
    for (const slotKey in defaultPreset.enchants) {
      const slot = slotKey as EquipmentSlot;
      const enchantId = (defaultPreset.enchants as any)[slot];
      if (enchantId) {
        initialEnchants[slot] = getEnchantById(enchantId) || null;
      }
    }
    if ((defaultPreset.enchants as any).twohand) {
      const twoHandEnchId = (defaultPreset.enchants as any).twohand;
      initialEnchants.mainhand = getEnchantById(twoHandEnchId) || null;
      initialEnchants.offhand = null;
    }
    return initialEnchants;
  });

  // Talents
  const [talents, setTalents] = useState<TalentConfig>(() => savedState?.talents || defaultPreset.talents || DEFAULT_TALENTS_17_34);

  // Buffs (Filtered to ensure no world buffs are active by default in raids)
  const [buffs, setBuffs] = useState<BuffConfig>(() => {
    if (savedState?.buffs) {
      return savedState.buffs;
    }
    const cleanBuffs = { ...(defaultPreset.buffs || DEFAULT_BUFF_CONFIG) };
    // Disable world buffs for raid ruleset
    cleanBuffs.rallyingCryOfDragonslayer = false;
    cleanBuffs.songflowerSerenade = false;
    cleanBuffs.warchiefsBlessing = false;
    cleanBuffs.spiritOfZandalar = false;
    cleanBuffs.saygesFortune = 0;
    cleanBuffs.fengusFerocity = false;
    cleanBuffs.moldarsMoxie = false;
    cleanBuffs.slipkiksSavvy = false;
    return cleanBuffs;
  });

  // Rotation
  const [rotation, setRotation] = useState<RotationConfig>(() => {
    const base: RotationConfig = savedState?.rotation ? { ...savedState.rotation } : {
      hsRageThreshold: 45,
      heroicStrikeRageThreshold: 45,
      overpowerMaxRage: 35,
      overpowerRageThreshold: 35,
      hamstringRageThreshold: 70,
      hamstringSpamRageThreshold: 70,
      executePhase: true,
      executeBtApThreshold: 2000,
      useHeroicStrike: true,
      useBloodthirst: true,
      useWhirlwind: true,
      useExecute: true,
      useOverpower: true,
      useDeathWish: true,
      useRecklessness: true,
      useBloodrage: true,
      useMightyRagePotion: true,
      deathWishTiming: 0,
      apl: DEFAULT_FURY_APL,
    };
    if (!base.apl || base.apl.length === 0) {
      base.apl = DEFAULT_FURY_APL;
    }
    if (base.useHeroicStrike === undefined) {
      base.useHeroicStrike = true;
    }
    return base;
  });

  // Encounter
  const [encounter, setEncounter] = useState<EncounterConfig>(() => savedState?.encounter || {
    bossLevel: 63,
    targetLevel: 63,
    bossArmor: 3731,
    targetArmor: 3731,
    startingRage: 50,
    durationSec: 60,
    duration: 60,
    durationVariance: 5,
    durationVariationSec: 5,
    executePhasePct: 20,
    executePercentage: 20,
    targets: 1,
    iterations: 2500,
  });

  // Race
  const [race, setRace] = useState<Race>(() => savedState?.race || (defaultPreset.race as Race) || 'orc');

  // Simulation Results & Status
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [statWeights, setStatWeights] = useState<StatWeightsResult | null>(null);
  const [batchResults, setBatchResults] = useState<Record<string, BatchItemResult>>({});

  const [isSimulating, setIsSimulating] = useState(false);
  const [isCalculatingWeights, setIsCalculatingWeights] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<{
    completed: number;
    total: number;
    pct: number;
  } | null>(null);

  // Build Full SimConfig object
  const currentSimConfig = useMemo<SimConfig>(() => {
    const itemsList: ItemStats[] = Object.entries(gear)
      .filter(([, item]) => Boolean(item))
      .map(([slotKey, item]) => ({
        ...item!,
        slot: item!.slot === 'twohand' ? 'twohand' : (slotKey as EquipmentSlot),
      }));
    const enchantsList: ItemStats[] = Object.entries(enchants)
      .filter(([, e]) => Boolean(e))
      .map(([slotKey, e]) => ({
        id: e!.id,
        name: e!.name,
        slot: slotKey as EquipmentSlot,
        ...e!.stats,
      }));

    return {
      race: String(race),
      items: itemsList,
      enchants: enchantsList,
      talents,
      buffs,
      rotation,
      encounter,
      gear,
      iterations: encounter.iterations || 2500,
    };
  }, [encounter, gear, enchants, talents, buffs, rotation, race]);

  // Real-time character sheet summary
  const characterSheet = useMemo(() => {
    return calculateCharacterSheet(currentSimConfig);
  }, [currentSimConfig]);

  // Auto-persist all user settings & APL to localStorage
  useEffect(() => {
    try {
      const gearIds: Partial<Record<EquipmentSlot, string | null>> = {};
      for (const slotKey in gear) {
        const item = gear[slotKey as EquipmentSlot];
        gearIds[slotKey as EquipmentSlot] = item ? item.id : null;
      }
      const enchantIds: Partial<Record<EquipmentSlot, string | null>> = {};
      for (const slotKey in enchants) {
        const ench = enchants[slotKey as EquipmentSlot];
        enchantIds[slotKey as EquipmentSlot] = ench ? ench.id : null;
      }

      const stateToSave = {
        currentPresetId,
        gearIds,
        enchantIds,
        talents,
        buffs,
        rotation,
        encounter,
        race,
        selectedSlot,
      };
      localStorage.setItem('wow_forever_sim_state_v2', JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save sim state to localStorage:', e);
    }
  }, [currentPresetId, gear, enchants, talents, buffs, rotation, encounter, race, selectedSlot]);

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setCurrentPresetId(preset.id);

    const newGear: Partial<Record<EquipmentSlot, ItemStats | null>> = {};
    for (const slotKey in preset.gear) {
      const slot = slotKey as EquipmentSlot;
      const itemId = (preset.gear as any)[slot];
      if (itemId) {
        newGear[slot] = allItemsMap[itemId] || getItemById(itemId) || null;
      }
    }
    if ((preset.gear as any).twohand) {
      const twoHandId = (preset.gear as any).twohand;
      newGear.mainhand = allItemsMap[twoHandId] || getItemById(twoHandId) || null;
      newGear.offhand = null;
    }
    setGear(newGear);

    const newEnchants: Partial<Record<EquipmentSlot, EnchantInfo | null>> = {};
    for (const slotKey in preset.enchants) {
      const slot = slotKey as EquipmentSlot;
      const enchId = (preset.enchants as any)[slot];
      if (enchId) {
        newEnchants[slot] = getEnchantById(enchId) || null;
      }
    }
    if ((preset.enchants as any).twohand) {
      const twoHandEnchId = (preset.enchants as any).twohand;
      newEnchants.mainhand = getEnchantById(twoHandEnchId) || null;
      newEnchants.offhand = null;
    }
    setEnchants(newEnchants);

    if (preset.talents) setTalents(preset.talents);
    if (preset.race) setRace(preset.race as Race);
    if (preset.buffs) {
      const clean = { ...preset.buffs };
      clean.rallyingCryOfDragonslayer = false;
      clean.songflowerSerenade = false;
      clean.warchiefsBlessing = false;
      clean.spiritOfZandalar = false;
      clean.saygesFortune = 0;
      setBuffs(clean);
    }
    if (preset.rotation) {
      setRotation({
        ...rotation,
        hsRageThreshold: preset.rotation.hsRageThreshold || preset.rotation.heroicStrikeRageThreshold || 45,
        heroicStrikeRageThreshold: preset.rotation.heroicStrikeRageThreshold || 45,
        overpowerMaxRage: preset.rotation.overpowerMaxRage || 35,
        overpowerRageThreshold: preset.rotation.overpowerMaxRage || 35,
        hamstringRageThreshold: preset.rotation.hamstringRageThreshold || 70,
        hamstringSpamRageThreshold: preset.rotation.hamstringRageThreshold || 70,
        executePhase: preset.rotation.executePhase !== undefined ? preset.rotation.executePhase : true,
      });
    }
    setBatchResults({});
  };

  // Save Preset
  const handleSavePreset = (name: string) => {
    const gearIds: Partial<Record<EquipmentSlot, string>> = {};
    for (const slotKey in gear) {
      const item = gear[slotKey as EquipmentSlot];
      if (item) gearIds[slotKey as EquipmentSlot] = item.id;
    }

    const enchantsIds: Partial<Record<EquipmentSlot, string>> = {};
    for (const slotKey in enchants) {
      const ench = enchants[slotKey as EquipmentSlot];
      if (ench) enchantsIds[slotKey as EquipmentSlot] = ench.id;
    }

    const newPreset: PresetDefinition = {
      id: `custom-${Date.now()}`,
      name: name.trim() || `Custom Preset ${customPresets.length + 1}`,
      description: 'Custom user-saved preset',
      gear: gearIds,
      enchants: enchantsIds,
      talents,
      buffs,
      rotation,
      race: String(race),
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('wow_forever_saved_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save preset to localStorage:', e);
    }
    setCurrentPresetId(newPreset.id);
  };

  // Delete Preset
  const handleDeletePreset = (presetId: string) => {
    const updatedCustom = customPresets.filter((p) => p.id !== presetId);
    setCustomPresets(updatedCustom);
    try {
      localStorage.setItem('wow_forever_saved_presets', JSON.stringify(updatedCustom));
    } catch (e) {
      console.warn('Failed to delete preset from localStorage:', e);
    }

    let updatedDeleted = deletedPresetIds;
    if (PRESETS.some((p) => p.id === presetId)) {
      if (!deletedPresetIds.includes(presetId)) {
        updatedDeleted = [...deletedPresetIds, presetId];
        setDeletedPresetIds(updatedDeleted);
        try {
          localStorage.setItem('wow_forever_deleted_presets', JSON.stringify(updatedDeleted));
        } catch (e) {
          console.warn('Failed to save deleted presets to localStorage:', e);
        }
      }
    }

    const remaining = [
      ...PRESETS.filter((p) => !updatedDeleted.includes(p.id)),
      ...updatedCustom,
    ];
    if (remaining.length > 0) {
      handleSelectPreset(remaining[0].id);
    }
  };

  // Run Main Combat Simulation
  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await runSimulation(currentSimConfig, encounter.iterations || 2500);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run Stat Weights
  const handleCalculateStatWeights = async () => {
    setIsCalculatingWeights(true);
    try {
      const res = await runStatWeights(currentSimConfig, 1500, (completed, total) => {
        setSimulationProgress({
          completed,
          total,
          pct: Math.round((completed / total) * 100),
        });
      });
      setStatWeights(res);
    } catch (err) {
      console.error('Stat weights error:', err);
    } finally {
      setIsCalculatingWeights(false);
      setSimulationProgress(null);
    }
  };

  // Run Batch Slot Simulation
  const handleSimulateAllInSlot = async (slot: EquipmentSlot, items: ItemStats[]) => {
    setIsSimulating(true);
    setSimulationProgress({ completed: 0, total: items.length, pct: 0 });

    try {
      const candidateIds = items.map((i) => i.id);
      const res = await runBatchSlot(
        {
          baseConfig: currentSimConfig,
          slot: String(slot),
          candidateItems: items,
          candidateItemIds: candidateIds,
          isEnchantBatch: false,
          iterationsPerItem: 1200,
        },
        allItemsMap,
        (completed, total) => {
          setSimulationProgress({
            completed,
            total,
            pct: Math.round((completed / total) * 100),
          });
        }
      );

      const batchMap: Record<string, BatchItemResult> = {};
      for (const itemRes of res.results) {
        batchMap[itemRes.itemId] = itemRes;
      }
      setBatchResults(batchMap);
    } catch (err) {
      console.error('Batch slot sim error:', err);
    } finally {
      setIsSimulating(false);
      setSimulationProgress(null);
    }
  };

  // Equip Item
  const handleEquipItem = (slot: EquipmentSlot, item: ItemStats) => {
    setGear((prev) => {
      const updated = { ...prev };
      const isItemTwoHand = item.slot === 'twohand' || (item as any).itemType === '2H';

      if (slot === 'mainhand') {
        if (isItemTwoHand) {
          updated.mainhand = item;
          updated.twohand = null;
          updated.offhand = null;
          setEnchants((prevEnchants) => ({
            ...prevEnchants,
            offhand: null,
          }));
        } else {
          updated.mainhand = item;
          updated.twohand = null;
        }
      } else if (slot === 'offhand') {
        const isMainHandTwoHand = prev.mainhand?.slot === 'twohand' || (prev.mainhand as any)?.itemType === '2H';
        if (isMainHandTwoHand) {
          updated.mainhand = null;
        }
        updated.twohand = null;
        updated.offhand = item;
      } else if (slot === 'twohand' || isItemTwoHand) {
        updated.mainhand = item;
        updated.twohand = null;
        updated.offhand = null;
        setEnchants((prevEnchants) => ({
          ...prevEnchants,
          offhand: null,
        }));
      } else {
        updated[slot] = item;
      }
      return updated;
    });
  };

  // Apply Enchant
  const handleApplyEnchant = (slot: EquipmentSlot, enchant: EnchantInfo | null) => {
    setEnchants((prev) => ({
      ...prev,
      [slot]: enchant,
    }));
  };

  // Unequip slot
  const handleUnequip = (slot: EquipmentSlot) => {
    setGear((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  // Custom Item Save
  const handleSaveCustomItem = (newItem: ItemStats) => {
    const updated = [newItem, ...customItems];
    setCustomItems(updated);
    try {
      localStorage.setItem('wow_forever_custom_items', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    handleEquipItem(newItem.slot as EquipmentSlot, newItem);
  };

  // Export JSON profile
  const handleExportGearJson = () => {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      gear,
      enchants,
      talents,
      buffs,
      rotation,
      customItems,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import JSON profile
  const handleImportGearJson = (jsonStr: string) => {
    const parsed = JSON.parse(jsonStr);
    if (parsed.gear) setGear(parsed.gear);
    if (parsed.enchants) setEnchants(parsed.enchants);
    if (parsed.talents) setTalents(parsed.talents);
    if (parsed.buffs) setBuffs(parsed.buffs);
    if (parsed.rotation) setRotation(parsed.rotation);
    if (parsed.customItems) {
      setCustomItems(parsed.customItems);
      localStorage.setItem('wow_forever_custom_items', JSON.stringify(parsed.customItems));
    }
  };

  useEffect(() => {
    handleSimulate();
  }, []);

  const slotItems = useMemo(() => {
    return getItemsForSlot(selectedSlot, allItems);
  }, [selectedSlot, allItems]);

  const slotEnchants = useMemo(() => {
    return getEnchantsForSlot(selectedSlot);
  }, [selectedSlot]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-black font-sans selection:bg-[#aac7fb] selection:text-black">
      {/* Column 1: 80px Left Icon Navigation Bar (NavMenu.razor) */}
      <aside className="ww-nav-sidebar shrink-0 flex flex-col items-center py-4 select-none text-white">
        {/* Brand / Logo */}
        <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center font-black text-xl mb-6 shadow">
          WF
        </div>

        {/* Navigation Icon Buttons */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {/* Gear Tab */}
          <button
            onClick={() => setActiveTab('gear')}
            title="Equipment & BiS Calculator (Index)"
            className={`w-14 h-14 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'gear'
                ? 'bg-white/25 text-white font-bold shadow-inner'
                : 'text-[#d7d7d7] hover:bg-white/10'
            }`}
          >
            <Swords className="w-5 h-5" />
            <span className="text-[10px] uppercase font-semibold">Gear</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab('settings')}
            title="Settings: Encounter, Buffs, Talents, Rotation"
            className={`w-14 h-14 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'settings'
                ? 'bg-white/25 text-white font-bold shadow-inner'
                : 'text-[#d7d7d7] hover:bg-white/10'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] uppercase font-semibold">Settings</span>
          </button>

          {/* Efficiency Tab */}
          <button
            onClick={() => setActiveTab('efficiency')}
            title="Spell & Ability Damage / Rage Efficiency"
            className={`w-14 h-14 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'efficiency'
                ? 'bg-white/25 text-white font-bold shadow-inner'
                : 'text-[#d7d7d7] hover:bg-white/10'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="text-[10px] uppercase font-semibold">Efficiency</span>
          </button>

          {/* Results Tab */}
          <button
            onClick={() => setActiveTab('results')}
            title="Simulation Analytics & Breakdown (Results)"
            className={`w-14 h-14 rounded flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'results'
                ? 'bg-white/25 text-white font-bold shadow-inner'
                : 'text-[#d7d7d7] hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] uppercase font-semibold">Results</span>
          </button>
        </div>

        {/* Quick Sim Button at bottom of 80px Nav */}
        <div className="mt-auto flex flex-col items-center">
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            title="Run Quick Simulation"
            className="w-14 h-14 rounded bg-[#e74c3c] hover:bg-[#c0392b] text-white flex flex-col items-center justify-center gap-0.5 shadow-md transition-all active:scale-95 disabled:opacity-50 font-bold text-xs"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Sim</span>
          </button>
        </div>
      </aside>

      {/* Column 2: 310px Persistent Stats Summary Sidebar */}
      <div className="ww-summary-sidebar shrink-0 h-full overflow-y-auto">
        <StatsSidebar
          stats={characterSheet}
          simResult={simResult}
          statWeights={statWeights}
          talents={talents}
          isSimulating={isSimulating}
          isCalculatingWeights={isCalculatingWeights}
          onSimulate={handleSimulate}
          onCalculateWeights={handleCalculateStatWeights}
          race={race}
          presets={allPresets}
          currentPresetId={currentPresetId}
          onSelectPreset={handleSelectPreset}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          targetLevel={encounter.bossLevel || encounter.targetLevel || 63}
        />
      </div>

      {/* Column 3: Main Working Area */}
      <main className="flex-1 h-full overflow-hidden bg-white">
        {/* Tab 1: Gear (Index.razor) */}
        {activeTab === 'gear' && (
          <div className="h-full flex overflow-hidden">
            <div className="w-[230px] shrink-0 h-full border-r border-[#dddddd] bg-white overflow-y-auto">
              <PaperDoll
                gear={gear}
                enchants={enchants}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                onUnequip={handleUnequip}
                currentPresetId={currentPresetId}
                onSelectPreset={handleSelectPreset}
                presets={allPresets}
                onSavePreset={handleSavePreset}
                onDeletePreset={handleDeletePreset}
              />
            </div>

            <div className="flex-1 h-full min-w-0 overflow-hidden p-3">
              <SlotTable
                selectedSlot={selectedSlot}
                equippedItem={gear[selectedSlot] || null}
                equippedEnchant={enchants[selectedSlot] || null}
                availableItems={slotItems}
                availableEnchants={slotEnchants}
                batchResults={batchResults}
                isSimulating={isSimulating}
                simulationProgress={simulationProgress}
                onEquipItem={handleEquipItem}
                onApplyEnchant={handleApplyEnchant}
                onSimulateAllInSlot={handleSimulateAllInSlot}
                onOpenCustomItemModal={() => setIsCustomModalOpen(true)}
                buffs={buffs}
                onChangeBuffs={setBuffs}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Settings (Settings.razor) */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-6 space-y-8 max-w-6xl">
            {/* 1. Simulation & Encounter Settings Bar */}
            <div className="bg-[#eeeeee] p-4 border border-[#d5d5d5] rounded">
              <div className="text-xs font-bold uppercase tracking-wider text-black mb-3 pb-1 border-b border-[#cccccc]">
                Simulation &amp; Encounter Settings
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Race</label>
                  <select
                    value={race}
                    onChange={(e) => setRace(e.target.value as Race)}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black focus:outline-none focus:border-[#1861ac]"
                  >
                    {WOW_FOREVER_RACES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.faction})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Starting Rage</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={encounter.startingRage ?? 50}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, startingRage: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black text-center font-mono focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Fight Length (s)</label>
                  <input
                    type="number"
                    value={encounter.durationSec || encounter.duration || 60}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, durationSec: val, duration: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black text-center font-mono focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Variation (±s)</label>
                  <input
                    type="number"
                    value={encounter.durationVariance ?? encounter.durationVariationSec ?? 5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, durationVariance: val, durationVariationSec: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black text-center font-mono focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Iterations</label>
                  <input
                    type="number"
                    step={500}
                    value={encounter.iterations || 2500}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, iterations: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black text-center font-mono focus:outline-none focus:border-[#1861ac]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Target Level</label>
                  <select
                    value={encounter.bossLevel || encounter.targetLevel || 63}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, bossLevel: val, targetLevel: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black font-mono focus:outline-none focus:border-[#1861ac]"
                  >
                    <option value={60}>60</option>
                    <option value={61}>61</option>
                    <option value={62}>62</option>
                    <option value={63}>63 (Boss)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-black block mb-1">Target Armor</label>
                  <input
                    type="number"
                    step={100}
                    value={encounter.bossArmor || encounter.targetArmor || 3731}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEncounter((prev) => ({ ...prev, bossArmor: val, targetArmor: val }));
                    }}
                    className="w-full bg-white border border-[#cccccc] rounded px-2.5 py-1 text-xs text-black text-center font-mono focus:outline-none focus:border-[#1861ac]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Rotation, Cooldowns & Priority Analyzer */}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-black mb-3 pb-1 border-b-2 border-black">
                Rotation, Cooldowns &amp; Priority Analyzer
              </div>
              <RotationPanel
                rotation={rotation}
                onChange={setRotation}
                simConfig={currentSimConfig}
                characterSheet={characterSheet}
                race={race}
                talents={talents}
              />
            </div>

            {/* 3. Raid Buffs & Consumables */}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-black mb-3 pb-1 border-b-2 border-black">
                Raid Buffs &amp; Consumables
              </div>
              <BuffsPanel
                buffs={buffs}
                encounter={encounter}
                race={race}
                onBuffChange={setBuffs}
                onEncounterChange={setEncounter}
                onRaceChange={setRace}
              />
            </div>

            {/* 4. Talents (Arms / Fury / Protection 3-Column Grid) */}
            <div>
              <div className="text-sm font-bold uppercase tracking-wider text-black mb-3 pb-1 border-b-2 border-black">
                Talents
              </div>
              <TalentTree talents={talents} onChange={setTalents} />
            </div>
          </div>
        )}

        {/* Tab: Efficiency */}
        {activeTab === 'efficiency' && (
          <div className="h-full overflow-y-auto p-6">
            <SpellEfficiencyPanel
              rotation={rotation}
              characterSheet={characterSheet}
              simConfig={currentSimConfig}
              race={race}
              talents={talents}
              onRotationChange={setRotation}
            />
          </div>
        )}

        {/* Tab 3: Results (Results.razor) */}
        {activeTab === 'results' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Top Bar with Run Simulation and Calculate Stat Weights */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#eeeeee] border border-[#d5d5d5] rounded">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="bg-[#1861ac] hover:bg-[#144e8c] text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isSimulating ? 'Simulating...' : 'Run Simulation'}</span>
                </button>

                <button
                  onClick={handleCalculateStatWeights}
                  disabled={isCalculatingWeights || isSimulating}
                  className="bg-white hover:bg-[#f5f5f5] text-black border border-[#aaaaaa] px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-[#1861ac]" />
                  <span>{isCalculatingWeights ? 'Calculating EP...' : 'Calculate Stat Weights (EP)'}</span>
                </button>
              </div>

              {/* Stat Weights Summary Strip */}
              {statWeights && statWeights.weights && (
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-white px-3 py-1.5 border border-[#cccccc] rounded">
                  <span className="font-bold text-black uppercase">Stat Weights (EP):</span>
                  {statWeights.weights.map((w) => (
                    <span key={w.stat}>
                      {w.label || w.name || w.stat} = <strong>{(w.normalized ?? w.dpsPerPoint ?? w.value ?? 1).toFixed(2)}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <AnalyticsPanel simResult={simResult} />
          </div>
        )}
      </main>

      {/* Custom Item Modal */}
      <CustomItemModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSaveCustomItem={handleSaveCustomItem}
        onImportGearJson={handleImportGearJson}
        onExportGearJson={handleExportGearJson}
        defaultSlot={selectedSlot}
      />
    </div>
  );
};

export default App;
