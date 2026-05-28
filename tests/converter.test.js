const assert = require('node:assert/strict');
const test = require('node:test');
const { convertEquation, DIRECTIONS } = require('../src/converter');

const latexInput = String.raw`x \times 3 + \frac{y^{2}}{z} + \int_{1}^{2} {x^{3}} + \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} + \begin{cases} x = 1 \\ y = 2 \end{cases} + \acute{A} + \sqrt{x} + f \left( \frac{x}{y} \right) + g(x)`;

const hwpInput = 'x times 3 + y^2 over z + int_1^2 { { x^3 } } + pmatrix{1 & 2 # 3 & 4} + cases{x = 1 # y = 2} + acute A + sqrt x + f LEFT( x over y RIGHT) + g(x)';

test('converts LaTeX to Hangul/HWP equation syntax', () => {
  const result = convertEquation(latexInput, DIRECTIONS.LATEX_TO_HWP);
  assert.equal(result.output, hwpInput);
  assert.equal(result.sourceFormat, 'latex');
  assert.equal(result.targetFormat, 'hwpeqn');
  assert.ok(result.tokenCount > 0);
});

test('converts Hangul/HWP equation syntax to LaTeX', () => {
  const result = convertEquation(hwpInput, DIRECTIONS.HWP_TO_LATEX);
  assert.equal(result.output, latexInput);
  assert.equal(result.sourceFormat, 'hwpeqn');
  assert.equal(result.targetFormat, 'latex');
});

test('returns an empty successful result for blank input', () => {
  const result = convertEquation('   ', DIRECTIONS.LATEX_TO_HWP);
  assert.equal(result.ok, true);
  assert.equal(result.output, '');
  assert.equal(result.tokenCount, 0);
});

test('rejects unknown directions', () => {
  assert.throws(() => convertEquation('x', 'sideways'), /Unknown conversion direction/);
});

test('rejects trailing tokens instead of silently truncating input', () => {
  assert.throws(
    () => convertEquation('x y', DIRECTIONS.LATEX_TO_HWP),
    /토큰을 해석하지 못했습니다/,
  );
  assert.throws(
    () => convertEquation('x y', DIRECTIONS.HWP_TO_LATEX),
    /토큰을 해석하지 못했습니다/,
  );
});

test('rejects unsupported characters before parsing', () => {
  assert.throws(
    () => convertEquation('x + ☃', DIRECTIONS.LATEX_TO_HWP),
    /지원하지 않는 문자/,
  );
});
