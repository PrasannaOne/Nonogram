/*
 * PrasannaOne Nonogram core - independent implementation.
 * No original game code, assets, level data, or branding is used.
 * Grid format: solution[row][column] is boolean.
 */

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
  if (!Array.isArray(solution) || solution.length < 1 || solution.length > 10) return false;
  const width = solution[0]?.length;
  if (!Number.isInteger(width) || width < 1 || width > 10) return false;
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
  if (!Number.isInteger(height) || height < 1 || height > 10 ||
      !Number.isInteger(width) || width < 1 || width > 10 ||
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

/**
 * Generates an independently created, easy-band puzzle.
 * Defaults: 5-8 cells; later levels can rise gradually to 10.
 * A puzzle is returned only when its clues have exactly one solution.
 */
export function generateEasyPuzzle({ level = 1, seed = Date.now(), maxAttempts = 500 } = {}) {
  if (!Number.isSafeInteger(level) || level < 1 || level > 1_000_000) {
    throw new RangeError('Level must be a positive safe integer within the supported range.');
  }
  if (!Number.isSafeInteger(seed)) throw new TypeError('Seed must be a safe integer.');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10_000) {
    throw new RangeError('maxAttempts must be an integer from 1 to 10000.');
  }
  const rng = createRng(seed);
  const size = Math.max(5, Math.min(10, 5 + Math.floor(Math.max(0, level - 1) / 4)));
  const minDensity = 0.34;
  const maxDensity = 0.56;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => rng() < (minDensity + rng() * (maxDensity - minDensity)))
    );
    if (!hasFilledLine(solution)) continue;
    const clues = calculateClues(solution);
    if (countSolutions(clues, size, size, 2) === 1) {
      return {
        id: `easy-${level}-${Number(seed) >>> 0}-${attempt}`,
        level,
        difficulty: 'easy',
        width: size,
        height: size,
        clues,
        solution,
        attempts: attempt + 1
      };
    }
  }
  throw new Error(`Could not generate a unique easy puzzle after ${maxAttempts} attempts; try another seed.`);
}

export function isSolved(current, solution) {
  return validateSolution(current) && validateSolution(solution) &&
    current.length === solution.length && current.every((row, r) =>
      row.every((value, c) => value === solution[r][c])
    );
}
