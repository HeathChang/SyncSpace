# Socket Event Contract

> 이 파일은 클라이언트 ↔ 서버 간 Socket.IO 이벤트의 공통 규약이다.
> 새 이벤트를 추가하거나 기존 이벤트를 수정할 때 반드시 이 규약을 따른다.

---

## 1. 네이밍 규칙

### 형식: `{domain}:{action}`

- 소문자 + 콜론 구분. 스네이크/카멜 케이스 혼용 금지.
- 도메인은 **명사 단수**, 액션은 **동사 또는 상태**.

| 방향 | 예시 |
|------|------|
| Client → Server (요청/의도) | `user:join`, `message:send`, `board:create`, `board:move`, `board:delete`, `room:join`, `room:leave` |
| Server → Client (상태 변경 방송) | `user:online`, `user:offline`, `presence:snapshot`, `message:new`, `board:updated` |

### 의미 구분
- Client → Server는 **의도(intent)** 를 표현 (`send`, `create`, `move`).
- Server → Client는 **결과(result)** 를 표현 (`new`, `updated`, `online`).

---

## 2. Envelope 공통 규약

### 요청 (Client → Server)

모든 요청은 `RequestEnvelope<T>`로 감싼다.

```ts
type RequestEnvelope<T> = T & { requestId: string };
```

- `requestId`는 클라이언트가 생성 (UUID).
- 서버는 동일 `requestId`의 재수신을 `DUPLICATE_REQUEST`로 거부.

### 응답 (ACK 콜백)

모든 요청은 **ACK 콜백으로 `EventAck<TData>`** 를 반환한다 (예외: `cursor:move` 같은 고빈도 단방향 이벤트).

```ts
type EventAck<TData = void> =
  | { ok: true; data: TData }
  | { ok: false; error: { code: ErrorCode; message: string } };
```

### 에러 코드

```ts
enum eErrorCode {
  INVALID_INPUT = "INVALID_INPUT",         // 페이로드 형식 오류
  ROOM_REQUIRED = "ROOM_REQUIRED",         // roomId 누락
  UNAUTHORIZED = "UNAUTHORIZED",           // 인증/유저 조인 필요
  DUPLICATE_REQUEST = "DUPLICATE_REQUEST", // 동일 requestId 재수신
  INTERNAL_ERROR = "INTERNAL_ERROR",       // 서버 내부 오류, 타임아웃
}
```

---

## 3. Reliability 규칙 (STEP 8)

### 3.1. 중복 요청 방지 (Idempotency)

- 서버는 소켓별로 최근 `requestId`를 **TTL 30초 / 최대 256개** 보관 (`DedupStore`).
- 동일 `requestId` 재수신 시 **상태를 변경하지 않고** `DUPLICATE_REQUEST` 반환.
- 연결 끊김/재연결 중 UI 재시도가 동일 이벤트를 두 번 전송해도 안전.

### 3.2. ACK 타임아웃

- 클라이언트 `useSocketEmitAck`는 기본 **5초** 타임아웃.
- 타임아웃 시 `INTERNAL_ERROR` 코드로 resolve (재시도는 호출자 책임).

### 3.3. 재연결 복구

- `useSocketReconnect` 훅으로 재연결 시점에 복구 로직 실행.
- 필수 복구 절차:
  1. `user:join` 재전송 → 세션 재수립
  2. `room:join` 재전송 → 이전 Room 재참여
  3. 메시지 dedup 캐시 초기화

### 3.4. 메시지 중복 방지 (클라이언트)

- 서버 `message:new` 방송이 재연결 중 중복 도달할 수 있음.
- 클라이언트는 `{roomId}:{userId}:{timestamp}:{message}` 조합을 dedup 키로 사용.

---

## 4. AI 행동 규칙

### 새 이벤트 추가 시

1. `server/src/socket.types.ts`와 `client/src/shared/socket/socket.type.ts`에 **동시에** 추가 (enum + interface).
2. `ClientToServerEvents`는 `RequestEnvelope<T>` + `AckCallback<TData>` 시그니처 사용.
3. 서버 핸들러에 `checkDedup()` 호출 필수.
4. 서버는 모든 경로에서 ACK를 1회 호출 (성공/실패 모두).
5. 입력 검증 실패 시 `INVALID_INPUT` + 구체적 메시지 반환.

### 기존 이벤트 수정 시

- 페이로드 필드 제거는 **후방호환 깨짐** — 새 이벤트를 만들고 구 이벤트는 deprecation 주석 추가.
- 추가 필드는 optional로 도입 후 마이그레이션 완료 후 required 전환.

### 금지 사항

- ACK 없이 요청을 보내는 코드 (`socket.emit(event, payload)` 직접 호출 금지, `useSocketEmit`/`useSocketEmitAck` 훅 사용).
- `console.log`로 이벤트 디버깅 (로거 사용, `logger.info`/`logger.warn`).
- `requestId` 없는 요청 전송 (`useSocketEmit` 계열은 자동 생성).
