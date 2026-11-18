/** Format elapsed wall-clock milliseconds for the completion summary. */
export function formatElapsedTime(durationMs) {
  const safeMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const two = value => String(value).padStart(2, '0');
  return hours > 0
    ? `${two(hours)}h ${two(minutes)}m ${two(seconds)}s`
    : `${two(totalMinutes)}m ${two(seconds)}s`;
}

/** Reuse a valid persisted start time or begin a fresh attempt now. */
export function restoreLevelStartTime(savedPuzzle, now = Date.now()) {
  if (Number.isSafeInteger(savedPuzzle?.startedAtMs) && savedPuzzle.startedAtMs > 0 && savedPuzzle.startedAtMs <= now) {
    return savedPuzzle.startedAtMs;
  }
  return now;
}


/**
 * First support prompt appears after level five. Later prompts are spaced by
 * deterministic pseudo-random intervals of four to eight completed levels,
 * keyed to the player's persistent journey seed.
 */
export function shouldShowKofiPrompt(level, journeySeed) {
  if (!Number.isSafeInteger(level) || level < 5 || typeof journeySeed !== 'string' || journeySeed.length < 8) return false;
  let state = 2166136261;
  for (let i = 0; i < journeySeed.length; i++) state = Math.imul(state ^ journeySeed.charCodeAt(i), 16777619) >>> 0;
  let next = 5;
  while (next < level) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    next += 4 + ((state >>> 0) % 5);
  }
  return next === level;
}
