import test from 'node:test';
import assert from 'node:assert/strict';
import { getKeyboardCellTarget } from '../web-port/keyboard-input.js';

test('arrow keys navigate by one cell in a rectangular grid', () => {
  assert.deepEqual(getKeyboardCellTarget(1, 1, 'ArrowUp', 3, 4), { row: 0, col: 1 });
  assert.deepEqual(getKeyboardCellTarget(1, 1, 'ArrowDown', 3, 4), { row: 2, col: 1 });
  assert.deepEqual(getKeyboardCellTarget(1, 1, 'ArrowLeft', 3, 4), { row: 1, col: 0 });
  assert.deepEqual(getKeyboardCellTarget(1, 1, 'ArrowRight', 3, 4), { row: 1, col: 2 });
});

test('navigation clamps at grid edges', () => {
  assert.deepEqual(getKeyboardCellTarget(0, 0, 'ArrowUp', 3, 4), { row: 0, col: 0 });
  assert.deepEqual(getKeyboardCellTarget(2, 3, 'ArrowRight', 3, 4), { row: 2, col: 3 });
});

test('Home, End, PageUp and PageDown move to line boundaries', () => {
  assert.deepEqual(getKeyboardCellTarget(1, 2, 'Home', 3, 4), { row: 1, col: 0 });
  assert.deepEqual(getKeyboardCellTarget(1, 2, 'End', 3, 4), { row: 1, col: 3 });
  assert.deepEqual(getKeyboardCellTarget(1, 2, 'PageUp', 3, 4), { row: 0, col: 2 });
  assert.deepEqual(getKeyboardCellTarget(1, 2, 'PageDown', 3, 4), { row: 2, col: 2 });
});

test('unsupported keys and invalid grid coordinates return null', () => {
  assert.equal(getKeyboardCellTarget(0, 0, 'Tab', 3, 4), null);
  assert.equal(getKeyboardCellTarget(-1, 0, 'ArrowDown', 3, 4), null);
  assert.equal(getKeyboardCellTarget(0, 4, 'ArrowDown', 3, 4), null);
  assert.equal(getKeyboardCellTarget(0, 0, 'ArrowDown', 0, 4), null);
});
