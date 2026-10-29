// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sim_core::types::*;
use sim_core::{compute_character_sheet, run_batch_slot, run_sim, run_stat_weights};

#[tauri::command]
fn compute_sheet_native(config: SimConfig) -> Result<CharacterSheetSummary, String> {
    Ok(compute_character_sheet(&config))
}

#[tauri::command]
fn run_sim_native(config: SimConfig) -> Result<SimResult, String> {
    Ok(run_sim(&config))
}

#[tauri::command]
fn run_batch_slot_native(request: BatchSlotRequest) -> Result<BatchSlotResult, String> {
    Ok(run_batch_slot(&request))
}

#[tauri::command]
fn run_stat_weights_native(config: SimConfig) -> Result<StatWeightsResult, String> {
    Ok(run_stat_weights(&config))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            compute_sheet_native,
            run_sim_native,
            run_batch_slot_native,
            run_stat_weights_native
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
