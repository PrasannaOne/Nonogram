/*
 * Independent Nonogram interaction model for PrasannaOne.
 * This is our own implementation, not copied from the reference game.
 * Design decisions and QA evidence are tracked in the development archive.
 */

import { calculateLineClues } from './nonogram.js';

export const CELL = Object.freeze({ UNKNOWN: 'unknown', FILLED: 'filled', CROSSED: 'crossed' });
export const TOOL = Object.freeze({ FILL: 'fill', CROSS: 'cross', ERASE: 'erase' });

const VALID_TOOLS = new Set(Object.values(TOOL));
const MAX_UNDO_ACTIONS = 10;

function cloneBoard(board) { return board.map(row => row.slice()); }

export class PuzzleBoard {
  constructor(height, width) {
    if (!Number.isInteger(height) || !Number.isInteger(width) || height < 1 || width < 1) {
      throw new TypeError('Board dimensions must be positive integers.');
    }
    this.height = height;
    this.width = width;
    this.cells = Array.from({ length: height }, () => Array(width).fill(CELL.UNKNOWN));
    // Native reference: a bounded 10-slot circular action buffer, with no redo API.
    this.history = [];
    this.activeStroke = null;
  }

  getState(row, col) {
    this.#assertCell(row, col);
    return this.cells[row][col];
  }

  beginStroke(tool) {
    if (!VALID_TOOLS.has(tool)) throw new TypeError(`Unknown tool: ${tool}`);
    if (this.activeStroke) this.endStroke();
    this.activeStroke = { tool, targetState: null, visited: new Set(), changed: false };
  }

  paintCell(row, col) {
    this.#assertCell(row, col);
    if (!this.activeStroke) throw new Error('Call beginStroke(tool) before paintCell().');

    const key = `${row}:${col}`;
    // A raycast/drag event may encounter the same tile more than once.
    // Process each tile at most once per pointer stroke.
    if (this.activeStroke.visited.has(key)) return false;
    this.activeStroke.visited.add(key);

    const previous = this.cells[row][col];
    // Lock the gesture's intent from its starting tile. Every tile crossed by
    // this pointer gesture receives the same target state, so mixed rows never
    // get toggled/inverted one cell at a time while dragging.
    if (this.activeStroke.targetState === null) {
      if (this.activeStroke.tool === TOOL.FILL) {
        this.activeStroke.targetState = previous === CELL.FILLED ? CELL.UNKNOWN : CELL.FILLED;
      } else if (this.activeStroke.tool === TOOL.CROSS) {
        this.activeStroke.targetState = previous === CELL.CROSSED ? CELL.UNKNOWN : CELL.CROSSED;
      } else {
        this.activeStroke.targetState = CELL.UNKNOWN;
      }
    }
    const next = this.activeStroke.targetState;
    if (previous === next) return false;
    this.cells[row][col] = next;
    this.#pushHistory({ row, col, state: previous });
    this.activeStroke.changed = true;
    return true;
  }

  endStroke() {
    if (!this.activeStroke) return false;
    const changed = this.activeStroke.changed;
    this.activeStroke = null;
    return changed;
  }

  applyCell(row, col, tool) {
    this.beginStroke(tool);
    const changed = this.paintCell(row, col);
    this.endStroke();
    return changed;
  }

  reset() {
    if (this.activeStroke) this.endStroke();
    let changed = false;
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.cells[row][col] !== CELL.UNKNOWN) {
          this.cells[row][col] = CELL.UNKNOWN;
          changed = true;
        }
      }
    }
    // Native ResetTiles clears the grid and refreshes line state; it does not
    // push a reset command into UndoStack. Existing undo entries are retained.
    return changed;
  }

  undo() {
    if (this.activeStroke) this.endStroke();
    const action = this.history.pop();
    if (!action) return false;
    this.cells[action.row][action.col] = action.state;
    return true;
  }

  canUndo() { return this.history.length > 0; }
  getUndoCount() { return this.history.length; }
  snapshot() { return cloneBoard(this.cells); }

  /**
   * Reveal one random solution-FILLED cell that is not already filled.
   * Crossed cells remain eligible, matching the native GiveHint candidate test.
   * Native GiveHint does not push a separate undo action.
   * Returns the revealed coordinate, or null when no eligible hint remains.
   */
  giveHint(solution, random = Math.random) {
    if (!validSolutionForBoard(this, solution)) {
      throw new TypeError('A valid solution matching this board is required.');
    }
    if (typeof random !== 'function') throw new TypeError('random must be a function.');

    const candidates = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.cells[row][col] !== CELL.FILLED && solution[row][col]) {
          candidates.push({ row, col });
        }
      }
    }
    if (candidates.length === 0) return null;

    const sample = random();
    if (typeof sample !== 'number' || !Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new RangeError('random must return a number in the range [0, 1).');
    }
    const selected = candidates[Math.floor(sample * candidates.length)];
    this.cells[selected.row][selected.col] = CELL.FILLED;
    return { ...selected };
  }

  #pushHistory(action) {
    this.history.push(action);
    if (this.history.length > MAX_UNDO_ACTIONS) this.history.shift();
  }

  #assertCell(row, col) {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= this.height || col >= this.width) {
      throw new RangeError(`Cell out of bounds: ${row},${col}`);
    }
  }
}

function validSolutionForBoard(board, solution) {
  return Boolean(board && Number.isInteger(board.height) && Number.isInteger(board.width) &&
    Array.isArray(board.cells) && board.cells.length === board.height &&
    board.cells.every(row => Array.isArray(row) && row.length === board.width &&
      row.every(value => Object.values(CELL).includes(value))) &&
    Array.isArray(solution) && solution.length === board.height &&
    solution.every(row => Array.isArray(row) && row.length === board.width &&
      row.every(value => typeof value === 'boolean')));
}

function currentRowRuns(board, rowIndex) {
  return calculateLineClues(board.cells[rowIndex].map(state => state === CELL.FILLED));
}

function currentColumnRuns(board, columnIndex) {
  return calculateLineClues(Array.from({ length: board.height }, (_, row) =>
    board.cells[row][columnIndex] === CELL.FILLED));
}

/**
 * A line is complete when its consecutive FILLED run lengths match its clue
 * sequence. UNKNOWN and CROSSED both act as non-filled separators. This mirrors
 * the native CheckRowComplete/CheckColumnComplete algorithm.
 */
export function isRowComplete(board, solution, rowIndex) {
  if (!validSolutionForBoard(board, solution) || !Number.isInteger(rowIndex) ||
      rowIndex < 0 || rowIndex >= board.height) return false;
  const expected = calculateLineClues(solution[rowIndex]);
  const actual = currentRowRuns(board, rowIndex);
  return actual.length === expected.length && actual.every((run, index) => run === expected[index]);
}

/** Native counterpart for a vertical line, matching consecutive FILLED runs. */
export function isColumnComplete(board, solution, columnIndex) {
  if (!validSolutionForBoard(board, solution) || !Number.isInteger(columnIndex) ||
      columnIndex < 0 || columnIndex >= board.width) return false;
  const expected = calculateLineClues(solution.map(row => row[columnIndex]));
  const actual = currentColumnRuns(board, columnIndex);
  return actual.length === expected.length && actual.every((run, index) => run === expected[index]);
}

/** Returns completed row and column indices for clue highlighting. */
export function getCompletedLines(board, solution) {
  if (!validSolutionForBoard(board, solution)) return { rows: [], columns: [] };
  return {
    rows: Array.from({ length: board.height }, (_, row) => row)
      .filter(row => isRowComplete(board, solution, row)),
    columns: Array.from({ length: board.width }, (_, col) => col)
      .filter(col => isColumnComplete(board, solution, col))
  };
}

/**
 * The native IsLevelDone method checks the aggregate line-completion flags.
 * With the uniquely solvable puzzle set used by this product, every row and
 * column matching its run clues completes the board.
 */
export function isBoardComplete(board, solution) {
  if (!validSolutionForBoard(board, solution)) return false;
  return Array.from({ length: board.height }, (_, row) => isRowComplete(board, solution, row)).every(Boolean) &&
    Array.from({ length: board.width }, (_, col) => isColumnComplete(board, solution, col)).every(Boolean);
}
