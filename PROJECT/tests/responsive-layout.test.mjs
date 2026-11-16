import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateBoardLayout } from '../web-port/layout.js';

const css = fs.readFileSync(new URL('../web-port/styles.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../web-port/app.js', import.meta.url), 'utf8');

const viewports = [
  ['small Android portrait', 320, 568, 0.55],
  ['standard Android portrait', 360, 800, 0.55],
  ['large Android portrait', 432, 960, 0.55],
  ['compact landscape', 667, 375, 0.70],
  ['wide landscape', 800, 360, 0.70],
  ['tablet portrait', 768, 1024, 0.55],
  ['desktop', 1280, 900, 0.55]
];

test('12x12 layout keeps square cells and fits representative screen sizes', () => {
  for (const [name, width, height, heightRatio] of viewports) {
    const availableHeight = height * heightRatio;
    const layout = calculateBoardLayout({ width: width - 20, height: availableHeight, size: 12, maxRowClueChars: 11, maxColumnClues: 6 });
    assert.ok(layout.cellSize >= 12, `${name}: touch cell should remain at least 12px in this viewport model`);
    assert.equal(layout.boardWidth, layout.rowClueWidth + 12 * layout.cellSize, `${name}: board width`);
    assert.equal(layout.boardHeight, layout.columnClueHeight + 12 * layout.cellSize, `${name}: board height`);
    assert.ok(layout.boardWidth <= width - 20, `${name}: board must fit horizontally`);
    assert.ok(layout.boardHeight <= availableHeight, `${name}: board must fit vertically`);
  }
});

test('row clue band expands for multi-digit clues', () => {
  const short = calculateBoardLayout({ width: 360, height: 400, size: 12, maxRowClueChars: 3, maxColumnClues: 4 });
  const long = calculateBoardLayout({ width: 360, height: 400, size: 12, maxRowClueChars: 6, maxColumnClues: 4 });
  assert.ok(long.rowClueWidth > short.rowClueWidth);
});

test('layout rejects invalid dimensions and clue counts', () => {
  assert.throws(() => calculateBoardLayout({ width: 0, height: 100, size: 12 }), RangeError);
  assert.throws(() => calculateBoardLayout({ width: 100, height: 100, size: 13 }), RangeError);
  assert.throws(() => calculateBoardLayout({ width: 100, height: 100, size: 12, maxRowClueChars: 37 }), RangeError);
});

test('app recalculates board metrics when the available area or orientation changes', () => {
  assert.match(app, /calculateBoardLayout/);
  assert.match(app, /new ResizeObserver\(updateBoardMetrics\)/);
  assert.match(app, /orientationchange/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /--grid-stroke: clamp\(1\.35px, \.38vw, 2\.5px\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test('all grid tracks use the same cell-size variable on both axes', () => {
  assert.match(css, /grid-template-columns:\s*var\(--row-clue-width\) repeat\(var\(--n\), var\(--cell-size\)\)/);
  assert.match(css, /grid-template-rows:\s*var\(--column-clue-height\) repeat\(var\(--n\), var\(--cell-size\)\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(var\(--n\), var\(--cell-size\)\)/);
  assert.match(css, /grid-template-rows:\s*repeat\(var\(--n\), var\(--cell-size\)\)/);
});
