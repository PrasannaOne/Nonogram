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
