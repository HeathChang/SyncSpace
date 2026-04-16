# AI Coding Rules

이 디렉토리는 AI 코딩 에이전트가 코드를 작성/리뷰할 때 따라야 하는 규칙 모음이다.

> `.ruler`는 별도로 설치하는 도구가 아니다.
> 마크다운 파일로 작성된 **규칙 디렉토리 컨벤션**이며, AI 도구가 이 파일들을 읽고 규칙을 따르는 방식이다.

------

## 1. 에디터에 .ruler 연동하기

`.ruler/` 디렉토리는 그 자체로는 AI가 자동으로 읽지 않는다.
각 AI 도구의 **프로젝트 설정 파일**에 "이 규칙을 읽어라"고 알려줘야 한다.

### Claude Code 연동

프로젝트 루트에 `CLAUDE.md` 파일을 생성한다:

```bash
# 프로젝트 루트에서 실행
touch CLAUDE.md
```

`CLAUDE.md`에 다음 내용을 작성한다:

```markdown
# Project Rules

이 프로젝트의 코딩 규칙은 `.ruler/` 디렉토리에 정의되어 있다.
코드를 작성하거나 리뷰하기 전에 반드시 아래 파일들을 읽고 준수할 것:

- `.ruler/base.md` — 기본 코딩 규칙 (필수)
- `.ruler/frontend.md` — React 프론트엔드 규칙
- `.ruler/fsd.md` — FSD 아키텍처 규칙
- `.ruler/testing.md` — 테스트 규칙
- `.ruler/security.md` — 보안 규칙
- `.ruler/git-workflow.md` — Git/PR 규칙

작업별 프로세스:
- 기능 개발 시: `.ruler/prompts/feature-dev.md` 참조
- 코드 리뷰 시: `.ruler/prompts/code-review.md` 참조
- 개발 시작 전: `.ruler/prompts/pre-flight.md` 체크리스트 확인
```

> Claude Code는 대화 시작 시 `CLAUDE.md`를 자동으로 읽는다.
> 별도의 에디터 설정 변경은 필요 없다.

---

### Cursor AI 연동

프로젝트 루트에 `.cursorrules` 파일을 생성한다:

```bash
# 프로젝트 루트에서 실행
touch .cursorrules
```

`.cursorrules`에 다음 내용을 작성한다:

```markdown
# Project Rules

이 프로젝트의 코딩 규칙은 `.ruler/` 디렉토리에 정의되어 있다.
코드를 작성하거나 리뷰하기 전에 반드시 아래 파일들을 읽고 준수할 것:

- `.ruler/base.md` — 기본 코딩 규칙 (필수)
- `.ruler/frontend.md` — React 프론트엔드 규칙
- `.ruler/fsd.md` — FSD 아키텍처 규칙
- `.ruler/testing.md` — 테스트 규칙
- `.ruler/security.md` — 보안 규칙
- `.ruler/git-workflow.md` — Git/PR 규칙

작업별 프로세스:
- 기능 개발 시: `.ruler/prompts/feature-dev.md` 참조
- 코드 리뷰 시: `.ruler/prompts/code-review.md` 참조
- 개발 시작 전: `.ruler/prompts/pre-flight.md` 체크리스트 확인
```

> Cursor는 프로젝트 루트의 `.cursorrules`를 자동으로 읽는다.

추가로, Cursor Settings에서 프로젝트 규칙을 등록할 수도 있다:
1. `Ctrl+Shift+J` → **Rules** 탭
2. **Project Rules** 섹션에서 `+ Add Rule` 클릭
3. `.ruler/base.md` 등의 경로를 추가

<!-- 필요 시 다른 AI 도구 추가:
### GitHub Copilot 연동
  `.github/copilot-instructions.md`에 동일한 내용 추가

### Windsurf 연동
  `.windsurfrules` 파일에 동일한 내용 추가

### Cline 연동
  `.clinerules` 파일에 동일한 내용 추가
-->

---

## 2. .gitignore 설정

`.ruler/`는 팀원과 공유하기 위해 **Git에 포함**한다.
대신 각 AI 도구의 설정 파일은 개인 환경이므로 `.gitignore`에 추가한다:

```gitignore
# AI tool configs (개인 환경 — .ruler/는 공유)
CLAUDE.md
.cursorrules
# .github/copilot-instructions.md  # 필요 시 추가
# .windsurfrules                    # 필요 시 추가
# .clinerules                       # 필요 시 추가
```

> `.ruler/` 자체는 ignore하지 않는다 — 팀 전체가 동일한 규칙을 사용해야 하기 때문이다.

---

## 3. 동작 확인

설정이 잘 되었는지 확인하는 방법:

### Claude Code 확인

```bash
# 프로젝트 루트에서 Claude Code 실행
claude

# 아래 질문을 입력하여 규칙 인식 확인
> .ruler/base.md 파일을 읽고 요약해줘
```

AI가 base.md 내용을 정확히 요약하면 연동 성공.

### Cursor AI 확인

1. Cursor에서 프로젝트를 연다
2. `Ctrl+L` 로 AI Chat을 열고 아래 질문을 입력한다:

```
.ruler/base.md 파일을 읽고 요약해줘
```

AI가 base.md 내용을 정확히 요약하면 연동 성공.

---

## 4. 사용 시나리오

### 새 기능 개발할 때

1. AI에게 작업을 요청하기 전, `.ruler/prompts/pre-flight.md` 체크리스트를 확인한다
2. AI에게 `.ruler/prompts/feature-dev.md` 프로세스를 따르도록 지시한다
3. 예시:
   ```
   .ruler/prompts/feature-dev.md 프로세스를 따라서 로그인 기능을 구현해줘
   ```

### 코드 리뷰 요청할 때

1. AI에게 `.ruler/prompts/code-review.md` 기준으로 리뷰를 요청한다
2. 예시:
   ```
   .ruler/prompts/code-review.md 기준으로 이 PR을 리뷰해줘
   ```

### 일반 코딩 작업할 때

- AI가 `CLAUDE.md` 또는 `.cursorrules`를 통해 자동으로 `.ruler/` 규칙을 인식한다
- 별도 지시 없이도 base.md의 기본 규칙이 적용된다

---

## 부록

### 디렉토리 구조

```
.ruler/
├── README.md              ← 이 파일 (사용 가이드)
├── base.md                ← 기본 코딩 규칙 (모든 파일이 상속)
├── frontend.md            ← React 프론트엔드 규칙
├── fsd.md                 ← Feature-Sliced Design 아키텍처 규칙
├── testing.md             ← 테스트 규칙
├── git-workflow.md        ← Git 브랜치, 커밋, PR 규칙
├── security.md            ← 보안 규칙
└── prompts/               ← AI 작업별 프롬프트
    ├── code-review.md     ← 코드 리뷰 수행 프롬프트
    ├── feature-dev.md     ← 기능 개발 프로세스
    └── pre-flight.md      ← 개발 전 체크리스트
```

### 규칙 파일 vs 프롬프트 파일

| 구분 | 위치 | 역할 | 언제 읽는가 |
|------|------|------|-------------|
| **규칙 파일** | `.ruler/*.md` | "무엇을 지켜야 하는가" — 항상 적용되는 코딩 표준 | 모든 작업 시 자동 적용 |
| **프롬프트 파일** | `.ruler/prompts/*.md` | "어떻게 수행하는가" — 특정 작업의 절차 | 해당 작업 수행 시 명시적으로 참조 |

### 상속 관계

```
base.md (모든 규칙의 기반)
├── frontend.md (React 코드에 추가 적용)
│   └── fsd.md (FSD 아키텍처에 추가 적용)
├── testing.md (테스트 코드에 추가 적용)
├── security.md (보안 관련 추가 적용)
└── git-workflow.md (Git 작업에 추가 적용)
```

### 우선순위

규칙 간 충돌 시: `base.md` < 특화 규칙 파일 (더 구체적인 규칙이 우선)

---

### 커스터마이징

#### 규칙 추가

1. `.ruler/` 에 새 `.md` 파일을 생성한다
2. 상단에 상속 관계를 명시한다: `> base.md 규칙을 상속한다.`
3. AI 도구 설정 파일(`CLAUDE.md`, `.cursorrules`)에 새 파일 경로를 추가한다

#### 프롬프트 추가

1. `.ruler/prompts/` 에 새 `.md` 파일을 생성한다
2. AI에게 해당 프롬프트를 참조하도록 지시한다
