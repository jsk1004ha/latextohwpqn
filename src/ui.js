const {
  DIRECTIONS,
  FORMAT_LABELS,
  SAMPLE_EQUATIONS,
  convertEquation,
  getFormatsForDirection,
  getSampleInput,
} = require('./converter');

const state = {
  direction: DIRECTIONS.LATEX_TO_HWP,
  lastResult: null,
};

const els = {};

function bindElements() {
  Object.assign(els, {
    app: document.querySelector('[data-app]'),
    input: document.querySelector('[data-input]'),
    output: document.querySelector('[data-output]'),
    sourceLabel: document.querySelector('[data-source-label]'),
    targetLabel: document.querySelector('[data-target-label]'),
    sourceHint: document.querySelector('[data-source-hint]'),
    targetHint: document.querySelector('[data-target-hint]'),
    directionButtons: Array.from(document.querySelectorAll('[data-direction]')),
    samples: document.querySelector('[data-samples]'),
    convertButton: document.querySelector('[data-convert]'),
    swapButton: document.querySelector('[data-swap]'),
    clearButton: document.querySelector('[data-clear]'),
    copyButton: document.querySelector('[data-copy]'),
    status: document.querySelector('[data-status]'),
    tokenCount: document.querySelector('[data-token-count]'),
    charCount: document.querySelector('[data-char-count]'),
  });
}

function setStatus(message, tone = 'neutral') {
  els.status.textContent = message;
  els.status.dataset.tone = tone;
}

function currentLabels() {
  const { sourceFormat, targetFormat } = getFormatsForDirection(state.direction);
  return {
    source: FORMAT_LABELS[sourceFormat],
    target: FORMAT_LABELS[targetFormat],
    sourceFormat,
    targetFormat,
  };
}

function renderSamples() {
  els.samples.replaceChildren(
    ...SAMPLE_EQUATIONS.map((sample) => {
      const button = document.createElement('button');
      button.className = 'sample-chip';
      button.type = 'button';
      button.dataset.sample = sample.id;
      button.textContent = sample.label;
      return button;
    }),
  );
}

function renderDirection() {
  const labels = currentLabels();
  els.sourceLabel.textContent = labels.source;
  els.targetLabel.textContent = labels.target;
  els.sourceHint.textContent = labels.sourceFormat === 'latex'
    ? String.raw`예: \frac{x}{y}, \sqrt{x}, \begin{pmatrix}...\end{pmatrix}`
    : '예: x over y, sqrt x, pmatrix{1 & 2 # 3 & 4}';
  els.targetHint.textContent = labels.targetFormat === 'latex'
    ? '복사해서 LaTeX 문서나 마크다운 수식에 붙여넣으세요.'
    : '한글 수식 입력창에 붙여넣을 수 있는 hwpeqn 문법입니다.';

  els.directionButtons.forEach((button) => {
    const selected = button.dataset.direction === state.direction;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function updateStats(result) {
  els.charCount.textContent = String(els.input.value.length);
  els.tokenCount.textContent = String(result?.tokenCount ?? 0);
}

function convertNow({ silent = false } = {}) {
  try {
    const result = convertEquation(els.input.value, state.direction);
    state.lastResult = result;
    els.output.value = result.output;
    updateStats(result);

    if (result.output) {
      setStatus(`${FORMAT_LABELS[result.sourceFormat]} → ${FORMAT_LABELS[result.targetFormat]} 변환 완료`, 'success');
    } else if (!silent) {
      setStatus('변환할 수식을 입력하거나 예제를 선택하세요.', 'neutral');
    }
  } catch (error) {
    state.lastResult = null;
    els.output.value = '';
    updateStats(null);
    setStatus(error?.message || '변환 중 오류가 발생했습니다.', 'danger');
  }
}

function debounce(fn, delay = 220) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}

function isKnownSampleInput(value) {
  const normalized = value.trim();
  return SAMPLE_EQUATIONS.some((sample) => (
    sample.latex === normalized || sample.hwpeqn === normalized
  ));
}

function setDirection(direction, { useCurrentOutput = false } = {}) {
  if (!Object.values(DIRECTIONS).includes(direction)) return;
  const previousOutput = els.output.value.trim();
  const previousInput = els.input.value.trim();
  state.direction = direction;
  renderDirection();

  if (useCurrentOutput && previousOutput) {
    els.input.value = previousOutput;
  } else if (!previousInput || isKnownSampleInput(previousInput)) {
    els.input.value = getSampleInput(SAMPLE_EQUATIONS[0].id, state.direction);
  }

  convertNow({ silent: true });
}

async function copyOutput() {
  const text = els.output.value.trim();
  if (!text) {
    setStatus('복사할 변환 결과가 없습니다.', 'neutral');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('결과를 클립보드에 복사했습니다.', 'success');
  } catch (_) {
    els.output.select();
    const copied = document.execCommand('copy');
    setStatus(
      copied ? '결과를 클립보드에 복사했습니다.' : '브라우저가 클립보드 복사를 차단했습니다. 결과를 직접 선택해 복사하세요.',
      copied ? 'success' : 'danger',
    );
  }
}

function bindEvents() {
  const convertDebounced = debounce(() => convertNow({ silent: true }));

  els.input.addEventListener('input', convertDebounced);
  els.convertButton.addEventListener('click', () => convertNow());
  els.copyButton.addEventListener('click', copyOutput);
  els.clearButton.addEventListener('click', () => {
    els.input.value = '';
    els.output.value = '';
    state.lastResult = null;
    updateStats(null);
    setStatus('입력창을 비웠습니다.', 'neutral');
    els.input.focus();
  });
  els.swapButton.addEventListener('click', () => {
    const nextDirection = state.direction === DIRECTIONS.LATEX_TO_HWP
      ? DIRECTIONS.HWP_TO_LATEX
      : DIRECTIONS.LATEX_TO_HWP;
    setDirection(nextDirection, { useCurrentOutput: true });
  });

  els.directionButtons.forEach((button) => {
    button.addEventListener('click', () => setDirection(button.dataset.direction));
  });

  els.samples.addEventListener('click', (event) => {
    const button = event.target.closest('[data-sample]');
    if (!button) return;
    els.input.value = getSampleInput(button.dataset.sample, state.direction);
    convertNow();
    els.input.focus();
  });
}

function boot() {
  bindElements();
  renderDirection();
  renderSamples();
  els.input.value = getSampleInput(SAMPLE_EQUATIONS[0].id, state.direction);
  bindEvents();
  convertNow({ silent: true });
}

window.addEventListener('DOMContentLoaded', boot);
