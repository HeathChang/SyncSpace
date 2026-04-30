# Security Rules

> 이 파일은 프론트엔드 보안에 관한 규칙이다.

## 입력 값 처리

- 사용자 입력은 **항상 검증**한다 (클라이언트 + 서버 양쪽).
- 서버에서 모든 Socket 이벤트 페이로드는 **Zod 스키마**로 검증한다 (`server/src/schemas/event-schemas.ts`).
  - 통과 시 `validateAndDedup` 헬퍼가 검증된 타입 안전 페이로드를 반환.
  - 실패 시 `INVALID_INPUT` ACK + 구체적인 issue 메시지.
- `dangerouslySetInnerHTML`은 **원칙적으로 금지**. 불가피한 경우 DOMPurify 등으로 반드시 새니타이즈한다.
- URL 파라미터, 쿼리스트링 값은 사용 전 **타입/범위 검증** 후 사용한다.

---

## 민감 정보

- API 키, 시크릿, 토큰을 **코드에 하드코딩하지 않는다**.
- 환경 변수(`.env`)는 **커밋하지 않는다** (`.gitignore` 필수).
- 클라이언트에 노출되는 환경 변수(`NEXT_PUBLIC_*` 등)에 민감 정보를 넣지 않는다.

---

## 인증 / 인가

- 인증 토큰은 **httpOnly 쿠키** 사용을 우선한다 (localStorage 저장 지양).
- API 요청 시 인증 헤더가 누락되지 않도록 인터셉터/미들웨어 레벨에서 처리한다.
- 권한 체크는 **서버에서도 반드시** 수행한다 (프론트 단독 의존 금지).

### 비밀번호 처리

- 비밀번호는 **반드시 해싱**하여 저장한다. 평문 저장 금지.
- 해싱 알고리즘: **bcrypt** (saltRounds=10) 또는 argon2.
  - 구현: `server/src/auth/password.ts`의 `hashPassword`/`verifyPassword`.
- 시드 데이터에서도 평문 비밀번호를 DB에 직접 저장하지 않는다 (`prisma/seed.ts` 참조).

### JWT Secret 정책

- 프로덕션에서 `JWT_SECRET` 환경변수는 **반드시 32자 이상**의 무작위 시크릿이어야 한다.
  - 미설정 또는 32자 미만 시 서버는 시작 시점에 throw (`NODE_ENV=production` 한정).
  - dev/test 환경에서만 fallback 시크릿 허용.
- 시크릿은 **`.env` 파일에만** 두고 절대 커밋하지 않는다 (`.gitignore` 등록 필수).

---

## 의존성

- 새 패키지 추가 시 **다운로드 수, 마지막 업데이트, 알려진 취약점**을 확인한다.
- `npm audit` / `yarn audit` 경고는 무시하지 않는다.

---

## AI 행동 규칙

- 코드에 민감 정보가 포함되어 있으면 **즉시 경고**한다.
- `dangerouslySetInnerHTML` 사용 시 반드시 새니타이즈 여부를 확인한다.
- 외부 입력값을 그대로 렌더링하는 코드를 발견하면 XSS 위험을 알린다.
