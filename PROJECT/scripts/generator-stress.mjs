import { generateEasyPuzzle, countSolutions } from '../web-port/nonogram.js';

const levels = [1, 2, 4, 5, 8, 9, 12, 20, 40, 80, 120, 240, 500, 1_000, 10_000, 100_000, 1_000_000];
const samplesPerLevel = 20;
let total = 0;
let maxAttempts = 0;
let worst = null;
const failures = [];
const startedAt = Date.now();

for (const level of levels) {
  for (let sample = 0; sample < samplesPerLevel; sample++) {
    const seed = (0x51f15e + Math.imul(level, 0x9e3779b1) + sample * 7919) >>> 0;
    try {
      const puzzle = generateEasyPuzzle({ level, seed, maxAttempts: 500 });
      const count = countSolutions(puzzle.clues, puzzle.height, puzzle.width, 2);
      if (count !== 1) failures.push(`Non-unique puzzle: level=${level}, seed=${seed}, count=${count}`);
      total++;
      if (puzzle.attempts > maxAttempts) {
        maxAttempts = puzzle.attempts;
        worst = { level, seed, attempts: puzzle.attempts };
      }
    } catch (error) {
      failures.push(`Generation failed: level=${level}, seed=${seed}, ${error.message}`);
    }
  }
}

const report = {
  levels,
  samplesPerLevel,
  total,
  generationFailures: failures.filter(value => value.startsWith('Generation failed')).length,
  failures,
  maxAttempts,
  worst,
  elapsedMs: Date.now() - startedAt
};
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
