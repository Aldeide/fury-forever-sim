use std::time::Instant;
use crate::engine::run_sim;
use crate::types::*;

pub fn run_stat_weights(config: &SimConfig) -> StatWeightsResult {
    let start_time = Instant::now();
    let iters = 2500;

    let mut base_cfg = config.clone();
    base_cfg.encounter.iterations = iters;

    let baseline_result = run_sim(&base_cfg);
    let baseline_dps = baseline_result.mean_dps;

    // Deltas to test
    let stats_to_test: [(&str, &str, f64, fn(&mut SimConfig, f64)); 8] = [
        ("ap", "Attack Power", 20.0, |cfg, val| {
            cfg.items.push(ItemStats { ap: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("str", "Strength", 10.0, |cfg, val| {
            cfg.items.push(ItemStats { str: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("agi", "Agility", 10.0, |cfg, val| {
            cfg.items.push(ItemStats { agi: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("crit", "Crit %", 1.0, |cfg, val| {
            cfg.items.push(ItemStats { crit: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("hit", "Hit %", 1.0, |cfg, val| {
            cfg.items.push(ItemStats { hit: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("haste", "Haste %", 1.0, |cfg, val| {
            cfg.items.push(ItemStats { haste: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("weapon_skill", "Weapon Skill", 1.0, |cfg, val| {
            cfg.items.push(ItemStats { weapon_skill: val, slot: "_test".to_string(), ..Default::default() });
        }),
        ("armor_pen", "Armor Penetration", 50.0, |cfg, val| {
            cfg.items.push(ItemStats { armor_pen: val, slot: "_test".to_string(), ..Default::default() });
        }),
    ];

    let mut dps_per_ap = 0.0;
    let mut intermediate_rates: Vec<(&str, &str, f64)> = Vec::new();

    for (stat_key, label, delta_val, apply_fn) in &stats_to_test {
        let mut test_cfg = base_cfg.clone();
        apply_fn(&mut test_cfg, *delta_val);
        let res = run_sim(&test_cfg);
        let delta_dps = res.mean_dps - baseline_dps;
        let dps_per_point = delta_dps / *delta_val;

        if *stat_key == "ap" {
            dps_per_ap = dps_per_point.max(0.01);
        }
        intermediate_rates.push((stat_key, label, dps_per_point));
    }

    let weights: Vec<StatWeightEntry> = intermediate_rates
        .into_iter()
        .map(|(stat, label, dps_per_point)| {
            let ep_per_point = if dps_per_ap > 0.0 {
                dps_per_point / dps_per_ap
            } else {
                0.0
            };
            StatWeightEntry {
                stat: stat.to_string(),
                label: label.to_string(),
                ep_per_point,
                dps_per_point,
            }
        })
        .collect();

    let elapsed_ms = start_time.elapsed().as_secs_f64() * 1000.0;

    StatWeightsResult {
        baseline_dps,
        dps_per_ap,
        elapsed_ms,
        weights,
    }
}
