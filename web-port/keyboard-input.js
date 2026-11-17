/**
 * Resolve a keyboard navigation target within a rectangular puzzle grid.
 * Unsupported keys and invalid starting coordinates return null.
 */
export function getKeyboardCellTarget(row, col, key, height, width) {
  if (!Number.isInteger(height) || !Number.isInteger(width) || height < 1 || width < 1 ||
      !Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 ||
      row >= height || col >= width) return null;

  let nextRow = row;
  let nextCol = col;
  switch (key) {
    case 'ArrowUp': nextRow = Math.max(0, row - 1); break;
    case 'ArrowDown': nextRow = Math.min(height - 1, row + 1); break;
    case 'ArrowLeft': nextCol = Math.max(0, col - 1); break;
    case 'ArrowRight': nextCol = Math.min(width - 1, col + 1); break;
    case 'Home': nextCol = 0; break;
    case 'End': nextCol = width - 1; break;
    case 'PageUp': nextRow = 0; break;
    case 'PageDown': nextRow = height - 1; break;
    default: return null;
  }
  return { row: nextRow, col: nextCol };
}
