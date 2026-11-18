/**
 * One-puzzle look-ahead coordinator. Generation runs in a dedicated worker;
 * only a result matching the currently requested deterministic plan is kept.
 * The active game always retains its synchronous, validated generation path.
 */
export function createPreloadPlan({ level, difficulty, journeySeed, recentFingerprints = [] } = {}) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Preloaded level must be a positive supported level.');
  }
  if (!['easy', 'normal', 'hard'].includes(difficulty)) {
    throw new RangeError('Preloaded difficulty must be easy, normal or hard.');
  }
  if (typeof journeySeed !== 'string' || !/^[a-f0-9]{32}$/i.test(journeySeed)) {
    throw new TypeError('A valid persistent journey seed is required for preloading.');
  }
  if (!Array.isArray(recentFingerprints) || recentFingerprints.some(value => typeof value !== 'string')) {
    throw new TypeError('Recent puzzle fingerprints must be an array of strings.');
  }
  const seed = `${journeySeed}:puzzle:${difficulty}:${level}`;
  const avoidFingerprints = [...recentFingerprints];
  const key = JSON.stringify([level, difficulty, journeySeed, seed, avoidFingerprints]);
  return Object.freeze({ key, level, difficulty, journeySeed, seed, avoidFingerprints });
}

export function createPuzzlePreloader(workerFactory) {
  let worker = null;
  let unavailable = typeof workerFactory !== 'function';
  let sequence = 0;
  let pending = null;
  let ready = null;
  let disposed = false;

  function clearWorker() {
    try { worker?.terminate?.(); } catch { /* worker is already gone */ }
    worker = null;
  }

  function disable() {
    unavailable = true;
    pending = null;
    ready = null;
    clearWorker();
  }

  function onMessage(event) {
    const message = event?.data;
    if (!pending || message?.id !== pending.id) return;
    const expectedKey = pending.key;
    pending = null;
    if (message?.planKey !== expectedKey || !message?.puzzle ||
        message.puzzle.level !== message.level || typeof message.seed !== 'string') return;
    ready = { key: expectedKey, generated: message.puzzle, seed: message.seed };
  }

  function ensureWorker() {
    if (disposed || unavailable) return null;
    if (worker) return worker;
    try {
      worker = workerFactory();
      if (!worker || typeof worker.postMessage !== 'function' || typeof worker.addEventListener !== 'function') {
        disable();
        return null;
      }
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', disable);
      worker.addEventListener('messageerror', disable);
      return worker;
    } catch {
      disable();
      return null;
    }
  }

  return Object.freeze({
    request(plan) {
      if (!plan || typeof plan.key !== 'string' || disposed || unavailable) return false;
      if (ready?.key === plan.key || pending?.key === plan.key) return true;
      const activeWorker = ensureWorker();
      if (!activeWorker) return false;
      const id = ++sequence;
      pending = { id, key: plan.key };
      ready = null;
      try {
        activeWorker.postMessage({ id, plan });
        return true;
      } catch {
        disable();
        return false;
      }
    },
    take(key) {
      if (!ready || ready.key !== key) return null;
      const result = ready;
      ready = null;
      return { generated: result.generated, seed: result.seed };
    },
    invalidate() {
      sequence++;
      pending = null;
      ready = null;
    },
    dispose() {
      disposed = true;
      pending = null;
      ready = null;
      clearWorker();
    },
    getState() {
      return Object.freeze({ pending: Boolean(pending), ready: Boolean(ready), unavailable, disposed });
    }
  });
}
