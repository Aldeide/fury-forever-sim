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
        // Dual-Wield OH Normal Hit: speed * 1.73
        let expected_oh_norm = 1.8 * 1.73;
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
}
