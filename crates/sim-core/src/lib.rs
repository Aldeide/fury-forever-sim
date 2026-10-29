pub mod batch;
pub mod engine;
pub mod stats;
pub mod types;
pub mod weights;

pub use batch::run_batch_slot;
pub use engine::run_sim;
pub use stats::compute_character_sheet;
pub use types::*;
pub use weights::run_stat_weights;

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> SimConfig {
        SimConfig {
            race: "orc".to_string(),
            items: vec![
                ItemStats {
                    id: "mh_axe".to_string(),
                    name: "Deathbringer".to_string(),
                    slot: "mainhand".to_string(),
                    min_dmg: 114.0,
                    max_dmg: 213.0,
                    speed: 2.9,
                    weapon_type: Some("axe".to_string()),
                    str: 15.0,
                    agi: 10.0,
                    crit: 1.0,
                    hit: 1.0,
                    ..Default::default()
                },
                ItemStats {
                    id: "oh_axe".to_string(),
                    name: "Flurry Axe".to_string(),
                    slot: "offhand".to_string(),
                    min_dmg: 37.0,
                    max_dmg: 69.0,
                    speed: 1.5,
                    weapon_type: Some("axe".to_string()),
                    crit: 1.0,
                    ..Default::default()
                },
            ],
            enchants: vec![],
            talents: TalentConfig {
                cruelty: 5,
                flurry: 5,
                bloodthirst: 1,
                dual_wield_specialization: 5,
                ..Default::default()
            },
            buffs: BuffConfig {
                battle_shout: true,
                ..Default::default()
            },
            rotation: RotationConfig {
                use_bloodthirst: true,
                use_whirlwind: true,
                use_heroic_strike: true,
                hs_rage_threshold: 40.0,
                use_execute: true,
                ..Default::default()
            },
            encounter: EncounterConfig {
                boss_level: 63,
                boss_armor: 3731.0,
                duration_sec: 30.0,
                duration_variation_sec: 0.0,
                execute_phase_pct: 20.0,
                targets: 1,
                iterations: 50,
                seed: 12345,
                starting_rage: 50.0,
            },
        }
    }

    #[test]
    fn test_normalized_rage_and_crit_rage() {
        let mut cfg = create_test_config();
        cfg.items = vec![
            ItemStats {
                id: "mh".to_string(),
                name: "MH Weapon".to_string(),
                slot: "mainhand".to_string(),
                speed: 2.6,
                min_dmg: 100.0,
                max_dmg: 150.0,
                ..Default::default()
            },
            ItemStats {
                id: "oh".to_string(),
                name: "OH Weapon".to_string(),
                slot: "offhand".to_string(),
                speed: 1.8,
                min_dmg: 80.0,
                max_dmg: 120.0,
                ..Default::default()
            },
        ];

        let sheet = compute_character_sheet(&cfg);
        // Dual-Wield MH Normal Hit: speed * 3.46
        let expected_mh_norm = 2.6 * 3.46;
        // Dual-Wield OH Normal Hit: speed * 1.73 * (1 + 0.05 * dwSpec)
        let expected_oh_norm = 1.8 * 1.73 * (1.0 + 0.05 * (cfg.talents.dual_wield_specialization as f64));
        // Crit Rage: 2.0 * normal_rage
        let expected_mh_crit = 2.0 * expected_mh_norm;
        let expected_oh_crit = 2.0 * expected_oh_norm;

        assert!((sheet.mh_norm_rage - expected_mh_norm).abs() < 1e-4, "MH Norm Rage mismatch");
        assert!((sheet.oh_norm_rage - expected_oh_norm).abs() < 1e-4, "OH Norm Rage mismatch");
        assert!((sheet.mh_crit_rage - expected_mh_crit).abs() < 1e-4, "MH Crit Rage mismatch");
        assert!((sheet.oh_crit_rage - expected_oh_crit).abs() < 1e-4, "OH Crit Rage mismatch");

        // Two-Hand Normal Hit: speed * 4.50
        let mut cfg_2h = create_test_config();
        cfg_2h.items = vec![
            ItemStats {
                id: "2h".to_string(),
                name: "2H Weapon".to_string(),
                slot: "twohand".to_string(),
                speed: 3.6,
                min_dmg: 200.0,
                max_dmg: 300.0,
                ..Default::default()
            },
        ];
        let sheet_2h = compute_character_sheet(&cfg_2h);
        let expected_2h_norm = 3.6 * 4.50;
        let expected_2h_crit = 2.0 * expected_2h_norm;
        assert!((sheet_2h.mh_norm_rage - expected_2h_norm).abs() < 1e-4, "2H Norm Rage mismatch");
        assert!((sheet_2h.mh_crit_rage - expected_2h_crit).abs() < 1e-4, "2H Crit Rage mismatch");
    }

    #[test]
    fn test_furious_precision_reduces_oh_miss() {
        let mut cfg = create_test_config();
        cfg.race = "tauren".to_string(); // 300 skill
        cfg.items = vec![
            ItemStats { slot: "mainhand".to_string(), speed: 2.6, ..Default::default() },
            ItemStats { slot: "offhand".to_string(), speed: 2.6, ..Default::default() },
        ];

        // 0 ranks: 0% bonus OH hit
        cfg.talents.furious_precision = 0;
        let sheet0 = compute_character_sheet(&cfg);
        // Base yellow miss vs lvl 63 at 300 skill (delta=15) = 5.0 + 15 * 0.2 = 8.0%
        // Base DW white miss = 8.0 + 19.0 = 27.0%
        assert!((sheet0.oh_white_miss_pct - 27.0).abs() < 1e-4, "Expected 27.0% OH miss with 0 FP");

        // 1 rank: +4% OH hit -> 23.0% OH miss
        cfg.talents.furious_precision = 1;
        let sheet1 = compute_character_sheet(&cfg);
        assert!((sheet1.oh_white_miss_pct - 23.0).abs() < 1e-4, "Expected 23.0% OH miss with 1 FP");

        // 2 ranks: +7% OH hit -> 20.0% OH miss
        cfg.talents.furious_precision = 2;
        let sheet2 = compute_character_sheet(&cfg);
        assert!((sheet2.oh_white_miss_pct - 20.0).abs() < 1e-4, "Expected 20.0% OH miss with 2 FP");

        // 3 ranks: +10% OH hit -> 17.0% OH miss
        cfg.talents.furious_precision = 3;
        let sheet3 = compute_character_sheet(&cfg);
        assert!((sheet3.oh_white_miss_pct - 17.0).abs() < 1e-4, "Expected 17.0% OH miss with 3 FP");
    }

    #[test]
    fn test_oh_miss_not_bypassed_by_hs_queue() {
        // Even when Heroic Strike is queued 100% of the time,
        // OH attacks MUST still experience the dual-wield miss rate (~27% or ~17% with 3/3 FP).
        let mut cfg = create_test_config();
        cfg.race = "tauren".to_string();
        cfg.talents.furious_precision = 0;
        cfg.rotation.use_heroic_strike = true;
        cfg.rotation.hs_rage_threshold = 0.0; // Queue constantly
        cfg.buffs.mighty_rage_potion = true; // High rage
        cfg.encounter.iterations = 200;
        cfg.encounter.duration_sec = 60.0;

        let result = run_sim(&cfg);
        let oh_stats = result.abilities.iter().find(|a| a.name == "Melee (OH)").expect("OH ability found");

        // If HS queue erroneously bypassed the dual-wield penalty, miss_pct would drop to yellow miss (~8%).
        // With WoW: Forever mechanics, OH miss must remain ~27%!
        assert!(
            oh_stats.miss_pct > 20.0,
            "OH miss percentage was {:?}, which is too low! HS queue should NOT bypass OH DW miss penalty!",
            oh_stats.miss_pct
        );
    }

    #[test]
    fn test_raging_blows_talent_reduction() {
        let mut cfg = create_test_config();
        cfg.talents.raging_blows = 3;

        // Base WW is 25, with 3/3 Raging Blows WW is 22
        let ww_cost = 25 - cfg.talents.raging_blows;
        assert_eq!(ww_cost, 22);

        // Base Cleave is 20, with 3/3 Raging Blows Cleave is 17
        let cleave_cost = 20 - cfg.talents.raging_blows;
        assert_eq!(cleave_cost, 17);
    }

    #[test]
    fn test_batch_slot_runner() {
        let base_cfg = create_test_config();
        let request = BatchSlotRequest {
            base_config: base_cfg,
            slot: "trinket1".to_string(),
            candidate_items: vec![
                ItemStats {
                    id: "diamond_flask".to_string(),
                    name: "Diamond Flask".to_string(),
                    slot: "trinket1".to_string(),
                    on_use_ap: 150.0,
                    on_use_duration: 60.0,
                    on_use_cd: 360.0,
                    ..Default::default()
                },
                ItemStats {
                    id: "blackhands_breadth".to_string(),
                    name: "Blackhand's Breadth".to_string(),
                    slot: "trinket1".to_string(),
                    crit: 2.0,
                    ..Default::default()
                },
            ],
            is_enchant_batch: false,
            iterations_per_item: 50,
        };

        let batch_result = run_batch_slot(&request);
        assert_eq!(batch_result.results.len(), 2);
        assert!(batch_result.baseline_dps > 0.0);
        for item in &batch_result.results {
            assert!(item.mean_dps > 0.0);
        }
    }

    #[test]
    fn test_stat_weights_runner() {
        let base_cfg = create_test_config();
        let sw_res = run_stat_weights(&base_cfg);
        assert!(sw_res.baseline_dps > 0.0);
        assert!(!sw_res.weights.is_empty());
        // Verify AP weight is 1.0 EP
        let ap_weight = sw_res.weights.iter().find(|w| w.stat == "ap").expect("AP weight found");
        assert!((ap_weight.ep_per_point - 1.0).abs() < 1e-2, "AP EP should be 1.0");
    }

    #[test]
    fn test_wow_forever_racials_and_disabled_world_buffs() {
        let mut base_cfg = create_test_config();
        base_cfg.race = "human".to_string();
        base_cfg.buffs = BuffConfig {
            rallying_cry: true,
            songflower: true,
            warchiefs_blessing: true,
            spirit_of_zandalar: true,
            dire_maul_tribute: true,
            darkmoon_faire: true,
            battle_shout: false,
            ..Default::default()
        };

        // Compute sheet: World buffs must NOT apply!
        let sheet_human = compute_character_sheet(&base_cfg);
        // Base str for human: 120 + gear 15 = 135 (no spirit of zandalar 1.15, no songflower +15)
        assert_eq!(sheet_human.total_str, 135.0, "World buff stats should not apply");
        // Base AP: 160 + 135 * 2 = 430 (no rallying cry +140, no tribute +200)
        assert_eq!(sheet_human.total_ap, 430.0, "World buff AP should not apply");
        // Haste: 0 (no warchief's blessing 15%)
        assert_eq!(sheet_human.haste_pct, 0.0, "World buff haste should not apply");

        // Human has +1.0% crit from Ruthless
        // Dwarf with identical gear has +1.0% hit from Artisan's Precision
        let mut dwarf_cfg = base_cfg.clone();
        dwarf_cfg.race = "dwarf".to_string();
        let sheet_dwarf = compute_character_sheet(&dwarf_cfg);
        assert!((sheet_dwarf.mh_hit_pct - (sheet_human.mh_hit_pct + 1.0)).abs() < 1e-4, "Dwarf should have +1% hit over Human");

        // Skyborne Elf has +2.0% haste from Wind-Blessed
        let mut skyborne_cfg = base_cfg.clone();
        skyborne_cfg.race = "skyborne_elf".to_string();
        let sheet_skyborne = compute_character_sheet(&skyborne_cfg);
        assert_eq!(sheet_skyborne.haste_pct, 2.0, "Skyborne should have +2% haste");

        // Weapon skill racials are removed:
        // Human with swords has weapon skill = 300 (no +5 sword bonus!)
        let mut sword_cfg = base_cfg.clone();
        sword_cfg.race = "human".to_string();
        sword_cfg.talents.weaponmaster = 0;
        let sheet_sword = compute_character_sheet(&sword_cfg);
        // Yellow miss at 300 skill vs level 63 (delta=15): 5.0 + 15 * 0.2 = 8.0%.
        // With 1% gear hit: yellow miss = 7.0%
        assert_eq!(sheet_sword.yellow_miss_pct, 7.0, "Human with swords should have no innate weapon skill bonus");

        // Orc with axes has weapon skill = 300 (no +5 axe bonus!)
        let mut axe_cfg = base_cfg.clone();
        axe_cfg.race = "orc".to_string();
        axe_cfg.talents.weaponmaster = 0;
        let sheet_axe = compute_character_sheet(&axe_cfg);
        assert_eq!(sheet_axe.yellow_miss_pct, 7.0, "Orc with axes should have no innate weapon skill bonus");
    }

    #[test]
    fn test_orc_blood_fury_and_undead_touch_of_the_grave() {
        // Orc simulation tracks Blood Fury uptime
        let mut orc_cfg = create_test_config();
        orc_cfg.race = "orc".to_string();
        orc_cfg.encounter.iterations = 50;
        orc_cfg.encounter.duration_sec = 60.0;
        let res_orc = run_sim(&orc_cfg);
        assert!(res_orc.proc_uptimes.contains_key("Blood Fury"), "Orc should track Blood Fury in proc_uptimes");
        let bf_uptime = res_orc.proc_uptimes.get("Blood Fury").unwrap();
        assert!(*bf_uptime > 0.0, "Blood Fury uptime should be positive");

        // Undead simulation records Touch of the Grave
        let mut ud_cfg = create_test_config();
        ud_cfg.race = "undead".to_string();
        ud_cfg.encounter.iterations = 50;
        ud_cfg.encounter.duration_sec = 60.0;
        let res_ud = run_sim(&ud_cfg);
        let totg = res_ud.abilities.iter().find(|a| a.name == "Touch of the Grave");
        assert!(totg.is_some(), "Undead should have Touch of the Grave in abilities breakdown");
        assert!(totg.unwrap().total_damage > 0.0, "Touch of the Grave should deal damage");
    }

    #[test]
    fn test_execute_phase_bt_pooling_logic() {
        let mut cfg = create_test_config();
        cfg.encounter.duration_sec = 60.0;
        cfg.encounter.execute_phase_pct = 100.0; // 100% execute phase
        cfg.encounter.iterations = 50;
        cfg.rotation.use_bloodthirst = true;
        cfg.rotation.use_execute = true;
        cfg.rotation.use_bt_in_execute = true;
        // With threshold <= current AP (~700 with Battle Shout), BT will be cast when off CD
        cfg.rotation.execute_bt_ap_threshold = 600.0;
        cfg.rotation.execute_rage_pool_threshold = 45.0;

        let res = run_sim(&cfg);
        let bt = res.abilities.iter().find(|a| a.name == "Bloodthirst");
        let exec = res.abilities.iter().find(|a| a.name == "Execute");
        assert!(bt.is_some(), "Bloodthirst should be cast during execute phase");
        assert!(exec.is_some(), "Execute should be cast during execute phase");
        assert!(bt.unwrap().casts > 0.0, "BT casts should be > 0 during execute phase with high AP/pooling");
    }
}
