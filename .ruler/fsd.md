# Feature-Sliced Design (FSD) Rules

> `base.md`, `frontend.md` 규칙을 상속한다. 이 파일은 FSD 아키텍처에 관한 규칙이다.

## 기본 원칙

- 모든 코드는 반드시 **FSD 레이어 중 하나에 속해야** 한다.
- 레이어를 건너뛰는 의존성은 **금지**한다.
- "일단 여기" 식의 파일 배치는 허용하지 않는다.
- 판단이 불가능한 경우, **작성을 멈추고 질문한다**.

---

## 레이어 정의

### `app` — 애플리케이션 초기화

- 전역 Provider (Theme, QueryClient 등), 전역 에러 처리, 라우팅 설정
- **허용**: `App.tsx`, `providers/`, `store/`
- **금지**: 비즈니스 로직, UI 컴포넌트

### `pages` — 라우트 단위 페이지

- URL / path param / query 검증, 페이지 조립
- feature / widget을 **조합만** 한다
- **금지**: 직접적인 비즈니스 로직

### `widgets` — 큰 UI 블록

- 여러 feature / entity를 조합하는 복합 UI 단위
- 예: `Header`, `Sidebar`, `CommentListWithInput`

### `features` — 사용자 행동 단위

- 하나의 "동사"를 표현한다
- 예: `login`, `signup`, `submitComment`
- **포함 가능**: UI, hooks, API 호출, 상태 관리

### `entities` — 도메인 모델

- 데이터 구조와 그에 대한 최소한의 로직
- 예: `user`, `post`
- **포함 가능**: type/interface, entity 단위 API, entity 전용 UI (Avatar, NameTag 등)

### `shared` — 재사용 코드

- 특정 도메인에 종속되지 않는 코드
- 예: 공통 UI, hooks, utils, constants, 디자인 토큰

---

## 의존성 방향 (아래 방향만 허용)

```
app → pages → widgets → features → entities → shared
```

**위반 예시:**
- `entities` → `features` import  ← 금지
- `shared` → `entities` import   ← 금지
- `features` → `pages` import    ← 금지

---

## Public API (barrel export)

각 슬라이스(slice)는 **`index.ts`로 공개 API를 정의**한다.

```
features/
  login/
    index.ts        ← 외부는 이 파일을 통해서만 접근
    ui/
    model/
    api/
    lib/
```

- 슬라이스 외부에서 내부 파일을 직접 import하는 것은 **금지**.
- `index.ts`에 노출하지 않은 것은 private으로 간주한다.

---

## AI 행동 규칙 — 파일 위치 결정

코드를 작성하기 전에 반드시 다음 순서로 판단한다:

1. 이 코드는 **라우트 책임인가?** → `pages`
2. **사용자 행동 단위인가?** → `features`
3. **도메인 모델인가?** → `entities`
4. **재사용 UI / 유틸인가?** → `shared`
5. **여러 개를 조합한 큰 블록인가?** → `widgets`

판단이 불가능한 경우 → **작성을 멈추고 사용자에게 질문한다.**

---

## 네이밍 규칙

- feature / entity 폴더명은 **소문자 kebab-case** (`login`, `submit-comment`)
- 슬라이스 내부 구조는 역할별로 분리:

```
{slice}/
  ui/          ← 컴포넌트
  model/       ← 상태, 타입
  api/         ← API 호출
  lib/         ← 유틸리티, 헬퍼
  index.ts     ← public API
```
