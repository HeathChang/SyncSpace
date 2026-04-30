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
| Client → Server (요청/의도) | `user:join`, `message:send`, `board:create`, `board:move`, `board:delete`, `room:join`, `room:leave`, `notification:read` |
| Server → Client (상태 변경 방송) | `user:online`, `user:offline`, `presence:snapshot`, `message:new`, `board:updated`, `notification:new`, `notification:snapshot` |

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

---

## 5. Authentication (STEP 9)

### 5.1. JWT + httpOnly 쿠키

- 로그인 `POST /auth/login` → httpOnly 쿠키 `syncspace_token` 발급 (TTL 2시간).
- 클라이언트는 Socket 연결 시 `withCredentials: true`로 쿠키 자동 전달.
- Socket.IO `io.use(socketAuthMiddleware)` 에서 쿠키의 JWT를 검증.
  - 실패 시 `UNAUTHORIZED` 에러로 연결 거부.
  - 성공 시 `socket.data.userId`, `socket.data.userName` 주입.

### 5.2. USER_JOIN 의미 변경

- 기존: 페이로드의 `userId`로 유저 인증 (스푸핑 가능).
- 변경 후: JWT에서 인증된 `userId`만 사용 — 페이로드 `userId`는 **무시**.
- 클라이언트는 빈 객체 `{}` + `requestId`만 전송.

### 5.3. 인증 관련 에러 코드

- `UNAUTHORIZED`: JWT 없음/만료/위조
- 라우트 API (HTTP): 401 응답
- Socket: `io.use` 미들웨어에서 connection 차단

---

## 6. Notification System (STEP 10)

### 6.1. 이벤트

| 이벤트 | 방향 | 용도 |
|--------|------|------|
| `notification:new` | Server → Client | 실시간 개인 알림 단건 전달 |
| `notification:snapshot` | Server → Client | 연결/user:join 시 unread 포함 목록 일괄 전달 |
| `notification:read` | Client → Server | 특정 알림 읽음 처리 (ACK) |

### 6.2. 개인 이벤트 전송 패턴

- 인증된 소켓은 연결 직후 개인 Room `user:{userId}` 에 자동 합류.
- 서버는 `io.to(userRoom(userId)).emit(...)` 로 개인 대상 이벤트 전송.
- 같은 유저의 멀티 디바이스/탭에 동시 도달.

### 6.3. 알림 트리거 예시

- `board:create` 시 `assigneeId !== actorId` 이면 할당 대상자에게 `notification:new` 전송.
- 스토어는 유저당 최대 100개 유지 (FIFO).

### 6.4. Notification 페이로드

```ts
interface Notification {
    id: string;             // 서버 생성 UUID
    userId: string;         // 수신자
    kind: "board:assigned" | "board:mentioned" | "system:info";
    title: string;
    body: string;
    createdAt: string;      // ISO timestamp
    readAt?: string;        // 읽은 시각
    meta?: Record<string, string>;
}
```

### 6.5. 읽음 처리 규칙

- 클라이언트는 optimistic update 후 `notification:read` 전송.
- ACK 실패 시 read 상태 롤백 (useNotificationActions 참조).

---

## 7. Namespace 분리 (STEP 11)

각 도메인별로 Socket.IO namespace를 분리하여 관심사를 분할한다. 동일 TCP 연결을 멀티플렉싱하므로 추가 비용 없음.

| Namespace | 책임 | 이벤트 |
|-----------|------|--------|
| `/` (main) | 인증 / Presence / Notification | `user:join`, `user:online`, `user:offline`, `presence:snapshot`, `notification:*` |
| `/chat` | 채팅 메시지 | `room:join`, `room:leave`, `message:send`, `message:new` |
| `/board` | 협업 보드 + 커서 | `room:join`, `room:leave`, `board:create/move/delete`, `board:updated`, `cursor:move` |

### 7.1. 규칙

- **인증 미들웨어는 모든 namespace에 동일하게 적용** (`io.use(socketAuthMiddleware)` + 각 nsp.use).
- **Room은 namespace별로 독립**된 이름공간. 같은 `roomId`라도 namespace가 다르면 다른 Room.
- **Cross-namespace 이벤트 전송**은 `mainIo.to(userRoom(userId)).emit(...)` 처럼 명시적으로 사용.
  - 예: `/board`의 `BOARD_CREATE` 핸들러가 main namespace로 `notification:new` 전송.

### 7.2. 클라이언트 사용법

- `useSocketEmitAck({ namespace: eNamespace.board })` — 특정 namespace 사용.
- `useSocketEvent({ event, handler, namespace })` — 특정 namespace 이벤트 구독.
- 기본값은 `eNamespace.main`.

---

## 8. Scaling — Redis Adapter (STEP 12)

### 8.1. 다중 인스턴스 운영

- 환경변수 `REDIS_URL` 이 설정되면 `@socket.io/redis-adapter` 자동 적용.
- 미설정 시 in-memory adapter (단일 인스턴스 한정).
- 모든 인스턴스가 같은 Redis pub/sub을 통해 Room 메시지를 공유.

### 8.2. 주의사항

- DedupStore, NotificationStore, RateLimiter 등 **인스턴스 로컬 상태**는 여전히 프로세스 단위.
- 프로덕션 확장 시 Redis 기반 분산 상태 저장으로 마이그레이션 필요.
- 알림 같은 사용자별 데이터는 DB로 영속화 권장.

---

## 9. Performance (STEP 13)

### 9.1. 서버 — Token Bucket Rate Limiter

- per-socket per-event 단위로 버킷 관리 (`RateLimiter`).
- 정책: 일반 이벤트 capacity 30, 충전 10/s.
- 한도 초과 시 `INTERNAL_ERROR` ACK + "rate limit exceeded".

### 9.2. 클라이언트 — Throttle / Debounce

| 훅 | 용도 |
|----|------|
| `useThrottledEmit` | 고빈도 이벤트 (cursor 등): leading edge + trailing emit |
| `useDebouncedEmit` | 입력 종료 후 1회 emit (검색 자동완성 등) |

- 두 훅 모두 ACK 없는 fire-and-forget. 신뢰성이 중요하면 `useSocketEmitAck` 사용.
- `requestId`는 자동 포함.

---

## 10. Logging & Monitoring (STEP 14)

### 10.1. HTTP 로깅

- `httpLogger` 미들웨어가 method/path/status/elapsedMs 자동 기록.
- 모든 `/auth/*` 라우트에 적용됨.

### 10.2. 소켓 이벤트 자동 로깅

- `installEventLogger(socket)` 가 모든 인바운드 이벤트의 처리 시간/ACK 결과 기록.
- `cursor:move` 같은 고빈도 이벤트는 자동 제외 (HIGH_FREQ_EVENTS).
- ACK 콜백을 후크하여 `ok: true/false` 분류.

### 10.3. 에러 추적

- `socket.on("error", ...)` 핸들러가 모든 namespace에 자동 등록.
- err.message + stack 모두 pino로 구조화 로깅.

### 10.4. 로그 형식 (pino)

```
{"level":"info","socketId":"abc","userId":"u1","event":"message:send","ok":true,"elapsedMs":12,"msg":"socket event handled"}
```

- 프로덕션에서는 pino-pretty 제거하고 JSON 라인을 그대로 수집기(Datadog/Loki 등)로 전송.

---

## 11. 영속화 (Prisma + SQLite/PostgreSQL)

### 11.1. 데이터 모델

| 모델 | 책임 |
|------|------|
| `User` | 인증 정보 (id, name, **passwordHash**) |
| `Room` | 채팅/보드 룸 메타데이터 |
| `Message` | 영속 메시지 + roomId/createdAt 인덱스 |
| `BoardCard` | 보드 카드 (column, tags JSON) |
| `Notification` | 사용자별 알림, readAt nullable |

### 11.2. 환경 설정

- `DATABASE_URL` 환경변수로 SQLite/Postgres 전환.
- `npm run db:migrate` 로 마이그레이션, `npm run db:seed` 로 시드.
- 학습/로컬: `file:./dev.db`. 프로덕션: `postgresql://...`.

### 11.3. HTTP API (인증 필요)

| 엔드포인트 | 용도 |
|-----------|------|
| `GET /api/rooms` | 전체 룸 목록 |
| `GET /api/rooms/:roomId/messages?limit=50` | 룸 메시지 히스토리 |
| `GET /api/rooms/:roomId/cards` | 룸의 보드 카드 |
| `GET /api/users` | 유저 목록 |
| `GET /health` / `GET /ready` | 헬스 / DB readiness |

### 11.4. 클라이언트

- `useInitialData` 훅이 로그인 후 자동으로 REST API 호출 → 룸/유저/메시지/카드 로드.
- mock-data는 Storybook에서만 사용.

---

## 12. 분산 상태 (선택적 Redis 활성화)

| 컴포넌트 | 단일 인스턴스 | 멀티 인스턴스 (REDIS_URL 설정 시) |
|----------|---------------|-----------------------------------|
| Socket.IO Adapter | in-memory | `@socket.io/redis-adapter` (자동) |
| DedupStore | `DedupStore` (in-memory) | `RedisDedupStore` (자동 전환) |
| RateLimiter | in-memory | TODO: 분산 token bucket |
| NotificationStore | DB (Prisma) | DB (Prisma) |

- `REDIS_URL` 환경변수 존재 시 분산 모드로 자동 전환. 없으면 in-memory fallback.
- DedupStore 인터페이스 (`IDedupStore`)로 추상화되어 핸들러는 구현체를 모름.

---

## 13. Graceful Shutdown

`SIGINT`/`SIGTERM` 수신 시:
1. HTTP 서버 close (in-flight 요청 완료 대기)
2. Socket.IO close
3. Prisma `$disconnect()`
4. `process.exit(0)`

k8s/Docker 환경에서 안전한 롤링 배포 가능.
