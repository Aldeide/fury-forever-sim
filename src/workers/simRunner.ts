import {
  SimConfig,
  SimResult,
  BatchSlotRequest,
  BatchSlotResult,
  StatWeightsResult,
  CharacterSheetSummary,
  ItemStats,
} from '../types/sim';
import { calculateCharacterSheet, simulateCombat, runBatchSlotTs, runStatWeightsTs } from './simEngineTs';

// Check if running inside Tauri Native Desktop App
function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__);
}

/**
 * Worker Pool Manager for Multi-Core Web Worker batch execution
 */
class WorkerPool {
  private workers: Worker[] = [];
  private currentWorkerIdx = 0;
  private messageCounter = 0;
  private isInitialized = false;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    const coreCount = Math.max(2, Math.min(16, navigator.hardwareConcurrency || 4));

    for (let i = 0; i < coreCount; i++) {
      try {
        const worker = new Worker(new URL('./simWorker.ts', import.meta.url), {
          type: 'module',
        });
        this.workers.push(worker);
      } catch (err) {
        console.warn('Worker instantiation fallback:', err);
      }
    }
    this.isInitialized = true;
  }

  public getWorker(): Worker | null {
    if (!this.isInitialized) this.init();
    if (this.workers.length === 0) return null;
    const worker = this.workers[this.currentWorkerIdx];
    this.currentWorkerIdx = (this.currentWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  public getNextId(): string {
    return `req_${++this.messageCounter}_${Date.now()}`;
  }
}

const pool = new WorkerPool();

/**
 * Run a single full simulation run
 */
export async function runSimulation(
  config: SimConfig,
  iterations = 2500,
  onProgress?: (pct: number) => void
): Promise<SimResult> {
  // 1. Tauri Native IPC if in Desktop App
  if (isTauriEnvironment()) {
    try {
      const { invoke } = (window as any).__TAURI__.tauri || (window as any).__TAURI__.core;
      const res = await invoke('run_sim', { config, iterations });
      if (res) return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (e) {
      console.warn('Tauri invoke fallback to local worker:', e);
    }
  }

  // 2. Web Worker with WASM or TS
  const worker = pool.getWorker();
  if (worker) {
    return new Promise((resolve, reject) => {
      const reqId = pool.getNextId();

      const handler = (e: MessageEvent) => {
        const { id, type, payload, error } = e.data;
        if (id !== reqId) return;

        if (type === 'SIMULATE_RESULT') {
          worker.removeEventListener('message', handler);
          resolve(payload);
        } else if (type === 'ERROR') {
          worker.removeEventListener('message', handler);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({
        id: reqId,
        type: 'SIMULATE',
        payload: { config, iterations },
      });
    });
  }

  // 3. Direct synchronous engine fallback
  if (onProgress) onProgress(100);
  return simulateCombat(config, iterations);
}

/**
 * Run batch item evaluations for an equipment slot
 */
export async function runBatchSlot(
  request: BatchSlotRequest,
  allItems: Record<string, ItemStats>,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchSlotResult> {
  // 1. Tauri Native IPC
  if (isTauriEnvironment()) {
    try {
      const { invoke } = (window as any).__TAURI__.tauri || (window as any).__TAURI__.core;
      const res = await invoke('run_batch_slot', { request, allItems });
      if (res) return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (e) {
      console.warn('Tauri batch slot fallback to local worker:', e);
    }
  }

  // 2. Web Worker Pool
  const worker = pool.getWorker();
  if (worker) {
    return new Promise((resolve, reject) => {
      const reqId = pool.getNextId();

      const handler = (e: MessageEvent) => {
        const { id, type, payload, error } = e.data;
        if (id !== reqId) return;

        if (type === 'PROGRESS') {
          if (onProgress) onProgress(payload.completed, payload.total);
        } else if (type === 'BATCH_SLOT_RESULT') {
          worker.removeEventListener('message', handler);
          resolve(payload);
        } else if (type === 'ERROR') {
          worker.removeEventListener('message', handler);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({
        id: reqId,
        type: 'BATCH_SLOT',
        payload: { request, allItems },
      });
    });
  }

  // 3. Fallback direct TS engine
  return runBatchSlotTs(request, allItems, onProgress);
}

/**
 * Run Stat Weights (EP) evaluation
 */
export async function runStatWeights(
  config: SimConfig,
  iterations = 1500,
  onProgress?: (completed: number, total: number) => void
): Promise<StatWeightsResult> {
  // 1. Tauri Native IPC
  if (isTauriEnvironment()) {
    try {
      const { invoke } = (window as any).__TAURI__.tauri || (window as any).__TAURI__.core;
      const res = await invoke('run_stat_weights', { config, iterations });
      if (res) return typeof res === 'string' ? JSON.parse(res) : res;
    } catch (e) {
      console.warn('Tauri stat weights fallback to local worker:', e);
    }
  }

  // 2. Web Worker
  const worker = pool.getWorker();
  if (worker) {
    return new Promise((resolve, reject) => {
      const reqId = pool.getNextId();

      const handler = (e: MessageEvent) => {
        const { id, type, payload, error } = e.data;
        if (id !== reqId) return;

        if (type === 'PROGRESS') {
          if (onProgress) onProgress(payload.completed, payload.total);
        } else if (type === 'STAT_WEIGHTS_RESULT') {
          worker.removeEventListener('message', handler);
          resolve(payload);
        } else if (type === 'ERROR') {
          worker.removeEventListener('message', handler);
          reject(new Error(error));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({
        id: reqId,
        type: 'STAT_WEIGHTS',
        payload: { config, iterations },
      });
    });
  }

  // 3. Fallback direct TS engine
  return runStatWeightsTs(config, iterations, onProgress);
}

export { calculateCharacterSheet };
