// Shared TypeScript definitions for WoW: Forever Fury Warrior Simulator & BiS Engine
// All data structures match serde-serialized Rust sim-core structs (rename_all = "camelCase")
// and provide full bidirectional compatibility with UI components and workers.

export type EquipmentSlot =
  | 'head'
  | 'neck'
  | 'shoulder'
  | 'back'
  | 'chest'
  | 'wrist'
  | 'hands'
  | 'waist'
  | 'legs'
  | 'feet'
  | 'ring1'
  | 'ring2'
  | 'trinket1'
  | 'trinket2'
  | 'mainhand'
  | 'offhand'
  | 'twohand'
  | 'ranged';

export type WeaponType =
  | 'Sword'
  | 'Axe'
  | 'Mace'
  | 'Dagger'
  | 'Fist'
  | 'Polearm'
  | 'TwoHandSword'
  | 'TwoHandAxe'
  | 'TwoHandMace'
  | 'Staff'
  | 'Bow'
  | 'Crossbow'
  | 'Gun'
  | 'Thrown'
  | 'Shield'
  | 'None'
  | 'sword'
  | 'axe'
  | 'mace'
  | 'dagger'
  | 'fist'
  | 'twohand_sword'
  | 'twohand_axe'
  | 'twohand_mace'
  | 'polearm'
  | 'bow'
  | 'crossbow'
  | 'gun';

export type Race =
  | 'Human'
  | 'Orc'
  | 'Troll'
  | 'Undead'
  | 'Tauren'
  | 'Gnome'
  | 'Dwarf'
  | 'NightElf'
  | 'human'
  | 'orc'
  | 'tauren'
  | 'undead'
  | 'troll'
  | 'dwarf'
  | 'night_elf'
  | 'gnome'
  | 'skyborne_elf';

export type ItemQuality =
  | 'poor'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

/**
 * ItemStats matches Rust `ItemStats` in sim-core (camelCase) with UI helper fields.
 */
export interface ItemStats {
  id: string;
  name: string;
  slot: string; // "head", "neck", "shoulder", "ring", "trinket", "onehand", etc.
  str?: number;
  agi?: number;
  sta?: number;
  ap?: number;
  crit?: number; // % e.g. 1.0 = 1%
  hit?: number; // % e.g. 1.0 = 1%
  ohHit?: number; // % bonus off-hand hit (WoW: Forever)
  haste?: number; // % e.g. 1.0 = 1%
  armor?: number;
  armorPen?: number;
  weaponSkill?: number;
  skillType?: string;
  minDmg?: number;
  maxDmg?: number;
  speed?: number; // swing timer in seconds e.g. 2.6
  weaponType?: WeaponType | string;
  procType?: string; // "crusader", "ironfoe", "flurry_axe", "hoj", "bonereaver", "deathbringer", "vis_kag", "windfury_item"
  procPpm?: number;
  procChance?: number; // % e.g. 2.0 = 2%
  procValue?: number;
  onUseAp?: number;
  onUseHaste?: number;
  onUseArmorPen?: number;
  onUseDuration?: number;
  onUseCd?: number;

  // UI & Metadata Helper Fields
  quality?: ItemQuality;
  source?: string;
  phase?: string;
  icon?: string;
  wowheadId?: number;
  isCustom?: boolean;
  itemType?: '1H' | '2H' | 'OH' | 'Ranged' | 'Armor';
  unique?: boolean;
  dps?: number;
  [key: string]: any;
}

/**
 * Enchant definition
 */
export interface EnchantInfo {
  id: string;
  name: string;
  slot: string;
  stats: Partial<ItemStats>;
  description?: string;
  phase?: string;
}

/**
 * WoW: Forever TalentConfig matching Rust sim-core
 */
export type TalentConfig = {
  // Arms
  deflection?: number;
  improvedRend?: number;
  improvedHeroicStrike?: number;
  improvedTacticalMastery?: number;
  tacticalMastery?: number;
  improvedOverpower?: number;
  angerManagement?: number;
  deepWounds?: number;
  impale?: number;
  weaponmaster?: number; // WoW: Forever consolidated Weapon Mastery (+3/+5 skill & crit)
  weaponMastery?: number;
  twoHandedWeaponSpecialization?: number;
  twoHandedWeaponSpec?: number;

  // Fury
  cruelty?: number;
  boomingVoice?: number;
  unbridledWrath?: number;
  lingeringRage?: number; // WoW: Forever Row 2
  improvedBattleShout?: number;
  furiousPrecision?: number; // WoW: Forever Row 3 (Off-Hand Hit!)
  improvedExecute?: number;
  enrage?: number;
  dualWieldSpecialization?: number;
  dualWieldSpec?: number;
  ragingBlows?: number; // WoW: Forever Row 4 (-rage cost on WW/Cleave)
  deathWish?: number; // WoW: Forever Row 5 (prereq for Flurry)
  improvedBerserkerRage?: number;
  flurry?: number; // WoW: Forever Row 6
  goreDrinker?: number; // WoW: Forever Row 6
  bloodthirst?: number; // Row 7
} & Record<string, any>;

/**
 * BuffConfig matching Rust sim-core (camelCase)
 */
export type BuffConfig = {
  // World Buffs
  rallyingCry?: boolean;
  rallyingCryOfDragonslayer?: boolean;
  songflower?: boolean;
  songflowerSerenade?: boolean;
  warchiefsBlessing?: boolean;
  spiritOfZandalar?: boolean;
  direMaulTribute?: boolean;
  fengusFerocity?: boolean;
  moldarsMoxie?: boolean;
  slipkiksSavvy?: boolean;
  darkmoonFaire?: boolean;
  saygesFortune?: number;

  // Raid Auras & Buffs
  battleShout?: boolean;
  improvedBattleShout?: boolean;
  trueshotAura?: boolean;
  leaderOfThePack?: boolean;
  windfuryTotem?: boolean;
  strengthOfEarth?: boolean;
  strengthOfEarthTotem?: boolean;
  graceOfAir?: boolean;
  graceOfAirTotem?: boolean;
  blessingOfKings?: boolean;
  blessingOfMight?: boolean;
  improvedBlessingOfMight?: boolean;
  markOfTheWild?: boolean;

  // Consumables
  elixirOfTheMongoose?: boolean;
  elixirOfMongoose?: boolean;
  elixirOfGiants?: boolean;
  winterfallFirewater?: boolean;
  jujuPower?: boolean;
  jujuMight?: boolean;
  jujuFlurry?: boolean;
  smokedDesertDumplings?: boolean;
  blessedSunfruit?: boolean;
  scorpokAssay?: boolean;
  roids?: boolean;
  roidCombat?: boolean;
  mightyRagePotion?: boolean;
  goblinSapper?: boolean;
  denseDynamite?: boolean;

  // Weapon Stones
  elementalSharpeningStoneMh?: boolean;
  elementalSharpeningStoneMH?: boolean;
  elementalSharpeningStoneOh?: boolean;
  elementalSharpeningStoneOH?: boolean;
  denseWeightstoneMh?: boolean;
  denseSharpeningStoneMH?: boolean;
  denseWeightstoneOh?: boolean;
  denseSharpeningStoneOH?: boolean;
  consecratedSharpeningStoneMH?: boolean;
  consecratedSharpeningStoneOH?: boolean;

  // Target Debuffs
  sunderArmor?: number;
  faerieFire?: boolean;
  curseOfRecklessness?: boolean;
  annihilatorStacks?: number;
  annihilator?: number;
  improvedExposeArmor?: number;
  giftOfArthas?: boolean;
} & Record<string, any>;

/**
 * RotationConfig matching Rust sim-core (camelCase) and UI
 */
export type RotationConfig = {
  useBloodthirst?: boolean;
  bloodthirstPrio?: number;
  useWhirlwind?: boolean;
  whirlwindPrio?: number;
  useHeroicStrike?: boolean;
  hsRageThreshold?: number;
  heroicStrikeRageThreshold?: number;
  useCleave?: boolean;
  cleaveRageThreshold?: number;
  useOverpower?: boolean;
  overpowerMaxRage?: number;
  overpowerRageThreshold?: number;
  useHamstring?: boolean;
  hamstringRageThreshold?: number;
  hamstringSpamRageThreshold?: number;
  useExecute?: boolean;
  executePhase?: boolean;
  useBtInExecute?: boolean;
  executeBtApThreshold?: number;
  executeRagePoolThreshold?: number;
  useDeathWish?: boolean;
  useRecklessness?: boolean;
  useBloodrage?: boolean;
  useBerserkerRage?: boolean;
  useTrinkets?: boolean;
  useRacial?: boolean;
  useMightyRagePotion?: boolean;
  mightyRageTime?: number;
  slamWeave?: boolean;
  slamRageThreshold?: number;
  deathWishTiming?: number;
  recklessnessTiming?: number;
} & Record<string, any>;

/**
 * EncounterConfig matching Rust sim-core (camelCase) and UI
 */
export type EncounterConfig = {
  duration?: number;
  durationSec?: number;
  durationVariance?: number;
  durationVariationSec?: number;
  targetLevel?: number;
  bossLevel?: number;
  targetArmor?: number;
  bossArmor?: number;
  startingRage?: number;
  executePercentage?: number;
  executePhasePct?: number;
  targetDefense?: number;
  targetCount?: number;
  targets?: number;
  iterations?: number;
  seed?: number;
} & Record<string, any>;

export const DEFAULT_ENCOUNTER_CONFIG: EncounterConfig = {
  duration: 60,
  durationSec: 60,
  durationVariance: 5,
  durationVariationSec: 5,
  bossLevel: 63,
  targetLevel: 63,
  bossArmor: 3731,
  targetArmor: 3731,
  startingRage: 50,
  executePercentage: 20,
  executePhasePct: 20,
  targets: 1,
  targetCount: 1,
  iterations: 2500,
};

/**
 * Full SimConfig passed to Rust simulation engine or TS worker
 */
export type SimConfig = {
  race: Race | string;
  items?: ItemStats[];
  enchants?: any;
  talents: TalentConfig;
  buffs: BuffConfig;
  rotation: RotationConfig;
  encounter: EncounterConfig;
  gear: Partial<Record<EquipmentSlot, ItemStats | null>>;
  iterations?: number;
} & Record<string, any>;

/**
 * AbilityBreakdown matching Rust sim-core and UI
 */
export type AbilityBreakdown = {
  name: string;
  totalDamage?: number;
  damage: number;
  dps: number;
  pct?: number;
  percentage: number;
  casts: number;
  hitPct?: number;
  hits: number;
  critPct?: number;
  crits: number;
  glancePct?: number;
  glancings: number;
  missPct?: number;
  misses: number;
  dodgePct?: number;
  dodges: number;
} & Record<string, any>;

/**
 * CharacterSheetSummary matching Rust sim-core and UI
 */
export type CharacterSheetSummary = {
  totalStr?: number;
  totalAgi?: number;
  totalAp?: number;
  critPct?: number;
  mhHitPct?: number;
  ohHitPct?: number;
  mhWhiteMissPct: number;
  ohWhiteMissPct: number;
  yellowMissPct: number;
  mhCritCap?: number;
  ohCritCap?: number;
  hastePct?: number;
  mhNormRage?: number;
  ohNormRage?: number;
  mhCritRage?: number;
  ohCritRage?: number;
  effectiveBossArmor?: number;
  armorReductionPct?: number;
  retainedStanceRage?: number;

  str: number;
  agi: number;
  sta: number;
  ap: number;
  crit: number;
  hit: number;
  ohHit: number;
  haste: number;
  mhSkill: number;
  ohSkill: number;
  mhSpeed: number;
  ohSpeed: number;
  mhMinDmg: number;
  mhMaxDmg: number;
  ohMinDmg: number;
  ohMaxDmg: number;
  mhDps: number;
  ohDps: number;
  armor: number;
  effectiveArmorPen?: number;
  bossArmorRemaining?: number;
} & Record<string, any>;

export type DpsHistogramBin = [number, number];

/**
 * SimResult matching Rust sim-core and UI
 */
export type SimResult = {
  dps: number;
  meanDps?: number;
  minDps: number;
  maxDps: number;
  medianDps?: number;
  stdDev: number;
  stdDevDps?: number;
  errorMargin?: number;
  meanRps?: number;
  flurryUptimePct?: number;
  goreDrinkerHealsPerMin?: number;
  elapsedMs?: number;
  executionTimeMs?: number;
  iterations: number;
  duration: number;
  sheet: CharacterSheetSummary;
  stats: CharacterSheetSummary;
  abilities: AbilityBreakdown[];
  dpsHistogram: DpsHistogramBin[];
  procUptimes?: Record<string, number>;
  timeSeriesDps?: { time: number; dps: number }[];
} & Record<string, any>;

/**
 * BatchSlotRequest matching Rust sim-core and UI
 */
export type BatchSlotRequest = {
  slot: EquipmentSlot | string;
  candidateItemIds: string[];
  candidateItems?: ItemStats[];
  baseConfig: SimConfig;
  iterationsPerItem?: number;
  isEnchantBatch?: boolean;
} & Record<string, any>;

/**
 * BatchItemResult matching Rust sim-core and UI
 */
export type BatchItemResult = {
  itemId: string;
  itemName: string;
  dps: number;
  meanDps?: number;
  deltaDps?: number;
  dpsDelta: number;
  errorMargin?: number;
  mhCritCap?: number;
  ohWhiteMissPct?: number;
  quality?: ItemQuality;
  icon?: string;
  phase?: string;
  source?: string;
} & Record<string, any>;

/**
 * BatchSlotResult matching Rust sim-core and UI
 */
export type BatchSlotResult = {
  slot: string;
  results: BatchItemResult[];
  baselineDps?: number;
  elapsedMs?: number;
} & Record<string, any>;

/**
 * StatWeightEntry matching Rust sim-core and UI
 */
export type StatWeightEntry = {
  stat: string;
  name: string;
  label?: string;
  value: number;
  epPerPoint?: number;
  normalized: number;
  dpsPerPoint: number;
} & Record<string, any>;

/**
 * StatWeightsResult matching Rust sim-core and UI
 */
export type StatWeightsResult = {
  baselineDps: number;
  dpsPerAp?: number;
  elapsedMs?: number;
  weights: StatWeightEntry[];
} & Record<string, any>;

/**
 * Visual Talent Tree Node for React UI
 */
export interface TalentTreeNode {
  id: string;
  name: string;
  icon: string;
  row: number; // 1 to 7
  col: number; // 1 to 4
  maxRank: number;
  currentRank: number;
  descriptions: string[];
  tree: 'arms' | 'fury' | 'protection';
  prereq?: {
    id: string;
    row: number;
    col: number;
  };
}

/**
 * Gear and Talent Preset Definition
 */
export interface PresetDefinition {
  id: string;
  name: string;
  description: string;
  gear: Partial<Record<EquipmentSlot, string>>; // Slot to Item ID
  enchants: Partial<Record<EquipmentSlot, string>>; // Slot to Enchant ID
  talents: TalentConfig;
  buffs: BuffConfig;
  rotation: RotationConfig;
  race: string;
}
