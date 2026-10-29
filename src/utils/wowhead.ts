import { EquipmentSlot, ItemStats, ItemQuality, WeaponType } from '../types/sim';

/**
 * Normalizes an icon name and generates an authentic Wowhead CDN icon image URL.
 * 
 * @param icon The icon slug (e.g. "inv_helmet_36", "inv_sword_48") or full URL
 * @param size Icon resolution: 'small' (18x18), 'medium' (36x36), or 'large' (56x56)
 */
export function getWowheadIconUrl(
  icon?: string,
  size: 'small' | 'medium' | 'large' = 'large'
): string {
  if (!icon || icon.trim() === '') {
    return `https://wow.zamimg.com/images/wow/icons/${size}/inv_misc_questionmark.jpg`;
  }

  const trimmed = icon.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Strip file extensions (.jpg, .png, etc.) and ensure lowercase
  const cleanIcon = trimmed.replace(/\.(jpg|png|webp|gif)$/i, '').toLowerCase();
  return `https://wow.zamimg.com/images/wow/icons/${size}/${cleanIcon}.jpg`;
}

/**
 * Standard Wowhead icons for Warrior abilities, procs, buffs, and racials.
 */
export const ABILITY_ICON_MAP: Record<string, string> = {
  // Core Yellow Abilities
  'Bloodthirst': 'spell_nature_bloodlust',
  'Whirlwind': 'ability_whirlwind',
  'Execute': 'inv_sword_48',
  'Execute (Min)': 'inv_sword_48',
  'Execute (30r)': 'inv_sword_48',
  'Execute (+1r Marginal)': 'inv_sword_48',
  'Execute (15 Rage Baseline)': 'inv_sword_48',
  'Execute (10 Rage Baseline)': 'inv_sword_48',
  'Execute (at 30 Rage — vs BT)': 'inv_sword_48',
  'Execute (Marginal +1 Rage Overflow)': 'inv_sword_48',
  'Heroic Strike': 'ability_rogue_ambush',
  'Cleave': 'ability_warrior_cleave',
  'Overpower': 'ability_meleedamage',
  'Overpower (Battle Stance)': 'ability_meleedamage',
  'Hamstring': 'ability_shockwave',
  'Slam': 'ability_warrior_decisivestrike',
  'Rend': 'ability_gouge',
  'Sunder Armor': 'ability_warrior_sunder',

  // White Attacks & Bleeds
  'Auto-Attack (MH)': 'inv_sword_04',
  'Auto-Attack': 'inv_sword_04',
  'Melee (MH)': 'inv_sword_04',
  'Auto-Attack (OH)': 'inv_axe_01',
  'Melee (OH)': 'inv_axe_01',
  'Deep Wounds': 'ability_backstab',

  // Combat Cooldowns & Talents
  'Death Wish': 'spell_shadow_deathpact',
  'Recklessness': 'ability_criticalstrike',
  'Bloodrage': 'ability_racial_bloodrage',
  'Berserker Rage': 'spell_nature_ancestralguardian',
  'Flurry': 'ability_ghoulfrenzy',
  'Enrage': 'spell_shadow_unholyfrenzy',
  'Battle Shout': 'ability_warrior_battleshout',
  'Gore Drinker': 'inv_drink_13',

  // Item & Enchants Procs
  'Crusader': 'spell_holy_blessingofstrength',
  'Crusader (MH)': 'spell_holy_blessingofstrength',
  'Crusader (OH)': 'spell_holy_blessingofstrength',
  'Windfury Totem': 'spell_nature_windfury',
  'Windfury': 'spell_nature_windfury',
  'Mighty Rage Potion': 'inv_potion_41',
  'Mighty Rage Pot': 'inv_potion_41',
  'Diamond Flask': 'inv_drink_01',
  'Earthstrike': 'spell_nature_abolishmagic',
  'Badge of the Swarmguard': 'inv_misc_ahnqirajtrinket_04',
  'Kiss of the Spider': 'inv_trinket_naxxramas04',
  'Slayer\'s Crest': 'inv_trinket_naxxramas03',

  // Racials (WoW: Forever)
  'Blood Fury': 'racial_orc_berserkerstrength',
  'Berserking': 'racial_troll_berserk',
  'Elune\'s Light': 'spell_holy_elunesgrace',
  'Eureka!': 'inv_gizmo_02',
  'Touch of the Grave': 'spell_shadow_chilltouch',
  'Ruthless': 'ability_racial_bloodrage',
  'Artisan\'s Precision': 'inv_hammer_01',
  'Wind-Blessed': 'spell_magic_featherfall',
  'Expansive Mind': 'inv_misc_head_gnome_01',
};

/**
 * Returns the authentic Wowhead CDN icon image URL for any Warrior ability or combat proc.
 */
export function getAbilityIconUrl(
  abilityName: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): string {
  // Exact match
  if (ABILITY_ICON_MAP[abilityName]) {
    return getWowheadIconUrl(ABILITY_ICON_MAP[abilityName], size);
  }

  // Substring or prefix matching
  const lower = abilityName.toLowerCase();
  for (const [key, slug] of Object.entries(ABILITY_ICON_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return getWowheadIconUrl(slug, size);
    }
  }

  // Fallbacks based on category keywords
  if (lower.includes('execute')) return getWowheadIconUrl('inv_sword_48', size);
  if (lower.includes('bloodthirst')) return getWowheadIconUrl('spell_nature_bloodlust', size);
  if (lower.includes('whirlwind')) return getWowheadIconUrl('ability_whirlwind', size);
  if (lower.includes('heroic strike')) return getWowheadIconUrl('ability_rogue_ambush', size);
  if (lower.includes('overpower')) return getWowheadIconUrl('ability_meleedamage', size);
  if (lower.includes('cleave')) return getWowheadIconUrl('ability_warrior_cleave', size);
  if (lower.includes('hamstring')) return getWowheadIconUrl('ability_shockwave', size);
  if (lower.includes('deep wounds')) return getWowheadIconUrl('ability_backstab', size);
  if (lower.includes('crusader')) return getWowheadIconUrl('spell_holy_blessingofstrength', size);
  if (lower.includes('flurry')) return getWowheadIconUrl('ability_ghoulfrenzy', size);
  if (lower.includes('touch of the grave')) return getWowheadIconUrl('spell_shadow_chilltouch', size);

  return getWowheadIconUrl('inv_misc_questionmark', size);
}

/**
 * Returns the authentic Wowhead Classic URL for an item.
 */
export function getWowheadItemUrl(item: { wowheadId?: number; name: string }): string {
  if (item.wowheadId && item.wowheadId > 0) {
    return `https://www.wowhead.com/classic/item=${item.wowheadId}`;
  }
  return `https://www.wowhead.com/classic/search?q=${encodeURIComponent(item.name)}`;
}

/**
 * Fetches item tooltip data directly from Wowhead Classic and converts it to a simulator ItemStats object.
 *
 * @param input Item ID (e.g. 19019) or full Wowhead URL (e.g. "https://www.wowhead.com/classic/item=19019/thunderfury...")
 * @param fallbackSlot Fallback equipment slot if not detected from the tooltip
 */
export async function fetchWowheadItemByIdOrUrl(
  input: string,
  fallbackSlot: EquipmentSlot = 'head'
): Promise<Partial<ItemStats>> {
  const trimmed = input.trim();
  const idMatch = trimmed.match(/item=(\d+)/i) || trimmed.match(/(\d{3,6})/);

  if (!idMatch || !idMatch[1]) {
    throw new Error(`Unable to extract valid Wowhead Item ID from input: "${input}"`);
  }

  const itemId = parseInt(idMatch[1], 10);
  const url = `https://nether.wowhead.com/classic/tooltip/item/${itemId}?dataEnv=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Wowhead tooltip API error: HTTP ${response.status} for item ID ${itemId}`);
  }

  const data = await response.json();
  if (!data || !data.name) {
    throw new Error(`Item ${itemId} not found on Wowhead Classic`);
  }

  const qualityMap: Record<number, ItemQuality> = {
    0: 'poor',
    1: 'common',
    2: 'uncommon',
    3: 'rare',
    4: 'epic',
    5: 'legendary',
  };

  const quality: ItemQuality = qualityMap[data.quality] || 'rare';
  const tooltipHtml: string = data.tooltip || '';

  // Extract numerical stats from tooltip HTML
  const armorMatch = tooltipHtml.match(/(\d+)\s+Armor/i);
  const armor = armorMatch ? parseInt(armorMatch[1], 10) : undefined;

  const strMatch = tooltipHtml.match(/\+(\d+)\s+Strength/i);
  const str = strMatch ? parseInt(strMatch[1], 10) : undefined;

  const agiMatch = tooltipHtml.match(/\+(\d+)\s+Agility/i);
  const agi = agiMatch ? parseInt(agiMatch[1], 10) : undefined;

  const staMatch = tooltipHtml.match(/\+(\d+)\s+Stamina/i);
  const sta = staMatch ? parseInt(staMatch[1], 10) : undefined;

  const apMatch =
    tooltipHtml.match(/Increases attack power by\s*(\d+)/i) ||
    tooltipHtml.match(/\+(\d+)\s*Attack Power/i);
  const ap = apMatch ? parseInt(apMatch[1], 10) : undefined;

  const critMatch = tooltipHtml.match(/Improves your chance to get a critical strike by\s*(\d+(?:\.\d+)?)%/i);
  const crit = critMatch ? parseFloat(critMatch[1]) : undefined;

  const hitMatch = tooltipHtml.match(/Improves your chance to hit by\s*(\d+(?:\.\d+)?)%/i);
  const hit = hitMatch ? parseFloat(hitMatch[1]) : undefined;

  const hasteMatch = tooltipHtml.match(/Increases your attack speed by\s*(\d+(?:\.\d+)?)%/i);
  const haste = hasteMatch ? parseFloat(hasteMatch[1]) : undefined;

  const dmgMatch = tooltipHtml.match(/(\d+)\s*-\s*(\d+)\s+Damage/i);
  const minDmg = dmgMatch ? parseInt(dmgMatch[1], 10) : undefined;
  const maxDmg = dmgMatch ? parseInt(dmgMatch[2], 10) : undefined;

  const speedMatch = tooltipHtml.match(/Speed\s+(\d+(?:\.\d+)?)/i);
  const speed = speedMatch ? parseFloat(speedMatch[1]) : undefined;

  const dpsMatch = tooltipHtml.match(/\((\d+(?:\.\d+)?)\s+damage per second\)/i);
  const dps = dpsMatch ? parseFloat(dpsMatch[1]) : undefined;

  const weaponSkillMatch = tooltipHtml.match(/Increased (?:Swords|Axes|Maces|Daggers|Two-handed Swords|Two-handed Axes|Two-handed Maces)\s*\+(\d+)/i);
  const weaponSkill = weaponSkillMatch ? parseInt(weaponSkillMatch[1], 10) : undefined;

  // Slot Detection
  let detectedSlot: EquipmentSlot = fallbackSlot;
  if (/<!--item-slot:1-->|<th>\s*Head\s*<\/th>|Head/i.test(tooltipHtml)) detectedSlot = 'head';
  else if (/<!--item-slot:2-->|<th>\s*Neck\s*<\/th>|Neck/i.test(tooltipHtml)) detectedSlot = 'neck';
  else if (/<!--item-slot:3-->|<th>\s*Shoulder\s*<\/th>|Shoulder/i.test(tooltipHtml)) detectedSlot = 'shoulder';
  else if (/<!--item-slot:16-->|<th>\s*Back\s*<\/th>|Back/i.test(tooltipHtml)) detectedSlot = 'back';
  else if (/<!--item-slot:5-->|<th>\s*Chest\s*<\/th>|Chest/i.test(tooltipHtml)) detectedSlot = 'chest';
  else if (/<!--item-slot:9-->|<th>\s*Wrist\s*<\/th>|Wrist/i.test(tooltipHtml)) detectedSlot = 'wrist';
  else if (/<!--item-slot:10-->|<th>\s*Hands\s*<\/th>|Hands/i.test(tooltipHtml)) detectedSlot = 'hands';
  else if (/<!--item-slot:6-->|<th>\s*Waist\s*<\/th>|Waist/i.test(tooltipHtml)) detectedSlot = 'waist';
  else if (/<!--item-slot:7-->|<th>\s*Legs\s*<\/th>|Legs/i.test(tooltipHtml)) detectedSlot = 'legs';
  else if (/<!--item-slot:8-->|<th>\s*Feet\s*<\/th>|Feet/i.test(tooltipHtml)) detectedSlot = 'feet';
  else if (/<!--item-slot:11-->|<th>\s*Finger\s*<\/th>|Finger/i.test(tooltipHtml)) detectedSlot = 'ring1';
  else if (/<!--item-slot:12-->|<th>\s*Trinket\s*<\/th>|Trinket/i.test(tooltipHtml)) detectedSlot = 'trinket1';
  else if (/Two-Hand/i.test(tooltipHtml)) detectedSlot = 'twohand';
  else if (/Main Hand/i.test(tooltipHtml)) detectedSlot = 'mainhand';
  else if (/Held In Off-hand|Shield|Off Hand/i.test(tooltipHtml)) detectedSlot = 'offhand';
  else if (/One-Hand/i.test(tooltipHtml)) detectedSlot = 'mainhand';
  else if (/Ranged|Bow|Crossbow|Gun|Thrown/i.test(tooltipHtml)) detectedSlot = 'ranged';

  // Weapon Type Detection
  let weaponType: WeaponType | undefined;
  if (/Two-Hand/i.test(tooltipHtml)) {
    if (/Sword/i.test(tooltipHtml)) weaponType = 'TwoHandSword';
    else if (/Axe/i.test(tooltipHtml)) weaponType = 'TwoHandAxe';
    else if (/Mace/i.test(tooltipHtml)) weaponType = 'TwoHandMace';
    else if (/Polearm/i.test(tooltipHtml)) weaponType = 'Polearm';
  } else if (/One-Hand|Main Hand|Off Hand/i.test(tooltipHtml)) {
    if (/Sword/i.test(tooltipHtml)) weaponType = 'Sword';
    else if (/Axe/i.test(tooltipHtml)) weaponType = 'Axe';
    else if (/Mace/i.test(tooltipHtml)) weaponType = 'Mace';
    else if (/Dagger/i.test(tooltipHtml)) weaponType = 'Dagger';
    else if (/Fist/i.test(tooltipHtml)) weaponType = 'Fist';
  } else if (/Bow/i.test(tooltipHtml)) weaponType = 'Bow';
  else if (/Crossbow/i.test(tooltipHtml)) weaponType = 'Crossbow';
  else if (/Gun/i.test(tooltipHtml)) weaponType = 'Gun';

  return {
    id: `wowhead-${itemId}`,
    name: data.name,
    wowheadId: itemId,
    slot: detectedSlot,
    quality,
    icon: data.icon,
    armor,
    str,
    agi,
    sta,
    ap,
    crit,
    hit,
    haste,
    minDmg,
    maxDmg,
    speed,
    dps,
    weaponSkill,
    weaponType,
    source: 'Wowhead Import',
    isCustom: true,
  };
}
