/**
 * Resolve the cell visually underneath a pointer's viewport coordinates.
 * This is intentionally coordinate-based rather than event-target-based:
 * touch browsers may keep dispatching pointer events to the original cell
 * after implicit pointer capture begins.
 */
export function getCellCoordinatesAtPoint(documentRef, clientX, clientY) {
  if (!documentRef || typeof documentRef.elementFromPoint !== 'function' ||
      !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  const target = documentRef.elementFromPoint(clientX, clientY);
  const cell = target?.closest?.('.cell');
  if (!cell) return null;
  const row = Number(cell.dataset?.row);
  const col = Number(cell.dataset?.col);
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0) return null;
  return { row, col };
}

/** Create a pointer stroke that will lock to one board axis. */
export function createAxisLockedStroke(start, clientX, clientY) {
  if (!start || !Number.isInteger(start.row) || !Number.isInteger(start.col) || start.row < 0 || start.col < 0 ||
      !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  return {
    start: { row: start.row, col: start.col },
    startX: clientX,
    startY: clientY,
    axis: null
  };
}

/**
 * Project pointer movement onto the selected row or column. The dominant
 * movement chooses the axis once; later diagonal drift cannot change it.
 * A small dead zone avoids locking from touch jitter immediately after down.
 */
export function getAxisLockedCell(stroke, coordinate, clientX, clientY) {
  if (!stroke || !coordinate || !Number.isInteger(coordinate.row) ||
      !Number.isInteger(coordinate.col) || !Number.isFinite(clientX) ||
      !Number.isFinite(clientY)) return null;

  if (stroke.axis === null) {
    const dx = clientX - stroke.startX;
    const dy = clientY - stroke.startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return null;
    stroke.axis = Math.abs(dx) >= Math.abs(dy) ? 'row' : 'column';
  }

  return stroke.axis === 'row'
    ? { row: stroke.start.row, col: coordinate.col }
    : { row: coordinate.row, col: stroke.start.col };
}
