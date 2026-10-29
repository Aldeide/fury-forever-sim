use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct ItemStats {
    pub id: String,
    pub name: String,
    pub slot: String, // "head", "neck", "shoulder", "back", "chest", "wrist", "hands", "waist", "legs", "feet", "ring1", "ring2", "trinket1", "trinket2", "mainhand", "offhand", "twohand", "ranged"
    pub str: f64,
    pub agi: f64,
    pub sta: f64,
    pub ap: f64,
    pub crit: f64,       // % e.g. 1.0 = 1%
    pub hit: f64,        // % e.g. 1.0 = 1%
    pub oh_hit: f64,     // % bonus off-hand hit
    pub haste: f64,      // % e.g. 1.0 = 1%
    pub armor_pen: f64,
    pub weapon_skill: f64,
    pub min_dmg: f64,
    pub max_dmg: f64,
    pub speed: f64,      // e.g. 2.6
    pub weapon_type: Option<String>, // "axe", "sword", "mace", "dagger", "fist", "twohand_sword", "twohand_axe", "twohand_mace", "polearm"
    pub proc_type: Option<String>,   // "crusader", "ironfoe", "flurry_axe", "hoj", "bonereaver", "deathbringer", "vis_kag", "windfury_item"
    pub proc_ppm: f64,
    pub proc_chance: f64, // % e.g. 2.0 = 2%
    pub proc_value: f64,
    pub on_use_ap: f64,
    pub on_use_haste: f64,
    pub on_use_armor_pen: f64,
    pub on_use_duration: f64,
    pub on_use_cd: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct TalentConfig {
    // Arms
    pub deflection: u8,
    pub improved_rend: u8,
    pub improved_heroic_strike: u8, // -1/-2/-3 rage
    pub improved_tactical_mastery: u8, // +5/+10/+15 retained rage on top of 10 baseline
    pub improved_overpower: u8,     // +25/+50% crit on Overpower
    pub anger_management: u8,       // 1 rage per 3s
    pub deep_wounds: u8,            // 20/40/60% avg weapon dmg bleed over 12s on crit
    pub impale: u8,                 // +10/+20% yellow ability crit damage multiplier
    pub weaponmaster: u8,           // WoW: Forever consolidated Weapon Mastery (+3/+5 weapon skill & +1/+2% crit)
    pub two_handed_weapon_specialization: u8, // +1..5% 2H damage
    pub mortal_strike: u8,                  // 0..1 -> Arms Row 7 (instant weapon dmg + 160, 30 rage, 6s CD)
    // Fury
    pub cruelty: u8,                // +1..5% crit
    pub booming_voice: u8,
    pub unbridled_wrath: u8,        // 8..40% chance to gain 1 rage on melee hit
    pub lingering_rage: u8,         // WoW: Forever Row 2 (0..5)
    pub improved_battle_shout: u8,  // +5..25% Battle Shout AP
    pub furious_precision: u8,      // WoW: Forever Row 3 (0..3 -> +4% / +7% / +10% Off-Hand Hit!)
    pub improved_execute: u8,       // 0..2 -> Execute cost 13 / 10 rage
    pub enrage: u8,                 // 0..5
    pub dual_wield_specialization: u8, // WoW: Forever Row 4 (0..5 -> +5/10/15/20/25% OH damage)
    pub raging_blows: u8,           // WoW: Forever Row 4 (0..3 -> -1/-2/-3 rage cost on Whirlwind & Cleave!)
    pub death_wish: u8,             // WoW: Forever Row 5 (0..1 -> prerequisite for Flurry!)
    pub improved_berserker_rage: u8,// 0..2 -> +5/+10 rage on Berserker Rage
    pub flurry: u8,                 // WoW: Forever Row 6 (0..5 -> +5/10/15/20/25% haste on crit for 3 swings)
    pub gore_drinker: u8,           // WoW: Forever Row 6 (0..2 -> 0.5% / 1.0% max HP heal for 3 swings after activating BT/DW/BR/BerserkerRage)
    pub bloodthirst: u8,            // Row 7 (0..1 -> 45% AP instant attack, 30 rage, 6s CD)
}

fn deserialize_bool_or_number<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::Visitor;
    struct BoolOrNumberVisitor;

    impl<'de> Visitor<'de> for BoolOrNumberVisitor {
        type Value = bool;

        fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
            formatter.write_str("a boolean or a number")
        }

        fn visit_bool<E>(self, v: bool) -> Result<bool, E> {
            Ok(v)
        }

        fn visit_i64<E>(self, v: i64) -> Result<bool, E> {
            Ok(v > 0)
        }

        fn visit_u64<E>(self, v: u64) -> Result<bool, E> {
            Ok(v > 0)
        }

        fn visit_f64<E>(self, v: f64) -> Result<bool, E> {
            Ok(v > 0.0)
        }
    }

    deserializer.deserialize_any(BoolOrNumberVisitor)
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct BuffConfig {
    pub rallying_cry: bool,         // +10% melee crit, +140 AP
    pub songflower: bool,           // +5% crit, +15 Str/Agi/Sta
    pub warchiefs_blessing: bool,   // +15% haste, +300 HP
    pub spirit_of_zandalar: bool,   // +15% all stats
    pub dire_maul_tribute: bool,    // +200 AP (Fengus' Ferocity)
    pub darkmoon_faire: bool,       // +10% damage
    pub battle_shout: bool,         // +232 base AP (scaled by Improved Battle Shout)
    pub trueshot_aura: bool,        // +100 AP
    pub leader_of_the_pack: bool,   // +3% crit
    pub windfury_totem: bool,       // 20% chance on MH hit for 1 extra MH attack with +315 AP
    pub strength_of_earth: bool,    // +77 Str
    pub grace_of_air: bool,         // +77 Agi
    pub blessing_of_kings: bool,    // +10% stats
    pub blessing_of_might: bool,    // +185 AP
    pub elixir_of_the_mongoose: bool, // +25 Agi, +2% crit
    pub juju_power: bool,           // +30 Str
    pub juju_might: bool,           // +40 AP
    pub juju_flurry: bool,          // +3% haste
    pub roids: bool,                // +25 Str (Ground Scorpok Assay)
    pub elemental_sharpening_stone_mh: bool, // +2% crit
    pub elemental_sharpening_stone_oh: bool, // +2% crit
    #[serde(alias = "denseSharpeningStoneMH", alias = "denseSharpeningStoneMh", default)]
    pub dense_weightstone_mh: bool, // +8 weapon dmg
    #[serde(alias = "denseSharpeningStoneOH", alias = "denseSharpeningStoneOh", default)]
    pub dense_weightstone_oh: bool, // +8 weapon dmg
    #[serde(alias = "consecratedSharpeningStoneMH", alias = "consecratedSharpeningStoneMh", default)]
    pub consecrated_sharpening_stone_mh: bool,
    #[serde(alias = "consecratedSharpeningStoneOH", alias = "consecratedSharpeningStoneOh", default)]
    pub consecrated_sharpening_stone_oh: bool,
    pub mighty_rage_potion: bool,   // +60 rage & +60 Str for 20s during Execute / Death Wish
    #[serde(deserialize_with = "deserialize_bool_or_number", default)]
    pub sunder_armor: bool,         // -2250 boss armor
    #[serde(deserialize_with = "deserialize_bool_or_number", default)]
    pub faerie_fire: bool,          // -505 boss armor
    #[serde(deserialize_with = "deserialize_bool_or_number", default)]
    pub curse_of_recklessness: bool,// -640 boss armor
    pub annihilator_stacks: u8,     // 0..3 (-200 armor per stack)
    #[serde(deserialize_with = "deserialize_bool_or_number", default)]
    pub gift_of_arthas: bool,       // +8 flat physical damage on hit
    pub goblin_sapper: bool,        // 450-750 fire dmg explosive
    pub dense_dynamite: bool,       // 340-460 fire dmg explosive
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct AplCondition {
    #[serde(rename = "type", alias = "condition_type", alias = "conditionType")]
    pub condition_type: String,
    pub value: Option<f64>,
    pub buff: Option<String>,
    #[serde(alias = "targetBuff")]
    pub target_buff: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct AplRow {
    #[serde(default)]
    pub id: Option<String>,
    pub enabled: bool,
    pub ability: String,
    #[serde(default)]
    pub conditions: Vec<AplCondition>,
    #[serde(default)]
    pub note: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct RotationConfig {
    #[serde(default)]
    pub apl: Option<Vec<AplRow>>,
    pub use_bloodthirst: bool,
    pub use_whirlwind: bool,
    pub use_heroic_strike: bool,
    pub hs_rage_threshold: f64,     // default 45.0
    pub use_cleave: bool,           // if true and targets > 1, uses Cleave instead of HS
    pub use_overpower: bool,        // stance dance using 10 baseline Tactical Mastery (+ Imp TM)
    pub overpower_max_rage: f64,    // default 35.0
    pub use_hamstring: bool,
    pub hamstring_rage_threshold: f64, // default 70.0
    pub use_execute: bool,
    pub use_bt_in_execute: bool,    // default true
    pub execute_bt_ap_threshold: f64, // default 2000.0
    pub execute_rage_pool_threshold: f64, // default 45.0
    pub use_death_wish: bool,
    pub use_recklessness: bool,
    pub use_bloodrage: bool,
    pub use_berserker_rage: bool,
    pub use_trinkets: bool,
    pub use_racial: bool,           // default true
}

impl Default for RotationConfig {
    fn default() -> Self {
        Self {
            apl: None,
            use_bloodthirst: true,
            use_whirlwind: true,
            use_heroic_strike: true,
            hs_rage_threshold: 45.0,
            use_cleave: false,
            use_overpower: true,
            overpower_max_rage: 35.0,
            use_hamstring: false,
            hamstring_rage_threshold: 70.0,
            use_execute: true,
            use_bt_in_execute: true,
            execute_bt_ap_threshold: 2000.0,
            execute_rage_pool_threshold: 45.0,
            use_death_wish: true,
            use_recklessness: true,
            use_bloodrage: true,
            use_berserker_rage: true,
            use_trinkets: true,
            use_racial: true,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct EncounterConfig {
    pub boss_level: u32,            // default 63
    pub boss_armor: f64,            // default 3731.0
    pub duration_sec: f64,          // default 60.0
    pub duration_variation_sec: f64,// default 5.0
    pub execute_phase_pct: f64,     // default 20.0 (last 20% of fight time)
    pub targets: u32,               // default 1
    pub iterations: u32,            // default 10000
    pub seed: u64,
    pub starting_rage: f64,         // default 50.0
}

impl Default for EncounterConfig {
    fn default() -> Self {
        Self {
            boss_level: 63,
            boss_armor: 3731.0,
            duration_sec: 60.0,
            duration_variation_sec: 5.0,
            execute_phase_pct: 20.0,
            targets: 1,
            iterations: 10000,
            seed: 0,
            starting_rage: 50.0,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct SimConfig {
    pub race: String,               // "human", "orc", "tauren", "undead", "troll", "dwarf", "night_elf", "gnome", "skyborne_elf"
    pub items: Vec<ItemStats>,
    pub enchants: Vec<ItemStats>,
    pub talents: TalentConfig,
    pub buffs: BuffConfig,
    pub rotation: RotationConfig,
    pub encounter: EncounterConfig,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct AbilityBreakdown {
    pub name: String,
    pub total_damage: f64,
    pub dps: f64,
    pub pct: f64,
    pub casts: f64,
    pub hit_pct: f64,
    pub crit_pct: f64,
    pub glance_pct: f64,
    pub miss_pct: f64,
    pub dodge_pct: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct CharacterSheetSummary {
    pub total_str: f64,
    pub total_agi: f64,
    pub total_ap: f64,
    pub crit_pct: f64,
    pub mh_hit_pct: f64,
    pub oh_hit_pct: f64,
    pub mh_white_miss_pct: f64,
    pub oh_white_miss_pct: f64,
    pub yellow_miss_pct: f64,
    pub mh_crit_cap: f64,
    pub oh_crit_cap: f64,
    pub haste_pct: f64,
    pub mh_norm_rage: f64,
    pub oh_norm_rage: f64,
    pub mh_crit_rage: f64,
    pub oh_crit_rage: f64,
    pub effective_boss_armor: f64,
    pub armor_reduction_pct: f64,
    pub retained_stance_rage: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct SimResult {
    pub mean_dps: f64,
    #[serde(default)]
    pub dps: f64,
    pub min_dps: f64,
    pub max_dps: f64,
    #[serde(default)]
    pub median_dps: f64,
    pub std_dev_dps: f64,
    #[serde(default)]
    pub std_dev: f64,
    pub error_margin: f64,
    pub mean_rps: f64,
    pub flurry_uptime_pct: f64,
    pub gore_drinker_heals_per_min: f64,
    pub elapsed_ms: f64,
    pub iterations: u32,
    pub sheet: CharacterSheetSummary,
    pub abilities: Vec<AbilityBreakdown>,
    pub dps_histogram: Vec<(u32, u32)>, // (bucket_dps, count)
    pub proc_uptimes: HashMap<String, f64>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct BatchSlotRequest {
    pub base_config: SimConfig,
    pub slot: String,
    pub candidate_items: Vec<ItemStats>,
    pub is_enchant_batch: bool,
    pub iterations_per_item: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct BatchItemResult {
    pub item_id: String,
    pub item_name: String,
    pub mean_dps: f64,
    pub delta_dps: f64,
    pub error_margin: f64,
    pub mh_crit_cap: f64,
    pub oh_white_miss_pct: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct BatchSlotResult {
    pub baseline_dps: f64,
    pub elapsed_ms: f64,
    pub results: Vec<BatchItemResult>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct StatWeightEntry {
    pub stat: String,
    pub label: String,
    pub ep_per_point: f64,
    pub dps_per_point: f64,
}

#[derive(Clone, Debug, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct StatWeightsResult {
    pub baseline_dps: f64,
    pub dps_per_ap: f64,
    pub elapsed_ms: f64,
    pub weights: Vec<StatWeightEntry>,
}
