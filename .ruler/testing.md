# Testing Rules

> `base.md` 규칙을 상속한다. 이 파일은 테스트 코드에 관한 규칙이다.

## 테스트 필수 대상

| 대상 | 테스트 도구 | 수준 |
|------|------------|------|
| 순수 함수 (utils, helpers) | Jest unit test | **필수** |
| Custom Hook | Jest + renderHook | **필수** |
| Presentational Component (`.ui.tsx`) | Storybook | **필수** |
| Container 비즈니스 로직 | Jest 통합 테스트 | 권장 |
| 페이지 주요 플로우 | E2E (추후 도입 시) | 권장 |

---

## 테스트 파일 위치 및 네이밍

- 테스트 파일은 테스트 대상 파일과 **같은 디렉토리**에 위치한다.
- 네이밍: `{대상파일명}.test.ts` 또는 `{대상파일명}.test.tsx`
- Storybook: `{대상파일명}.stories.tsx`

```
features/login/
  model/
    validate.ts
    validate.test.ts    ← 같은 폴더
  ui/
    LoginForm.ui.tsx
    LoginForm.stories.tsx  ← 같은 폴더
```

---

## 테스트 네이밍 규칙

다음 두 가지 중 하나로 **통일**한다:

### 옵션 A: `should` 형식
```typescript
describe('validateEmail', () => {
  it('should return true for valid email format', () => { ... });
  it('should return false when @ is missing', () => { ... });
});
```

### 옵션 B: `given / when / then` 형식
```typescript
describe('validateEmail', () => {
  describe('given a valid email', () => {
    it('returns true', () => { ... });
  });
  describe('given an email without @', () => {
    it('returns false', () => { ... });
  });
});
```

---

## 테스트 원칙

- **테스트 없는 리팩토링은 금지.** 기존 테스트가 없으면 먼저 테스트를 추가한 후 리팩토링한다.
- 테스트는 **구현이 아닌 동작**을 검증한다 (내부 상태 직접 접근 금지).
- 테스트 간 **독립성**을 유지한다 (실행 순서에 의존하지 않음).
- **모킹 최소화**: 외부 의존성(API, 타이머)만 모킹한다. 내부 모듈 모킹은 설계 문제의 신호.
- 각 테스트는 **하나의 동작**만 검증한다.

---

## Storybook 규칙

- `.ui.tsx` 파일은 **반드시** `.stories.tsx` 파일을 함께 작성한다.
- 최소한 다음 스토리를 포함한다:
  - **Default**: 기본 상태
  - **주요 변형**: props 조합에 따른 시각적 차이
  - **Edge case**: 빈 데이터, 긴 텍스트, 에러 상태 등

---

## 커밋 전 테스트 체크

```bash
npm run type-check   # 타입 체크 통과
npm run lint         # 린트 통과
npm run test         # 테스트 통과
```

세 가지 모두 통과해야 커밋할 수 있다.
