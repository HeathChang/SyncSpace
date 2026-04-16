# Git & PR Workflow

> 이 파일은 브랜치 전략, 커밋 메시지, PR 프로세스에 관한 규칙이다.

## 브랜치 전략

| 브랜치 | 용도 | 머지 대상 |
|--------|------|-----------|
| `master` | 프로덕션 배포 | — |
| `develop` | 개발 통합 | `master` |
| `feature/*` | 기능 개발 | `develop` |
| `fix/*` | 버그 수정 | `develop` |
| `hotfix/*` | 긴급 수정 | `master` + `develop` |

- 브랜치명은 **소문자 kebab-case**: `feature/login-redesign`, `fix/donation-amount-validation`
- `master`, `develop`에 직접 push는 **금지** — 반드시 PR을 거친다.

---

## 커밋 메시지 컨벤션

```
<type>: <subject>

[optional body]
```

### Type

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 (기능 변경 없음) |
| `style` | 코드 스타일 변경 (포매팅, 세미콜론 등) |
| `test` | 테스트 추가/수정 |
| `docs` | 문서 변경 |
| `chore` | 빌드, 설정, 의존성 등 |

### 규칙

- subject는 **한국어** 또는 **영어** — 프로젝트 내에서 통일.
- 50자 이내, 마침표 없이 작성.
- body는 **왜(why)** 이 변경이 필요한지를 설명한다.

---

## PR 규칙

- PR 하나는 **하나의 관심사**만 다룬다.
- PR 설명에 다음을 포함한다:
  - **변경 사항 요약** (무엇을, 왜)
  - **테스트 방법** (어떻게 확인했는지)
  - **스크린샷** (UI 변경 시)
- 셀프 리뷰를 먼저 수행한 후 리뷰를 요청한다.

---

## AI 행동 규칙

- 커밋 메시지 작성 시 위 컨벤션을 따른다.
- PR 생성 시 변경 파일 전체를 분석하여 요약한다.
- `master`/`develop` 브랜치에 직접 push하지 않는다.
- force push는 사용자가 명시적으로 요청하지 않는 한 **금지**.
