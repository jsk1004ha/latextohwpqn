# LaTeX ↔ 한글(HWP) 수식 변환기

`hwp-eqn-ts`를 브라우저에 번들링한 정적 HTML 변환기입니다. LaTeX 수식을 한글(HWP) 수식 문법으로, 한글 수식 문법을 LaTeX로 변환합니다.

## 사용

```bash
npm install
npm run verify
```

그 뒤 `index.html`을 브라우저로 열면 됩니다. 배포할 때는 `index.html`, `styles.css`, `assets/app.js`, `THIRD_PARTY_NOTICES.md`를 함께 올리면 됩니다.

## 개발 메모

- `src/converter.js`: `hwp-eqn-ts` 기반 변환 래퍼와 지원 토큰 검증.
- `src/ui.js`: DOM 이벤트, 예제 선택, 방향 전환, 클립보드 복사.
- `assets/app.js`: `npm run build`로 생성되는 브라우저 실행 번들입니다. 직접 수정하지 말고 `src/`를 수정한 뒤 다시 빌드하세요.
- 변환 범위는 `hwp-eqn-ts`가 지원하는 문법에 따릅니다. 해석하지 못한 토큰과 지원하지 않는 문자는 오류로 표시합니다.

## 원본 라이브러리

- https://github.com/franknoh/hwp-eqn-ts/
- License: MIT (see `THIRD_PARTY_NOTICES.md`)
