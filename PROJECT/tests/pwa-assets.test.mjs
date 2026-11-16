import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function pngDimensions(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('PWA manifest has a standalone scope and valid local icons', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any', 'installed app must support portrait and landscape');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.icons.length, 2);
  for (const icon of manifest.icons) {
    const file = path.join(root, icon.src);
    assert.ok(fs.existsSync(file), `missing icon ${icon.src}`);
    const dimensions = pngDimensions(file);
    assert.equal(dimensions.width, dimensions.height);
    assert.ok(dimensions.width >= 192);
  }
});

test('service worker precache list references existing same-origin app files', () => {
  const source = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
  const paths = [...source.matchAll(/['"](\.\/[^'"]+)['"]/g)].map(match => match[1]);
  assert.ok(paths.includes('./index.html'));
  assert.ok(paths.includes('./web-port/keyboard-input.js'));
  for (const relative of paths) {
    const file = path.resolve(root, relative);
    assert.ok(file.startsWith(root + path.sep) || file === root, `unsafe service worker path: ${relative}`);
    if (relative !== './') assert.ok(fs.existsSync(file), `missing precache file: ${relative}`);
  }
});

test('application registers service worker without making startup depend on it', () => {
  const app = fs.readFileSync(path.join(root, 'web-port/app.js'), 'utf8');
  assert.match(app, /navigator\.serviceWorker\.register\('\.\/service-worker\.js'\)/);
  assert.match(app, /catch\(error => console\.warn\('Nonogram offline support could not be registered:/);
});
