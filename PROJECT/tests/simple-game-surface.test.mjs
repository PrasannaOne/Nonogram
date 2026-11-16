import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const css = fs.readFileSync(new URL('web-port/styles.css', root), 'utf8');
const app = fs.readFileSync(new URL('web-port/app.js', root), 'utf8');

test('brand sits at the upper left with heart, share and settings grouped on the right', () => {
  assert.match(html, /<h1 class="brand-title">Nonogram<\/h1>/);
  assert.match(html, /class="header-actions"[\s\S]*brand-heart[\s\S]*id="shareButton"[\s\S]*id="settingsButton"/);
  assert.match(html, /id="pointsBalance"/);
  assert.doesNotMatch(html, /id="modeLabel"/);
});

test('play surface has no visible progress sentence or extra explanatory copy', () => {
  assert.doesNotMatch(html, /id="feedback"/);
  assert.match(html, /id="liveStatus"/);
  assert.match(css, /\.sr-only\s*\{/);
  assert.doesNotMatch(app, /\$\('feedback'\)/);
});

test('grid remains square-cornered while game controls and glass surfaces are round', () => {
  assert.match(css, /\.cell\s*\{[\s\S]*border-radius:\s*0/);
  assert.match(css, /\.tool-button\s*\{[\s\S]*border-radius:\s*50%/);
  assert.match(css, /\.icon-button\s*\{[\s\S]*border-radius:\s*50%/);
  assert.match(css, /backdrop-filter:\s*blur\(/);
});

test('bottom tools use large round icon targets with accessible names', () => {
  assert.match(css, /\.tool-button\s*\{[^}]*aspect-ratio:\s*1/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(html, /aria-label="Undo last move"/);
  assert.match(html, /id="clearBoardButton"/);
  assert.match(html, /aria-label="Clear the entire grid"/);
  assert.doesNotMatch(html, /data-tool="erase"/);
  assert.match(html, /aria-label="Fill cells"/);
  assert.match(html, /aria-label="Cross cells"/);
});
