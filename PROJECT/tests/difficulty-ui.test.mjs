import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../web-port/app.js', import.meta.url), 'utf8');

test('settings exposes exactly Easy, Normal and Hard with accessible pressed state', () => {
  const choices = [...html.matchAll(/<button\b([^>]*)data-difficulty="([^"]+)"([^>]*)>(.*?)<\/button>/gs)];
  assert.deepEqual(choices.map(match => match[2]), ['easy', 'normal', 'hard']);
  for (const [, before, , after, label] of choices) {
    assert.match(before + after, /aria-pressed=/);
    assert.ok(label.trim().length > 0);
  }
  assert.match(html, /id="settingsDialog"/);
  assert.doesNotMatch(html, /data-difficulty="mixed"/);
});

test('difficulty switch persists the active profile and loads the selected profile', () => {
  assert.match(app, /if \(pointerDown\) finishStroke\(\)/);
  assert.match(app, /persist\(\);\s*gameState = selectGameMode\(gameState, nextMode\)/);
  assert.match(app, /progress = gameState\.profiles\[activeMode\]/);
  assert.match(app, /closeDialog\(\$\('settingsDialog'\)\)/);
});
