const { Tokenizer, HwpParser, LatexParser, TokenType } = require('hwp-eqn-ts');

const DIRECTIONS = Object.freeze({
  LATEX_TO_HWP: 'latex-to-hwp',
  HWP_TO_LATEX: 'hwp-to-latex',
});

const FORMAT_LABELS = Object.freeze({
  latex: 'LaTeX',
  hwpeqn: '한글 수식',
});

const SAMPLE_EQUATIONS = Object.freeze([
  {
    id: 'fraction-integral',
    label: '분수 · 적분',
    latex: String.raw`x \times 3 + \frac{y^{2}}{z} + \int_{1}^{2} {x^{3}}`,
    hwpeqn: 'x times 3 + y^2 over z + int_1^2 { { x^3 } }',
  },
  {
    id: 'matrix-cases',
    label: '행렬 · cases',
    latex: String.raw`\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} + \begin{cases} x = 1 \\ y = 2 \end{cases}`,
    hwpeqn: 'pmatrix{1 & 2 # 3 & 4} + cases{x = 1 # y = 2}',
  },
  {
    id: 'decorations-root',
    label: '루트 · 장식',
    latex: String.raw`\acute{A} + \sqrt{x} + f \left( \frac{x}{y} \right) + g(x)`,
    hwpeqn: 'acute A + sqrt x + f LEFT( x over y RIGHT) + g(x)',
  },
]);

function getFormatsForDirection(direction) {
  switch (direction) {
    case DIRECTIONS.LATEX_TO_HWP:
      return { sourceFormat: 'latex', targetFormat: 'hwpeqn' };
    case DIRECTIONS.HWP_TO_LATEX:
      return { sourceFormat: 'hwpeqn', targetFormat: 'latex' };
    default:
      throw new Error(`Unknown conversion direction: ${direction}`);
  }
}

function tokenKind(token) {
  return TokenType[token.type] || String(token.type);
}

function assertKnownTokens(tokens, sourceFormat) {
  const unknown = tokens.find((token) => token.type === TokenType.UNKNOWN);
  if (unknown) {
    throw new Error(`${FORMAT_LABELS[sourceFormat]}에서 지원하지 않는 문자 "${unknown.value}"가 있습니다.`);
  }
}

function parseAll(tokens, sourceFormat) {
  const parser = sourceFormat === 'latex' ? new LatexParser(tokens) : new HwpParser(tokens);
  const ast = parser.parseExpression();
  const nextToken = parser.tokens[parser.pos];

  if (nextToken && nextToken.type !== TokenType.EOF) {
    throw new Error(
      `${FORMAT_LABELS[sourceFormat]} 수식의 "${nextToken.value}" 토큰을 해석하지 못했습니다. ` +
      `연산자나 괄호를 확인하세요. (${tokenKind(nextToken)})`,
    );
  }

  return ast;
}

function convertEquation(input, direction = DIRECTIONS.LATEX_TO_HWP) {
  const { sourceFormat, targetFormat } = getFormatsForDirection(direction);
  const source = String(input ?? '').trim();

  if (!source) {
    return {
      ok: true,
      input: '',
      output: '',
      sourceFormat,
      targetFormat,
      tokenCount: 0,
      ast: null,
    };
  }

  const tokens = Tokenizer.tokenize(source, sourceFormat);
  assertKnownTokens(tokens, sourceFormat);
  const ast = parseAll(tokens, sourceFormat);
  const output = Tokenizer.decode(ast, targetFormat);
  const tokenCount = tokens.filter((token) => token.value !== '').length;

  return {
    ok: true,
    input: source,
    output,
    sourceFormat,
    targetFormat,
    tokenCount,
    ast,
  };
}

function getSampleInput(sampleId, direction = DIRECTIONS.LATEX_TO_HWP) {
  const sample = SAMPLE_EQUATIONS.find((item) => item.id === sampleId) || SAMPLE_EQUATIONS[0];
  return direction === DIRECTIONS.LATEX_TO_HWP ? sample.latex : sample.hwpeqn;
}

module.exports = {
  DIRECTIONS,
  FORMAT_LABELS,
  SAMPLE_EQUATIONS,
  convertEquation,
  getFormatsForDirection,
  getSampleInput,
};
