import { generateEasyPuzzle, countSolutions, puzzleFingerprint } from '../web-port/nonogram.js';

const target = 2000;
const fingerprints = new Set();
const recent = [];
const sizeCounts = new Map();
let failures = 0;
let maxAttempts = 0;
let totalCells = 0;
let densityTotal = 0;
let minDensity = 1;
let maxDensity = 0;
let totalClueRuns = 0;
let minClueRuns = Infinity;
let maxClueRuns = 0;
const started = Date.now();
for (let level = 1; level <= target; level++) {
  const seed = (0x51f15e + Math.imul(level, 0x9e3779b1)) >>> 0;
  try {
    const puzzle = generateEasyPuzzle({ level, seed, avoidFingerprints: recent });
    const fingerprint = puzzleFingerprint(puzzle.solution);
    const filled = puzzle.solution.flat().filter(Boolean).length;
    const density = filled / (puzzle.width * puzzle.height);
    const clueRuns = [...puzzle.clues.rows, ...puzzle.clues.columns]
      .reduce((sum, clue) => sum + (clue[0] === 0 ? 0 : clue.length), 0);
    if (puzzle.level !== level || puzzle.difficulty !== 'easy' ||
        puzzle.width < 5 || puzzle.width > 7 || puzzle.height !== puzzle.width ||
        countSolutions(puzzle.clues, puzzle.height, puzzle.width, 2) !== 1 || fingerprint !== puzzle.fingerprint) {
      failures++;
      continue;
    }
    if (fingerprints.has(fingerprint)) failures++;
    fingerprints.add(fingerprint);
    recent.push(fingerprint);
    sizeCounts.set(`${puzzle.width}x${puzzle.height}`, (sizeCounts.get(`${puzzle.width}x${puzzle.height}`) || 0) + 1);
    maxAttempts = Math.max(maxAttempts, puzzle.attempts);
    totalCells += puzzle.width * puzzle.height;
    densityTotal += density;
    minDensity = Math.min(minDensity, density);
    maxDensity = Math.max(maxDensity, density);
    totalClueRuns += clueRuns;
    minClueRuns = Math.min(minClueRuns, clueRuns);
    maxClueRuns = Math.max(maxClueRuns, clueRuns);
  } catch (error) {
    failures++;
    process.stderr.write(`Level ${level}: ${error.message}\n`);
  }
}
const report = {
  requestedLevels: target,
  generated: target - failures,
  failures,
  uniqueSolutionFingerprints: fingerprints.size,
  recentFingerprintWindow: recent.length,
  gridSizes: Object.fromEntries([...sizeCounts.entries()].sort((a, b) => Number(a[0].split('x')[0]) - Number(b[0].split('x')[0]))),
  maxAttempts,
  density: { min: minDensity, average: densityTotal / target, max: maxDensity },
  clueRunsAcrossTenLines: { min: minClueRuns, average: totalClueRuns / target, max: maxClueRuns },
  totalCellsGenerated: totalCells,
  allTimeUniqueFingerprints: fingerprints.size,
  elapsedMs: Date.now() - started
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures) process.exitCode = 1;
