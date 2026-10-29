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
} from './types/sim';
import { PaperDoll } from './components/PaperDoll';
import { SlotTable } from './components/SlotTable';
import { StatsSidebar } from './components/StatsSidebar';
import { TalentTree } from './components/TalentTree';
import { BuffsPanel } from './components/BuffsPanel';
import { RotationPanel } from './components/RotationPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { CustomItemModal } from './components/CustomItemModal';
import {
  ITEMS_DATABASE,
  getItemsForSlot,
  getItemById,
} from './data/items';
import {
  ENCHANTS_DATABASE,
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
  Shield,
  Sparkles,
  BarChart3,
  Sliders,
  Award,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<
    'bis' | 'talents' | 'buffs' | 'rotation' | 'analytics'
  >('bis');

  // Currently selected equipment slot in Paper-Doll
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot>('mainhand');

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

  // Initial preset
  const defaultPreset = PRESETS[0];

  // Character Configuration State
  const [currentPresetId, setCurrentPresetId] = useState<string>(defaultPreset.id);

  // Equipped Items Map
  const [gear, setGear] = useState<Partial<Record<EquipmentSlot, ItemStats | null>>>(() => {
    const initialGear: Partial<Record<EquipmentSlot, ItemStats | null>> = {};
    for (const slotKey in defaultPreset.gear) {
      const slot = slotKey as EquipmentSlot;
      const itemId = (defaultPreset.gear as any)[slot];
      if (itemId) {
        initialGear[slot] = getItemById(itemId) || null;
      }
    }
    return initialGear;
  });

  // Equipped Enchants Map
  const [enchants, setEnchants] = useState<Partial<Record<EquipmentSlot, EnchantInfo | null>>>(() => {
    const initialEnchants: Partial<Record<EquipmentSlot, EnchantInfo | null>> = {};
    for (const slotKey in defaultPreset.enchants) {
      const slot = slotKey as EquipmentSlot;
      const enchantId = (defaultPreset.enchants as any)[slot];
      if (enchantId) {
        initialEnchants[slot] = getEnchantById(enchantId) || null;
      }
    }
    return initialEnchants;
  });

  // Talents
  const [talents, setTalents] = useState<TalentConfig>(defaultPreset.talents || DEFAULT_TALENTS_17_34);

  // Buffs
  const [buffs, setBuffs] = useState<BuffConfig>(defaultPreset.buffs || DEFAULT_BUFF_CONFIG);

  // Rotation
  const [rotation, setRotation] = useState<RotationConfig>({
    hsRageThreshold: 45,
    heroicStrikeRageThreshold: 45,
    overpowerMaxRage: 35,
    overpowerRageThreshold: 35,
    hamstringRageThreshold: 70,
    hamstringSpamRageThreshold: 70,
    executePhase: true,
    useDeathWish: true,
    useRecklessness: true,
    useBloodrage: true,
    useMightyRagePotion: true,
    deathWishTiming: 0,
  });

  // Encounter
  const [encounter, setEncounter] = useState<EncounterConfig>({
    bossLevel: 63,
    targetLevel: 63,
    bossArmor: 4691,
    targetArmor: 4691,
    durationSec: 60,
    duration: 60,
    executePhasePct: 20,
    executePercentage: 20,
    targets: 1,
    iterations: 2500,
  });

  // Race
  const [race, setRace] = useState<Race>('orc');

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

  const [engineMode] = useState<'wasm' | 'native' | 'ts'>('wasm');

  // Build Full SimConfig object
  const currentSimConfig = useMemo<SimConfig>(() => {
    const itemsList: ItemStats[] = Object.values(gear).filter(Boolean) as ItemStats[];
    const enchantsList: ItemStats[] = Object.values(enchants)
      .filter(Boolean)
      .map((e) => ({
        id: e!.id,
        name: e!.name,
        slot: e!.slot,
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
      iterations: 2500,
    };
  }, [encounter, gear, enchants, talents, buffs, rotation, race]);

  // Real-time character sheet summary
  const characterSheet = useMemo(() => {
    return calculateCharacterSheet(currentSimConfig);
  }, [currentSimConfig]);

  // Load Preset
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
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
    setGear(newGear);

    const newEnchants: Partial<Record<EquipmentSlot, EnchantInfo | null>> = {};
    for (const slotKey in preset.enchants) {
      const slot = slotKey as EquipmentSlot;
      const enchId = (preset.enchants as any)[slot];
      if (enchId) {
        newEnchants[slot] = getEnchantById(enchId) || null;
      }
    }
    setEnchants(newEnchants);

    if (preset.talents) setTalents(preset.talents);
    if (preset.buffs) setBuffs(preset.buffs);
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

  // Run Main Combat Simulation
  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await runSimulation(currentSimConfig, 2500);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run Stat Weights
  const handleCalculateWeights = async () => {
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
      if (slot === 'twohand' || item.slot === 'twohand') {
        updated.twohand = item;
        updated.mainhand = null;
        updated.offhand = null;
      } else if (slot === 'mainhand' || slot === 'offhand') {
        updated.twohand = null;
        updated[slot] = item;
      } else {
        updated[slot] = item;
      }
      return updated;
    });
  };

  // Apply Enchant
  const handleApplyEnchant = (slot: EquipmentSlot, enchant: EnchantInfo) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40 text-slate-950 font-black text-lg">
              ⚔️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-extrabold tracking-wide uppercase text-slate-100">
                  WoW: Forever <span className="text-amber-400">Fury Warrior BiS Sim</span>
                </h1>
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  Level 60 Launch
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Sub-millisecond Rust Monte Carlo Engine &bull; Nov 4 Release
              </p>
            </div>
          </div>

          <nav className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('bis')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'bis'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Gear &amp; BiS</span>
            </button>
            <button
              onClick={() => setActiveTab('talents')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'talents'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Talents</span>
            </button>
            <button
              onClick={() => setActiveTab('buffs')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'buffs'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buffs &amp; Boss</span>
            </button>
            <button
              onClick={() => setActiveTab('rotation')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'rotation'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Rotation</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-4 flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeTab === 'bis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
              <div className="lg:col-span-5 h-[760px] lg:h-full">
                <PaperDoll
                  gear={gear}
                  enchants={enchants}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  onUnequip={handleUnequip}
                  currentPresetId={currentPresetId}
                  onSelectPreset={handleSelectPreset}
                  presets={PRESETS}
                />
              </div>

              <div className="lg:col-span-7 h-[760px] lg:h-full">
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
                />
              </div>
            </div>
          )}

          {activeTab === 'talents' && (
            <div className="h-full">
              <TalentTree talents={talents} onChange={setTalents} />
            </div>
          )}

          {activeTab === 'buffs' && (
            <div className="h-full">
              <BuffsPanel
                buffs={buffs}
                encounter={encounter}
                race={race}
                onBuffChange={setBuffs}
                onEncounterChange={setEncounter}
                onRaceChange={setRace}
              />
            </div>
          )}

          {activeTab === 'rotation' && (
            <div className="h-full">
              <RotationPanel rotation={rotation} onChange={setRotation} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="h-full">
              <AnalyticsPanel simResult={simResult} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-80 lg:w-96 shrink-0 h-[680px] md:h-full">
          <StatsSidebar
            stats={characterSheet}
            simResult={simResult}
            statWeights={statWeights}
            talents={talents}
            isSimulating={isSimulating}
            isCalculatingWeights={isCalculatingWeights}
            onSimulate={handleSimulate}
            onCalculateWeights={handleCalculateWeights}
            engineMode={engineMode}
          />
        </div>
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
