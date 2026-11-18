import { generatePreloadedPuzzle } from './puzzle-preload-core.js';

self.addEventListener('message', event => {
  const { id, plan } = event.data || {};
  if (!Number.isSafeInteger(id) || !plan) return;
  try {
    const result = generatePreloadedPuzzle(plan);
    self.postMessage({ id, ...result });
  } catch (error) {
    self.postMessage({ id, planKey: plan.key, error: String(error?.message || error) });
  }
});
