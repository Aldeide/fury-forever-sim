use std::time::Instant;
use crate::engine::run_sim;
use crate::stats::compute_character_sheet;
use crate::types::*;

pub fn run_batch_slot(request: &BatchSlotRequest) -> BatchSlotResult {
    let start_time = Instant::now();
    let iters = if request.iterations_per_item > 0 {
        request.iterations_per_item
    } else {
        2000
    };

    let mut baseline_cfg = request.base_config.clone();
    baseline_cfg.encounter.iterations = iters;

    let baseline_result = run_sim(&baseline_cfg);
    let baseline_dps = baseline_result.mean_dps;

    let mut results: Vec<BatchItemResult> = Vec::with_capacity(request.candidate_items.len());

    for item in &request.candidate_items {
        let mut test_cfg = baseline_cfg.clone();
        if request.is_enchant_batch {
            // Replace or add enchant for this slot
            test_cfg.enchants.retain(|e| !e.slot.eq_ignore_ascii_case(&request.slot));
            let mut ench = item.clone();
            ench.slot = request.slot.clone();
            test_cfg.enchants.push(ench);
        } else {
            // Replace or add item for this slot
            test_cfg.items.retain(|i| !i.slot.eq_ignore_ascii_case(&request.slot));
            let mut itm = item.clone();
            itm.slot = request.slot.clone();
            test_cfg.items.push(itm);
        }

        let item_sheet = compute_character_sheet(&test_cfg);
        let sim_res = run_sim(&test_cfg);
        let delta_dps = sim_res.mean_dps - baseline_dps;

        results.push(BatchItemResult {
            item_id: item.id.clone(),
            item_name: item.name.clone(),
            mean_dps: sim_res.mean_dps,
            delta_dps,
            error_margin: sim_res.error_margin,
            mh_crit_cap: item_sheet.mh_crit_cap,
            oh_white_miss_pct: item_sheet.oh_white_miss_pct,
        });
    }

    results.sort_by(|a, b| b.mean_dps.partial_cmp(&a.mean_dps).unwrap_or(std::cmp::Ordering::Equal));
    let elapsed_ms = start_time.elapsed().as_secs_f64() * 1000.0;

    BatchSlotResult {
        baseline_dps,
        elapsed_ms,
        results,
    }
}
