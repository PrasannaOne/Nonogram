/** Calculate a square-cell Nonogram layout within the available board viewport. */
export function calculateBoardLayout({ width, height, size, maxRowClueChars = 1, maxColumnClues = 1, maxCellSize = 56 } = {}) {
  const finitePositive = value => Number.isFinite(value) && value > 0;
  if (!finitePositive(width) || !finitePositive(height)) throw new RangeError('Available width and height must be positive finite numbers.');
  if (!Number.isInteger(size) || size < 1 || size > 12) throw new RangeError('Grid size must be an integer from 1 to 12.');
  if (!Number.isInteger(maxRowClueChars) || maxRowClueChars < 1 || maxRowClueChars > size * 3 ||
      !Number.isInteger(maxColumnClues) || maxColumnClues < 1 || maxColumnClues > size) {
    throw new RangeError('Maximum clue counts must be valid for the grid size.');
  }
  if (!finitePositive(maxCellSize)) throw new RangeError('Maximum cell size must be positive and finite.');

  const clueFontSize = Math.max(9, Math.min(14, width * 0.034, height * 0.03));
  const rowClueWidth = Math.ceil(Math.max(27,
    maxRowClueChars * clueFontSize * 0.58 + 10));
  const columnClueHeight = Math.ceil(Math.max(32,
    maxColumnClues * clueFontSize * 1.08 + 8));
  const cellSize = Math.max(1, Math.floor(Math.min(
    (width - rowClueWidth) / size,
    (height - columnClueHeight) / size,
    maxCellSize
  )));

  return {
    clueFontSize,
    rowClueWidth,
    columnClueHeight,
    cellSize,
    boardWidth: rowClueWidth + size * cellSize,
    boardHeight: columnClueHeight + size * cellSize
  };
}
