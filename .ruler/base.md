# Base Coding Rules (Company Standard)

> 이 파일은 모든 코드에 적용되는 기본 규칙이다. 다른 ruler 파일은 이 규칙을 상속한다.

## AI 행동 원칙

- 모든 응답과 코드 설명은 **한국어**로 작성한다.
- 추측하지 않는다 — 불확실한 경우 반드시 질문한다.
- 가정이 필요한 경우: `"다음과 같이 가정하고 진행합니다"` 를 명시한다.
- 코드를 작성하기 전, 관련 ruler 파일을 먼저 읽고 규칙을 준수한다.
- 규칙 위반이 불가피한 경우, **이유를 주석으로 명시**한다.

---

## TypeScript 규칙

### 절대 금지 (위반 시 리뷰 거부)

| 항목 | 대안 |
|------|------|
| `any` 타입 | `unknown` + 런타임 타입 가드 |
| `as unknown as T` 이중 캐스팅 | 타입 설계 재검토 |
| `@ts-ignore` / `@ts-expect-error` 남발 | 근본 원인 해결 |
| `enum` (숫자 enum) | `as const` + union type |

### 필수 준수

- `strict: true` 환경을 전제로 작성한다.
- `as` 캐스팅은 **외부 라이브러리 타입 불일치** 등 불가피한 경우에만 사용하고, 사유를 주석으로 남긴다.
- 제네릭은 의미 있는 이름을 사용한다 (`T` → `TItem`, `TResponse` 등).

---

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 / 함수 | `camelCase` | `getUserName`, `itemCount` |
| 컴포넌트 / 타입 / 인터페이스 | `PascalCase` | `UserProfile`, `ApiResponse` |
| 상수 (진짜 상수만) | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| boolean | `is/has/can/should` 접두어 | `isLoading`, `hasPermission`, `canSubmit` |
| 이벤트 핸들러 | `handle` 접두어 (내부), `on` 접두어 (props) | `handleClick`, `onClick` |

---

## 함수 규칙

- 함수명은 **동사로 시작**한다 (`getUser`, `validateInput`, `formatDate`).
- 가능한 한 **순수 함수**로 작성한다 (같은 입력 → 같은 출력).
- 중첩 조건문 대신 **Early Return**을 사용한다.
- 함수 하나는 **하나의 책임**만 갖는다.
- 매개변수가 3개를 초과하면 **객체 파라미터**로 변경한다.

---

## Null / Undefined

- `null`과 `undefined`를 혼용하지 않는다.
- "값 없음"은 기본적으로 **`undefined`** 를 사용한다.
- API 응답 등 외부 데이터의 `null`은 가능한 빠른 시점에 `undefined`로 정규화한다.

---

## 에러 핸들링

- 에러는 **가능한 가까운 곳**에서 처리한다.
- catch 블록에서 에러를 삼키지 않는다 — 최소한 로깅한다.
- 사용자에게 노출되는 에러 메시지는 **기술 용어를 피한다**.
- 예상 가능한 에러(네트워크, 입력값)와 예상 불가 에러(버그)를 구분하여 처리한다.

---

## Import / Export

- **barrel export** (`index.ts`)는 각 모듈의 공개 API 역할을 한다.
- 모듈 외부에서는 반드시 barrel export를 통해 접근한다 (내부 파일 직접 import 금지).
- 순환 참조(circular dependency)가 발생하지 않도록 주의한다.
- 사용하지 않는 import는 즉시 제거한다.

---

## 절대 커밋 금지

- `console.log` / `console.warn` / `console.error` (디버깅용)
- 하드코딩된 API URL, 시크릿, 토큰
- 주석 처리된 코드 블록 (삭제할 것)
- `TODO` 주석 없이 임시로 작성한 코드
