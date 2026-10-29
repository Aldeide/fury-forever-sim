// WoW: Forever Racial Kits (October 26-28, 2026 Pre-Launch Racial Tuning Pass)
// Complete 4-racial kits: 2 Actives, 2 Passives, plus combat summary badge text

export interface RacialTrait {
  id: string;
  name: string;
  type: 'active' | 'passive';
  icon: string;
  description: string;
  cooldownSec?: number;
  durationSec?: number;
}

export interface RacialKit {
  race: string;
  raceName: string;
  badge: string; // Combat summary badge text
  summary: string;
  traits: RacialTrait[];
  passives: RacialTrait[];
  actives: RacialTrait[];
}

export const RACIAL_TRAITS: Record<string, RacialKit> = {
  human: {
    race: 'human',
    raceName: 'Human',
    badge: '+1.0% Passive Crit • CC Break • Stealth Detect',
    summary: 'Ruthless provides flat +1.0% crit across all white and yellow attacks. Every Man for Himself grants a universal CC break.',
    traits: [
      {
        id: 'ruthless',
        name: 'Ruthless',
        type: 'passive',
        icon: 'ability_criticalstrike',
        description: '+1.0% Critical Strike Chance across all melee attacks and abilities.',
      },
      {
        id: 'theHumanSpirit',
        name: 'The Human Spirit',
        type: 'passive',
        icon: 'spell_holy_mindsooth',
        description: 'Increases Spirit by 5%.',
      },
      {
        id: 'everyManForHimself',
        name: 'Every Man for Himself',
        type: 'active',
        icon: 'spell_shadow_teleport',
        description: 'Removes all movement impairing and loss of control effects.',
        cooldownSec: 120,
      },
      {
        id: 'perception',
        name: 'Perception',
        type: 'active',
        icon: 'spell_nature_sleep',
        description: 'Dramatically increases stealth detection for 20 sec.',
        cooldownSec: 180,
        durationSec: 20,
      },
    ],
    passives: [
      {
        id: 'ruthless',
        name: 'Ruthless',
        type: 'passive',
        icon: 'ability_criticalstrike',
        description: '+1.0% Critical Strike Chance across all melee attacks and abilities.',
      },
      {
        id: 'theHumanSpirit',
        name: 'The Human Spirit',
        type: 'passive',
        icon: 'spell_holy_mindsooth',
        description: 'Increases Spirit by 5%.',
      },
    ],
    actives: [
      {
        id: 'everyManForHimself',
        name: 'Every Man for Himself',
        type: 'active',
        icon: 'spell_shadow_teleport',
        description: 'Removes all movement impairing and loss of control effects.',
        cooldownSec: 120,
      },
      {
        id: 'perception',
        name: 'Perception',
        type: 'active',
        icon: 'spell_nature_sleep',
        description: 'Dramatically increases stealth detection for 20 sec.',
        cooldownSec: 180,
        durationSec: 20,
      },
    ],
  },

  dwarf: {
    race: 'dwarf',
    raceName: 'Dwarf',
    badge: '+1.0% Passive Hit • Bleed/Poison Immune • Stoneform',
    summary: "Artisan's Precision provides flat +1.0% hit chance to main-hand, off-hand, and special abilities. Stoneform cleanses bleeds/poisons and grants +10% armor.",
    traits: [
      {
        id: 'artisansPrecision',
        name: "Artisan's Precision",
        type: 'passive',
        icon: 'inv_hammer_20',
        description: '+1.0% Hit Chance on main hand, off hand, and yellow special abilities.',
      },
      {
        id: 'frostResistance',
        name: 'Frost Resistance',
        type: 'passive',
        icon: 'spell_frost_frostward',
        description: 'Frost Resistance increased by 10.',
      },
      {
        id: 'stoneform',
        name: 'Stoneform',
        type: 'active',
        icon: 'spell_shadow_unholystrength',
        description: 'Grants immunity to Bleed, Poison, and Disease effects and increases Armor by 10% for 8 sec.',
        cooldownSec: 120,
        durationSec: 8,
      },
      {
        id: 'findTreasure',
        name: 'Find Treasure',
        type: 'active',
        icon: 'inv_misc_coin_01',
        description: 'Allows the dwarf to sense nearby treasure on the minimap.',
      },
    ],
    passives: [
      {
        id: 'artisansPrecision',
        name: "Artisan's Precision",
        type: 'passive',
        icon: 'inv_hammer_20',
        description: '+1.0% Hit Chance on main hand, off hand, and yellow special abilities.',
      },
      {
        id: 'frostResistance',
        name: 'Frost Resistance',
        type: 'passive',
        icon: 'spell_frost_frostward',
        description: 'Frost Resistance increased by 10.',
      },
    ],
    actives: [
      {
        id: 'stoneform',
        name: 'Stoneform',
        type: 'active',
        icon: 'spell_shadow_unholystrength',
        description: 'Grants immunity to Bleed, Poison, and Disease effects and increases Armor by 10% for 8 sec.',
        cooldownSec: 120,
        durationSec: 8,
      },
      {
        id: 'findTreasure',
        name: 'Find Treasure',
        type: 'active',
        icon: 'inv_misc_coin_01',
        description: 'Allows the dwarf to sense nearby treasure on the minimap.',
      },
    ],
  },

  night_elf: {
    race: 'night_elf',
    raceName: 'Night Elf',
    badge: '+10% Crit Cooldown (15s/3m) • Shadowmeld • +1% Dodge',
    summary: "Elune's Light provides a massive +10.0% burst crit cooldown for 15s. Quickness gives +1% dodge.",
    traits: [
      {
        id: 'elunesLight',
        name: "Elune's Light",
        type: 'active',
        icon: 'spell_holy_elunesgrace',
        description: 'Increases Critical Strike Chance by +10.0% for 15 sec.',
        cooldownSec: 180,
        durationSec: 15,
      },
      {
        id: 'shadowmeld',
        name: 'Shadowmeld',
        type: 'active',
        icon: 'ability_ambush',
        description: 'Slip into the shadows, reducing the chance for enemies to detect your presence.',
        cooldownSec: 10,
      },
      {
        id: 'quickness',
        name: 'Quickness',
        type: 'passive',
        icon: 'ability_racial_shadowmeld',
        description: 'Dodge chance increased by 1%.',
      },
      {
        id: 'natureResistance',
        name: 'Nature Resistance & Wisp Spirit',
        type: 'passive',
        icon: 'spell_nature_spiritarmor',
        description: 'Nature Resistance increased by 10; transformed into a wisp upon death, increasing speed by 50%.',
      },
    ],
    passives: [
      {
        id: 'quickness',
        name: 'Quickness',
        type: 'passive',
        icon: 'ability_racial_shadowmeld',
        description: 'Dodge chance increased by 1%.',
      },
      {
        id: 'natureResistance',
        name: 'Nature Resistance & Wisp Spirit',
        type: 'passive',
        icon: 'spell_nature_spiritarmor',
        description: 'Nature Resistance increased by 10; transformed into a wisp upon death, increasing speed by 50%.',
      },
    ],
    actives: [
      {
        id: 'elunesLight',
        name: "Elune's Light",
        type: 'active',
        icon: 'spell_holy_elunesgrace',
        description: 'Increases Critical Strike Chance by +10.0% for 15 sec.',
        cooldownSec: 180,
        durationSec: 15,
      },
      {
        id: 'shadowmeld',
        name: 'Shadowmeld',
        type: 'active',
        icon: 'ability_ambush',
        description: 'Slip into the shadows, reducing the chance for enemies to detect your presence.',
        cooldownSec: 10,
      },
    ],
  },

  gnome: {
    race: 'gnome',
    raceName: 'Gnome',
    badge: '105 Max Rage • Eureka! (+10% Dmg, -5 Rage) • Root Break',
    summary: 'Expansive Mind expands rage capacity to 105 max rage. Eureka! gives 3 charges of +10% ability damage and -5 ability rage cost.',
    traits: [
      {
        id: 'expansiveMind',
        name: 'Expansive Mind',
        type: 'passive',
        icon: 'spell_arcane_mindmastery',
        description: 'Maximum rage pool increased to 105; Intellect increased by 5%.',
      },
      {
        id: 'engineeringSpecialist',
        name: 'Engineering Specialist',
        type: 'passive',
        icon: 'trade_engineering',
        description: 'Engineering skill increased by 15; Arcane Resistance increased by 10.',
      },
      {
        id: 'eureka',
        name: 'Eureka!',
        type: 'active',
        icon: 'spell_holy_flashheal',
        description: 'Grants 3 charges increasing yellow special ability damage by +10% and reducing ability rage costs by 5.',
        cooldownSec: 180,
        durationSec: 15,
      },
      {
        id: 'escapeArtist',
        name: 'Escape Artist',
        type: 'active',
        icon: 'ability_rogue_sprint',
        description: 'Escape any immobilization or movement speed reduction effect.',
        cooldownSec: 60,
      },
    ],
    passives: [
      {
        id: 'expansiveMind',
        name: 'Expansive Mind',
        type: 'passive',
        icon: 'spell_arcane_mindmastery',
        description: 'Maximum rage pool increased to 105; Intellect increased by 5%.',
      },
      {
        id: 'engineeringSpecialist',
        name: 'Engineering Specialist',
        type: 'passive',
        icon: 'trade_engineering',
        description: 'Engineering skill increased by 15; Arcane Resistance increased by 10.',
      },
    ],
    actives: [
      {
        id: 'eureka',
        name: 'Eureka!',
        type: 'active',
        icon: 'spell_holy_flashheal',
        description: 'Grants 3 charges increasing yellow special ability damage by +10% and reducing ability rage costs by 5.',
        cooldownSec: 180,
        durationSec: 15,
      },
      {
        id: 'escapeArtist',
        name: 'Escape Artist',
        type: 'active',
        icon: 'ability_rogue_sprint',
        description: 'Escape any immobilization or movement speed reduction effect.',
        cooldownSec: 60,
      },
    ],
  },

  orc: {
    race: 'orc',
    raceName: 'Orc',
    badge: '+10% AP Cooldown (15s/2m) • 25% Stun Resist',
    summary: 'Blood Fury buffed to 120s cooldown (+10% AP for 15s). Hardiness gives passive 25% stun resistance.',
    traits: [
      {
        id: 'bloodFury',
        name: 'Blood Fury',
        type: 'active',
        icon: 'racial_orc_berserkerstrength',
        description: 'Increases total Attack Power by 10% for 15 sec (120s cooldown, tuned Oct 26).',
        cooldownSec: 120,
        durationSec: 15,
      },
      {
        id: 'hardiness',
        name: 'Hardiness',
        type: 'passive',
        icon: 'spell_nature_thunderclap',
        description: 'Chance to resist Stun effects increased by an additional 25%.',
      },
      {
        id: 'command',
        name: 'Command',
        type: 'passive',
        icon: 'ability_hunter_pet_bear',
        description: 'Damage dealt by combat pets increased by 5% (replaced Savage on Oct 26).',
      },
      {
        id: 'enragedRecovery',
        name: 'Enraged Recovery',
        type: 'passive',
        icon: 'ability_warrior_endlessrage',
        description: 'Health regeneration increased by 10% for 10 sec after scoring a killing blow.',
      },
    ],
    passives: [
      {
        id: 'hardiness',
        name: 'Hardiness',
        type: 'passive',
        icon: 'spell_nature_thunderclap',
        description: 'Chance to resist Stun effects increased by an additional 25%.',
      },
      {
        id: 'command',
        name: 'Command',
        type: 'passive',
        icon: 'ability_hunter_pet_bear',
        description: 'Damage dealt by combat pets increased by 5% (replaced Savage on Oct 26).',
      },
    ],
    actives: [
      {
        id: 'bloodFury',
        name: 'Blood Fury',
        type: 'active',
        icon: 'racial_orc_berserkerstrength',
        description: 'Increases total Attack Power by 10% for 15 sec (120s cooldown, tuned Oct 26).',
        cooldownSec: 120,
        durationSec: 15,
      },
    ],
  },

  troll: {
    race: 'troll',
    raceName: 'Troll',
    badge: '+10% Haste Cooldown (15s/3m) • +5% Beast Dmg',
    summary: 'Berserking buffed to 15s duration (+10% haste). Beast Slaying gives flat 5% damage against beasts.',
    traits: [
      {
        id: 'berserking',
        name: 'Berserking',
        type: 'active',
        icon: 'racial_troll_berserk',
        description: 'Increases attack speed and haste by +10% for 15 sec (buffed from 10s to 15s on Oct 26).',
        cooldownSec: 180,
        durationSec: 15,
      },
      {
        id: 'beastSlaying',
        name: 'Beast Slaying',
        type: 'passive',
        icon: 'ability_hunter_beastsoothe',
        description: 'Damage dealt versus Beasts increased by 5%.',
      },
      {
        id: 'regeneration',
        name: 'Regeneration',
        type: 'passive',
        icon: 'spell_nature_regeneration',
        description: 'Health regeneration rate increased by 10%; 10% of total health regeneration continues during combat.',
      },
      {
        id: 'bowThrowingSpecialization',
        name: 'Bow & Throwing Specialization',
        type: 'passive',
        icon: 'inv_weapon_bow_08',
        description: 'Critical strike chance with Bows and Thrown weapons increased by 1%.',
      },
    ],
    passives: [
      {
        id: 'beastSlaying',
        name: 'Beast Slaying',
        type: 'passive',
        icon: 'ability_hunter_beastsoothe',
        description: 'Damage dealt versus Beasts increased by 5%.',
      },
      {
        id: 'regeneration',
        name: 'Regeneration',
        type: 'passive',
        icon: 'spell_nature_regeneration',
        description: 'Health regeneration rate increased by 10%; 10% of total health regeneration continues during combat.',
      },
    ],
    actives: [
      {
        id: 'berserking',
        name: 'Berserking',
        type: 'active',
        icon: 'racial_troll_berserk',
        description: 'Increases attack speed and haste by +10% for 15 sec (buffed from 10s to 15s on Oct 26).',
        cooldownSec: 180,
        durationSec: 15,
      },
    ],
  },

  tauren: {
    race: 'tauren',
    raceName: 'Tauren',
    badge: 'War Stomp AoE Stun • +5% Max Health',
    summary: 'War Stomp provides an on-demand 2-second AoE stun. Endurance provides +5% total maximum health.',
    traits: [
      {
        id: 'warStomp',
        name: 'War Stomp',
        type: 'active',
        icon: 'ability_warstomp',
        description: 'Stuns up to 5 enemies within 8 yards for 2 sec.',
        cooldownSec: 120,
        durationSec: 2,
      },
      {
        id: 'endurance',
        name: 'Endurance',
        type: 'passive',
        icon: 'spell_nature_unrelentingstorm',
        description: 'Total health increased by 5%.',
      },
      {
        id: 'natureResistance',
        name: 'Nature Resistance',
        type: 'passive',
        icon: 'spell_nature_protectionformnature',
        description: 'Nature Resistance increased by 10.',
      },
      {
        id: 'cultivation',
        name: 'Cultivation',
        type: 'active',
        icon: 'inv_misc_flower_02',
        description: 'Herbalism skill increased by 15.',
      },
    ],
    passives: [
      {
        id: 'endurance',
        name: 'Endurance',
        type: 'passive',
        icon: 'spell_nature_unrelentingstorm',
        description: 'Total health increased by 5%.',
      },
      {
        id: 'natureResistance',
        name: 'Nature Resistance',
        type: 'passive',
        icon: 'spell_nature_protectionformnature',
        description: 'Nature Resistance increased by 10.',
      },
    ],
    actives: [
      {
        id: 'warStomp',
        name: 'War Stomp',
        type: 'active',
        icon: 'ability_warstomp',
        description: 'Stuns up to 5 enemies within 8 yards for 2 sec.',
        cooldownSec: 120,
        durationSec: 2,
      },
    ],
  },

  undead: {
    race: 'undead',
    raceName: 'Undead',
    badge: 'Touch of the Grave (55 Shadow / 15s) • WotF Fear Break',
    summary: 'Touch of the Grave triggers 55 Shadow damage on a 15s internal cooldown (buffed Oct 26). Will of the Forsaken breaks Fear, Charm, and Sleep.',
    traits: [
      {
        id: 'touchOfTheGrave',
        name: 'Touch of the Grave',
        type: 'passive',
        icon: 'spell_shadow_haunting',
        description: 'Melee attacks and special abilities have a chance to inflict 55 Shadow damage with a 15-second internal cooldown (buffed Oct 26 from 25s ICD).',
        cooldownSec: 15,
      },
      {
        id: 'willOfTheForsaken',
        name: 'Will of the Forsaken',
        type: 'active',
        icon: 'spell_shadow_raisedead',
        description: 'Provides immunity to Charm, Fear, and Sleep effects while active for 5 sec.',
        cooldownSec: 120,
        durationSec: 5,
      },
      {
        id: 'cannibalize',
        name: 'Cannibalize',
        type: 'active',
        icon: 'ability_racial_cannibalize',
        description: 'Regenerate 7% of total health every 2 sec for 10 sec from a nearby humanoid or undead corpse.',
        cooldownSec: 120,
        durationSec: 10,
      },
      {
        id: 'shadowResistance',
        name: 'Shadow Resistance & Underwater Breathing',
        type: 'passive',
        icon: 'spell_shadow_antishadow',
        description: 'Shadow Resistance increased by 10; Underwater Breathing duration increased by 300%.',
      },
    ],
    passives: [
      {
        id: 'touchOfTheGrave',
        name: 'Touch of the Grave',
        type: 'passive',
        icon: 'spell_shadow_haunting',
        description: 'Melee attacks and special abilities have a chance to inflict 55 Shadow damage with a 15-second internal cooldown (buffed Oct 26 from 25s ICD).',
        cooldownSec: 15,
      },
      {
        id: 'shadowResistance',
        name: 'Shadow Resistance & Underwater Breathing',
        type: 'passive',
        icon: 'spell_shadow_antishadow',
        description: 'Shadow Resistance increased by 10; Underwater Breathing duration increased by 300%.',
      },
    ],
    actives: [
      {
        id: 'willOfTheForsaken',
        name: 'Will of the Forsaken',
        type: 'active',
        icon: 'spell_shadow_raisedead',
        description: 'Provides immunity to Charm, Fear, and Sleep effects while active for 5 sec.',
        cooldownSec: 120,
        durationSec: 5,
      },
      {
        id: 'cannibalize',
        name: 'Cannibalize',
        type: 'active',
        icon: 'ability_racial_cannibalize',
        description: 'Regenerate 7% of total health every 2 sec for 10 sec from a nearby humanoid or undead corpse.',
        cooldownSec: 120,
        durationSec: 10,
      },
    ],
  },

  skyborne_elf: {
    race: 'skyborne_elf',
    raceName: 'Skyborne Elf',
    badge: '+2.0% Passive Haste • Mobility Utility',
    summary: 'Wind-Blessed provides a permanent +2.0% haste across all attacks. Arcane Gust offers burst mobility.',
    traits: [
      {
        id: 'windBlessed',
        name: 'Wind-Blessed',
        type: 'passive',
        icon: 'spell_nature_windfury',
        description: '+2.0% Attack and special ability haste.',
      },
      {
        id: 'arcaneAffinity',
        name: 'Arcane Affinity',
        type: 'passive',
        icon: 'spell_holy_magicalsentry',
        description: 'Arcane Resistance increased by 10.',
      },
      {
        id: 'arcaneGust',
        name: 'Arcane Gust',
        type: 'active',
        icon: 'spell_nature_cyclone',
        description: 'Blasts the caster forward with a gust of wind, breaking movement impairing effects.',
        cooldownSec: 90,
      },
      {
        id: 'dispelWeakness',
        name: 'Dispel Weakness',
        type: 'active',
        icon: 'spell_holy_dispelmagic',
        description: 'Dispels 1 harmful magic effect from the user.',
        cooldownSec: 120,
      },
    ],
    passives: [
      {
        id: 'windBlessed',
        name: 'Wind-Blessed',
        type: 'passive',
        icon: 'spell_nature_windfury',
        description: '+2.0% Attack and special ability haste.',
      },
      {
        id: 'arcaneAffinity',
        name: 'Arcane Affinity',
        type: 'passive',
        icon: 'spell_holy_magicalsentry',
        description: 'Arcane Resistance increased by 10.',
      },
    ],
    actives: [
      {
        id: 'arcaneGust',
        name: 'Arcane Gust',
        type: 'active',
        icon: 'spell_nature_cyclone',
        description: 'Blasts the caster forward with a gust of wind, breaking movement impairing effects.',
        cooldownSec: 90,
      },
      {
        id: 'dispelWeakness',
        name: 'Dispel Weakness',
        type: 'active',
        icon: 'spell_holy_dispelmagic',
        description: 'Dispels 1 harmful magic effect from the user.',
        cooldownSec: 120,
      },
    ],
  },
};

export function getRacialKit(race: string): RacialKit {
  const norm = race.toLowerCase().replace(/[\s-]/g, '_');
  if (norm.includes('night') || norm === 'nightelf') return RACIAL_TRAITS.night_elf;
  if (norm.includes('skyborne')) return RACIAL_TRAITS.skyborne_elf;
  return RACIAL_TRAITS[norm] || RACIAL_TRAITS.human;
}
