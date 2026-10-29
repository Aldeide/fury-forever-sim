use crate::types::*;

pub struct WeaponInfo {
    pub min_dmg: f64,
    pub max_dmg: f64,
    pub speed: f64,
    pub weapon_type: String,
    pub proc_type: Option<String>,
    pub proc_ppm: f64,
    pub proc_chance: f64,
    pub proc_value: f64,
}

pub fn get_weapons(items: &[ItemStats], buffs: &BuffConfig) -> (WeaponInfo, Option<WeaponInfo>) {
    let mut mh_item = None;
    let mut oh_item = None;
    let mut th_item = None;

    for item in items {
        match item.slot.to_lowercase().as_str() {
            "mainhand" => mh_item = Some(item),
            "offhand" => oh_item = Some(item),
            "twohand" => th_item = Some(item),
            _ => {}
        }
    }

    if let Some(th) = th_item {
        let weightstone = if buffs.dense_weightstone_mh { 8.0 } else { 0.0 };
        let speed = if th.speed > 0.1 { th.speed } else { 3.6 };
        let min_dmg = (if th.min_dmg > 0.0 { th.min_dmg } else { 180.0 }) + weightstone;
        let max_dmg = (if th.max_dmg > 0.0 { th.max_dmg } else { 270.0 }) + weightstone;
        let weapon_type = th.weapon_type.clone().unwrap_or_else(|| "twohand_sword".to_string());
        (
            WeaponInfo {
                min_dmg,
                max_dmg,
                speed,
                weapon_type,
                proc_type: th.proc_type.clone(),
                proc_ppm: th.proc_ppm,
                proc_chance: th.proc_chance,
                proc_value: th.proc_value,
            },
            None,
        )
    } else {
        let mh = mh_item.cloned().unwrap_or_else(|| ItemStats {
            min_dmg: 100.0,
            max_dmg: 150.0,
            speed: 2.6,
            weapon_type: Some("sword".to_string()),
            ..Default::default()
        });
        let weightstone_mh = if buffs.dense_weightstone_mh { 8.0 } else { 0.0 };
        let mh_speed = if mh.speed > 0.1 { mh.speed } else { 2.6 };
        let mh_min_dmg = (if mh.min_dmg > 0.0 { mh.min_dmg } else { 100.0 }) + weightstone_mh;
        let mh_max_dmg = (if mh.max_dmg > 0.0 { mh.max_dmg } else { 150.0 }) + weightstone_mh;
        let mh_type = mh.weapon_type.clone().unwrap_or_else(|| "sword".to_string());

        let oh_info = oh_item.map(|oh| {
            let weightstone_oh = if buffs.dense_weightstone_oh { 8.0 } else { 0.0 };
            let oh_speed = if oh.speed > 0.1 { oh.speed } else { 2.6 };
            let oh_min_dmg = (if oh.min_dmg > 0.0 { oh.min_dmg } else { 90.0 }) + weightstone_oh;
            let oh_max_dmg = (if oh.max_dmg > 0.0 { oh.max_dmg } else { 140.0 }) + weightstone_oh;
            let oh_type = oh.weapon_type.clone().unwrap_or_else(|| "sword".to_string());
            WeaponInfo {
                min_dmg: oh_min_dmg,
                max_dmg: oh_max_dmg,
                speed: oh_speed,
                weapon_type: oh_type,
                proc_type: oh.proc_type.clone(),
                proc_ppm: oh.proc_ppm,
                proc_chance: oh.proc_chance,
                proc_value: oh.proc_value,
            }
        });

        (
            WeaponInfo {
                min_dmg: mh_min_dmg,
                max_dmg: mh_max_dmg,
                speed: mh_speed,
                weapon_type: mh_type,
                proc_type: mh.proc_type.clone(),
                proc_ppm: mh.proc_ppm,
                proc_chance: mh.proc_chance,
                proc_value: mh.proc_value,
            },
            oh_info,
        )
    }
}

pub fn compute_character_sheet(config: &SimConfig) -> CharacterSheetSummary {
    let (base_str, base_agi, _base_sta) = match config.race.to_lowercase().as_str() {
        "human" => (120.0, 80.0, 110.0),
        "orc" => (123.0, 77.0, 112.0),
        "tauren" => (125.0, 75.0, 112.0),
        "undead" => (119.0, 78.0, 111.0),
        "troll" => (121.0, 82.0, 111.0),
        "dwarf" => (122.0, 76.0, 113.0),
        "night_elf" => (117.0, 85.0, 110.0),
        "gnome" => (115.0, 83.0, 109.0),
        _ => (120.0, 82.0, 110.0), // skyborne_elf or default
    };

    let mut gear_str = 0.0;
    let mut gear_agi = 0.0;
    let mut gear_ap = 0.0;
    let mut gear_crit = 0.0;
    let mut gear_hit = 0.0;
    let mut gear_oh_hit = 0.0;
    let mut gear_haste = 0.0;
    let mut gear_armor_pen = 0.0;
    let mut gear_weapon_skill = 0.0;

    for item in config.items.iter().chain(config.enchants.iter()) {
        gear_str += item.str;
        gear_agi += item.agi;
        gear_ap += item.ap;
        gear_crit += item.crit;
        gear_hit += item.hit;
        gear_oh_hit += item.oh_hit;
        gear_haste += item.haste;
        gear_armor_pen += item.armor_pen;
        gear_weapon_skill += item.weapon_skill;
    }

    let mut buff_str = 0.0;
    let mut buff_agi = 0.0;
    let mut buff_ap = 0.0;
    let mut buff_crit = 0.0;
    let mut buff_haste = 0.0;

    if config.buffs.strength_of_earth {
        buff_str += 77.0;
    }
    if config.buffs.juju_power {
        buff_str += 30.0;
    }
    if config.buffs.roids {
        buff_str += 25.0;
    }
    if config.buffs.songflower {
        buff_str += 15.0;
        buff_agi += 15.0;
        buff_crit += 5.0;
    }
    if config.buffs.grace_of_air {
        buff_agi += 77.0;
    }
    if config.buffs.elixir_of_the_mongoose {
        buff_agi += 25.0;
        buff_crit += 2.0;
    }

    let stat_mult = (if config.buffs.blessing_of_kings { 1.10 } else { 1.0 })
        * (if config.buffs.spirit_of_zandalar { 1.15 } else { 1.0 });

    let total_str = (base_str + gear_str + buff_str) * stat_mult;
    let total_agi = (base_agi + gear_agi + buff_agi) * stat_mult;

    // AP from level 60 + Str
    let base_ap = 160.0 + total_str * 2.0;

    if config.buffs.rallying_cry {
        buff_ap += 140.0;
        buff_crit += 10.0;
    }
    if config.buffs.dire_maul_tribute {
        buff_ap += 200.0;
    }
    if config.buffs.trueshot_aura {
        buff_ap += 100.0;
    }
    if config.buffs.blessing_of_might {
        buff_ap += 185.0;
    }
    if config.buffs.juju_might {
        buff_ap += 40.0;
    }
    if config.buffs.battle_shout {
        let bs_scaling = 1.0 + 0.05 * (config.talents.improved_battle_shout as f64).min(5.0);
        buff_ap += 232.0 * bs_scaling;
    }

    let total_ap = base_ap + gear_ap + buff_ap;

    // Crit
    let agi_crit = total_agi / 20.0;
    let talent_crit = (config.talents.cruelty as f64).min(5.0)
        + (match config.talents.weaponmaster {
            1 => 1.0,
            2..=u8::MAX => 2.0,
            _ => 0.0,
        });

    if config.buffs.leader_of_the_pack {
        buff_crit += 3.0;
    }
    if config.buffs.elemental_sharpening_stone_mh {
        buff_crit += 2.0;
    }
    if config.buffs.elemental_sharpening_stone_oh {
        buff_crit += 2.0;
    }

    let crit_pct = agi_crit + gear_crit + talent_crit + buff_crit;

    // Haste
    if config.buffs.warchiefs_blessing {
        buff_haste += 15.0;
    }
    if config.buffs.juju_flurry {
        buff_haste += 3.0;
    }
    let haste_pct = gear_haste + buff_haste;

    // Weapons
    let (mh_weapon, oh_weapon_opt) = get_weapons(&config.items, &config.buffs);
    let has_offhand = oh_weapon_opt.is_some();

    // Weapon skill
    let talent_ws = match config.talents.weaponmaster {
        1 => 3.0,
        2..=u8::MAX => 5.0,
        _ => 0.0,
    };

    let mut racial_ws = 0.0;
    let race_lower = config.race.to_lowercase();
    let mh_type = mh_weapon.weapon_type.to_lowercase();
    if race_lower == "human" && (mh_type.contains("sword") || mh_type.contains("mace")) {
        racial_ws += 5.0;
    } else if race_lower == "orc" && mh_type.contains("axe") {
        racial_ws += 5.0;
    }

    let mh_weapon_skill = 300.0 + talent_ws + racial_ws + gear_weapon_skill;
    let delta = (315.0 - mh_weapon_skill).max(0.0);

    let base_yellow_miss = if delta > 10.0 {
        5.0 + delta * 0.2
    } else {
        5.0 + delta * 0.1
    };

    let base_white_miss = if has_offhand {
        base_yellow_miss + 19.0
    } else {
        base_yellow_miss
    };

    let mh_hit_pct = gear_hit;
    let fp_hit = match config.talents.furious_precision {
        1 => 4.0,
        2 => 7.0,
        3..=u8::MAX => 10.0,
        _ => 0.0,
    };
    let oh_hit_pct = gear_hit + fp_hit + gear_oh_hit;

    let mh_white_miss_pct = (base_white_miss - mh_hit_pct).max(0.0);
    let oh_white_miss_pct = if has_offhand {
        (base_white_miss - oh_hit_pct).max(0.0)
    } else {
        0.0
    };
    let yellow_miss_pct = (base_yellow_miss - mh_hit_pct).max(0.0);

    let dodge_pct = (5.0 + delta * 0.1).max(0.0);
    let glancing_pct = 40.0;

    let mh_crit_cap = (100.0 - mh_white_miss_pct - dodge_pct - glancing_pct).max(0.0);
    let oh_crit_cap = if has_offhand {
        (100.0 - oh_white_miss_pct - dodge_pct - glancing_pct).max(0.0)
    } else {
        0.0
    };

    // Normalized rage formula
    let mh_norm_rage = mh_weapon.speed * if has_offhand { 3.46 } else { 4.50 };
    let oh_norm_rage = if let Some(ref oh) = oh_weapon_opt {
        oh.speed * 1.73
    } else {
        0.0
    };
    let mh_crit_rage = 2.0 * mh_norm_rage;
    let oh_crit_rage = 2.0 * oh_norm_rage;

    // Armor
    let boss_armor = if config.encounter.boss_armor > 0.0 {
        config.encounter.boss_armor
    } else {
        3731.0
    };

    let mut armor_reduction_flat = gear_armor_pen;
    if config.buffs.sunder_armor {
        armor_reduction_flat += 2250.0;
    }
    if config.buffs.faerie_fire {
        armor_reduction_flat += 505.0;
    }
    if config.buffs.curse_of_recklessness {
        armor_reduction_flat += 640.0;
    }
    armor_reduction_flat += (config.buffs.annihilator_stacks as f64 * 200.0).min(600.0);

    let effective_boss_armor = (boss_armor - armor_reduction_flat).max(0.0);
    let armor_reduction_pct = (effective_boss_armor / (effective_boss_armor + 5500.0)) * 100.0;

    // Retained stance rage: 10 baseline + 5 per point in Improved Tactical Mastery
    let retained_stance_rage = 10.0 + 5.0 * (config.talents.improved_tactical_mastery as f64).min(3.0);

    CharacterSheetSummary {
        total_str,
        total_agi,
        total_ap,
        crit_pct,
        mh_hit_pct,
        oh_hit_pct,
        mh_white_miss_pct,
        oh_white_miss_pct,
        yellow_miss_pct,
        mh_crit_cap,
        oh_crit_cap,
        haste_pct,
        mh_norm_rage,
        oh_norm_rage,
        mh_crit_rage,
        oh_crit_rage,
        effective_boss_armor,
        armor_reduction_pct,
        retained_stance_rage,
    }
}
