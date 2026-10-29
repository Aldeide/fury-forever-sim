use wasm_bindgen::prelude::*;
use sim_core::types::*;
use sim_core::{compute_character_sheet, run_sim, run_batch_slot, run_stat_weights};

#[wasm_bindgen]
pub fn compute_sheet_json(config_json: &str) -> String {
    match serde_json::from_str::<SimConfig>(config_json) {
        Ok(config) => {
            let sheet = compute_character_sheet(&config);
            serde_json::to_string(&sheet).unwrap_or_else(|e| format!("{{\"error\":\"{}\"}}", e))
        }
        Err(e) => format!("{{\"error\":\"Failed to parse SimConfig: {}\"}}", e),
    }
}

#[wasm_bindgen]
pub fn run_sim_json(config_json: &str) -> String {
    match serde_json::from_str::<SimConfig>(config_json) {
        Ok(config) => {
            let result = run_sim(&config);
            serde_json::to_string(&result).unwrap_or_else(|e| format!("{{\"error\":\"{}\"}}", e))
        }
        Err(e) => format!("{{\"error\":\"Failed to parse SimConfig: {}\"}}", e),
    }
}

#[wasm_bindgen]
pub fn run_batch_slot_json(request_json: &str) -> String {
    match serde_json::from_str::<BatchSlotRequest>(request_json) {
        Ok(request) => {
            let result = run_batch_slot(&request);
            serde_json::to_string(&result).unwrap_or_else(|e| format!("{{\"error\":\"{}\"}}", e))
        }
        Err(e) => format!("{{\"error\":\"Failed to parse BatchSlotRequest: {}\"}}", e),
    }
}

#[wasm_bindgen]
pub fn run_stat_weights_json(config_json: &str) -> String {
    match serde_json::from_str::<SimConfig>(config_json) {
        Ok(config) => {
            let result = run_stat_weights(&config);
            serde_json::to_string(&result).unwrap_or_else(|e| format!("{{\"error\":\"{}\"}}", e))
        }
        Err(e) => format!("{{\"error\":\"Failed to parse SimConfig: {}\"}}", e),
    }
}
