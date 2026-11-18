/** Shared deterministic generation path used only by the puzzle worker. */
import { generatePuzzle } from './nonogram.js';

export function generatePreloadedPuzzle(plan) {
  if (!plan || typeof plan.key !== 'string' || !Number.isSafeInteger(plan.level) ||
      !['easy', 'normal', 'hard'].includes(plan.difficulty) ||
      typeof plan.seed !== 'string' || typeof plan.journeySeed !== 'string' ||
      !Array.isArray(plan.avoidFingerprints)) {
    throw new TypeError('Invalid next-level preload plan.');
  }
  const options = {
    level: plan.level,
    seed: plan.seed,
    difficulty: plan.difficulty,
    journeySeed: plan.journeySeed,
    avoidFingerprints: plan.avoidFingerprints
  };
  try {
    const puzzle = generatePuzzle({ ...options, maxAttempts: 500 });
    return { planKey: plan.key, level: plan.level, seed: plan.seed, puzzle };
  } catch (firstError) {
    const retrySeed = `${plan.seed}:retry1`;
    try {
      const puzzle = generatePuzzle({ ...options, seed: retrySeed, maxAttempts: 1000 });
      return { planKey: plan.key, level: plan.level, seed: retrySeed, puzzle };
    } catch (retryError) {
      throw new Error(`Background generation failed for level ${plan.level}: ${retryError.message}`, { cause: firstError });
    }
  }
}
