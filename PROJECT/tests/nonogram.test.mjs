import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLineClues, calculateClues, countSolutions, generateEasyPuzzle, generateLegacyEasyPuzzle, generatePuzzle, getGridSizeForLevel, getLegacyEasyGridSizeForLevel, getPointsForGridSize, EASY_GRID_SIZES, DIFFICULTY_GRID_SIZES, isSolved, validateSolution } from '../web-port/nonogram.js';

test('line clues cover runs and empty lines', () => {
  assert.deepEqual(calculateLineClues([false, true, true, false, true]), [2, 1]);
  assert.deepEqual(calculateLineClues([false, false, false]), [0]);
});

test('generated puzzle is deterministic and uniquely solvable', () => {
  const a = generateEasyPuzzle({ level: 1, seed: 12345 });
  const b = generateEasyPuzzle({ level: 1, seed: 12345 });
  assert.deepEqual(a, b);
  assert.equal(a.difficulty, 'easy');
  assert.equal(a.width, getGridSizeForLevel(1));
  assert.equal(a.height, a.width);
  assert.equal(countSolutions(a.clues, a.height, a.width, 2), 1);
  assert.equal(isSolved(a.solution, a.solution), true);
});

test('endless Easy loop uses only recovered square sizes from 5x5 through 7x7', () => {
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 50, 51, 150, 151, 2000, 1_000_000]) {
    const puzzle = generateEasyPuzzle({ level, seed: 7 });
    assert.equal(puzzle.width, getGridSizeForLevel(level));
    assert.equal(puzzle.height, puzzle.width);
    assert.ok(puzzle.width >= 5 && puzzle.width <= 7);
    assert.equal(countSolutions(puzzle.clues, puzzle.height, puzzle.width, 2), 1);
  }
});

test('generator avoids a supplied recent fingerprint window', () => {
  const first = generateEasyPuzzle({ level: 1, seed: 12345 });
  const next = generateEasyPuzzle({ level: 2, seed: 12346, avoidFingerprints: [first.fingerprint] });
  assert.notEqual(next.fingerprint, first.fingerprint);
  assert.equal(countSolutions(next.clues, next.height, next.width, 2), 1);
});

test('generator rejects malformed fingerprint exclusion lists', () => {
  assert.throws(() => generateEasyPuzzle({ avoidFingerprints: 'not-an-array' }), TypeError);
});

test('solution validation accepts up to 12x12 and rejects oversized, ragged and non-boolean grids', () => {
  assert.equal(validateSolution(Array.from({ length: 12 }, () => Array(12).fill(false))), true);
  assert.equal(validateSolution(Array.from({ length: 13 }, () => Array(1).fill(false))), false);
  assert.equal(validateSolution([[true], [false, true]]), false);
  assert.equal(validateSolution([[1]]), false);
});

test('solution counter rejects malformed clues and unsafe dimensions without throwing', () => {
  assert.equal(countSolutions({ rows: [[1]], columns: [[1], [1]] }, 1, 2), 0);
  assert.equal(countSolutions({ rows: [[-1]], columns: [[1]] }, 1, 1), 0);
  assert.equal(countSolutions({ rows: [[1]], columns: [[1]] }, 1, 32), 0);
});

test('generator rejects invalid level, seed and attempt budgets', () => {
  assert.throws(() => generateEasyPuzzle({ level: 0 }), RangeError);
  assert.throws(() => generateEasyPuzzle({ seed: 1.5 }), TypeError);
  assert.throws(() => generateEasyPuzzle({ maxAttempts: 0 }), RangeError);
});


test('each difficulty uses its recovered size bag without repeats before refill', () => {
  for (const mode of ['easy', 'normal', 'hard']) {
    const sizes = DIFFICULTY_GRID_SIZES[mode];
    const sequence = Array.from({ length: 10 }, (_, i) => getGridSizeForLevel(i + 1, mode));
    for (let offset = 0; offset < 9; offset += sizes.length) {
      const bag = sequence.slice(offset, offset + sizes.length);
      assert.deepEqual([...bag].sort((a, b) => a - b), [...sizes]);
    }
  }
  assert.deepEqual(EASY_GRID_SIZES, [5, 6, 7]);
  assert.notDeepEqual(Array.from({ length: 10 }, (_, i) => getGridSizeForLevel(i + 1)),
    Array.from({ length: 10 }, (_, i) => getGridSizeForLevel(i + 1, 'normal')));
});

test('legacy Easy schedule remains available for safe unfinished-save migration', () => {
  assert.ok(Array.from({ length: 10 }, (_, i) => getLegacyEasyGridSizeForLevel(i + 1)).some(size => size > 7));
});

test('all three difficulty generators produce valid unique 12x12-capable puzzles', () => {
  const easy = generatePuzzle({ difficulty: 'easy', level: 1, seed: 901 });
  const normal = generatePuzzle({ difficulty: 'normal', level: 1, seed: 902 });
  const hard = generatePuzzle({ difficulty: 'hard', level: 3, seed: 903 });
  assert.ok(easy.width >= 5 && easy.width <= 7);
  assert.ok(normal.width >= 7 && normal.width <= 9);
  assert.equal(hard.width, 12);
  for (const puzzle of [easy, normal, hard]) {
    assert.equal(puzzle.height, puzzle.width);
    assert.equal(countSolutions(puzzle.clues, puzzle.height, puzzle.width, 2), 1);
  }
});

test('grid-size selection rejects invalid level numbers', () => {
  assert.throws(() => getGridSizeForLevel(0), RangeError);
  assert.throws(() => getGridSizeForLevel(1_000_001), RangeError);
});

test('native-inspired grid reward is 30 points per dimension', () => {
  assert.equal(getPointsForGridSize(5), 150);
  assert.equal(getPointsForGridSize(10), 300);
  assert.equal(getPointsForGridSize(12), 360);
  assert.throws(() => getPointsForGridSize(13), RangeError);
});


test('legacy Easy generator matches the v39 output fixture across 13 deterministic levels', async () => {
  const { default: fixture } = await import('./fixtures/legacy-easy-v39-parity.json', { with: { type: 'json' } });
  assert.equal(fixture.samples, 13);
  assert.equal(fixture.mismatches, 0);
  for (const item of fixture.results) {
    const puzzle = generateLegacyEasyPuzzle({ level: item.level, seed: item.seed });
    assert.equal(puzzle.width, item.size);
    assert.equal(puzzle.attempts, item.attempts);
    assert.equal(puzzle.fingerprint, item.fingerprint);
  }
});
