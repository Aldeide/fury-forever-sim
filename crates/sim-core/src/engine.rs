use std::collections::HashMap;
use std::time::Instant;
use rand::rngs::SmallRng;
use rand::{Rng, SeedableRng};

use crate::stats::{compute_character_sheet, get_weapons, WeaponInfo};
use crate::types::*;

#[derive(Default, Clone)]
struct AbilityStats {
    casts: u32,
    hits: u32,
    crits: u32,
    glances: u32,
    misses: u32,
    dodges: u32,
    total_damage: f64,
}

#[derive(Default, Clone)]
pub struct IterationResult {
    pub total_damage: f64,
    pub fight_duration: f64,
    pub total_rage_gained: f64,
    pub flurry_active_time: f64,
    pub gore_drinker_heals: u32,
    ability_stats: HashMap<String, AbilityStats>,
}

impl IterationResult {
    pub fn dps(&self) -> f64 {
        if self.fight_duration > 0.0 {
            self.total_damage / self.fight_duration
        } else {
            0.0
        }
    }
}

pub struct SimulationRun {
    config: SimConfig,
    sheet: CharacterSheetSummary,
    mh: WeaponInfo,
    oh: Option<WeaponInfo>,
    is_dw: bool,
    dodge_pct: f64,
    glance_mult: f64,
    norm_mh_speed: f64,
}

impl SimulationRun {
    pub fn new(config: SimConfig) -> Self {
        let sheet = compute_character_sheet(&config);
        let (mh, oh) = get_weapons(&config.items, &config.buffs);
        let is_dw = oh.is_some();

        let talent_ws: f64 = match config.talents.weaponmaster {
            1 => 3.0,
            2..=u8::MAX => 5.0,
            _ => 0.0,
        };

        let mut gear_ws: f64 = 0.0;
        for itm in config.items.iter().chain(config.enchants.iter()) {
            gear_ws += itm.weapon_skill;
        }

        let mut racial_ws: f64 = 0.0;
        let race_lower = config.race.to_lowercase();
        let mh_type = mh.weapon_type.to_lowercase();
        if race_lower == "human" && (mh_type.contains("sword") || mh_type.contains("mace")) {
            racial_ws += 5.0;
        } else if race_lower == "orc" && mh_type.contains("axe") {
            racial_ws += 5.0;
        }

        let total_ws: f64 = 300.0 + talent_ws + racial_ws + gear_ws;
        let delta: f64 = f64::max(0.0, 315.0 - total_ws);
        let dodge_pct: f64 = f64::max(0.0, 5.0 + delta * 0.1);
        let glance_mult: f64 = (0.65 + (total_ws - 300.0) * 0.04).clamp(0.65, 0.95);

        let norm_mh_speed: f64 = match mh.weapon_type.to_lowercase().as_str() {
            t if t.contains("dagger") => 1.7,
            t if t.contains("twohand") || t.contains("polearm") => 3.3,
            _ => 2.4,
        };

        Self {
            config,
            sheet,
            mh,
            oh,
            is_dw,
            dodge_pct,
            glance_mult,
            norm_mh_speed,
        }
    }

    pub fn run_single_iteration(&self, rng: &mut SmallRng, fight_duration: f64) -> IterationResult {
        let dt = 0.02; // 20ms discrete time-step
        let total_steps = (fight_duration / dt).ceil() as usize;

        let mut current_time = 0.0;
        let mut rage: f64 = 0.0;
        let mut total_rage_gained = 0.0;

        let mut mh_swing_timer = 0.0;
        let mut oh_swing_timer = if self.is_dw {
            // Stagger OH swing by half speed initially
            self.oh.as_ref().map(|w| w.speed / 2.0).unwrap_or(0.0)
        } else {
            0.0
        };

        let mut gcd = 0.0;
        let mut bt_cd = 0.0;
        let mut ww_cd = 0.0;
        let mut op_cd = 0.0;
        let mut bloodrage_cd = 0.0;
        let mut berserker_rage_cd = 0.0;
        let mut dw_cd = 0.0;
        let mut reck_cd = 0.0;
        let mut pot_cd = 0.0;
        let mut trinket_cd = 0.0;

        // Buff / Proc Timers & Charges
        let mut flurry_charges = 0u8;
        let mut flurry_active_time = 0.0;
        let mut gore_drinker_charges = 0u8;
        let mut total_gore_drinker_heals = 0u32;

        let mut crusader_mh_until = 0.0;
        let mut crusader_oh_until = 0.0;
        let mut death_wish_until = 0.0;
        let mut recklessness_until = 0.0;
        let mut mighty_rage_until = 0.0;
        let mut bloodrage_until = 0.0;
        let mut bloodrage_next_tick = 0.0;
        let mut trinket_until = 0.0;
        let mut bonereaver_stacks = 0u8;
        let mut bonereaver_until = 0.0;

        let mut overpower_available_until = 0.0;
        let mut hs_queued = false;

        // Deep Wounds Bleed Pool
        let mut deep_wounds_pool = 0.0;
        let mut deep_wounds_ticks_left = 0u8;
        let mut deep_wounds_next_tick = 0.0;

        // Passive Anger Management timer (1 rage every 3s)
        let mut anger_management_timer = 3.0;

        let mut ability_stats: HashMap<String, AbilityStats> = HashMap::new();
        let mut total_damage = 0.0;

        let execute_start_time = fight_duration * (1.0 - (self.config.encounter.execute_phase_pct / 100.0).clamp(0.0, 1.0));

        for _ in 0..total_steps {
            current_time += dt;

            // Cooldown ticks
            if gcd > 0.0 { gcd = (gcd - dt).max(0.0); }
            if bt_cd > 0.0 { bt_cd = (bt_cd - dt).max(0.0); }
            if ww_cd > 0.0 { ww_cd = (ww_cd - dt).max(0.0); }
            if op_cd > 0.0 { op_cd = (op_cd - dt).max(0.0); }
            if bloodrage_cd > 0.0 { bloodrage_cd = (bloodrage_cd - dt).max(0.0); }
            if berserker_rage_cd > 0.0 { berserker_rage_cd = (berserker_rage_cd - dt).max(0.0); }
            if dw_cd > 0.0 { dw_cd = (dw_cd - dt).max(0.0); }
            if reck_cd > 0.0 { reck_cd = (reck_cd - dt).max(0.0); }
            if pot_cd > 0.0 { pot_cd = (pot_cd - dt).max(0.0); }
            if trinket_cd > 0.0 { trinket_cd = (trinket_cd - dt).max(0.0); }

            if flurry_charges > 0 {
                flurry_active_time += dt;
            }

            // Passive Anger Management
            if self.config.talents.anger_management > 0 {
                anger_management_timer -= dt;
                if anger_management_timer <= 0.0 {
                    let old_rage = rage;
                    rage = (rage + 1.0).min(100.0);
                    total_rage_gained += rage - old_rage;
                    anger_management_timer = 3.0;
                }
            }

            // Bloodrage ticking
            if current_time <= bloodrage_until && current_time >= bloodrage_next_tick {
                let old_rage = rage;
                rage = (rage + 1.0).min(100.0);
                total_rage_gained += rage - old_rage;
                bloodrage_next_tick = current_time + 1.0;
            }

            // Deep wounds tick (ticks every 3s, exactly 4 ticks total)
            if deep_wounds_ticks_left > 0 && current_time >= deep_wounds_next_tick {
                let tick_dmg = deep_wounds_pool / (deep_wounds_ticks_left as f64);
                deep_wounds_pool -= tick_dmg;
                deep_wounds_ticks_left -= 1;
                deep_wounds_next_tick = current_time + 3.0;
                total_damage += tick_dmg;
                let entry = ability_stats.entry("Deep Wounds".to_string()).or_default();
                entry.hits += 1;
                entry.total_damage += tick_dmg;
            }

            // Dynamic AP & Stats for this step
            let mut dynamic_ap = self.sheet.total_ap;
            let mut dynamic_haste = self.sheet.haste_pct;
            let mut dynamic_crit = self.sheet.crit_pct;
            let mut dynamic_armor_pen = 0.0;

            if current_time <= crusader_mh_until {
                dynamic_ap += 200.0; // 100 Str = 200 AP
            }
            if current_time <= crusader_oh_until {
                dynamic_ap += 200.0;
            }
            if current_time <= mighty_rage_until {
                dynamic_ap += 120.0; // 60 Str = 120 AP
            }
            if current_time <= recklessness_until {
                dynamic_crit += 100.0;
            }
            if current_time <= bonereaver_until && bonereaver_stacks > 0 {
                dynamic_armor_pen += (bonereaver_stacks as f64) * 700.0;
            }

            // On-use trinkets
            if current_time <= trinket_until {
                for item in &self.config.items {
                    dynamic_ap += item.on_use_ap;
                    dynamic_haste += item.on_use_haste;
                    dynamic_armor_pen += item.on_use_armor_pen;
                }
            }

            // Flurry Haste
            let flurry_haste = if flurry_charges > 0 {
                (self.config.talents.flurry as f64) * 5.0
            } else {
                0.0
            };
            let total_haste = dynamic_haste + flurry_haste;
            let haste_mult = 1.0 + total_haste / 100.0;

            // Damage multipliers
            let mut dmg_mult = 1.0;
            if self.config.buffs.darkmoon_faire {
                dmg_mult *= 1.10;
            }
            if current_time <= death_wish_until {
                dmg_mult *= 1.20;
            }
            if !self.is_dw && self.config.talents.two_handed_weapon_specialization > 0 {
                dmg_mult *= 1.0 + (self.config.talents.two_handed_weapon_specialization as f64) * 0.01;
            }

            // Armor mitigation
            let effective_armor = (self.sheet.effective_boss_armor - dynamic_armor_pen).max(0.0);
            let armor_mult = 1.0 - (effective_armor / (effective_armor + 5500.0));

            // Decrement swing timers by haste
            mh_swing_timer -= dt * haste_mult;
            if self.is_dw {
                oh_swing_timer -= dt * haste_mult;
            }

            // Active Abilities & Cooldowns
            let in_execute = current_time >= execute_start_time;

            // Mighty Rage Potion on execute phase entry (or pull if execute is 0)
            if self.config.buffs.mighty_rage_potion && pot_cd <= 0.0 && (in_execute || self.config.encounter.execute_phase_pct <= 0.0) {
                pot_cd = 120.0;
                mighty_rage_until = current_time + 20.0;
                let old_rage = rage;
                rage = (rage + 60.0).min(100.0);
                total_rage_gained += rage - old_rage;
            }

            // Death Wish
            if self.config.rotation.use_death_wish && self.config.talents.death_wish > 0 && dw_cd <= 0.0 && rage >= 10.0 {
                rage -= 10.0;
                dw_cd = 180.0;
                death_wish_until = current_time + 30.0;
                if self.config.talents.gore_drinker > 0 {
                    gore_drinker_charges = 3;
                }
            }

            // Bloodrage
            if self.config.rotation.use_bloodrage && bloodrage_cd <= 0.0 && rage < 80.0 {
                bloodrage_cd = 60.0;
                bloodrage_until = current_time + 10.0;
                bloodrage_next_tick = current_time + 1.0;
                let old_rage = rage;
                rage = (rage + 10.0).min(100.0);
                total_rage_gained += rage - old_rage;
                if self.config.talents.gore_drinker > 0 {
                    gore_drinker_charges = 3;
                }
            }

            // Berserker Rage
            if self.config.rotation.use_berserker_rage && berserker_rage_cd <= 0.0 {
                berserker_rage_cd = 30.0;
                let br_rage = match self.config.talents.improved_berserker_rage {
                    1 => 5.0,
                    2..=u8::MAX => 10.0,
                    _ => 0.0,
                };
                if br_rage > 0.0 {
                    let old_rage = rage;
                    rage = (rage + br_rage).min(100.0);
                    total_rage_gained += rage - old_rage;
                }
                if self.config.talents.gore_drinker > 0 {
                    gore_drinker_charges = 3;
                }
            }

            // Recklessness
            if self.config.rotation.use_recklessness && reck_cd <= 0.0 && in_execute {
                reck_cd = 1800.0;
                recklessness_until = current_time + 15.0;
            }

            // On-use Trinkets
            if self.config.rotation.use_trinkets && trinket_cd <= 0.0 {
                let has_trinket = self.config.items.iter().any(|i| i.on_use_ap > 0.0 || i.on_use_haste > 0.0 || i.on_use_armor_pen > 0.0);
                if has_trinket {
                    trinket_cd = 120.0;
                    let duration = self.config.items.iter().map(|i| i.on_use_duration).fold(20.0, f64::max);
                    trinket_until = current_time + duration;
                }
            }

            // GCD Rotation Priority
            if gcd <= 0.0 {
                let impale_crit_mult = 2.0 + 0.10 * (self.config.talents.impale as f64);

                // 1. Overpower stance-dance window
                let can_overpower = self.config.rotation.use_overpower
                    && current_time <= overpower_available_until
                    && op_cd <= 0.0
                    && rage <= self.config.rotation.overpower_max_rage;

                if can_overpower {
                    // Stance dance to Battle Stance
                    let retained = self.sheet.retained_stance_rage;
                    rage = rage.min(retained);

                    if rage >= 5.0 {
                        rage -= 5.0;
                        op_cd = 5.0;
                        gcd = 1.5;
                        overpower_available_until = 0.0; // Consumed

                        // Overpower yellow roll: cannot be dodged/blocked/parried
                        let roll: f64 = rng.gen_range(0.0..100.0);
                        let yellow_miss = self.sheet.yellow_miss_pct;
                        let op_crit_pct = (dynamic_crit + 25.0 * (self.config.talents.improved_overpower as f64)).min(100.0 - yellow_miss);

                        let entry = ability_stats.entry("Overpower".to_string()).or_default();
                        entry.casts += 1;

                        if roll < yellow_miss {
                            entry.misses += 1;
                        } else if roll < yellow_miss + op_crit_pct {
                            entry.crits += 1;
                            let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                            let raw_dmg = weapon_roll + (dynamic_ap / 14.0) * self.norm_mh_speed + 35.0;
                            let final_dmg = raw_dmg * impale_crit_mult * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;

                            // Crit triggers flurry & deep wounds
                            if self.config.talents.flurry > 0 { flurry_charges = 3; }
                            if self.config.talents.deep_wounds > 0 {
                                let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                                let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                                deep_wounds_pool += dw_total;
                                deep_wounds_ticks_left = 4;
                                deep_wounds_next_tick = current_time + 3.0;
                            }
                        } else {
                            entry.hits += 1;
                            let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                            let raw_dmg = weapon_roll + (dynamic_ap / 14.0) * self.norm_mh_speed + 35.0;
                            let final_dmg = raw_dmg * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;
                        }

                        // Stance dance back to Berserker Stance
                        rage = rage.min(retained);
                        continue;
                    }
                }

                // 2. Execute Phase
                if in_execute && self.config.rotation.use_execute {
                    let exec_cost = match self.config.talents.improved_execute {
                        1 => 13.0,
                        2..=u8::MAX => 10.0,
                        _ => 15.0,
                    };

                    let prefer_bt = self.config.rotation.use_bloodthirst
                        && self.config.talents.bloodthirst > 0
                        && dynamic_ap >= self.config.rotation.execute_bt_ap_threshold
                        && bt_cd <= 0.0
                        && rage >= 30.0;

                    if !prefer_bt && rage >= exec_cost {
                        let extra_rage = rage - exec_cost;
                        rage = 0.0; // Drains all rage
                        gcd = 1.5;

                        let roll: f64 = rng.gen_range(0.0..100.0);
                        let yellow_miss = self.sheet.yellow_miss_pct;
                        let dodge = self.dodge_pct;
                        let yellow_crit = dynamic_crit.min(100.0 - yellow_miss - dodge);

                        let entry = ability_stats.entry("Execute".to_string()).or_default();
                        entry.casts += 1;

                        let base_exec_dmg = 600.0 + extra_rage * 15.0;

                        if roll < yellow_miss {
                            entry.misses += 1;
                        } else if roll < yellow_miss + dodge {
                            entry.dodges += 1;
                            overpower_available_until = current_time + 5.0;
                        } else if roll < yellow_miss + dodge + yellow_crit {
                            entry.crits += 1;
                            let final_dmg = base_exec_dmg * impale_crit_mult * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;

                            if self.config.talents.flurry > 0 { flurry_charges = 3; }
                            if self.config.talents.deep_wounds > 0 {
                                let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                                let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                                deep_wounds_pool += dw_total;
                                deep_wounds_ticks_left = 4;
                                deep_wounds_next_tick = current_time + 3.0;
                            }
                        } else {
                            entry.hits += 1;
                            let final_dmg = base_exec_dmg * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;
                        }
                        continue;
                    }
                }

                // 3. Bloodthirst
                if self.config.rotation.use_bloodthirst && self.config.talents.bloodthirst > 0 && bt_cd <= 0.0 && rage >= 30.0 {
                    rage -= 30.0;
                    bt_cd = 6.0;
                    gcd = 1.5;

                    if self.config.talents.gore_drinker > 0 {
                        gore_drinker_charges = 3;
                    }

                    let roll: f64 = rng.gen_range(0.0..100.0);
                    let yellow_miss = self.sheet.yellow_miss_pct;
                    let dodge = self.dodge_pct;
                    let yellow_crit = dynamic_crit.min(100.0 - yellow_miss - dodge);

                    let entry = ability_stats.entry("Bloodthirst".to_string()).or_default();
                    entry.casts += 1;

                    let base_bt_dmg = 0.45 * dynamic_ap;

                    if roll < yellow_miss {
                        entry.misses += 1;
                    } else if roll < yellow_miss + dodge {
                        entry.dodges += 1;
                        overpower_available_until = current_time + 5.0;
                    } else if roll < yellow_miss + dodge + yellow_crit {
                        entry.crits += 1;
                        let final_dmg = base_bt_dmg * impale_crit_mult * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        if self.config.talents.flurry > 0 { flurry_charges = 3; }
                        if self.config.talents.deep_wounds > 0 {
                            let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                            let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                            deep_wounds_pool += dw_total;
                            deep_wounds_ticks_left = 4;
                            deep_wounds_next_tick = current_time + 3.0;
                        }
                    } else {
                        entry.hits += 1;
                        let final_dmg = base_bt_dmg * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;
                    }

                    // Windfury on Yellow Attack
                    if self.config.buffs.windfury_totem && roll >= yellow_miss + dodge {
                        if rng.gen_range(0.0..100.0) < 20.0 {
                            self.resolve_windfury_extra_swing(
                                rng,
                                current_time,
                                dynamic_ap,
                                dynamic_crit,
                                armor_mult,
                                dmg_mult,
                                &mut rage,
                                &mut total_rage_gained,
                                &mut flurry_charges,
                                &mut gore_drinker_charges,
                                &mut total_gore_drinker_heals,
                                &mut deep_wounds_pool,
                                &mut deep_wounds_ticks_left,
                                &mut deep_wounds_next_tick,
                                &mut overpower_available_until,
                                &mut crusader_mh_until,
                                &mut bonereaver_stacks,
                                &mut bonereaver_until,
                                &mut total_damage,
                                &mut ability_stats,
                            );
                        }
                    }
                    continue;
                }

                // 4. Whirlwind
                let ww_cost = 25.0 - (self.config.talents.raging_blows as f64);
                if self.config.rotation.use_whirlwind && ww_cd <= 0.0 && rage >= ww_cost {
                    rage -= ww_cost;
                    ww_cd = 10.0;
                    gcd = 1.5;

                    let entry = ability_stats.entry("Whirlwind".to_string()).or_default();
                    entry.casts += 1;

                    let targets = (self.config.encounter.targets).clamp(1, 4);

                    for _ in 0..targets {
                        let roll: f64 = rng.gen_range(0.0..100.0);
                        let yellow_miss = self.sheet.yellow_miss_pct;
                        let dodge = self.dodge_pct;
                        let yellow_crit = dynamic_crit.min(100.0 - yellow_miss - dodge);

                        let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                        let raw_dmg = weapon_roll + (dynamic_ap / 14.0) * self.norm_mh_speed;

                        if roll < yellow_miss {
                            entry.misses += 1;
                        } else if roll < yellow_miss + dodge {
                            entry.dodges += 1;
                            overpower_available_until = current_time + 5.0;
                        } else if roll < yellow_miss + dodge + yellow_crit {
                            entry.crits += 1;
                            let final_dmg = raw_dmg * impale_crit_mult * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;

                            if self.config.talents.flurry > 0 { flurry_charges = 3; }
                            if self.config.talents.deep_wounds > 0 {
                                let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                                let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                                deep_wounds_pool += dw_total;
                                deep_wounds_ticks_left = 4;
                                deep_wounds_next_tick = current_time + 3.0;
                            }
                        } else {
                            entry.hits += 1;
                            let final_dmg = raw_dmg * armor_mult * dmg_mult;
                            entry.total_damage += final_dmg;
                            total_damage += final_dmg;
                        }
                    }

                    // Windfury proc on WW primary hit
                    if self.config.buffs.windfury_totem {
                        if rng.gen_range(0.0..100.0) < 20.0 {
                            self.resolve_windfury_extra_swing(
                                rng,
                                current_time,
                                dynamic_ap,
                                dynamic_crit,
                                armor_mult,
                                dmg_mult,
                                &mut rage,
                                &mut total_rage_gained,
                                &mut flurry_charges,
                                &mut gore_drinker_charges,
                                &mut total_gore_drinker_heals,
                                &mut deep_wounds_pool,
                                &mut deep_wounds_ticks_left,
                                &mut deep_wounds_next_tick,
                                &mut overpower_available_until,
                                &mut crusader_mh_until,
                                &mut bonereaver_stacks,
                                &mut bonereaver_until,
                                &mut total_damage,
                                &mut ability_stats,
                            );
                        }
                    }
                    continue;
                }

                // 5. Hamstring (Rage Dump / Proc Fishing)
                if self.config.rotation.use_hamstring
                    && rage >= self.config.rotation.hamstring_rage_threshold
                    && bt_cd > 1.0
                    && ww_cd > 1.0
                {
                    rage -= 10.0;
                    gcd = 1.5;

                    let roll: f64 = rng.gen_range(0.0..100.0);
                    let yellow_miss = self.sheet.yellow_miss_pct;
                    let dodge = self.dodge_pct;
                    let yellow_crit = dynamic_crit.min(100.0 - yellow_miss - dodge);

                    let entry = ability_stats.entry("Hamstring".to_string()).or_default();
                    entry.casts += 1;

                    let base_hs_dmg = 45.0;

                    if roll < yellow_miss {
                        entry.misses += 1;
                    } else if roll < yellow_miss + dodge {
                        entry.dodges += 1;
                        overpower_available_until = current_time + 5.0;
                    } else if roll < yellow_miss + dodge + yellow_crit {
                        entry.crits += 1;
                        let final_dmg = base_hs_dmg * impale_crit_mult * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        if self.config.talents.flurry > 0 { flurry_charges = 3; }
                        if self.config.talents.deep_wounds > 0 {
                            let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                            let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                            deep_wounds_pool += dw_total;
                            deep_wounds_ticks_left = 4;
                            deep_wounds_next_tick = current_time + 3.0;
                        }
                    } else {
                        entry.hits += 1;
                        let final_dmg = base_hs_dmg * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;
                    }

                    // Windfury proc on Hamstring hit
                    if self.config.buffs.windfury_totem && roll >= yellow_miss + dodge {
                        if rng.gen_range(0.0..100.0) < 20.0 {
                            self.resolve_windfury_extra_swing(
                                rng,
                                current_time,
                                dynamic_ap,
                                dynamic_crit,
                                armor_mult,
                                dmg_mult,
                                &mut rage,
                                &mut total_rage_gained,
                                &mut flurry_charges,
                                &mut gore_drinker_charges,
                                &mut total_gore_drinker_heals,
                                &mut deep_wounds_pool,
                                &mut deep_wounds_ticks_left,
                                &mut deep_wounds_next_tick,
                                &mut overpower_available_until,
                                &mut crusader_mh_until,
                                &mut bonereaver_stacks,
                                &mut bonereaver_until,
                                &mut total_damage,
                                &mut ability_stats,
                            );
                        }
                    }
                    continue;
                }
            }

            // Heroic Strike / Cleave Queue Decision
            // Do not queue during execute phase if using execute
            if (!in_execute || !self.config.rotation.use_execute) && !hs_queued {
                let want_cleave = self.config.rotation.use_cleave && self.config.encounter.targets > 1;
                let hs_threshold = self.config.rotation.hs_rage_threshold;
                if (self.config.rotation.use_heroic_strike || want_cleave) && rage >= hs_threshold {
                    hs_queued = true;
                }
            }

            // Main Hand Auto Attack / Queued Yellow Attack
            if mh_swing_timer <= 0.0 {
                mh_swing_timer = self.mh.speed;

                let use_cleave = self.config.rotation.use_cleave && self.config.encounter.targets > 1;
                let queue_cost = if use_cleave {
                    20.0 - (self.config.talents.raging_blows as f64)
                } else {
                    15.0 - (self.config.talents.improved_heroic_strike as f64)
                };

                if hs_queued && rage >= queue_cost {
                    // HEROIC STRIKE / CLEAVE EXECUTES
                    rage -= queue_cost;
                    hs_queued = false;

                    let ability_name = if use_cleave { "Cleave" } else { "Heroic Strike" };
                    let bonus_dmg = if use_cleave { 50.0 } else { 157.0 };
                    let impale_crit_mult = 2.0 + 0.10 * (self.config.talents.impale as f64);

                    let entry = ability_stats.entry(ability_name.to_string()).or_default();
                    entry.casts += 1;

                    let roll: f64 = rng.gen_range(0.0..100.0);
                    let yellow_miss = self.sheet.yellow_miss_pct;
                    let dodge = self.dodge_pct;
                    let yellow_crit = dynamic_crit.min(100.0 - yellow_miss - dodge);

                    let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                    let raw_dmg = weapon_roll + (dynamic_ap / 14.0) * self.mh.speed + bonus_dmg;

                    if roll < yellow_miss {
                        entry.misses += 1;
                    } else if roll < yellow_miss + dodge {
                        entry.dodges += 1;
                        overpower_available_until = current_time + 5.0;
                    } else if roll < yellow_miss + dodge + yellow_crit {
                        entry.crits += 1;
                        let final_dmg = raw_dmg * impale_crit_mult * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        if self.config.talents.flurry > 0 { flurry_charges = 3; }
                        if self.config.talents.deep_wounds > 0 {
                            let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                            let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                            deep_wounds_pool += dw_total;
                            deep_wounds_ticks_left = 4;
                            deep_wounds_next_tick = current_time + 3.0;
                        }
                    } else {
                        entry.hits += 1;
                        let final_dmg = raw_dmg * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;
                    }

                    // Cleave second target
                    if use_cleave && roll >= yellow_miss + dodge && self.config.encounter.targets > 1 {
                        let roll2: f64 = rng.gen_range(0.0..100.0);
                        let weapon_roll2 = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                        let raw_dmg2 = weapon_roll2 + (dynamic_ap / 14.0) * self.mh.speed + bonus_dmg;
                        if roll2 >= yellow_miss + dodge {
                            let final_dmg2 = if roll2 < yellow_miss + dodge + yellow_crit {
                                raw_dmg2 * impale_crit_mult * armor_mult * dmg_mult
                            } else {
                                raw_dmg2 * armor_mult * dmg_mult
                            };
                            entry.total_damage += final_dmg2;
                            total_damage += final_dmg2;
                        }
                    }

                    // Windfury proc on HS/Cleave
                    if self.config.buffs.windfury_totem && roll >= yellow_miss + dodge {
                        if rng.gen_range(0.0..100.0) < 20.0 {
                            self.resolve_windfury_extra_swing(
                                rng,
                                current_time,
                                dynamic_ap,
                                dynamic_crit,
                                armor_mult,
                                dmg_mult,
                                &mut rage,
                                &mut total_rage_gained,
                                &mut flurry_charges,
                                &mut gore_drinker_charges,
                                &mut total_gore_drinker_heals,
                                &mut deep_wounds_pool,
                                &mut deep_wounds_ticks_left,
                                &mut deep_wounds_next_tick,
                                &mut overpower_available_until,
                                &mut crusader_mh_until,
                                &mut bonereaver_stacks,
                                &mut bonereaver_until,
                                &mut total_damage,
                                &mut ability_stats,
                            );
                        }
                    }
                } else {
                    // NORMAL MAIN HAND WHITE ATTACK
                    hs_queued = false; // drop queue if rage dropped below cost

                    let entry = ability_stats.entry("Melee (MH)".to_string()).or_default();
                    entry.casts += 1;

                    if flurry_charges > 0 {
                        flurry_charges -= 1;
                    }
                    if gore_drinker_charges > 0 {
                        gore_drinker_charges -= 1;
                        total_gore_drinker_heals += 1;
                    }

                    let roll: f64 = rng.gen_range(0.0..100.0);
                    let white_miss = self.sheet.mh_white_miss_pct;
                    let dodge = self.dodge_pct;
                    let glancing = 40.0;
                    let glance_mult = self.glance_mult;
                    let white_crit_cap = self.sheet.mh_crit_cap;
                    let effective_white_crit = dynamic_crit.min(white_crit_cap);

                    let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
                    let base_white_dmg = weapon_roll + (dynamic_ap / 14.0) * self.mh.speed;

                    let norm_rage = self.sheet.mh_norm_rage;
                    let crit_rage = self.sheet.mh_crit_rage;

                    if roll < white_miss {
                        entry.misses += 1;
                    } else if roll < white_miss + dodge {
                        entry.dodges += 1;
                        overpower_available_until = current_time + 5.0;
                    } else if roll < white_miss + dodge + glancing {
                        entry.glances += 1;
                        let final_dmg = base_white_dmg * glance_mult * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        // Rage generation
                        let old_rage = rage;
                        rage = (rage + norm_rage).min(100.0);
                        total_rage_gained += rage - old_rage;

                        self.resolve_on_hit_procs(
                            rng,
                            current_time,
                            &self.mh,
                            &mut crusader_mh_until,
                            &mut bonereaver_stacks,
                            &mut bonereaver_until,
                            &mut total_damage,
                            &mut ability_stats,
                        );
                    } else if roll < white_miss + dodge + glancing + effective_white_crit {
                        entry.crits += 1;
                        let final_dmg = base_white_dmg * 2.0 * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        // Rage generation: Crit Rage = 2.0 * norm_rage (+100% crit rage bonus!)
                        let old_rage = rage;
                        rage = (rage + crit_rage).min(100.0);
                        total_rage_gained += rage - old_rage;

                        if self.config.talents.flurry > 0 { flurry_charges = 3; }
                        if self.config.talents.deep_wounds > 0 {
                            let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                            let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                            deep_wounds_pool += dw_total;
                            deep_wounds_ticks_left = 4;
                            deep_wounds_next_tick = current_time + 3.0;
                        }

                        self.resolve_on_hit_procs(
                            rng,
                            current_time,
                            &self.mh,
                            &mut crusader_mh_until,
                            &mut bonereaver_stacks,
                            &mut bonereaver_until,
                            &mut total_damage,
                            &mut ability_stats,
                        );
                    } else {
                        entry.hits += 1;
                        let final_dmg = base_white_dmg * armor_mult * dmg_mult;
                        entry.total_damage += final_dmg;
                        total_damage += final_dmg;

                        // Rage generation
                        let old_rage = rage;
                        rage = (rage + norm_rage).min(100.0);
                        total_rage_gained += rage - old_rage;

                        self.resolve_on_hit_procs(
                            rng,
                            current_time,
                            &self.mh,
                            &mut crusader_mh_until,
                            &mut bonereaver_stacks,
                            &mut bonereaver_until,
                            &mut total_damage,
                            &mut ability_stats,
                        );
                    }

                    // Unbridled Wrath check on white hit
                    if self.config.talents.unbridled_wrath > 0 && roll >= white_miss + dodge {
                        if rng.gen_range(0.0..100.0) < (self.config.talents.unbridled_wrath as f64) * 8.0 {
                            let old_rage = rage;
                            rage = (rage + 1.0).min(100.0);
                            total_rage_gained += rage - old_rage;
                        }
                    }

                    // Windfury proc on MH white hit
                    if self.config.buffs.windfury_totem && roll >= white_miss + dodge {
                        if rng.gen_range(0.0..100.0) < 20.0 {
                            self.resolve_windfury_extra_swing(
                                rng,
                                current_time,
                                dynamic_ap,
                                dynamic_crit,
                                armor_mult,
                                dmg_mult,
                                &mut rage,
                                &mut total_rage_gained,
                                &mut flurry_charges,
                                &mut gore_drinker_charges,
                                &mut total_gore_drinker_heals,
                                &mut deep_wounds_pool,
                                &mut deep_wounds_ticks_left,
                                &mut deep_wounds_next_tick,
                                &mut overpower_available_until,
                                &mut crusader_mh_until,
                                &mut bonereaver_stacks,
                                &mut bonereaver_until,
                                &mut total_damage,
                                &mut ability_stats,
                            );
                        }
                    }
                }
            }

            // Off Hand Auto Attack
            if self.is_dw && oh_swing_timer <= 0.0 {
                let oh = self.oh.as_ref().unwrap();
                oh_swing_timer = oh.speed;

                let entry = ability_stats.entry("Melee (OH)".to_string()).or_default();
                entry.casts += 1;

                if flurry_charges > 0 {
                    flurry_charges -= 1;
                }
                if gore_drinker_charges > 0 {
                    gore_drinker_charges -= 1;
                    total_gore_drinker_heals += 1;
                }

                // CRITICAL WOW:FOREVER RULE:
                // Off-Hand ALWAYS uses the dual-wield white attack table!
                // Even if Heroic Strike is queued on MH, OH miss is NEVER bypassed!
                let roll: f64 = rng.gen_range(0.0..100.0);
                let oh_miss = self.sheet.oh_white_miss_pct;
                let dodge = self.dodge_pct;
                let glancing = 40.0;
                let glance_mult = self.glance_mult;
                let oh_crit_cap = self.sheet.oh_crit_cap;
                let effective_oh_crit = dynamic_crit.min(oh_crit_cap);

                let weapon_roll = rng.gen_range(oh.min_dmg..=oh.max_dmg);
                let oh_dw_penalty = 0.5 * (1.0 + 0.05 * (self.config.talents.dual_wield_specialization as f64));
                let base_oh_dmg = (weapon_roll + (dynamic_ap / 14.0) * oh.speed) * oh_dw_penalty;

                let norm_rage = self.sheet.oh_norm_rage;
                let crit_rage = self.sheet.oh_crit_rage;

                if roll < oh_miss {
                    entry.misses += 1;
                } else if roll < oh_miss + dodge {
                    entry.dodges += 1;
                    overpower_available_until = current_time + 5.0;
                } else if roll < oh_miss + dodge + glancing {
                    entry.glances += 1;
                    let final_dmg = base_oh_dmg * glance_mult * armor_mult * dmg_mult;
                    entry.total_damage += final_dmg;
                    total_damage += final_dmg;

                    // Rage generation
                    let old_rage = rage;
                    rage = (rage + norm_rage).min(100.0);
                    total_rage_gained += rage - old_rage;

                    self.resolve_on_hit_procs(
                        rng,
                        current_time,
                        oh,
                        &mut crusader_oh_until,
                        &mut bonereaver_stacks,
                        &mut bonereaver_until,
                        &mut total_damage,
                        &mut ability_stats,
                    );
                } else if roll < oh_miss + dodge + glancing + effective_oh_crit {
                    entry.crits += 1;
                    let final_dmg = base_oh_dmg * 2.0 * armor_mult * dmg_mult;
                    entry.total_damage += final_dmg;
                    total_damage += final_dmg;

                    // Rage generation: Crit Rage = 2.0 * norm_rage
                    let old_rage = rage;
                    rage = (rage + crit_rage).min(100.0);
                    total_rage_gained += rage - old_rage;

                    if self.config.talents.flurry > 0 { flurry_charges = 3; }
                    if self.config.talents.deep_wounds > 0 {
                        let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                        let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                        deep_wounds_pool += dw_total;
                        deep_wounds_ticks_left = 4;
                        deep_wounds_next_tick = current_time + 3.0;
                    }

                    self.resolve_on_hit_procs(
                        rng,
                        current_time,
                        oh,
                        &mut crusader_oh_until,
                        &mut bonereaver_stacks,
                        &mut bonereaver_until,
                        &mut total_damage,
                        &mut ability_stats,
                    );
                } else {
                    entry.hits += 1;
                    let final_dmg = base_oh_dmg * armor_mult * dmg_mult;
                    entry.total_damage += final_dmg;
                    total_damage += final_dmg;

                    // Rage generation
                    let old_rage = rage;
                    rage = (rage + norm_rage).min(100.0);
                    total_rage_gained += rage - old_rage;

                    self.resolve_on_hit_procs(
                        rng,
                        current_time,
                        oh,
                        &mut crusader_oh_until,
                        &mut bonereaver_stacks,
                        &mut bonereaver_until,
                        &mut total_damage,
                        &mut ability_stats,
                    );
                }

                // Unbridled Wrath check on OH white hit
                if self.config.talents.unbridled_wrath > 0 && roll >= oh_miss + dodge {
                    if rng.gen_range(0.0..100.0) < (self.config.talents.unbridled_wrath as f64) * 8.0 {
                        let old_rage = rage;
                        rage = (rage + 1.0).min(100.0);
                        total_rage_gained += rage - old_rage;
                    }
                }
            }
        }

        IterationResult {
            total_damage,
            fight_duration,
            total_rage_gained,
            flurry_active_time,
            gore_drinker_heals: total_gore_drinker_heals,
            ability_stats,
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn resolve_windfury_extra_swing(
        &self,
        rng: &mut SmallRng,
        current_time: f64,
        dynamic_ap: f64,
        dynamic_crit: f64,
        armor_mult: f64,
        dmg_mult: f64,
        rage: &mut f64,
        total_rage_gained: &mut f64,
        flurry_charges: &mut u8,
        gore_drinker_charges: &mut u8,
        total_gore_drinker_heals: &mut u32,
        deep_wounds_pool: &mut f64,
        deep_wounds_ticks_left: &mut u8,
        deep_wounds_next_tick: &mut f64,
        overpower_available_until: &mut f64,
        crusader_mh_until: &mut f64,
        bonereaver_stacks: &mut u8,
        bonereaver_until: &mut f64,
        total_damage: &mut f64,
        ability_stats: &mut HashMap<String, AbilityStats>,
    ) {
        let entry = ability_stats.entry("Windfury Attack".to_string()).or_default();
        entry.casts += 1;

        if *gore_drinker_charges > 0 {
            *gore_drinker_charges -= 1;
            *total_gore_drinker_heals += 1;
        }

        let roll: f64 = rng.gen_range(0.0..100.0);
        let white_miss = self.sheet.mh_white_miss_pct;
        let dodge = self.dodge_pct;
        let glancing = 40.0;
        let glance_mult = self.glance_mult;
        let white_crit_cap = self.sheet.mh_crit_cap;
        let effective_white_crit = dynamic_crit.min(white_crit_cap);

        let weapon_roll = rng.gen_range(self.mh.min_dmg..=self.mh.max_dmg);
        // Windfury grants +315 AP on the extra swing
        let base_wf_dmg = weapon_roll + ((dynamic_ap + 315.0) / 14.0) * self.mh.speed;

        let norm_rage = self.sheet.mh_norm_rage;
        let crit_rage = self.sheet.mh_crit_rage;

        if roll < white_miss {
            entry.misses += 1;
        } else if roll < white_miss + dodge {
            entry.dodges += 1;
            *overpower_available_until = current_time + 5.0;
        } else if roll < white_miss + dodge + glancing {
            entry.glances += 1;
            let final_dmg = base_wf_dmg * glance_mult * armor_mult * dmg_mult;
            entry.total_damage += final_dmg;
            *total_damage += final_dmg;

            let old_rage = *rage;
            *rage = (*rage + norm_rage).min(100.0);
            *total_rage_gained += *rage - old_rage;

            self.resolve_on_hit_procs(
                rng,
                current_time,
                &self.mh,
                crusader_mh_until,
                bonereaver_stacks,
                bonereaver_until,
                total_damage,
                ability_stats,
            );
        } else if roll < white_miss + dodge + glancing + effective_white_crit {
            entry.crits += 1;
            let final_dmg = base_wf_dmg * 2.0 * armor_mult * dmg_mult;
            entry.total_damage += final_dmg;
            *total_damage += final_dmg;

            let old_rage = *rage;
            *rage = (*rage + crit_rage).min(100.0);
            *total_rage_gained += *rage - old_rage;

            if self.config.talents.flurry > 0 { *flurry_charges = 3; }
            if self.config.talents.deep_wounds > 0 {
                let avg_dmg = (self.mh.min_dmg + self.mh.max_dmg) / 2.0;
                let dw_total = avg_dmg * 0.20 * (self.config.talents.deep_wounds as f64);
                *deep_wounds_pool += dw_total;
                *deep_wounds_ticks_left = 4;
                *deep_wounds_next_tick = current_time + 3.0;
            }

            self.resolve_on_hit_procs(
                rng,
                current_time,
                &self.mh,
                crusader_mh_until,
                bonereaver_stacks,
                bonereaver_until,
                total_damage,
                ability_stats,
            );
        } else {
            entry.hits += 1;
            let final_dmg = base_wf_dmg * armor_mult * dmg_mult;
            entry.total_damage += final_dmg;
            *total_damage += final_dmg;

            let old_rage = *rage;
            *rage = (*rage + norm_rage).min(100.0);
            *total_rage_gained += *rage - old_rage;

            self.resolve_on_hit_procs(
                rng,
                current_time,
                &self.mh,
                crusader_mh_until,
                bonereaver_stacks,
                bonereaver_until,
                total_damage,
                ability_stats,
            );
        }
    }

    #[allow(clippy::too_many_arguments)]
    fn resolve_on_hit_procs(
        &self,
        rng: &mut SmallRng,
        current_time: f64,
        weapon: &WeaponInfo,
        crusader_until: &mut f64,
        bonereaver_stacks: &mut u8,
        bonereaver_until: &mut f64,
        total_damage: &mut f64,
        ability_stats: &mut HashMap<String, AbilityStats>,
    ) {
        if let Some(ref proc_type) = weapon.proc_type {
            match proc_type.to_lowercase().as_str() {
                "crusader" => {
                    let chance = (1.0 * weapon.speed / 60.0) * 100.0;
                    if rng.gen_range(0.0..100.0) < chance {
                        *crusader_until = current_time + 15.0;
                        let entry = ability_stats.entry("Crusader Proc".to_string()).or_default();
                        entry.hits += 1;
                    }
                }
                "bonereaver" => {
                    let chance = if weapon.proc_chance > 0.0 { weapon.proc_chance } else { 10.0 };
                    if rng.gen_range(0.0..100.0) < chance {
                        *bonereaver_stacks = (*bonereaver_stacks + 1).min(3);
                        *bonereaver_until = current_time + 10.0;
                        let entry = ability_stats.entry("Bonereaver Proc".to_string()).or_default();
                        entry.hits += 1;
                    }
                }
                "vis_kag" => {
                    let chance = if weapon.proc_chance > 0.0 { weapon.proc_chance } else { 2.0 };
                    if rng.gen_range(0.0..100.0) < chance {
                        let proc_dmg = 240.0;
                        *total_damage += proc_dmg;
                        let entry = ability_stats.entry("Vis'kag Proc".to_string()).or_default();
                        entry.hits += 1;
                        entry.total_damage += proc_dmg;
                    }
                }
                "deathbringer" => {
                    let chance = if weapon.proc_chance > 0.0 { weapon.proc_chance } else { 3.0 };
                    if rng.gen_range(0.0..100.0) < chance {
                        let proc_dmg = rng.gen_range(110.0..=140.0);
                        *total_damage += proc_dmg;
                        let entry = ability_stats.entry("Deathbringer Proc".to_string()).or_default();
                        entry.hits += 1;
                        entry.total_damage += proc_dmg;
                    }
                }
                _ => {}
            }
        }
    }
}

pub fn run_sim(config: &SimConfig) -> SimResult {
    let start_time = Instant::now();
    let runner = SimulationRun::new(config.clone());
    let iterations = if config.encounter.iterations > 0 {
        config.encounter.iterations
    } else {
        10000
    };

    let base_seed = if config.encounter.seed > 0 {
        config.encounter.seed
    } else {
        42
    };

    let duration_base = if config.encounter.duration_sec > 0.0 {
        config.encounter.duration_sec
    } else {
        60.0
    };
    let duration_var = config.encounter.duration_variation_sec;

    #[cfg(feature = "parallel")]
    let iteration_results: Vec<IterationResult> = {
        use rayon::prelude::*;
        (0..iterations)
            .into_par_iter()
            .map(|i| {
                let mut rng = SmallRng::seed_from_u64(base_seed.wrapping_add(i as u64));
                let fight_duration = if duration_var > 0.0 {
                    duration_base + rng.gen_range(-duration_var..=duration_var)
                } else {
                    duration_base
                };
                runner.run_single_iteration(&mut rng, fight_duration)
            })
            .collect()
    };

    #[cfg(not(feature = "parallel"))]
    let iteration_results: Vec<IterationResult> = {
        (0..iterations)
            .map(|i| {
                let mut rng = SmallRng::seed_from_u64(base_seed.wrapping_add(i as u64));
                let fight_duration = if duration_var > 0.0 {
                    duration_base + rng.gen_range(-duration_var..=duration_var)
                } else {
                    duration_base
                };
                runner.run_single_iteration(&mut rng, fight_duration)
            })
            .collect()
    };

    // Calculate aggregated statistics
    let mut total_dps = 0.0;
    let mut min_dps = f64::MAX;
    let mut max_dps = 0.0;
    let mut total_rps = 0.0;
    let mut total_flurry_uptime = 0.0;
    let mut total_fight_time = 0.0;
    let mut total_gore_drinker_heals = 0u64;

    let mut ability_aggregate: HashMap<String, AbilityStats> = HashMap::new();
    let mut dps_list = Vec::with_capacity(iterations as usize);

    for res in &iteration_results {
        let dps = res.dps();
        dps_list.push(dps);
        total_dps += dps;
        if dps < min_dps { min_dps = dps; }
        if dps > max_dps { max_dps = dps; }

        if res.fight_duration > 0.0 {
            total_rps += res.total_rage_gained / res.fight_duration;
            total_flurry_uptime += res.flurry_active_time;
            total_fight_time += res.fight_duration;
        }
        total_gore_drinker_heals += res.gore_drinker_heals as u64;

        for (name, stats) in &res.ability_stats {
            let agg = ability_aggregate.entry(name.clone()).or_default();
            agg.casts += stats.casts;
            agg.hits += stats.hits;
            agg.crits += stats.crits;
            agg.glances += stats.glances;
            agg.misses += stats.misses;
            agg.dodges += stats.dodges;
            agg.total_damage += stats.total_damage;
        }
    }

    let n = iterations as f64;
    let mean_dps = total_dps / n;
    let mean_rps = total_rps / n;
    let flurry_uptime_pct = if total_fight_time > 0.0 {
        (total_flurry_uptime / total_fight_time) * 100.0
    } else {
        0.0
    };
    let total_fight_min = total_fight_time / 60.0;
    let gore_drinker_heals_per_min = if total_fight_min > 0.0 {
        (total_gore_drinker_heals as f64) / total_fight_min
    } else {
        0.0
    };

    // Variance & Standard Deviation
    let variance = dps_list.iter().map(|d| (d - mean_dps).powi(2)).sum::<f64>() / n;
    let std_dev_dps = variance.sqrt();
    let error_margin = 1.96 * std_dev_dps / (n.sqrt());

    // DPS Histogram (25 buckets)
    let num_buckets = 25;
    let range = (max_dps - min_dps).max(1.0);
    let bucket_size = range / (num_buckets as f64);
    let mut histogram_counts = vec![0u32; num_buckets];

    for &d in &dps_list {
        let b = (((d - min_dps) / bucket_size).floor() as usize).min(num_buckets - 1);
        histogram_counts[b] += 1;
    }

    let dps_histogram: Vec<(u32, u32)> = histogram_counts
        .into_iter()
        .enumerate()
        .map(|(i, count)| {
            let bucket_val = (min_dps + (i as f64 + 0.5) * bucket_size).round() as u32;
            (bucket_val, count)
        })
        .collect();

    // Ability Breakdown list
    let grand_total_damage: f64 = ability_aggregate.values().map(|s| s.total_damage).sum();
    let mut abilities: Vec<AbilityBreakdown> = ability_aggregate
        .into_iter()
        .map(|(name, stats)| {
            let total_events = (stats.hits + stats.crits + stats.glances + stats.misses + stats.dodges) as f64;
            let div = if total_events > 0.0 { total_events } else { 1.0 };
            let dps = stats.total_damage / total_fight_time.max(1.0);
            let pct = if grand_total_damage > 0.0 {
                (stats.total_damage / grand_total_damage) * 100.0
            } else {
                0.0
            };

            AbilityBreakdown {
                name,
                total_damage: stats.total_damage / n,
                dps,
                pct,
                casts: (stats.casts as f64) / n,
                hit_pct: (stats.hits as f64) / div * 100.0,
                crit_pct: (stats.crits as f64) / div * 100.0,
                glance_pct: (stats.glances as f64) / div * 100.0,
                miss_pct: (stats.misses as f64) / div * 100.0,
                dodge_pct: (stats.dodges as f64) / div * 100.0,
            }
        })
        .collect();

    abilities.sort_by(|a, b| b.total_damage.partial_cmp(&a.total_damage).unwrap_or(std::cmp::Ordering::Equal));

    let elapsed_ms = start_time.elapsed().as_secs_f64() * 1000.0;

    SimResult {
        mean_dps,
        min_dps,
        max_dps,
        std_dev_dps,
        error_margin,
        mean_rps,
        flurry_uptime_pct,
        gore_drinker_heals_per_min,
        elapsed_ms,
        iterations,
        sheet: runner.sheet,
        abilities,
        dps_histogram,
    }
}
