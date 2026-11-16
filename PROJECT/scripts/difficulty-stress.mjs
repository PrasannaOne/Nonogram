import { generatePuzzle, countSolutions, DIFFICULTY_GRID_SIZES } from '../web-port/nonogram.js';

const modes = ['easy', 'normal', 'hard'];
const samplesPerMode = 20;
const failures = [];
const maxima = {};
let total = 0;
const started = Date.now();

for (const mode of modes) {
  maxima[mode] = { attempts: 0, largestSize: 0, samples: 0 };
  for (let sample = 0; sample < samplesPerMode; sample++) {
    const level = sample + 1;
    const seed = (0x71a93d ^ Math.imul(level, 0x9e3779b1) ^ (mode === 'easy' ? 0x13579bdf : mode === 'normal' ? 0x2468ace0 : 0x10293847)) >>> 0;
    try {
      const puzzle = generatePuzzle({ difficulty: mode, level, seed, maxAttempts: 1000 });
      const solutions = countSolutions(puzzle.clues, puzzle.height, puzzle.width, 2);
      if (solutions !== 1) failures.push(`${mode} L${level}: expected 1 solution, got ${solutions}`);
      if (!DIFFICULTY_GRID_SIZES[mode].includes(puzzle.width)) failures.push(`${mode} L${level}: unexpected size ${puzzle.width}`);
      if (puzzle.width !== puzzle.height) failures.push(`${mode} L${level}: non-square board`);
      maxima[mode].attempts = Math.max(maxima[mode].attempts, puzzle.attempts);
      maxima[mode].largestSize = Math.max(maxima[mode].largestSize, puzzle.width);
      maxima[mode].samples++;
      total++;
    } catch (error) {
      failures.push(`${mode} L${level}: ${error.message}`);
    }
  }
}

const report = { samplesPerMode, total, modes: maxima, failures, elapsedMs: Date.now() - started };
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
