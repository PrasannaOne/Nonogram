import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const seen = new Set();
for (const id of ids) {
  if (seen.has(id)) errors.push(`Duplicate HTML id: ${id}`);
  seen.add(id);
}

const app = fs.readFileSync(path.join(root, 'web-port/app.js'), 'utf8');
const directIds = [...app.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
for (const id of [...new Set(directIds)]) {
  if (!seen.has(id)) errors.push(`app.js references missing HTML id: ${id}`);
}

for (const [, attribute, value] of html.matchAll(/\b(src|href)=["']([^"']+)["']/g)) {
  if (/^(?:[a-z]+:|#|\/\/)/i.test(value)) continue;
  const localPath = path.resolve(root, value.split(/[?#]/, 1)[0]);
  if (!localPath.startsWith(root + path.sep) || !fs.existsSync(localPath)) {
    errors.push(`Missing or unsafe local ${attribute}: ${value}`);
  }
}

const moduleFiles = fs.readdirSync(path.join(root, 'web-port'))
  .filter(name => name.endsWith('.js'));
for (const name of moduleFiles) {
  const file = path.join(root, 'web-port', name);
  const source = fs.readFileSync(file, 'utf8');
  if (/\.\.\/?REFERENCE|FULL_RESEARCH_WORKSPACE/.test(source)) {
    errors.push(`${name} must not depend on the research workspace`);
  }
  for (const [, specifier] of source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)) {
    const resolved = path.resolve(path.dirname(file), specifier);
    if (!fs.existsSync(resolved)) errors.push(`${name} imports missing module: ${specifier}`);
  }
}

const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
for (const [index, [, attributes, content]] of buttons.entries()) {
  const hasName = /\baria-label=["'][^"']+/.test(attributes) || /\btitle=["'][^"']+/.test(attributes) ||
    content.replace(/<[^>]*>/g, '').trim().length > 0;
  if (!hasName) errors.push(`Button ${index + 1} has no accessible name`);
}

if (errors.length) {
  console.error(errors.map(error => `FAIL: ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Static audit passed: ${ids.length} unique HTML ids; ${new Set(directIds).size} direct app id references; ${buttons.length} named HTML buttons; ${moduleFiles.length} JS modules checked.`);
}
