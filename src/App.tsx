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
import { BuffsPanel, WOW_FOREVER_RACES } from './components/BuffsPanel';
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
  ChevronDown,
  Users,
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

  // Buffs (Filtered to ensure no world buffs are active by default in raids)
  const [buffs, setBuffs] = useState<BuffConfig>(() => {
    const cleanBuffs = { ...DEFAULT_BUFF_CONFIG };
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
  const [rotation, setRotation] = useState<RotationConfig>({
    hsRageThreshold: 45,
    heroicStrikeRageThreshold: 45,
    overpowerMaxRage: 35,
    overpowerRageThreshold: 35,
    hamstringRageThreshold: 70,
    hamstringSpamRageThreshold: 70,
    executePhase: true,
    executeBtApThreshold: 2000,
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
    if (preset.buffs) {
      const clean = { ...preset.buffs };
      // disable world buffs
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

  // Current active race details
  const activeRaceInfo = useMemo(() => {
    const norm = String(race).toLowerCase().replace(/[^a-z]/g, '');
    return WOW_FOREVER_RACES.find((r) => r.id.toLowerCase().replace(/[^a-z]/g, '') === norm) || WOW_FOREVER_RACES[0];
  }, [race]);

  return (
    <div className="min-h-screen bg-[#111318] text-[#e2e2e9] flex flex-col font-sans selection:bg-[#284777] selection:text-[#d6e3ff]">
      {/* Google Material Design 3 Top Bar */}
      <header className="border-b border-[#44474e]/40 bg-[#191c20]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#284777] text-[#a8c7fa] flex items-center justify-center font-black text-xl shadow-sm border border-[#a8c7fa]/30">
              ⚔️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-[#e2e2e9]">
                  WoW: Forever <span className="text-[#a8c7fa]">Fury Warrior BiS Sim</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 uppercase tracking-wider">
                  Level 60 Launch
                </span>
              </div>
              <p className="text-[11px] text-[#8e9099] font-mono">
                Sub-millisecond Rust Monte Carlo Engine &bull; Google Material Design 3
              </p>
            </div>
          </div>

          {/* Quick Race Selector Chip */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={activeRaceInfo.id}
                onChange={(e) => setRace(e.target.value as Race)}
                className="appearance-none bg-[#1d2024] border border-[#44474e]/50 hover:border-[#a8c7fa] text-[#d6e3ff] text-xs rounded-full pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] cursor-pointer transition-all font-medium"
                title={`Active Racials: ${activeRaceInfo.racialsSummary}`}
              >
                {WOW_FOREVER_RACES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.faction}) &bull; {r.keyPerk}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#a8c7fa] absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Segmented Pill Navigation Tabs */}
          <nav className="flex bg-[#111318] p-1 rounded-full border border-[#44474e]/40 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('bis')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeTab === 'bis'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9] hover:bg-[#1d2024]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Gear &amp; BiS</span>
            </button>
            <button
              onClick={() => setActiveTab('talents')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeTab === 'talents'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9] hover:bg-[#1d2024]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Talents</span>
            </button>
            <button
              onClick={() => setActiveTab('buffs')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeTab === 'buffs'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9] hover:bg-[#1d2024]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Raid Buffs &amp; Consumables</span>
            </button>
            <button
              onClick={() => setActiveTab('rotation')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeTab === 'rotation'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9] hover:bg-[#1d2024]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Priority &amp; Spell Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#284777] text-[#d6e3ff] border border-[#a8c7fa]/40 shadow-sm'
                  : 'text-[#8e9099] hover:text-[#e2e2e9] hover:bg-[#1d2024]'
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
              <RotationPanel
                rotation={rotation}
                onChange={setRotation}
                simConfig={currentSimConfig}
                characterSheet={characterSheet}
                race={race}
                talents={talents}
              />
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
            race={race}
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
