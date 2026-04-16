# Frontend Rules (React)

> `base.md` 규칙을 상속한다. 이 파일은 React 프론트엔드 코드에 추가로 적용되는 규칙이다.

## 컴포넌트 기본 원칙

- **함수 컴포넌트만** 사용한다. 클래스형 컴포넌트는 금지.
- 한 컴포넌트 파일이 **200줄을 초과**하면 분리를 검토한다.
- `default export`는 **Page 컴포넌트**에서만 허용한다. 그 외는 named export.

---

## 컴포넌트 역할 분리 (강제)

### Presentational Component — `{Name}.ui.tsx`

- **UI 렌더링만** 담당한다.
- 비즈니스 로직, API 호출, 전역 상태 접근을 포함하지 않는다.
- Props를 통해서만 데이터를 받는다.
- Storybook 작성 **필수**.

### Container Component — `{Name}.container.tsx`

- 비즈니스 로직, Hook 사용, 데이터 가공을 담당한다.
- SRP(단일 책임 원칙)를 준수한다.
- UI를 직접 렌더링하지 않고, Presentational Component에 위임한다.

### Page Component — `{Name}.page.tsx`

- 라우트 단위 책임만 갖는다.
- path parameter / query 검증, redirect 처리.
- feature / widget을 **조합만** 한다.

---

## Hooks 규칙

- 커스텀 훅은 `useXxx` 형태로 작성한다.
- 훅은 **UI 렌더링 로직을 포함하지 않는다** (JSX 반환 금지).
- 하나의 훅은 **데이터 / 상태 / 액션** 중 하나의 관심사만 담당한다.
- 훅 내부 로직이 복잡해지면 순수 함수로 추출한다.

---

## 상태 관리

| 상태 유형 | 도구 | 규칙 |
|-----------|------|------|
| **서버 상태** (API 데이터) | RTK Query | `fetch` 직접 사용 금지, RTK Query 캐싱 활용 |
| **로컬 UI 상태** (모달, 토글) | useState / useReducer | 컴포넌트에 가장 가까운 곳에 선언 |
| **공유 UI 상태** (테마, 인증) | Context | 최소 범위의 Provider 사용 |

- 전역 상태에 모든 것을 올리는 행위는 **금지**한다.
- UI 상태와 서버 상태를 같은 store에 혼합하지 않는다.

---

## 스타일 규칙

- 스타일은 **Tailwind CSS로 통일**한다.
- 디자인 토큰(색상, 간격, 폰트 크기, border-radius 등)은 CSS 변수(`app/styles/globals.css`)에 정의하고, `tailwind.config.js`를 통해 `text-text-main`, `bg-bg-card` 등의 유틸리티 클래스로 사용한다.
- **하드코딩 절대 금지**: 색상값, 간격값, 폰트 크기를 직접 입력하지 않는다.

---

## 접근성 (a11y) 필수 사항

| 요소 | 필수 속성 |
|------|-----------|
| `<img>` | `alt` (장식용이면 `alt=""`) |
| `<input>` | `<label>` 연결 또는 `aria-label` |
| 클릭 가능 영역 | `<button>` 또는 `<a>` 사용 (`div` + onClick 금지) |
| 아이콘 버튼 | `aria-label` 필수 |
| 모달/다이얼로그 | `role="dialog"`, `aria-modal="true"`, 포커스 트랩 |

---

## 성능 가이드라인

- `React.memo`: props가 자주 변하지 않는 **리스트 아이템**, **하위 트리가 큰 컴포넌트**에 적용.
- `useMemo`: **비용이 높은 계산**(필터링, 정렬, 변환)에만 사용. 단순 값에 남용 금지.
- `useCallback`: **자식 컴포넌트에 전달하는 핸들러**가 불필요 리렌더를 유발할 때만 사용.
- 이미지: `loading="lazy"` 적용, 적절한 사이즈 사용.
- 대량 리스트: 가상화(virtualization) 검토.

> 성능 최적화는 **측정 후** 적용한다. 추측 기반 최적화 금지.
