import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialProgress, normalizeProgress, completeLevel, setCurrentPuzzle,
  createProgressRepository, getSavedPuzzle, PROGRESS_KEY, spendHintPoints, HINT_COST
} from '../web-port/progress.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test('new game starts directly at level 1 with no mode or level-picker dependency', () => {
  const p = createInitialProgress();
  assert.equal(p.schemaVersion, 4);
  assert.equal(p.mode, 'easy');
  assert.equal(p.currentLevel, 1);
  assert.equal(p.highestUnlockedLevel, 1);
  assert.equal(p.completedThrough, 0);
  assert.deepEqual(p.completedLevels, []);
});

test('completing a level immediately unlocks and selects exactly the next level', () => {
  const p = completeLevel(createInitialProgress(), 1);
  assert.equal(p.currentLevel, 2);
  assert.equal(p.highestUnlockedLevel, 2);
  assert.equal(p.completedThrough, 1);
});

test('continuous progression advances sequentially without ten-level batches', () => {
  let p = createInitialProgress();
  for (let level = 1; level <= 25; level++) p = completeLevel(p, level);
  assert.equal(p.currentLevel, 26);
  assert.equal(p.highestUnlockedLevel, 26);
  assert.equal(p.completedThrough, 25);
  assert.deepEqual(p.completedLevels, []);
});

test('two thousand consecutive wins remain compact and advance without a menu', () => {
  let p = createInitialProgress();
  for (let level = 1; level <= 2000; level++) p = completeLevel(p, level);
  assert.equal(p.currentLevel, 2001);
  assert.equal(p.highestUnlockedLevel, 2001);
  assert.equal(p.completedThrough, 2000);
  assert.deepEqual(p.completedLevels, []);
  assert.ok(JSON.stringify(p).length < 1000);
});

test('normalization compresses legacy consecutive completed-level arrays', () => {
  const p = normalizeProgress({ currentLevel: 8, highestUnlockedLevel: 10, completedLevels: [1, 2, 3, 4, 5, 6, 7, 9] });
  assert.equal(p.completedThrough, 7);
  assert.deepEqual(p.completedLevels, [9]);
  assert.equal(p.currentLevel, 8);
});

test('normalization repairs malformed progress safely', () => {
  const p = normalizeProgress({ currentLevel: -1, highestUnlockedLevel: 0, completedThrough: -4, completedLevels: [1, 1, -2] });
  assert.equal(p.currentLevel, 1);
  assert.equal(p.highestUnlockedLevel, 2);
  assert.equal(p.completedThrough, 1);
  assert.deepEqual(p.completedLevels, []);
});

test('out-of-order legacy completions are retained sparsely until the gap is filled', () => {
  let p = normalizeProgress({ currentLevel: 4, highestUnlockedLevel: 10, completedLevels: [1, 2, 4] });
  assert.equal(p.completedThrough, 2);
  assert.deepEqual(p.completedLevels, [4]);
  p = completeLevel(p, 3);
  assert.equal(p.completedThrough, 4);
  assert.deepEqual(p.completedLevels, []);
});

test('completing the current puzzle discards its board snapshot', () => {
  let p = setCurrentPuzzle(createInitialProgress(),
    { level: 1, seed: 1, width: 2, height: 2 }, [['filled', 'unknown'], ['unknown', 'crossed']]);
  assert.ok(getSavedPuzzle(p, 1));
  p = completeLevel(p, 1, 'completed-one');
  assert.equal(getSavedPuzzle(p, 1), null);
  assert.equal(p.currentPuzzle, null);
});

test('only the active puzzle snapshot is retained when moving forward', () => {
  let p = { ...createInitialProgress(), highestUnlockedLevel: 3 };
  p = setCurrentPuzzle(p, { level: 1, seed: 11, width: 1, height: 1 }, [['filled']]);
  p = setCurrentPuzzle(p, { level: 2, seed: 22, width: 1, height: 1 }, [['crossed']]);
  assert.equal(getSavedPuzzle(p, 1), null);
  assert.deepEqual(getSavedPuzzle(p, 2).board, [['crossed']]);
  assert.equal(Object.hasOwn(p, 'savedPuzzles'), false);
  assert.equal(Object.hasOwn(p, 'savedPuzzleOrder'), false);
});

test('completion awards the supplied grid-size reward once and records only a compact fingerprint', () => {
  let p = completeLevel(createInitialProgress(), 1, 'abc123', 150);
  assert.equal(p.points, 150);
  assert.deepEqual(p.recentFingerprints, ['abc123']);
  p = completeLevel(p, 1, 'abc123', 150);
  assert.equal(p.points, 150);
});

test('completion rejects invalid point rewards', () => {
  assert.throws(() => completeLevel(createInitialProgress(), 1, null, -1), RangeError);
  assert.throws(() => completeLevel(createInitialProgress(), 1, null, 361), RangeError);
  assert.equal(completeLevel(createInitialProgress(), 1, null, 360).points, 360);
});

test('single-cell hint spends five points only when the balance is sufficient', () => {
  const empty = spendHintPoints(createInitialProgress());
  assert.equal(empty.success, false);
  assert.equal(empty.remaining, 0);
  const funded = spendHintPoints({ ...createInitialProgress(), points: HINT_COST });
  assert.equal(funded.success, true);
  assert.equal(funded.remaining, 0);
});

test('recent puzzle fingerprints are deduplicated and capped', () => {
  const values = Array.from({ length: 200 }, (_, index) => `fp${index}`);
  const p = normalizeProgress({ recentFingerprints: [...values, 'fp199'] });
  assert.equal(p.recentFingerprints.length, 128);
  assert.equal(p.recentFingerprints.at(-1), 'fp199');
});

test('v1 currentPuzzle save migrates into schema v4', () => {
  const p = normalizeProgress({ schemaVersion: 1, currentLevel: 3, highestUnlockedLevel: 10,
    currentPuzzle: { level: 3, seed: 303, width: 1, height: 1, board: [['filled']] } });
  assert.equal(p.schemaVersion, 4);
  assert.deepEqual(getSavedPuzzle(p, 3).board, [['filled']]);
});

test('repository migrates the previous v2 storage key and writes v4', () => {
  const storage = memoryStorage();
  storage.setItem('prasannaone.nonogram.progress.v2', JSON.stringify({ currentLevel: 2, highestUnlockedLevel: 10,
    currentPuzzle: { level: 2, seed: 2, width: 1, height: 1, board: [['crossed']] } }));
  const repo = createProgressRepository(storage);
  const p = repo.load();
  assert.equal(p.schemaVersion, 4);
  assert.deepEqual(getSavedPuzzle(p, 2).board, [['crossed']]);
  assert.ok(storage.getItem(PROGRESS_KEY));
});


test('repository migrates v3 saves with existing unfinished board and streak', () => {
  const storage = memoryStorage();
  storage.setItem('prasannaone.nonogram.progress.v3', JSON.stringify({ schemaVersion: 3,
    currentLevel: 6, highestUnlockedLevel: 6, completedThrough: 5,
    currentPuzzle: { level: 6, seed: 6, width: 1, height: 1, board: [['crossed']] } }));
  const p = createProgressRepository(storage).load();
  assert.equal(p.schemaVersion, 4);
  assert.equal(p.currentLevel, 6);
  assert.equal(p.completedThrough, 5);
  assert.deepEqual(getSavedPuzzle(p, 6).board, [['crossed']]);
});

test('repository persists a long-run completion streak compactly', () => {
  const storage = memoryStorage();
  const repo = createProgressRepository(storage);
  let p = repo.load();
  for (let level = 1; level <= 2000; level++) p = completeLevel(p, level);
  repo.save(p);
  const restored = repo.load();
  assert.equal(restored.currentLevel, 2001);
  assert.equal(restored.completedThrough, 2000);
  assert.ok(storage.getItem(PROGRESS_KEY).length < 2000);
});

test('invalid or locked board snapshots are rejected', () => {
  assert.throws(() => setCurrentPuzzle(createInitialProgress(),
    { level: 2, seed: 1, width: 1, height: 1 }, [['unknown']]), TypeError);
  assert.throws(() => setCurrentPuzzle(createInitialProgress(),
    { level: 1, seed: 1, width: 2, height: 1 }, [['unknown']]), TypeError);
});

test('terminal level is rejected instead of silently wrapping progress', () => {
  const p = normalizeProgress({ currentLevel: 1_000_000, highestUnlockedLevel: 1_000_000 });
  assert.throws(() => completeLevel(p, 1_000_000), RangeError);
});

import {
  createInitialGameState, normalizeGameState, createGameRepository,
  selectGameMode, updateModeProgress, GAME_STATE_KEY
} from '../web-port/progress.js';

test('new game workspace starts with isolated Easy, Normal and Hard profiles', () => {
  const state = createInitialGameState();
  assert.equal(state.currentMode, 'easy');
  assert.deepEqual(Object.keys(state.profiles).sort(), ['easy', 'hard', 'normal']);
  assert.notEqual(state.profiles.easy, state.profiles.normal);
  assert.equal(state.profiles.normal.mode, 'normal');
  assert.equal(state.profiles.hard.mode, 'hard');
});

test('v4 Easy save migrates into Easy profile without losing its unfinished puzzle', () => {
  const old = {
    schemaVersion: 4, currentLevel: 8, highestUnlockedLevel: 8, completedThrough: 7,
    points: 42, recentFingerprints: ['abc'],
    currentPuzzle: { level: 8, seed: 808, width: 10, height: 10,
      board: Array.from({ length: 10 }, () => Array(10).fill('unknown')) }
  };
  const migrated = normalizeGameState(old);
  assert.equal(migrated.currentMode, 'easy');
  assert.equal(migrated.profiles.easy.currentLevel, 8);
  assert.equal(migrated.profiles.easy.points, 42);
  assert.equal(migrated.profiles.easy.generatorVersion, 1);
  assert.equal(getSavedPuzzle(migrated.profiles.easy, 8).width, 10);
  assert.equal(migrated.profiles.normal.currentLevel, 1);
  assert.equal(migrated.profiles.hard.currentLevel, 1);
});

test('switching modes preserves each unfinished board and never overwrites another profile', () => {
  let state = createInitialGameState();
  let easy = setCurrentPuzzle({ ...state.profiles.easy, currentLevel: 4, highestUnlockedLevel: 4, points: 90 },
    { level: 4, seed: 404, width: 1, height: 1 }, [['filled']]);
  state = updateModeProgress(state, 'easy', easy);
  state = selectGameMode(state, 'normal');
  let normal = setCurrentPuzzle({ ...state.profiles.normal, points: 55 },
    { level: 1, seed: 202, width: 1, height: 1 }, [['crossed']]);
  state = updateModeProgress(state, 'normal', normal);
  state = selectGameMode(state, 'hard');
  let hard = { ...state.profiles.hard, currentLevel: 2, points: 30 };
  state = updateModeProgress(state, 'hard', hard);
  assert.equal(state.profiles.easy.currentLevel, 4);
  assert.equal(state.profiles.easy.points, 90);
  assert.deepEqual(getSavedPuzzle(state.profiles.easy, 4).board, [['filled']]);
  assert.equal(state.profiles.normal.currentLevel, 1);
  assert.equal(state.profiles.normal.points, 55);
  assert.deepEqual(getSavedPuzzle(state.profiles.normal, 1).board, [['crossed']]);
  assert.equal(state.profiles.hard.currentLevel, 2);
  assert.equal(state.currentMode, 'hard');
});

test('game repository migrates legacy save and persists independent mode profiles', () => {
  const storage = memoryStorage();
  storage.setItem(PROGRESS_KEY, JSON.stringify({ currentLevel: 3, highestUnlockedLevel: 3, points: 25 }));
  const repo = createGameRepository(storage);
  let state = repo.load();
  assert.equal(state.profiles.easy.currentLevel, 3);
  assert.equal(state.profiles.easy.generatorVersion, 1);
  state = updateModeProgress(state, 'normal', { ...state.profiles.normal, currentLevel: 5, points: 55 });
  state = selectGameMode(state, 'normal');
  repo.save(state);
  const restored = repo.load();
  assert.equal(restored.currentMode, 'normal');
  assert.equal(restored.profiles.easy.currentLevel, 3);
  assert.equal(restored.profiles.normal.currentLevel, 5);
  assert.equal(restored.profiles.normal.points, 55);
  assert.ok(storage.getItem(GAME_STATE_KEY));
});


test('12x12 unfinished Hard board snapshots survive save and reload', () => {
  const storage = memoryStorage();
  const repo = createGameRepository(storage);
  let state = repo.load();
  const board = Array.from({ length: 12 }, () => Array(12).fill('unknown'));
  let hard = setCurrentPuzzle(state.profiles.hard,
    { level: 1, seed: 1212, width: 12, height: 12 }, board);
  state = updateModeProgress(state, 'hard', hard);
  state = selectGameMode(state, 'hard');
  repo.save(state);
  const restored = repo.load();
  const snapshot = getSavedPuzzle(restored.profiles.hard, 1);
  assert.equal(snapshot.width, 12);
  assert.equal(snapshot.height, 12);
  assert.equal(snapshot.board.length, 12);
  assert.equal(snapshot.board[11].length, 12);
});
