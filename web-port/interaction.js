/*
 * Independent Nonogram interaction model for PrasannaOne.
 * This is our own implementation, not copied from the reference game.
 * One completed pointer stroke is one undo action.
 */

export const CELL = Object.freeze({ UNKNOWN: 'unknown', FILLED: 'filled', CROSSED: 'crossed' });
export const TOOL = Object.freeze({ FILL: 'fill', CROSS: 'cross', ERASE: 'erase' });

const VALID_STATES = new Set(Object.values(CELL));
const VALID_TOOLS = new Set(Object.values(TOOL));

function cloneBoard(board) { return board.map(row => row.slice()); }
function cellKey(row, col) { return `${row}:${col}`; }

export class PuzzleBoard {
  constructor(height, width) {
    if (!Number.isInteger(height) || !Number.isInteger(width) || height < 1 || width < 1) {
      throw new TypeError('Board dimensions must be positive integers.');
    }
    this.height = height;
    this.width = width;
    this.cells = Array.from({ length: height }, () => Array(width).fill(CELL.UNKNOWN));
    this.history = [];
    this.historyIndex = 0;
    this.activeStroke = null;
  }

  getState(row, col) {
    this.#assertCell(row, col);
    return this.cells[row][col];
  }

  beginStroke(tool) {
    if (!VALID_TOOLS.has(tool)) throw new TypeError(`Unknown tool: ${tool}`);
    if (this.activeStroke) this.endStroke();
    this.activeStroke = { tool, before: new Map() };
  }

  paintCell(row, col) {
    this.#assertCell(row, col);
    if (!this.activeStroke) throw new Error('Call beginStroke(tool) before paintCell().');
    const next = this.activeStroke.tool === TOOL.FILL ? CELL.FILLED
      : this.activeStroke.tool === TOOL.CROSS ? CELL.CROSSED : CELL.UNKNOWN;
    const previous = this.cells[row][col];
    if (previous === next) return false;
    const key = cellKey(row, col);
    if (!this.activeStroke.before.has(key)) this.activeStroke.before.set(key, { row, col, state: previous });
    this.cells[row][col] = next;
    return true;
  }

  endStroke() {
    if (!this.activeStroke) return false;
    const changes = [];
    for (const [key, before] of this.activeStroke.before) {
      const after = this.cells[before.row][before.col];
      if (after !== before.state) changes.push({ ...before, after });
    }
    this.activeStroke = null;
    if (!changes.length) return false;
    this.#pushHistory({ type: 'stroke', changes });
    return true;
  }

  applyCell(row, col, tool) {
    this.beginStroke(tool);
    this.paintCell(row, col);
    return this.endStroke();
  }

  reset() {
    if (this.activeStroke) this.endStroke();
    const changes = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        const before = this.cells[row][col];
        if (before !== CELL.UNKNOWN) {
          changes.push({ row, col, state: before, after: CELL.UNKNOWN });
          this.cells[row][col] = CELL.UNKNOWN;
        }
      }
    }
    if (!changes.length) return false;
    this.#pushHistory({ type: 'reset', changes });
    return true;
  }

  undo() {
    if (this.activeStroke) this.endStroke();
    if (this.historyIndex === 0) return false;
    const command = this.history[--this.historyIndex];
    for (const change of command.changes) this.cells[change.row][change.col] = change.state;
    return true;
  }

  canUndo() { return this.historyIndex > 0 || Boolean(this.activeStroke?.before.size); }
  getUndoCount() { return this.historyIndex; }
  snapshot() { return cloneBoard(this.cells); }

  #pushHistory(command) {
    this.history.length = this.historyIndex;
    this.history.push(command);
    this.historyIndex = this.history.length;
  }

  #assertCell(row, col) {
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= this.height || col >= this.width) {
      throw new RangeError(`Cell out of bounds: ${row},${col}`);
    }
  }
}

/**
 * Nonogram completion convention for our project:
 * every solution-filled cell must be filled and no solution-empty cell may be filled.
 * Cross marks are optional annotations; unknown and crossed both count as unfilled.
 */
function validSolutionForBoard(board, solution) {
  return Boolean(board && Number.isInteger(board.height) && Number.isInteger(board.width) &&
    Array.isArray(board.cells) && board.cells.length === board.height &&
    board.cells.every(row => Array.isArray(row) && row.length === board.width) &&
    Array.isArray(solution) && solution.length === board.height &&
    solution.every(row => Array.isArray(row) && row.length === board.width &&
      row.every(value => typeof value === 'boolean')));
}

/**
 * Independent line-completion rule: every required filled cell in this row
 * must be filled, and no incorrect cell may be filled. Empty solution cells
 * may remain UNKNOWN or be marked CROSSED. This is our product rule, not a
 * recovered assertion about the original native CheckRowComplete method.
 */
export function isRowComplete(board, solution, rowIndex) {
  if (!validSolutionForBoard(board, solution) || !Number.isInteger(rowIndex) ||
      rowIndex < 0 || rowIndex >= board.height) return false;
  for (let col = 0; col < board.width; col++) {
    if ((board.cells[rowIndex][col] === CELL.FILLED) !== solution[rowIndex][col]) return false;
  }
  return true;
}

/** Independent counterpart to isRowComplete, evaluated vertically. */
export function isColumnComplete(board, solution, columnIndex) {
  if (!validSolutionForBoard(board, solution) || !Number.isInteger(columnIndex) ||
      columnIndex < 0 || columnIndex >= board.width) return false;
  for (let row = 0; row < board.height; row++) {
    if ((board.cells[row][columnIndex] === CELL.FILLED) !== solution[row][columnIndex]) return false;
  }
  return true;
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

export function isBoardComplete(board, solution) {
  if (!validSolutionForBoard(board, solution)) return false;
  return Array.from({ length: board.height }, (_, row) => isRowComplete(board, solution, row)).every(Boolean) &&
    Array.from({ length: board.width }, (_, col) => isColumnComplete(board, solution, col)).every(Boolean);
}
