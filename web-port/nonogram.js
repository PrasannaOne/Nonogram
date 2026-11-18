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

function cyrb128(text) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

function sfc32(a, b, c, d) {
  return () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function isValidSeed(seed) {
  return Number.isSafeInteger(seed) ||
    (typeof seed === 'string' && seed.length >= 8 && seed.length <= 180 && /^[a-zA-Z0-9:_-]+$/.test(seed));
}

export function createRng(seed = Date.now()) {
  // New player journeys use namespaced 128-bit random IDs. String seeds feed a
  // four-word PRNG so the whole player seed, not merely a 32-bit slice, matters.
  if (typeof seed === 'string') {
    if (!isValidSeed(seed)) throw new TypeError('String seed must be 8-180 safe characters.');
    return sfc32(...cyrb128(seed));
  }
  if (!Number.isSafeInteger(seed)) throw new TypeError('Seed must be a safe integer or a valid string.');
  // Preserve the established numeric PRNG stream for existing v1-v54 saves.
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

function lineMasks(length, clues) {
  if (clues.length === 1 && clues[0] === 0) return [0];
  const runs = clues;
  const suffixCells = Array(runs.length + 1).fill(0);
  for (let i = runs.length - 1; i >= 0; i--) suffixCells[i] = suffixCells[i + 1] + runs[i];
  const out = [];
  function place(index, earliest, mask) {
    if (index === runs.length) { out.push(mask); return; }
    const remainingRuns = runs.length - index;
    const minimumTail = suffixCells[index] + remainingRuns - 1;
    const latestStart = length - minimumTail;
    for (let start = earliest; start <= latestStart; start++) {
      const runMask = ((1 << runs[index]) - 1) << start;
      place(index + 1, start + runs[index] + 1, mask | runMask);
    }
  }
  place(0, 0, 0);
  return out;
}

// Counts up to `limit`. Line placements are generated directly from run clues,
// and column-prefix possibilities are indexed once. This avoids scanning every
// 2^width row mask and allocating temporary arrays at every recursion node.
/**
 * Deterministic, deduction-only Nonogram solver.
 * Cell state: -1 unknown, 0 empty, 1 filled. It never branches or guesses.
 * A line's candidate placements are filtered by known cells; cells shared by
 * every remaining placement become forced. Rows and columns repeat to a fixed
 * point. A stalled board is explicitly not logically solvable.
 */
export function solveLogically(clues, height, width) {
  const validClueLine = (line, lineLength) => Array.isArray(line) && line.length > 0 &&
    line.every(n => Number.isInteger(n) && n >= 0 && n <= lineLength) &&
    (line.length === 1 ? true : line.every(n => n > 0)) &&
    (line.length === 1 && line[0] === 0 || line.length > 0 && line[0] > 0);
  if (!Number.isInteger(height) || height < 1 || height > 12 ||
      !Number.isInteger(width) || width < 1 || width > 12 ||
      !clues || !Array.isArray(clues.rows) || !Array.isArray(clues.columns) ||
      clues.rows.length !== height || clues.columns.length !== width ||
      !clues.rows.every(line => validClueLine(line, width)) ||
      !clues.columns.every(line => validClueLine(line, height))) {
    return { status: 'invalid', solved: false, board: null, iterations: 0, deductions: 0 };
  }

  const board = Array.from({ length: height }, () => Array(width).fill(-1));
  let iterations = 0, deductions = 0;
  const applyLine = (isRow, index, clue) => {
    const length = isRow ? width : height;
    const candidates = lineMasks(length, clue).filter(mask => {
      for (let offset = 0; offset < length; offset++) {
        const known = isRow ? board[index][offset] : board[offset][index];
        if (known !== -1 && Number(Boolean(mask & (1 << offset))) !== known) return false;
      }
      return true;
    });
    if (!candidates.length) return -1;
    let changed = 0;
    for (let offset = 0; offset < length; offset++) {
      const bit = 1 << offset;
      const first = Boolean(candidates[0] & bit);
      if (!candidates.every(mask => Boolean(mask & bit) === first)) continue;
      const value = first ? 1 : 0;
      const current = isRow ? board[index][offset] : board[offset][index];
      if (current === -1) {
        if (isRow) board[index][offset] = value;
        else board[offset][index] = value;
        changed++; deductions++;
      } else if (current !== value) return -1;
    }
    return changed;
  };

  while (true) {
    iterations++;
    let changed = 0;
    for (let r = 0; r < height; r++) {
      const result = applyLine(true, r, clues.rows[r]);
      if (result < 0) return { status: 'contradiction', solved: false, board, iterations, deductions };
      changed += result;
    }
    for (let c = 0; c < width; c++) {
      const result = applyLine(false, c, clues.columns[c]);
      if (result < 0) return { status: 'contradiction', solved: false, board, iterations, deductions };
      changed += result;
    }
    // A later axis may invalidate a line processed earlier in this pass.
    // Recheck every row and column before declaring the board solved or stalled.
    const lineStillPossible = (isRow, index, clue) => {
      const length = isRow ? width : height;
      return lineMasks(length, clue).some(mask => {
        for (let offset = 0; offset < length; offset++) {
          const known = isRow ? board[index][offset] : board[offset][index];
          if (known !== -1 && Number(Boolean(mask & (1 << offset))) !== known) return false;
        }
        return true;
      });
    };
    if (clues.rows.some((clue, r) => !lineStillPossible(true, r, clue)) ||
        clues.columns.some((clue, c) => !lineStillPossible(false, c, clue))) {
      return { status: 'contradiction', solved: false, board, iterations, deductions };
    }
    if (board.every(row => row.every(cell => cell !== -1))) {
      return { status: 'solved', solved: true, board: board.map(row => row.map(Boolean)), iterations, deductions };
    }
    if (changed === 0) {
      return { status: 'stalled', solved: false, board, iterations, deductions };
    }
  }
}

export function isLogicallySolvable(clues, height, width) {
  return solveLogically(clues, height, width).solved;
}

export function countSolutions(clues, height, width, limit = 2) {
  const validClueLine = (line, lineLength) => Array.isArray(line) && line.length > 0 &&
    line.every(n => Number.isInteger(n) && n >= 0 && n <= lineLength) &&
    (line.length === 1 ? true : line.every(n => n > 0));
  if (!Number.isInteger(height) || height < 1 || height > 12 ||
      !Number.isInteger(width) || width < 1 || width > 12 ||
      !Number.isSafeInteger(limit) || limit < 1 ||
      !clues || !Array.isArray(clues.rows) || !Array.isArray(clues.columns) ||
      clues.rows.length !== height || clues.columns.length !== width ||
      !clues.rows.every(line => validClueLine(line, width)) ||
      !clues.columns.every(line => validClueLine(line, height))) return 0;

  const rowCandidates = clues.rows.map(line => lineMasks(width, line));
  if (rowCandidates.some(rows => rows.length === 0)) return 0;
  const columnPrefixes = clues.columns.map(line => {
    const masks = lineMasks(height, line);
    if (!masks.length) return null;
    return Array.from({ length: height + 1 }, (_, depth) => {
      const prefixMask = (1 << depth) - 1;
      return new Set(masks.map(mask => mask & prefixMask));
    });
  });
  if (columnPrefixes.some(prefixes => prefixes === null)) return 0;

  const activeColumnBits = Array(width).fill(0);
  let count = 0;
  function visit(row) {
    if (count >= limit) return;
    if (row === height) { count++; return; }
    const nextDepth = row + 1;
    for (const candidate of rowCandidates[row]) {
      for (let col = 0; col < width; col++) {
        if (candidate & (1 << col)) activeColumnBits[col] |= 1 << row;
      }
      let valid = true;
      for (let col = 0; col < width; col++) {
        if (!columnPrefixes[col][nextDepth].has(activeColumnBits[col])) { valid = false; break; }
      }
      if (valid) visit(nextDepth);
      for (let col = 0; col < width; col++) activeColumnBits[col] &= ~(1 << row);
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
function makeSizeSchedule(level, sizes, modeSalt = 0, journeySeed = null) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Level must be a positive safe integer within the supported range.');
  }
  const batchIndex = Math.floor((level - 1) / EASY_LEVEL_BATCH_SIZE);
  const slot = (level - 1) % EASY_LEVEL_BATCH_SIZE;
  const batchSeed = (0x6a09e667 ^ modeSalt ^ Math.imul(batchIndex + 1, 0x9e3779b1)) >>> 0;
  const rng = typeof journeySeed === 'string'
    ? createRng(`${journeySeed}:size-bag:${modeSalt}:${batchIndex}`)
    : createRng(batchSeed);
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

export function getGridSizeForLevel(level, difficulty = 'easy', journeySeed = null) {
  if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('Difficulty must be easy, normal, or hard.');
  if (journeySeed !== null && !isValidSeed(journeySeed)) throw new TypeError('journeySeed must be a valid saved seed.');
  return makeSizeSchedule(level, DIFFICULTY_GRID_SIZES[difficulty], MODE_SALTS[difficulty], journeySeed);
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

function generatePuzzleAtSize({ level, seed, size, difficulty, maxAttempts, avoidFingerprints, exactAttempt = null, allowLegacyRestore = false, diagnostics = null, minimumRunCount = Math.min(12, size * 2) }) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Level must be a positive safe integer within the supported range.');
  }
  if (!isValidSeed(seed)) throw new TypeError('Seed must be a safe integer or a valid string.');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10_000) {
    throw new RangeError('maxAttempts must be an integer from 1 to 10000.');
  }
  if (!Number.isInteger(size) || size < 5 || size > 12) throw new RangeError('Grid size must be between 5 and 12.');
  if (!Array.isArray(avoidFingerprints) || avoidFingerprints.some(value => typeof value !== 'string')) {
    throw new TypeError('avoidFingerprints must be an array of strings.');
  }
  if (exactAttempt !== null && (!Number.isSafeInteger(exactAttempt) || exactAttempt < 0 || exactAttempt >= maxAttempts)) {
    throw new RangeError('exactAttempt must be a zero-based attempt index within maxAttempts.');
  }
  const recent = new Set(avoidFingerprints);
  const rng = createRng(seed);
  const minDensity = 0.28;
  const maxDensity = 0.60;
  const now = () => globalThis.performance?.now?.() ?? Date.now();
  const validationMetrics = {
    prefilterRejects: 0, logicalChecks: 0, logicalRejects: 0,
    uniquenessChecks: 0, uniquenessRejects: 0,
    totalLogicalMs: 0, totalUniquenessMs: 0, maxCandidateValidationMs: 0
  };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const density = minDensity + rng() * (maxDensity - minDensity);
    const solution = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rng() < density)
    );
    // Replay/resume pins the exact accepted PRNG attempt. Earlier attempts are
    // still consumed so the stream is identical, but they are not candidates.
    if (exactAttempt !== null && attempt !== exactAttempt) continue;
    if (!hasFilledLine(solution) || !hasUsefulVariety(solution, minimumRunCount)) {
      validationMetrics.prefilterRejects++;
      continue;
    }
    const fingerprint = puzzleFingerprint(solution);
    if (recent.has(fingerprint)) {
      validationMetrics.prefilterRejects++;
      continue;
    }
    const clues = calculateClues(solution);
    // Run deterministic propagation first: it is cheap and rejects candidates
    // that would require guessing before the more expensive uniqueness search.
    // The opt-in exact-attempt fallback exists only to resume a puzzle already
    // saved by older releases; it never applies to fresh puzzle generation.
    const logicalStarted = now();
    const logicallySolvable = isLogicallySolvable(clues, size, size);
    const logicalMs = now() - logicalStarted;
    validationMetrics.logicalChecks++;
    validationMetrics.totalLogicalMs += logicalMs;
    validationMetrics.maxCandidateValidationMs = Math.max(validationMetrics.maxCandidateValidationMs, logicalMs);
    if (!logicallySolvable) validationMetrics.logicalRejects++;
    if (!logicallySolvable && !(allowLegacyRestore && exactAttempt !== null)) continue;
    const uniquenessStarted = now();
    const uniqueSolutionCount = countSolutions(clues, size, size, 2);
    const uniquenessMs = now() - uniquenessStarted;
    validationMetrics.uniquenessChecks++;
    validationMetrics.totalUniquenessMs += uniquenessMs;
    validationMetrics.maxCandidateValidationMs = Math.max(validationMetrics.maxCandidateValidationMs, logicalMs + uniquenessMs);
    if (uniqueSolutionCount === 1) {
      if (diagnostics && typeof diagnostics === 'object') Object.assign(diagnostics, {
        ...validationMetrics,
        totalValidationMs: validationMetrics.totalLogicalMs + validationMetrics.totalUniquenessMs
      });
      return {
        id: `${difficulty}-${level}-${typeof seed === 'string' ? seed : Number(seed) >>> 0}-${attempt}`,
        seed,
        level,
        difficulty,
        width: size,
        height: size,
        points: getPointsForGridSize(size),
        clues,
        solution,
        fingerprint,
        attempts: attempt + 1,
        restoredLegacyUnsolvable: !logicallySolvable
      };
    }
    validationMetrics.uniquenessRejects++;
  }
  throw new Error(`Could not generate a fresh unique ${difficulty} puzzle at ${size}x${size} after ${maxAttempts} attempts; try another seed or clear the recent-fingerprint window.`);
}

export function generatePuzzle({ difficulty = 'easy', level = 1, seed = Date.now(), journeySeed = null, size = null, maxAttempts = 500, avoidFingerprints = [], exactAttempt = null, allowLegacyRestore = false, diagnostics = null } = {}) {
  if (!DIFFICULTIES.includes(difficulty)) throw new RangeError('Difficulty must be easy, normal, or hard.');
  if (journeySeed !== null && !isValidSeed(journeySeed)) throw new TypeError('journeySeed must be a valid saved seed.');
  const selectedSize = size === null ? getGridSizeForLevel(level, difficulty, journeySeed) : size;
  if (!DIFFICULTY_GRID_SIZES[difficulty].includes(selectedSize)) {
    throw new RangeError(`Grid size ${selectedSize} is not available in ${difficulty} mode.`);
  }
  return generatePuzzleAtSize({ level, seed, size: selectedSize, difficulty, maxAttempts, avoidFingerprints, exactAttempt, allowLegacyRestore, diagnostics });
}


/** Compatibility entry point retained for older imports and tests. */
export function generateEasyPuzzle(options = {}) {
  return generatePuzzle({ ...options, difficulty: 'easy' });
}

/** Legacy generation is used only to resume a v4 Easy save's unfinished puzzle. */
export function generateLegacyEasyPuzzle({ level = 1, seed = Date.now(), size: savedSize = null, maxAttempts = 500, avoidFingerprints = [], exactAttempt = null, allowLegacyRestore = false, diagnostics = null } = {}) {
  const size = savedSize === null ? getLegacyEasyGridSizeForLevel(level) : savedSize;
  return generatePuzzleAtSize({ level, seed, size, difficulty: 'easy', maxAttempts, avoidFingerprints, exactAttempt, allowLegacyRestore, diagnostics, minimumRunCount: 12 });
}

export function isSolved(current, solution) {
  return validateSolution(current) && validateSolution(solution) &&
    current.length === solution.length && current.every((row, r) =>
      row.every((value, c) => value === solution[r][c])
    );
}
