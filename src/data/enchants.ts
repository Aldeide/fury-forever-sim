import { EnchantInfo } from '../types/sim';

export const ENCHANTS_DATABASE: EnchantInfo[] = [
  // ==========================================
  // HEAD
  // ==========================================
  {
    id: 'head-voracity-str',
    name: 'Lesser Arcanum of Voracity (Strength)',
    slot: 'head',
    stats: { str: 8 },
    description: '+8 Strength',
    phase: 'Phase 1',
  },
  {
    id: 'head-voracity-agi',
    name: 'Lesser Arcanum of Voracity (Agility)',
    slot: 'head',
    stats: { agi: 8 },
    description: '+8 Agility',
    phase: 'Phase 1',
  },
  {
    id: 'head-syncretists-sigil',
    name: "Syncretist's Sigil",
    slot: 'head',
    stats: { ap: 10, hit: 1.0 },
    description: '+10 Attack Power, +1% Hit',
    phase: 'Phase 4',
  },
  {
    id: 'head-deaths-embrace',
    name: "Death's Embrace",
    slot: 'head',
    stats: { ap: 28 },
    description: '+28 Attack Power, +1% Dodge',
    phase: 'Phase 4',
  },

  // ==========================================
  // SHOULDER
  // ==========================================
  {
    id: 'shoulder-zandalar-might',
    name: 'Zandalar Signet of Might',
    slot: 'shoulder',
    stats: { ap: 30 },
    description: '+30 Attack Power',
    phase: 'Phase 4',
  },
  {
    id: 'shoulder-might-of-the-scourge',
    name: 'Might of the Scourge',
    slot: 'shoulder',
    stats: { ap: 26, crit: 1.0 },
    description: '+26 Attack Power, +1% Critical Strike',
    phase: 'Phase 6',
  },
  {
    id: 'shoulder-fire-res',
    name: 'Fire Mantle of the Dawn',
    slot: 'shoulder',
    stats: {},
    description: '+5 Fire Resistance',
    phase: 'Phase 1',
  },

  // ==========================================
  // BACK
  // ==========================================
  {
    id: 'back-greater-agility',
    name: 'Enchant Cloak - Greater Agility',
    slot: 'back',
    stats: { agi: 3 },
    description: '+3 Agility',
    phase: 'Phase 1',
  },
  {
    id: 'back-subtlety',
    name: 'Enchant Cloak - Subtlety',
    slot: 'back',
    stats: {},
    description: 'Reduces threat caused by 2%',
    phase: 'Phase 5',
  },
  {
    id: 'back-dodge',
    name: 'Enchant Cloak - Dodge',
    slot: 'back',
    stats: {},
    description: '+1% Dodge',
    phase: 'Phase 5',
  },

  // ==========================================
  // CHEST
  // ==========================================
  {
    id: 'chest-greater-stats',
    name: 'Enchant Chest - Greater Stats',
    slot: 'chest',
    stats: { str: 4, agi: 4, sta: 4 },
    description: '+4 All Stats',
    phase: 'Phase 1',
  },
  {
    id: 'chest-major-health',
    name: 'Enchant Chest - Major Health',
    slot: 'chest',
    stats: { sta: 10 },
    description: '+100 Health',
    phase: 'Phase 1',
  },

  // ==========================================
  // WRIST
  // ==========================================
  {
    id: 'wrist-superior-strength',
    name: 'Enchant Bracer - Superior Strength',
    slot: 'wrist',
    stats: { str: 9 },
    description: '+9 Strength',
    phase: 'Phase 1',
  },
  {
    id: 'wrist-greater-stamina',
    name: 'Enchant Bracer - Greater Stamina',
    slot: 'wrist',
    stats: { sta: 7 },
    description: '+7 Stamina',
    phase: 'Phase 1',
  },
  {
    id: 'wrist-minor-haste',
    name: 'Enchant Bracer - Minor Haste',
    slot: 'wrist',
    stats: { haste: 1.0 },
    description: '+1% Attack Speed (WoW: Forever)',
    phase: 'WoW: Forever',
  },

  // ==========================================
  // HANDS
  // ==========================================
  {
    id: 'hands-superior-agility',
    name: 'Enchant Gloves - Superior Agility',
    slot: 'hands',
    stats: { agi: 15 },
    description: '+15 Agility',
    phase: 'Phase 5',
  },
  {
    id: 'hands-greater-strength',
    name: 'Enchant Gloves - Greater Strength',
    slot: 'hands',
    stats: { str: 7 },
    description: '+7 Strength',
    phase: 'Phase 1',
  },
  {
    id: 'hands-minor-haste',
    name: 'Enchant Gloves - Minor Haste',
    slot: 'hands',
    stats: { haste: 1.0 },
    description: '+1% Attack Speed',
    phase: 'Phase 1',
  },

  // ==========================================
  // LEGS
  // ==========================================
  {
    id: 'legs-voracity-str',
    name: 'Lesser Arcanum of Voracity (Strength)',
    slot: 'legs',
    stats: { str: 8 },
    description: '+8 Strength',
    phase: 'Phase 1',
  },
  {
    id: 'legs-voracity-agi',
    name: 'Lesser Arcanum of Voracity (Agility)',
    slot: 'legs',
    stats: { agi: 8 },
    description: '+8 Agility',
    phase: 'Phase 1',
  },
  {
    id: 'legs-syncretists-sigil',
    name: "Syncretist's Sigil",
    slot: 'legs',
    stats: { ap: 10, hit: 1.0 },
    description: '+10 Attack Power, +1% Hit',
    phase: 'Phase 4',
  },
  {
    id: 'legs-deaths-embrace',
    name: "Death's Embrace",
    slot: 'legs',
    stats: { ap: 28 },
    description: '+28 Attack Power, +1% Dodge',
    phase: 'Phase 4',
  },

  // ==========================================
  // FEET
  // ==========================================
  {
    id: 'feet-greater-agility',
    name: 'Enchant Boots - Greater Agility',
    slot: 'feet',
    stats: { agi: 7 },
    description: '+7 Agility',
    phase: 'Phase 1',
  },
  {
    id: 'feet-minor-speed',
    name: 'Enchant Boots - Minor Speed',
    slot: 'feet',
    stats: {},
    description: '+8% Movement Speed',
    phase: 'Phase 1',
  },
  {
    id: 'feet-greater-stamina',
    name: 'Enchant Boots - Greater Stamina',
    slot: 'feet',
    stats: { sta: 7 },
    description: '+7 Stamina',
    phase: 'Phase 1',
  },

  // ==========================================
  // MAIN-HAND & OFF-HAND (WEAPONS)
  // ==========================================
  {
    id: 'weapon-crusader',
    name: 'Enchant Weapon - Crusader',
    slot: 'weapon',
    stats: { procType: 'crusader', procPpm: 1.0 },
    description: 'Chance on hit to gain +100 Strength for 15s and heal for 75-125',
    phase: 'Phase 1',
  },
  {
    id: 'weapon-15-agility',
    name: 'Enchant Weapon - 15 Agility',
    slot: 'weapon',
    stats: { agi: 15 },
    description: '+15 Agility',
    phase: 'Phase 3',
  },
  {
    id: 'weapon-superior-striking',
    name: 'Enchant Weapon - Superior Striking',
    slot: 'weapon',
    stats: { ap: 10 },
    description: '+5 Weapon Damage',
    phase: 'Phase 1',
  },
  {
    id: 'weapon-lifestealing',
    name: 'Enchant Weapon - Lifestealing',
    slot: 'weapon',
    stats: { procType: 'lifestealing', procPpm: 6.0 },
    description: 'Chance on hit to drain 30 life from target',
    phase: 'Phase 1',
  },

  // ==========================================
  // TWO-HAND WEAPONS
  // ==========================================
  {
    id: '2h-crusader',
    name: 'Enchant 2H Weapon - Crusader',
    slot: 'twohand',
    stats: { procType: 'crusader', procPpm: 1.0 },
    description: 'Chance on hit to gain +100 Strength for 15s and heal for 75-125',
    phase: 'Phase 1',
  },
  {
    id: '2h-25-agility',
    name: 'Enchant 2H Weapon - 25 Agility',
    slot: 'twohand',
    stats: { agi: 25 },
    description: '+25 Agility',
    phase: 'Phase 3',
  },
  {
    id: '2h-impact-damage',
    name: 'Enchant 2H Weapon - Superior Impact',
    slot: 'twohand',
    stats: { ap: 18 },
    description: '+9 Weapon Damage',
    phase: 'Phase 1',
  },
  {
    id: '2h-iron-counterweight',
    name: 'Iron Counterweight',
    slot: 'twohand',
    stats: { haste: 3.0 },
    description: '+3% Attack Speed (Blacksmithing attached counterweight)',
    phase: 'Phase 1',
  },
];

export const ENCHANT_LOOKUP: Map<string, EnchantInfo> = new Map(
  ENCHANTS_DATABASE.map((ench) => [ench.id, ench])
);

export function getEnchantById(id: string): EnchantInfo | undefined {
  return ENCHANT_LOOKUP.get(id);
}

export function getEnchantsForSlot(slot: string): EnchantInfo[] {
  if (slot === 'mainhand') {
    const list = ENCHANTS_DATABASE.filter(
      (e) => e.slot === 'weapon' || e.slot === 'mainhand' || e.slot === 'twohand'
    );
    const seen = new Set<string>();
    return list.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }
  if (slot === 'twohand') {
    return ENCHANTS_DATABASE.filter(
      (e) => e.slot === 'twohand' || e.slot === 'weapon'
    );
  }
  return ENCHANTS_DATABASE.filter((e) => e.slot === slot);
}
