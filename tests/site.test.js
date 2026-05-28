const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('styles.css', 'utf8');
const bundle = fs.readFileSync('assets/app.js', 'utf8');

test('static page exposes the expected conversion controls', () => {
  for (const selector of [
    'data-input',
    'data-output',
    'data-direction="latex-to-hwp"',
    'data-direction="hwp-to-latex"',
    'data-samples',
    'data-copy',
    'role="status"',
  ]) {
    assert.match(html, new RegExp(selector));
  }
});

test('page documents the supported syntax boundary', () => {
  assert.match(html, /hwp-eqn-ts/);
  assert.match(html, /지원하지 않는 문자는 오류로 표시/);
});

test('styles include keyboard focus and reduced-motion affordances', () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('generated browser bundle is present and contains converter UI code', () => {
  assert.match(bundle, /TokenType/);
  assert.match(bundle, /LaTeX/);
  assert.ok(bundle.length > 1000);
});
