# Feature Development Prompt

> AI가 새 기능을 개발할 때 따르는 프로세스이다.

## 개발 전 — 컨텍스트 파악

1. **관련 ruler 파일 확인**: `base.md`, `frontend.md`, `fsd.md`, `testing.md` 읽기
2. **기존 코드 패턴 파악**: 동일 레이어의 기존 코드를 읽고 패턴을 따른다
3. **영향 범위 파악**: 변경이 다른 모듈에 미치는 영향을 미리 확인한다

---

## 개발 순서

### Step 1: 타입 정의

- 도메인 타입은 `entities/{도메인}/model/` 에 정의한다.
- API 응답/요청 타입은 `features/{기능}/api/` 에 정의한다.
- 공유 타입은 `shared/types/` 에 정의한다.
- **타입 먼저 작성** → 구현은 타입이 확정된 후.

### Step 2: API 레이어

- SWR hook으로 작성한다.
- 에러/로딩 상태 처리를 포함한다.
- `features/{기능}/api/` 에 위치한다.

### Step 3: 비즈니스 로직

- 순수 함수로 추출 가능한 로직을 먼저 분리한다.
- Custom Hook으로 상태와 액션을 캡슐화한다.
- `features/{기능}/model/` 에 위치한다.

### Step 4: UI 컴포넌트

- Presentational Component (`.ui.tsx`)를 먼저 작성한다.
- Container Component (`.container.tsx`)에서 로직을 연결한다.
- `features/{기능}/ui/` 에 위치한다.

### Step 5: 테스트

- 순수 함수 → unit test 작성 (`testing.md` 참조)
- `.ui.tsx` → Storybook 작성
- Custom Hook → 통합 테스트

### Step 6: Public API

- `features/{기능}/index.ts`에 외부 공개 항목만 export한다.
- 페이지에서 import하여 조립한다.

---

## 핵심 원칙

- **한 번에 하나의 책임**만 구현한다.
- 작은 단위의 함수로 나눈다.
- 읽기 쉬운 코드가 최우선이다.
- 구현 중 불확실한 부분이 있으면 **멈추고 질문**한다.

---

## AI 행동 규칙

- 각 Step을 순서대로 진행하며, 이전 Step이 완료되어야 다음으로 넘어간다.
- 파일 생성 전에 FSD 레이어 위치를 명시하고 확인한다.
- 기존 코드에 유사 패턴이 있으면 그 패턴을 따른다.
- 과도한 추상화를 피한다 — 실제 필요에 의한 추상화만 적용한다.
