/*
 * PrasannaOne Nonogram core - independent implementation.
 * No original game code, assets, level data, or branding is used.
 * Grid format: solution[row][column] is boolean.
 */

export const DIFFICULTY_GRID_SIZES = Object.freeze({
  easy: Object.freeze([5, 6, 7]),
  normal: Object.freeze([7, 8, 9]),
  hard: Object.freeze([10, 11, 12])
});
export const DIFFICULTIES = Object.freeze(['easy', 'normal', 'hard']);
export const EASY_GRID_SIZES = DIFFICULTY_GRID_SIZES.easy; // Backwards-compatible export.
export const LEGACY_EASY_GRID_SIZES = Object.freeze([5, 6, 7, 8, 9, 10]);
export const EASY_LEVEL_BATCH_SIZE = 10;

export function createRng(seed = Date.now()) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function calculateLineClues(line) {
  const clues = [];
  let run = 0;
  for (const filled of line) {
    if (filled) run++;
    else if (run) { clues.push(run); run = 0; }
  }
  if (run) clues.push(run);
  return clues.length ? clues : [0];
}

export function calculateClues(solution) {
  const rows = solution.map(calculateLineClues);
  const width = solution[0]?.length ?? 0;
  const columns = Array.from({ length: width }, (_, c) =>
    calculateLineClues(solution.map(row => row[c]))
  );
  return { rows, columns };
}

export function validateSolution(solution) {
  if (!Array.isArray(solution) || solution.length < 1 || solution.length > 12) return false;
  const width = solution[0]?.length;
  if (!Number.isInteger(width) || width < 1 || width > 12) return false;
  return solution.every(row => Array.isArray(row) && row.length === width && row.every(v => typeof v === 'boolean'));
}

function matchesClues(line, clues) {
  const actual = calculateLineClues(line);
  return actual.length === clues.length && actual.every((n, i) => n === clues[i]);
}

function prefixCanMatch(linePrefix, targetClues) {
  let clueIndex = 0;
  let run = 0;
  for (const bit of linePrefix) {
    if (bit) {
      if (clueIndex >= targetClues.length || targetClues[clueIndex] === 0) return false;
      run++;
      if (run > targetClues[clueIndex]) return false;
    } else if (run) {
      if (run !== targetClues[clueIndex]) return false;
      clueIndex++;
      run = 0;
    }
  }
  return true;
}

function rowMasks(width, clues) {
  const out = [];
  const limit = 1 << width;
  for (let mask = 0; mask < limit; mask++) {
    const row = Array.from({ length: width }, (_, c) => Boolean(mask & (1 << c)));
    if (matchesClues(row, clues)) out.push(row);
  }
  return out;
}

// Counts up to `limit`; useful for uniqueness validation on small/easy boards.
export function countSolutions(clues, height, width, limit = 2) {
  const validClueLine = line => Array.isArray(line) && line.length > 0 &&
    line.every(n => Number.isInteger(n) && n >= 0 && n <= width) &&
    (line.length === 1 ? true : line.every(n => n > 0));
  if (!Number.isInteger(height) || height < 1 || height > 12 ||
      !Number.isInteger(width) || width < 1 || width > 12 ||
      !Number.isSafeInteger(limit) || limit < 1 ||
      !clues || !Array.isArray(clues.rows) || !Array.isArray(clues.columns) ||
      clues.rows.length !== height || clues.columns.length !== width ||
      !clues.rows.every(validClueLine) || !clues.columns.every(validClueLine)) return 0;
  const candidates = clues.rows.map(rowClue => rowMasks(width, rowClue));
  if (candidates.some(rows => rows.length === 0)) return 0;
  const chosen = [];
  let count = 0;
  function visit(r) {
    if (count >= limit) return;
    if (r === height) {
      for (let c = 0; c < width; c++) {
        if (!matchesClues(chosen.map(row => row[c]), clues.columns[c])) return;
      }
      count++;
      return;
    }
    for (const candidate of candidates[r]) {
      chosen.push(candidate);
      let valid = true;
      for (let c = 0; c < width; c++) {
        if (!prefixCanMatch(chosen.map(row => row[c]), clues.columns[c])) { valid = false; break; }
      }
      if (valid) visit(r + 1);
      chosen.pop();
      if (count >= limit) return;
    }
  }
  visit(0);
  return count;
}

function hasFilledLine(solution) {
  const { rows, columns } = calculateClues(solution);
  return rows.every(clue => clue[0] !== 0) && columns.every(clue => clue[0] !== 0);
}

/** Stable compact identity for repetition checks; stores no puzzle content. */
export function puzzleFingerprint(solution) {
  if (!validateSolution(solution)) throw new TypeError('A valid solution is required.');
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (const row of solution) for (const value of row) {
    hash ^= BigInt(value ? 49 : 48);
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, '0');
}

/** Deterministic size bag: each configured size appears once before a refill. */
function makeSizeSchedule(level, sizes, modeSalt = 0) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Level must be a positive safe integer within the supported range.');
  }
  const batchIndex = Math.floor((level - 1) / EASY_LEVEL_BATCH_SIZE);
  const slot = (level - 1) % EASY_LEVEL_BATCH_SIZE;
  const batchSeed = (0x6a09e667 ^ modeSalt ^ Math.imul(batchIndex + 1, 0x9e3779b1)) >>> 0;
  const rng = createRng(batchSeed);
  const schedule = [];
  while (schedule.length < EASY_LEVEL_BATCH_SIZE) {
    const bag = [...sizes];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    schedule.push(...bag.slice(0, EASY_LEVEL_BATCH_SIZE - schedule.length));
  }
  return schedule[slot];
}

const MODE_SALTS = Object.freeze({ easy: 0x13579bdf, normal: 0x2468ace0, hard: 0x10293847 });

export function getGridSizeForLevel(level, difficulty = 'easy') {
  if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('Difficulty must be easy, normal, or hard.');
  return makeSizeSchedule(level, DIFFICULTY_GRID_SIZES[difficulty], MODE_SALTS[difficulty]);
}

/** Reproduces the pre-v40 Easy schedule only to resume existing unfinished saves safely. */
export function getLegacyEasyGridSizeForLevel(level) {
  return makeSizeSchedule(level, LEGACY_EASY_GRID_SIZES, 0);
}

export function getPointsForGridSize(size) {
  if (!Number.isInteger(size) || size < 1 || size > 12) {
    throw new RangeError('Grid size must be an integer from 1 to 12.');
  }
  return size * 30;
}

function hasUsefulVariety(solution, minimumRunCount = 12) {
  const { rows, columns } = calculateClues(solution);
  const density = solution.flat().filter(Boolean).length / (solution.length * solution[0].length);
  const rowPatterns = new Set(solution.map(row => row.map(Number).join('')));
  const columnPatterns = new Set(columns.map(clue => clue.join(',')));
  const runCount = [...rows, ...columns].reduce((sum, clue) => sum + (clue[0] === 0 ? 0 : clue.length), 0);
  return density >= 0.28 && density <= 0.60 &&
    rowPatterns.size >= 3 && columnPatterns.size >= 3 && runCount >= minimumRunCount;
}

function generatePuzzleAtSize({ level, seed, size, difficulty, maxAttempts, avoidFingerprints, minimumRunCount = Math.min(12, size * 2) }) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Level must be a positive safe integer within the supported range.');
  }
  if (!Number.isSafeInteger(seed)) throw new TypeError('Seed must be a safe integer.');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10_000) {
    throw new RangeError('maxAttempts must be an integer from 1 to 10000.');
  }
  if (!Number.isInteger(size) || size < 5 || size > 12) throw new RangeError('Grid size must be between 5 and 12.');
  if (!Array.isArray(avoidFingerprints) || avoidFingerprints.some(value => typeof value !== 'string')) {
    throw new TypeError('avoidFingerprints must be an array of strings.');
  }
  const recent = new Set(avoidFingerprints);
  const rng = createRng(seed);
  const minDensity = 0.28;
  const maxDensity = 0.60;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const density = minDensity + rng() * (maxDensity - minDensity);
    const solution = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rng() < density)
    );
    if (!hasFilledLine(solution) || !hasUsefulVariety(solution, minimumRunCount)) continue;
    const fingerprint = puzzleFingerprint(solution);
    if (recent.has(fingerprint)) continue;
    const clues = calculateClues(solution);
    if (countSolutions(clues, size, size, 2) === 1) {
      return {
        id: `${difficulty}-${level}-${Number(seed) >>> 0}-${attempt}`,
        level,
        difficulty,
        width: size,
        height: size,
        points: getPointsForGridSize(size),
        clues,
        solution,
        fingerprint,
        attempts: attempt + 1
      };
    }
  }
  throw new Error(`Could not generate a fresh unique ${difficulty} puzzle at ${size}x${size} after ${maxAttempts} attempts; try another seed or clear the recent-fingerprint window.`);
}

export function generatePuzzle({ difficulty = 'easy', level = 1, seed = Date.now(), maxAttempts = 500, avoidFingerprints = [] } = {}) {
  if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('Difficulty must be easy, normal, or hard.');
  const size = getGridSizeForLevel(level, difficulty);
  return generatePuzzleAtSize({ level, seed, size, difficulty, maxAttempts, avoidFingerprints });
}

/** Compatibility entry point retained for older imports and tests. */
export function generateEasyPuzzle(options = {}) {
  return generatePuzzle({ ...options, difficulty: 'easy' });
}

/** Legacy generation is used only to resume a v4 Easy save's unfinished puzzle. */
export function generateLegacyEasyPuzzle({ level = 1, seed = Date.now(), maxAttempts = 500, avoidFingerprints = [] } = {}) {
  const size = getLegacyEasyGridSizeForLevel(level);
  return generatePuzzleAtSize({ level, seed, size, difficulty: 'easy', maxAttempts, avoidFingerprints, minimumRunCount: 12 });
}

export function isSolved(current, solution) {
  return validateSolution(current) && validateSolution(solution) &&
    current.length === solution.length && current.every((row, r) =>
      row.every((value, c) => value === solution[r][c])
    );
}
