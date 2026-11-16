import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../web-port/app.js', import.meta.url), 'utf8');

test('launch page opens directly on the puzzle with lightweight settings and about overlays', () => {
  assert.match(html, /<div class="board" id="board"/);
  assert.match(html, /id="settingsDialog"/);
  assert.match(html, /id="aboutDialog"/);
  assert.match(html, /id="shareButton"/);
  assert.match(html, /id="settingsButton"/);
  assert.match(html, /class="icon-button brand-heart"/);
  assert.match(html, /prasannaone\.github\.io/);
  assert.match(html, /github\.com\/PrasannaOne\/Nonogram/);
  assert.match(html, /id="pointsBalance"/);
  assert.match(html, /aria-label="Use a hint, costs 5 points"/);
  assert.match(app, /puzzle\.points/);
  assert.doesNotMatch(html, /id="startScreen"/);
});

test('winning commits progress and automatically loads the next level', () => {
  assert.match(app, /progress = completeLevel\(progress, finishedLevel, puzzle\.fingerprint, puzzle\.points\)/);
  assert.match(app, /advanceTimer = setTimeout\(/);
  assert.match(app, /loadLevel\(progress\.currentLevel\)/);
  assert.equal(app.includes('showModal'), true, 'settings/about overlays use native modal dialogs');
});

test('game startup resumes directly from the saved current level', () => {
  assert.match(app, /loadLevel\(progress\.currentLevel \|\| 1\)/);
});

test('only the single-cell hint is wired into the endless game', () => {
  assert.match(app, /spendHintPoints\(progress\)/);
  assert.match(app, /board\.giveHint\(puzzle\.solution\)/);
  assert.equal(app.includes('giveLineHint'), false);
  assert.equal(html.includes('line-hint'), false);
});
