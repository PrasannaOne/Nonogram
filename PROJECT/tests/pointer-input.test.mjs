import test from 'node:test';
import assert from 'node:assert/strict';
import { getCellCoordinatesAtPoint } from '../web-port/pointer-input.js';

function fakeDocument(target) {
  return { elementFromPoint(x, y) { assert.equal(x, 12); assert.equal(y, 34); return target; } };
}

test('resolves a cell from the element visually under the pointer', () => {
  const cell = { dataset: { row: '3', col: '4' } };
  const nested = { closest(selector) { assert.equal(selector, '.cell'); return cell; } };
  assert.deepEqual(getCellCoordinatesAtPoint(fakeDocument(nested), 12, 34), { row: 3, col: 4 });
});

test('returns null when pointer is over a non-cell element', () => {
  const target = { closest() { return null; } };
  assert.equal(getCellCoordinatesAtPoint(fakeDocument(target), 12, 34), null);
});

test('rejects malformed coordinates and invalid document references', () => {
  assert.equal(getCellCoordinatesAtPoint(null, 12, 34), null);
  assert.equal(getCellCoordinatesAtPoint({ elementFromPoint() { return { closest() { return { dataset: { row: '-1', col: '2' } }; } }; } }, 1, 2), null);
  assert.equal(getCellCoordinatesAtPoint({ elementFromPoint() { return null; } }, NaN, 2), null);
});

import { createAxisLockedStroke, getAxisLockedCell } from '../web-port/pointer-input.js';

test('horizontal drag remains locked to its starting row despite diagonal drift', () => {
  const stroke = createAxisLockedStroke({ row: 2, col: 1 }, 100, 100);
  assert.deepEqual(getAxisLockedCell(stroke, { row: 3, col: 2 }, 130, 112), { row: 2, col: 2 });
  assert.equal(stroke.axis, 'row');
  assert.deepEqual(getAxisLockedCell(stroke, { row: 4, col: 4 }, 160, 145), { row: 2, col: 4 });
});

test('vertical drag remains locked to its starting column despite diagonal drift', () => {
  const stroke = createAxisLockedStroke({ row: 1, col: 3 }, 100, 100);
  assert.deepEqual(getAxisLockedCell(stroke, { row: 2, col: 4 }, 111, 132), { row: 2, col: 3 });
  assert.equal(stroke.axis, 'column');
  assert.deepEqual(getAxisLockedCell(stroke, { row: 5, col: 6 }, 145, 180), { row: 5, col: 3 });
});

test('axis does not lock from small touch jitter and locks only once movement is clear', () => {
  const stroke = createAxisLockedStroke({ row: 0, col: 0 }, 20, 20);
  assert.equal(getAxisLockedCell(stroke, { row: 0, col: 1 }, 25, 22), null);
  assert.equal(stroke.axis, null);
  assert.deepEqual(getAxisLockedCell(stroke, { row: 1, col: 1 }, 42, 24), { row: 0, col: 1 });
  assert.equal(stroke.axis, 'row');
});

test('invalid axis stroke inputs are rejected safely', () => {
  assert.equal(createAxisLockedStroke(null, 1, 2), null);
  assert.equal(createAxisLockedStroke({ row: -1, col: 0 }, 1, 2), null);
  assert.equal(getAxisLockedCell(null, { row: 0, col: 0 }, 1, 2), null);
  assert.equal(getAxisLockedCell(createAxisLockedStroke({ row: 0, col: 0 }, 1, 2), null, 1, 2), null);
});
