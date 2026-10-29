import { simulateCombat, runBatchSlotTs, runStatWeightsTs } from './simEngineTs';
import { SimConfig, BatchSlotRequest, ItemStats } from '../types/sim';

// Optional WASM module instance cache
let wasmModule: any = null;

async function tryLoadWasm() {
  if (wasmModule) return wasmModule;
  try {
    // Dynamic import to allow pure TS fallback if WASM is not yet built
    // @ts-ignore
    const wasm = await import('../wasm-pkg/sim_wasm.js');
    if (wasm && wasm.default) {
      await wasm.default();
      wasmModule = wasm;
    }
  } catch (e) {
    // WASM not built yet or not supported in this context; use pure TS engine
    wasmModule = null;
  }
  return wasmModule;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { id, type, payload } = e.data;

  try {
    if (type === 'INIT_WASM') {
      const wasm = await tryLoadWasm();
      self.postMessage({ id, success: true, hasWasm: !!wasm });
      return;
    }

    if (type === 'SIMULATE') {
      const { config, iterations } = payload as { config: SimConfig; iterations?: number };
      const result = simulateCombat(config, iterations || 2000);
      self.postMessage({ id, type: 'SIMULATE_RESULT', payload: result });
      return;
    }

    if (type === 'BATCH_SLOT') {
      const { request, allItems } = payload as {
        request: BatchSlotRequest;
        allItems: Record<string, ItemStats>;
      };

      const result = runBatchSlotTs(request, allItems, (completed, total) => {
        self.postMessage({
          id,
          type: 'PROGRESS',
          payload: { completed, total, pct: Math.round((completed / total) * 100) },
        });
      });

      self.postMessage({ id, type: 'BATCH_SLOT_RESULT', payload: result });
      return;
    }

    if (type === 'STAT_WEIGHTS') {
      const { config, iterations } = payload as { config: SimConfig; iterations?: number };

      const result = runStatWeightsTs(config, iterations || 1500, (completed, total) => {
        self.postMessage({
          id,
          type: 'PROGRESS',
          payload: { completed, total, pct: Math.round((completed / total) * 100) },
        });
      });

      self.postMessage({ id, type: 'STAT_WEIGHTS_RESULT', payload: result });
      return;
    }
  } catch (err: any) {
    self.postMessage({ id, type: 'ERROR', error: err?.message || String(err) });
  }
});
