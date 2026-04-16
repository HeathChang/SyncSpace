# Pre-Flight Checklist

> 코드 작성 **전에** 반드시 확인하는 체크리스트이다.
> 각 항목의 상세 규칙은 해당 ruler 파일을 참조한다 — 여기서는 체크 항목만 나열한다.

---

## 1. 규칙 파일 확인

- [ ] 작업에 관련된 ruler 파일을 모두 읽었는가?
  - `base.md` → 기본 코딩 규칙
  - `frontend.md` → React 규칙
  - `fsd.md` → FSD 아키텍처
  - `testing.md` → 테스트 규칙
  - `security.md` → 보안 규칙
  - `git-workflow.md` → Git/PR 규칙

---

## 2. FSD 레이어 판단 (`fsd.md` 참조)

- [ ] 이 코드는 어느 레이어에 속하는가?
  - `app` / `pages` / `widgets` / `features` / `entities` / `shared`
- [ ] 레이어 간 의존성 방향은 올바른가? (아래 방향만 허용)

---

## 3. 타입 정의 (`base.md` 참조)

- [ ] 타입/인터페이스를 먼저 작성했는가?
- [ ] `any` 타입을 사용하지 않았는가?

---

## 4. 컴포넌트 역할 분리 (`frontend.md` 참조)

- [ ] `.ui.tsx` (Presentational)와 `.container.tsx` (Container)를 분리했는가?
- [ ] 비즈니스 로직이 JSX에 섞이지 않았는가?

---

## 5. 스타일 & 접근성 (`frontend.md` 참조)

- [ ] 디자인 토큰을 사용했는가? (하드코딩 금지)
- [ ] 접근성 필수 속성을 포함했는가? (alt, label, aria-label, role)

---

## 6. 상태 관리 (`frontend.md` 참조)

- [ ] 서버 상태는 SWR을 사용했는가?
- [ ] UI 상태와 서버 상태를 분리했는가?

---

## 7. 테스트 전략 (`testing.md` 참조)

- [ ] 순수 함수 → unit test 작성 예정인가?
- [ ] `.ui.tsx` → Storybook 작성 예정인가?

---

## 8. 보안 (`security.md` 참조)

- [ ] 사용자 입력을 검증하고 있는가?
- [ ] 민감 정보가 코드에 포함되지 않았는가?

---

## 9. 커밋 전 최종 체크

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] `npm run test` 통과
- [ ] `console.log` 제거 확인
- [ ] 하드코딩 값 확인
- [ ] 테스트/Storybook 파일 존재 확인
