import test from 'node:test';
import assert from 'node:assert/strict';
import { PuzzleBoard, CELL, TOOL, isBoardComplete } from '../web-port/interaction.js';

 test('tap actions change a cell and undo restores its previous state', () => {
  const board = new PuzzleBoard(2, 2);
  assert.equal(board.applyCell(0, 0, TOOL.FILL), true);
  assert.equal(board.getState(0, 0), CELL.FILLED);
  assert.equal(board.canUndo(), true);
  assert.equal(board.undo(), true);
  assert.equal(board.getState(0, 0), CELL.UNKNOWN);
  assert.equal(board.canUndo(), false);
});

test('dragging across multiple cells creates one undo action per changed tile', () => {
  const board = new PuzzleBoard(2, 3);
  board.beginStroke(TOOL.FILL);
  board.paintCell(0, 0);
  board.paintCell(0, 1);
  board.paintCell(0, 2);
  board.endStroke();
  assert.equal(board.getUndoCount(), 3);
  assert.deepEqual(board.snapshot()[0], [CELL.FILLED, CELL.FILLED, CELL.FILLED]);
  board.undo();
  assert.deepEqual(board.snapshot()[0], [CELL.FILLED, CELL.FILLED, CELL.UNKNOWN]);
  board.undo();
  board.undo();
  assert.deepEqual(board.snapshot()[0], [CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]);
});


test('one fill drag keeps one fixed target state across empty and already-filled cells', () => {
  const board = new PuzzleBoard(1, 4);
  board.applyCell(0, 1, TOOL.FILL);
  board.applyCell(0, 3, TOOL.CROSS);
  board.beginStroke(TOOL.FILL);
  board.paintCell(0, 0); // Empty start locks this entire gesture to FILLED.
  board.paintCell(0, 1); // Already filled stays filled, not toggled off.
  board.paintCell(0, 2);
  board.paintCell(0, 3); // Crossed becomes filled.
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.FILLED, CELL.FILLED, CELL.FILLED, CELL.FILLED]]);
});

test('starting a fill drag on a filled cell locks the whole gesture to erase', () => {
  const board = new PuzzleBoard(1, 5);
  for (let col = 0; col < 5; col++) board.applyCell(0, col, TOOL.FILL);
  board.beginStroke(TOOL.FILL);
  board.paintCell(0, 2); // Filled start locks the gesture to UNKNOWN.
  board.paintCell(0, 1);
  board.paintCell(0, 0);
  board.paintCell(0, 2); // Revisit cannot invert or refill the start cell.
  board.paintCell(0, 3);
  board.paintCell(0, 4);
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]]);
});

test('cross drag fills a mixed row with crosses without toggling existing marks', () => {
  const board = new PuzzleBoard(1, 3);
  board.applyCell(0, 1, TOOL.CROSS);
  board.applyCell(0, 2, TOOL.FILL);
  board.beginStroke(TOOL.CROSS);
  board.paintCell(0, 0); // Empty start locks the whole path to CROSSED.
  board.paintCell(0, 1); // Existing cross remains crossed.
  board.paintCell(0, 2); // Filled tile becomes crossed.
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.CROSSED, CELL.CROSSED, CELL.CROSSED]]);
});

test('cross drag also uses a fixed target and can erase a crossed run in one pass', () => {
  const board = new PuzzleBoard(1, 4);
  board.applyCell(0, 1, TOOL.CROSS);
  board.applyCell(0, 2, TOOL.CROSS);
  board.beginStroke(TOOL.CROSS);
  board.paintCell(0, 1); // Crossed start locks to erase.
  board.paintCell(0, 0);
  board.paintCell(0, 2);
  board.paintCell(0, 3);
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]]);
});

test('revisiting a tile within a stroke never toggles it, including erase strokes', () => {
  const board = new PuzzleBoard(1, 2);
  board.applyCell(0, 0, TOOL.CROSS);
  board.beginStroke(TOOL.CROSS);
  board.paintCell(0, 0);
  board.paintCell(0, 1);
  board.paintCell(0, 0);
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.UNKNOWN, CELL.UNKNOWN]]);
});

test('same selected state toggles a tile back to empty', () => {
  const board = new PuzzleBoard(1, 2);
  assert.equal(board.applyCell(0, 0, TOOL.CROSS), true);
  assert.equal(board.getState(0, 0), CELL.CROSSED);
  assert.equal(board.applyCell(0, 0, TOOL.CROSS), true);
  assert.equal(board.getState(0, 0), CELL.UNKNOWN);
  assert.equal(board.getUndoCount(), 2);
  board.undo();
  assert.equal(board.getState(0, 0), CELL.CROSSED);
});

test('erase clears a cell; an unchanged erase creates no undo action', () => {
  const board = new PuzzleBoard(1, 2);
  assert.equal(board.applyCell(0, 0, TOOL.FILL), true);
  assert.equal(board.applyCell(0, 0, TOOL.ERASE), true);
  assert.equal(board.getState(0, 0), CELL.UNKNOWN);
  assert.equal(board.applyCell(0, 0, TOOL.ERASE), false);
  assert.equal(board.getUndoCount(), 2);
  board.undo();
  assert.equal(board.getState(0, 0), CELL.FILLED);
});

test('reset clears cells without creating a reset undo action', () => {
  const board = new PuzzleBoard(2, 2);
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(1, 1, TOOL.CROSS);
  assert.equal(board.reset(), true);
  assert.deepEqual(board.snapshot(), [[CELL.UNKNOWN, CELL.UNKNOWN], [CELL.UNKNOWN, CELL.UNKNOWN]]);
  assert.equal(board.getUndoCount(), 2);
  board.undo();
  assert.equal(board.getState(1, 1), CELL.UNKNOWN);
  assert.equal(board.getUndoCount(), 1);
});

test('undo history is bounded to ten recent cell actions', () => {
  const board = new PuzzleBoard(2, 6);
  for (let col = 0; col < 6; col++) board.applyCell(0, col, TOOL.FILL);
  for (let col = 0; col < 4; col++) board.applyCell(1, col, TOOL.FILL);
  assert.equal(board.getUndoCount(), 10);
  assert.equal(board.applyCell(1, 4, TOOL.FILL), true);
  assert.equal(board.getUndoCount(), 10);
  for (let n = 0; n < 10; n++) assert.equal(board.undo(), true);
  assert.deepEqual(board.snapshot()[0], [CELL.FILLED, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]);
  assert.deepEqual(board.snapshot()[1], [CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]);
  assert.equal(board.canUndo(), false);
});

test('undoing then making a new action has no redo branch', () => {
  const board = new PuzzleBoard(1, 2);
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(0, 1, TOOL.CROSS);
  assert.equal(board.undo(), true);
  assert.equal(board.applyCell(0, 1, TOOL.FILL), true);
  assert.equal(board.getUndoCount(), 2);
  assert.equal(typeof board.redo, 'undefined');
});

test('completion uses clue-run equality, not exact cell-position equality', async () => {
  const { isRowComplete, isColumnComplete, getCompletedLines } = await import('../web-port/interaction.js');
  const board = new PuzzleBoard(2, 4);
  const solution = [[true, false, true, false], [true, true, true, true]];
  // Same run sequence [1, 1], but the filled cells are in different positions.
  board.applyCell(0, 1, TOOL.FILL);
  board.applyCell(0, 3, TOOL.FILL);
  assert.equal(isRowComplete(board, solution, 0), true);
  assert.equal(isColumnComplete(board, solution, 0), false);
  assert.deepEqual(getCompletedLines(board, solution), { rows: [0], columns: [1, 3] });
});

test('row and column completion are checked independently; crossed and empty cells are separators', async () => {
  const { isRowComplete, isColumnComplete, getCompletedLines } = await import('../web-port/interaction.js');
  const board = new PuzzleBoard(2, 2);
  const solution = [[true, false], [false, true]];
  board.applyCell(0, 0, TOOL.FILL);
  assert.equal(isRowComplete(board, solution, 0), true);
  assert.equal(isColumnComplete(board, solution, 0), true);
  assert.equal(isRowComplete(board, solution, 1), false);
  assert.equal(isColumnComplete(board, solution, 1), false);
  assert.deepEqual(getCompletedLines(board, solution), { rows: [0], columns: [0] });
  board.applyCell(0, 1, TOOL.CROSS);
  assert.equal(isRowComplete(board, solution, 0), true);
});

test('a line with the wrong clue sequence stays incomplete', async () => {
  const { isRowComplete, isColumnComplete } = await import('../web-port/interaction.js');
  const board = new PuzzleBoard(2, 3);
  const solution = [[true, true, false], [false, false, true]];
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(0, 2, TOOL.FILL);
  assert.equal(isRowComplete(board, solution, 0), false);
  assert.equal(isColumnComplete(board, solution, 2), true);
});

test('revisiting a cell during one drag stroke does not toggle it twice', () => {
  const board = new PuzzleBoard(1, 2);
  board.beginStroke(TOOL.FILL);
  board.paintCell(0, 0);
  board.paintCell(0, 1);
  assert.equal(board.paintCell(0, 0), false);
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.FILLED, CELL.FILLED]]);
  assert.equal(board.getUndoCount(), 2);
  board.undo();
  assert.deepEqual(board.snapshot(), [[CELL.FILLED, CELL.UNKNOWN]]);
});

test('undo during an active stroke commits all touched cells, then undoes only the latest tile', () => {
  const board = new PuzzleBoard(1, 3);
  board.beginStroke(TOOL.FILL);
  board.paintCell(0, 0);
  board.paintCell(0, 1);
  assert.equal(board.undo(), true);
  assert.deepEqual(board.snapshot(), [[CELL.FILLED, CELL.UNKNOWN, CELL.UNKNOWN]]);
  assert.equal(board.canUndo(), true);
});

test('an unchanged stroke creates no undo entry', () => {
  const board = new PuzzleBoard(1, 1);
  board.beginStroke(TOOL.ERASE);
  assert.equal(board.paintCell(0, 0), false);
  assert.equal(board.endStroke(), false);
  assert.equal(board.getUndoCount(), 0);
});

test('invalid coordinates and tools fail explicitly', () => {
  const board = new PuzzleBoard(2, 2);
  assert.throws(() => board.getState(-1, 0), RangeError);
  assert.throws(() => board.beginStroke('paint'), TypeError);
  assert.throws(() => board.paintCell(0, 0), /beginStroke/);
});

test('board completion requires every row and column clue sequence to match', () => {
  const solution = [[true, false], [false, true]];
  const board = new PuzzleBoard(2, 2);
  assert.equal(isBoardComplete(board, solution), false);
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(1, 1, TOOL.FILL);
  assert.equal(isBoardComplete(board, solution), true);
});


test('single-cell hint reveals a random correct filled cell, including a crossed target', () => {
  const board = new PuzzleBoard(2, 3);
  const solution = [[true, false, true], [false, true, false]];
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(1, 1, TOOL.CROSS);
  const beforeUndoCount = board.getUndoCount();

  const revealed = board.giveHint(solution, () => 0.99);
  assert.deepEqual(revealed, { row: 1, col: 1 });
  assert.equal(board.getState(1, 1), CELL.FILLED);
  assert.equal(board.getUndoCount(), beforeUndoCount);
});

test('single-cell hint returns null when all correct filled cells are already filled', () => {
  const board = new PuzzleBoard(1, 3);
  const solution = [[true, false, true]];
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(0, 2, TOOL.FILL);
  assert.equal(board.giveHint(solution, () => 0.5), null);
});

test('single-cell hint rejects invalid solutions and random sources', () => {
  const board = new PuzzleBoard(1, 2);
  assert.throws(() => board.giveHint([[true]]), TypeError);
  assert.throws(() => board.giveHint([[true, false]], 0.5), TypeError);
  assert.throws(() => board.giveHint([[true, false]], () => 1), RangeError);
});


test('explicit erase stroke clears mixed filled and crossed cells without toggling', () => {
  const board = new PuzzleBoard(1, 4);
  board.applyCell(0, 0, TOOL.FILL);
  board.applyCell(0, 1, TOOL.CROSS);
  board.applyCell(0, 2, TOOL.FILL);
  board.applyCell(0, 3, TOOL.CROSS);
  board.beginStroke(TOOL.ERASE);
  for (let col = 0; col < 4; col++) board.paintCell(0, col);
  for (let col = 0; col < 4; col++) board.paintCell(0, col);
  board.endStroke();
  assert.deepEqual(board.snapshot(), [[CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN, CELL.UNKNOWN]]);
});
