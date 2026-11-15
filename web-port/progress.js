/*
 * Independent Easy-only progression and persistence for PrasannaOne Nonogram.
 * Browser storage is versioned and contains no points, rewards, ads, or modes.
 * The original's exact serialized format is not claimed to be reproduced.
 */

export const PROGRESS_KEY = 'prasannaone.nonogram.progress.v1';
export const LEVELS_PER_BATCH = 10;
export const LEVELS_PER_PAGE = 10; // Our product choice; original page size is not yet recovered.
export const MAX_LEVEL_ID = 1_000_000;
export const MAX_GRID_SIZE = 10;

export function createInitialProgress() {
  return {
    schemaVersion: 1,
    mode: 'easy',
    currentLevel: 1,
    highestUnlockedLevel: LEVELS_PER_BATCH,
    completedLevels: [],
    batchesGenerated: 1,
    currentPuzzle: null,
    savedAt: null
  };
}

function isPositiveInt(value) { return Number.isSafeInteger(value) && value > 0; }
function isValidLevel(value) { return isPositiveInt(value) && value <= MAX_LEVEL_ID; }
const VALID_CELL_STATES = new Set(['unknown', 'filled', 'crossed']);

function normalizePuzzleSnapshot(snapshot, highestUnlockedLevel) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const { level, seed, width, height, board } = snapshot;
  if (!isValidLevel(level) || level > highestUnlockedLevel ||
      !Number.isInteger(width) || width < 1 || width > MAX_GRID_SIZE ||
      !Number.isInteger(height) || height < 1 || height > MAX_GRID_SIZE ||
      !Number.isSafeInteger(seed) || !Array.isArray(board) || board.length !== height) return null;
  if (!board.every(row => Array.isArray(row) && row.length === width &&
      row.every(cell => VALID_CELL_STATES.has(cell)))) return null;
  return {
    level,
    seed: seed >>> 0,
    width,
    height,
    board: board.map(row => row.slice())
  };
}

export function normalizeProgress(input) {
  const base = createInitialProgress();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const currentLevel = isValidLevel(input.currentLevel) ? input.currentLevel : 1;
  const requestedHighest = isValidLevel(input.highestUnlockedLevel) ? input.highestUnlockedLevel : LEVELS_PER_BATCH;
  const highestUnlockedLevel = Math.max(currentLevel, requestedHighest);
  const completedLevels = Array.isArray(input.completedLevels)
    ? [...new Set(input.completedLevels.filter(value => isValidLevel(value) && value <= highestUnlockedLevel))].sort((a, b) => a - b)
    : [];
  const minimumBatches = Math.max(1, Math.ceil(highestUnlockedLevel / LEVELS_PER_BATCH));
  const batchesGenerated = isPositiveInt(input.batchesGenerated)
    ? Math.max(minimumBatches, Math.min(Math.ceil(MAX_LEVEL_ID / LEVELS_PER_BATCH), input.batchesGenerated))
    : minimumBatches;
  return {
    ...base,
    currentLevel,
    highestUnlockedLevel,
    completedLevels,
    batchesGenerated,
    currentPuzzle: normalizePuzzleSnapshot(input.currentPuzzle, highestUnlockedLevel),
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : null
  };
}

export function getLevelPage(progress, pageIndex, pageSize = LEVELS_PER_PAGE) {
  const state = normalizeProgress(progress);
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0 || pageIndex > MAX_LEVEL_ID ||
      !isPositiveInt(pageSize) || pageSize > MAX_GRID_SIZE * 10) {
    throw new RangeError('Page index must be non-negative and page size positive.');
  }
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, state.highestUnlockedLevel);
  return end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => {
    const level = start + i;
    return {
      level,
      unlocked: level <= state.highestUnlockedLevel,
      completed: state.completedLevels.includes(level),
      current: level === state.currentLevel
    };
  });
}

export function completeLevel(progress, level) {
  const state = normalizeProgress(progress);
  if (!isValidLevel(level) || level > state.highestUnlockedLevel) {
    throw new RangeError('Cannot complete a level that is invalid or locked.');
  }
  const completed = new Set(state.completedLevels);
  completed.add(level);
  let batchesGenerated = state.batchesGenerated;
  let highestUnlockedLevel = Math.max(state.highestUnlockedLevel, batchesGenerated * LEVELS_PER_BATCH);
  // Original metadata text describes ten levels initially, then another batch
  // after all ten have been completed. We adopt that batch cadence independently.
  const maximumBatches = Math.ceil(MAX_LEVEL_ID / LEVELS_PER_BATCH);
  while (batchesGenerated < maximumBatches && Array.from(
    { length: LEVELS_PER_BATCH },
    (_, i) => (batchesGenerated - 1) * LEVELS_PER_BATCH + i + 1
  ).every(id => completed.has(id))) {
    batchesGenerated++;
    highestUnlockedLevel = Math.max(highestUnlockedLevel, batchesGenerated * LEVELS_PER_BATCH);
  }
  const nextLevel = Array.from({ length: highestUnlockedLevel }, (_, i) => i + 1)
    .find(id => !completed.has(id)) ?? highestUnlockedLevel;
  return {
    ...state,
    currentLevel: nextLevel,
    highestUnlockedLevel,
    completedLevels: [...completed].sort((a, b) => a - b),
    batchesGenerated,
    currentPuzzle: null
  };
}

export function setCurrentPuzzle(progress, puzzle, board) {
  const state = normalizeProgress(progress);
  if (!puzzle || !isValidLevel(puzzle.level) || puzzle.level > state.highestUnlockedLevel ||
      !Number.isInteger(puzzle.width) || puzzle.width < 1 || puzzle.width > MAX_GRID_SIZE ||
      !Number.isInteger(puzzle.height) || puzzle.height < 1 || puzzle.height > MAX_GRID_SIZE ||
      !Number.isSafeInteger(puzzle.seed) || !Array.isArray(board) || board.length !== puzzle.height ||
      !board.every(row => Array.isArray(row) && row.length === puzzle.width &&
        row.every(cell => VALID_CELL_STATES.has(cell)))) {
    throw new TypeError('Puzzle must reference an unlocked level and include a valid, dimension-matched board snapshot.');
  }
  return {
    ...state,
    currentLevel: puzzle.level,
    currentPuzzle: normalizePuzzleSnapshot({ ...puzzle, board }, state.highestUnlockedLevel)
  };
}

export function createProgressRepository(storage, key = PROGRESS_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Storage must provide getItem() and setItem().');
  }
  return {
    load() {
      try {
        const raw = storage.getItem(key);
        return raw == null ? createInitialProgress() : normalizeProgress(JSON.parse(raw));
      } catch {
        return createInitialProgress();
      }
    },
    save(progress) {
      const normalized = normalizeProgress({ ...progress, savedAt: new Date().toISOString() });
      storage.setItem(key, JSON.stringify(normalized));
      return normalized;
    },
    clear() { storage.removeItem?.(key); }
  };
}
