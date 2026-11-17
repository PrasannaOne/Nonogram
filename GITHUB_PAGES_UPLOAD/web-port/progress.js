/*
 * Independent, endless Easy-only progression for PrasannaOne Nonogram.
 * Schema v4 stores a compact completion streak, points and recent puzzle IDs so thousands
 * of levels do not create a huge completed-level array.
 */

export const PROGRESS_KEY = 'prasannaone.nonogram.progress.v4';
export const LEGACY_PROGRESS_KEYS = Object.freeze(['prasannaone.nonogram.progress.v3', 'prasannaone.nonogram.progress.v2', 'prasannaone.nonogram.progress.v1']);
export const LEVELS_PER_BATCH = 10; // Legacy compatibility only; no batches in the product flow.
export const LEVELS_PER_PAGE = 10;  // Legacy helper only; no level picker in the product flow.
export const MAX_LEVEL_ID = 1_000_000;
export const MAX_GRID_SIZE = 12;
export const POINTS_PER_GRID_DIMENSION = 30; // Native formula: square grid size × 30.
export const HINT_COST = 15; // Base per-cell cost; getHintCost scales with the current grid.
export const RECENT_FINGERPRINT_LIMIT = 128;

export function createInitialProgress() {
  return {
    schemaVersion: 4,
    mode: 'easy',
    generatorVersion: 2,
    journeySeed: null, // Random per-player, persistent across reloads and progress backups.
    currentLevel: 1,
    highestUnlockedLevel: 1,
    completedThrough: 0,
    completedLevels: [], // Sparse legacy/out-of-order completions only.
    batchesGenerated: 1, // Retained for backwards-compatible migration; ignored by gameplay.
    currentPuzzle: null,
    points: 0,
    recentFingerprints: [],
    savedAt: null
  };
}

function isPositiveInt(value) { return Number.isSafeInteger(value) && value > 0; }
function isValidLevel(value) { return isPositiveInt(value) && value <= MAX_LEVEL_ID; }
const VALID_CELL_STATES = new Set(['unknown', 'filled', 'crossed']);

function normalizePuzzleSnapshot(snapshot, highestUnlockedLevel) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const { level, seed, width, height, board } = snapshot;
  const validSeed = Number.isSafeInteger(seed) || (typeof seed === 'string' && seed.length >= 8 && seed.length <= 180 && /^[a-zA-Z0-9:_-]+$/.test(seed));
  if (!isValidLevel(level) || level > highestUnlockedLevel || !validSeed ||
      !Number.isInteger(width) || width < 1 || width > MAX_GRID_SIZE ||
      !Number.isInteger(height) || height < 1 || height > MAX_GRID_SIZE ||
      !Array.isArray(board) || board.length !== height) return null;
  if (!board.every(row => Array.isArray(row) && row.length === width &&
      row.every(cell => VALID_CELL_STATES.has(cell)))) return null;
  const hintedCells = Array.isArray(snapshot.hintedCells)
    ? [...new Map(snapshot.hintedCells
        .filter(cell => cell && Number.isInteger(cell.row) && Number.isInteger(cell.col) &&
          cell.row >= 0 && cell.row < height && cell.col >= 0 && cell.col < width)
        .map(cell => [`${cell.row}:${cell.col}`, { row: cell.row, col: cell.col }])).values()]
    : [];
  const startedAtMs = Number.isSafeInteger(snapshot.startedAtMs) && snapshot.startedAtMs > 0
    ? snapshot.startedAtMs : null;
  const attempts = Number.isSafeInteger(snapshot.attempts) && snapshot.attempts >= 1 && snapshot.attempts <= 10000
    ? snapshot.attempts : null;
  const fingerprint = typeof snapshot.fingerprint === 'string' && /^[a-f0-9]{16}$/i.test(snapshot.fingerprint)
    ? snapshot.fingerprint.toLowerCase() : null;
  return { level, seed: typeof seed === 'number' ? seed >>> 0 : seed, width, height, board: board.map(row => row.slice()), hintedCells, startedAtMs, attempts, fingerprint, legacy: typeof snapshot.legacy === 'boolean' ? snapshot.legacy : null };
}

export function normalizeProgress(input) {
  const base = createInitialProgress();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base;
  const currentLevel = isValidLevel(input.currentLevel) ? input.currentLevel : 1;
  const requestedHighest = isValidLevel(input.highestUnlockedLevel) ? input.highestUnlockedLevel : 1;
  const rawCompleted = Array.isArray(input.completedLevels)
    ? [...new Set(input.completedLevels.filter(value => isValidLevel(value)))].sort((a, b) => a - b)
    : [];
  let completedThrough = Number.isSafeInteger(input.completedThrough) && input.completedThrough >= 0
    ? Math.min(input.completedThrough, MAX_LEVEL_ID) : 0;
  const completedSet = new Set(rawCompleted);
  // Migrate old explicit completion arrays into a compact consecutive streak.
  while (completedSet.has(completedThrough + 1)) {
    completedSet.delete(completedThrough + 1);
    completedThrough++;
  }
  const completedLevels = [...completedSet].filter(level => level > completedThrough).sort((a, b) => a - b);
  const highestUnlockedLevel = Math.max(currentLevel, requestedHighest, completedThrough + 1);
  const minimumBatches = Math.max(1, Math.ceil(highestUnlockedLevel / LEVELS_PER_BATCH));
  const batchesGenerated = isPositiveInt(input.batchesGenerated)
    ? Math.max(minimumBatches, Math.min(Math.ceil(MAX_LEVEL_ID / LEVELS_PER_BATCH), input.batchesGenerated))
    : minimumBatches;

  // Prefer the current snapshot. Older v3 saves may also have the same board
  // duplicated in savedPuzzles; use that map only as a migration fallback.
  let currentPuzzle = normalizePuzzleSnapshot(input.currentPuzzle, highestUnlockedLevel);
  if (!currentPuzzle && input.savedPuzzles && typeof input.savedPuzzles === 'object' && !Array.isArray(input.savedPuzzles)) {
    currentPuzzle = normalizePuzzleSnapshot(input.savedPuzzles[String(currentLevel)], highestUnlockedLevel);
  }
  if (currentPuzzle && currentPuzzle.level !== currentLevel) currentPuzzle = null;

  const points = Number.isSafeInteger(input.points) && input.points >= 0 ? Math.min(input.points, 1_000_000_000) : 0;
  const recentFingerprints = Array.isArray(input.recentFingerprints)
    ? [...new Set(input.recentFingerprints.filter(value => typeof value === 'string' && value.length > 0 && value.length <= 16))].slice(-RECENT_FINGERPRINT_LIMIT)
    : [];

  return {
    ...base,
    schemaVersion: 4,
    mode: input.mode === 'normal' || input.mode === 'hard' ? input.mode : 'easy',
    generatorVersion: input.generatorVersion === 1 ? 1 : 2,
    journeySeed: typeof input.journeySeed === 'string' && /^[a-f0-9]{32}$/i.test(input.journeySeed) ? input.journeySeed.toLowerCase() : null,
    currentLevel,
    highestUnlockedLevel,
    completedThrough,
    completedLevels,
    batchesGenerated,
    currentPuzzle,
    points,
    recentFingerprints,
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : null
  };
}

export function getSavedPuzzle(progress, level) {
  if (!isValidLevel(level)) return null;
  const snapshot = normalizeProgress(progress).currentPuzzle;
  return snapshot && snapshot.level === level ? { ...snapshot, board: snapshot.board.map(row => row.slice()) } : null;
}

// Kept as a migration/testing helper. The shipped interface has no level picker.
export function getLevelPage(progress, pageIndex, pageSize = LEVELS_PER_PAGE) {
  const state = normalizeProgress(progress);
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0 || pageIndex > MAX_LEVEL_ID ||
      !isPositiveInt(pageSize) || pageSize > MAX_GRID_SIZE * 10) throw new RangeError('Invalid page request.');
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + pageSize - 1, state.highestUnlockedLevel);
  return end < start ? [] : Array.from({ length: end - start + 1 }, (_, i) => {
    const level = start + i;
    return { level, unlocked: level <= state.highestUnlockedLevel,
      completed: level <= state.completedThrough || state.completedLevels.includes(level), current: level === state.currentLevel };
  });
}

export function completeLevel(progress, level, fingerprint = null, pointReward = 0) {
  const state = normalizeProgress(progress);
  if (!isValidLevel(level) || level > state.highestUnlockedLevel || level >= MAX_LEVEL_ID) {
    throw new RangeError('Cannot complete an invalid, locked, or terminal level.');
  }
  const completed = new Set(state.completedLevels);
  const isFirstCompletion = level > state.completedThrough && !completed.has(level);
  if (level > state.completedThrough) completed.add(level);
  let completedThrough = state.completedThrough;
  while (completed.has(completedThrough + 1)) {
    completed.delete(completedThrough + 1);
    completedThrough++;
  }
  if (!Number.isSafeInteger(pointReward) || pointReward < 0 || pointReward > 360) {
    throw new RangeError('Point reward must be an integer from 0 to 360.');
  }
  const nextLevel = level + 1;
  return {
    ...state,
    schemaVersion: 4,
    generatorVersion: 2, // A migrated Easy save switches to the new schedule after its legacy puzzle is completed.
    currentLevel: nextLevel,
    points: state.points + (isFirstCompletion ? pointReward : 0),
    recentFingerprints: fingerprint && !state.recentFingerprints.includes(fingerprint)
      ? [...state.recentFingerprints, fingerprint].slice(-RECENT_FINGERPRINT_LIMIT)
      : state.recentFingerprints,
    highestUnlockedLevel: Math.max(state.highestUnlockedLevel, nextLevel),
    completedThrough,
    completedLevels: [...completed].sort((a, b) => a - b),
    batchesGenerated: Math.max(state.batchesGenerated, Math.ceil(nextLevel / LEVELS_PER_BATCH)),
    currentPuzzle: null
  };
}

export function getHintCost(size) {
  if (!Number.isInteger(size) || size < 1 || size > MAX_GRID_SIZE) {
    throw new RangeError('Grid size must be an integer from 1 to 12.');
  }
  // A completed puzzle awards size × 30 points. One hint costs half that
  // reward, so a player earns at most two hints per completed level.
  return size * HINT_COST;
}

export function spendHintPoints(progress, cost = HINT_COST) {
  const state = normalizeProgress(progress);
  if (!Number.isSafeInteger(cost) || cost < 1 || cost > 360) {
    throw new RangeError('Hint cost must be an integer from 1 to 360.');
  }
  if (state.points < cost) return { progress: state, success: false, remaining: state.points, cost };
  const next = { ...state, points: state.points - cost };
  return { progress: next, success: true, remaining: next.points, cost };
}

export function setCurrentPuzzle(progress, puzzle, board) {
  const state = normalizeProgress(progress);
  if (!puzzle || !isValidLevel(puzzle.level) || puzzle.level > state.highestUnlockedLevel ||
      !Number.isInteger(puzzle.width) || puzzle.width < 1 || puzzle.width > MAX_GRID_SIZE ||
      !Number.isInteger(puzzle.height) || puzzle.height < 1 || puzzle.height > MAX_GRID_SIZE ||
      !(Number.isSafeInteger(puzzle.seed) || (typeof puzzle.seed === 'string' && puzzle.seed.length >= 8 && puzzle.seed.length <= 180 && /^[a-zA-Z0-9:_-]+$/.test(puzzle.seed))) ||
      (puzzle.attempts !== undefined && (!Number.isSafeInteger(puzzle.attempts) || puzzle.attempts < 1 || puzzle.attempts > 10000)) ||
      (puzzle.fingerprint !== undefined && (typeof puzzle.fingerprint !== 'string' || !/^[a-f0-9]{16}$/i.test(puzzle.fingerprint))) ||
      (puzzle.legacy !== undefined && typeof puzzle.legacy !== 'boolean') || !Array.isArray(board) || board.length !== puzzle.height ||
      !board.every(row => Array.isArray(row) && row.length === puzzle.width && row.every(cell => VALID_CELL_STATES.has(cell)))) {
    throw new TypeError('Puzzle must reference an unlocked level and include a valid board snapshot.');
  }
  const snapshot = normalizePuzzleSnapshot({ ...puzzle, board }, state.highestUnlockedLevel);
  return { ...state, currentLevel: puzzle.level, currentPuzzle: snapshot };
}

export function createProgressRepository(storage, key = PROGRESS_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Storage must provide getItem() and setItem().');
  }
  return {
    load() {
      let currentRaw;
      try { currentRaw = storage.getItem(key); } catch { return createInitialProgress(); }
      if (currentRaw != null) {
        try { return normalizeProgress(JSON.parse(currentRaw)); } catch { /* try legacy */ }
      }
      if (key === PROGRESS_KEY) for (const legacyKey of LEGACY_PROGRESS_KEYS) {
        let legacyRaw;
        try { legacyRaw = storage.getItem(legacyKey); } catch { continue; }
        if (legacyRaw == null) continue;
        try {
          const migrated = normalizeProgress(JSON.parse(legacyRaw));
          try { storage.setItem(key, JSON.stringify({ ...migrated, savedAt: new Date().toISOString() })); } catch { /* in-memory migration */ }
          return migrated;
        } catch { /* ignore malformed legacy save */ }
      }
      return createInitialProgress();
    },
    save(progress) {
      const normalized = normalizeProgress({ ...progress, savedAt: new Date().toISOString() });
      storage.setItem(key, JSON.stringify(normalized));
      return normalized;
    },
    clear() { storage.removeItem?.(key); }
  };
}


// Multi-difficulty game workspace. Each profile owns its own level, points,
// completion streak, recent fingerprints and unfinished board snapshot.
export const GAME_STATE_KEY = 'prasannaone.nonogram.game.v1';
const LEGACY_GAME_KEYS = Object.freeze([
  PROGRESS_KEY,
  'prasannaone.nonogram.progress.v3',
  'prasannaone.nonogram.progress.v2',
  'prasannaone.nonogram.progress.v1'
]);
export const GAME_MODES = Object.freeze(['easy', 'normal', 'hard']);

export function createInitialGameState() {
  return {
    schemaVersion: 1,
    currentMode: 'easy',
    profiles: {
      easy: createInitialProgress(),
      normal: { ...createInitialProgress(), mode: 'normal' },
      hard: { ...createInitialProgress(), mode: 'hard' }
    },
    savedAt: null
  };
}

export function normalizeGameState(input) {
  const initial = createInitialGameState();
  if (!input || typeof input !== 'object' || Array.isArray(input)) return initial;
  // New workspace format.
  if (input.schemaVersion === 1 && input.profiles && typeof input.profiles === 'object') {
    const profiles = {};
    for (const mode of GAME_MODES) {
      const raw = input.profiles[mode];
      profiles[mode] = raw
        ? { ...normalizeProgress({ ...raw, mode }), mode }
        : { ...createInitialProgress(), mode };
    }
    return {
      schemaVersion: 1,
      currentMode: GAME_MODES.includes(input.currentMode) ? input.currentMode : 'easy',
      profiles,
      savedAt: typeof input.savedAt === 'string' ? input.savedAt : null
    };
  }
  // v1-v4 single-profile saves migrate to Easy without losing their active board,
  // level, points or completion streak. The old generator remains active until
  // that unfinished puzzle is completed, because its dimensions/schedule differ.
  const legacyEasy = {
    ...normalizeProgress({ ...input, mode: 'easy' }),
    mode: 'easy',
    generatorVersion: input.generatorVersion === 2 ? 2 : 1
  };
  return {
    schemaVersion: 1,
    currentMode: 'easy',
    profiles: {
      easy: legacyEasy,
      normal: { ...createInitialProgress(), mode: 'normal' },
      hard: { ...createInitialProgress(), mode: 'hard' }
    },
    savedAt: typeof input.savedAt === 'string' ? input.savedAt : null
  };
}

export function selectGameMode(state, mode) {
  if (!GAME_MODES.includes(mode)) throw new RangeError('Mode must be easy, normal, or hard.');
  const normalized = normalizeGameState(state);
  return { ...normalized, currentMode: mode };
}

export function updateModeProgress(state, mode, progress) {
  if (!GAME_MODES.includes(mode)) throw new RangeError('Mode must be easy, normal, or hard.');
  const normalized = normalizeGameState(state);
  return {
    ...normalized,
    profiles: {
      ...normalized.profiles,
      [mode]: { ...normalizeProgress({ ...progress, mode }), mode }
    }
  };
}

export function createGameRepository(storage, key = GAME_STATE_KEY) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new TypeError('Storage must provide getItem() and setItem().');
  }
  return {
    load() {
      try {
        const raw = storage.getItem(key);
        if (raw != null) return normalizeGameState(JSON.parse(raw));
      } catch { /* attempt legacy migration below */ }
      if (key === GAME_STATE_KEY) {
        for (const legacyKey of LEGACY_GAME_KEYS) {
          try {
            const raw = storage.getItem(legacyKey);
            if (raw == null) continue;
            const migrated = normalizeGameState(JSON.parse(raw));
            try { storage.setItem(key, JSON.stringify({ ...migrated, savedAt: new Date().toISOString() })); } catch { /* keep in-memory migration */ }
            return migrated;
          } catch { /* ignore malformed legacy value */ }
        }
      }
      return createInitialGameState();
    },
    save(state) {
      const normalized = normalizeGameState({ ...state, savedAt: new Date().toISOString() });
      storage.setItem(key, JSON.stringify(normalized));
      return normalized;
    }
  };
}
