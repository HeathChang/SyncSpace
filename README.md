# SyncSpace

## 1. Overview

**SyncSpace**는 Socket.IO 기반의 실시간 협업 플랫폼이다.
단순 채팅을 넘어, **이벤트 기반 아키텍처와 상태 동기화**를 중심으로 실무 수준의 구조를 구현하는 것을 목표로 한다.

---

## 2. Objectives

### 핵심 목표

* WebSocket(Socket.IO) 구조 완전 이해
* 실시간 상태 동기화 설계 경험
* 이벤트 기반 아키텍처 설계 능력 확보
* 확장 가능한 서버 구조 학습

### 구현 범위

* 실시간 채팅
* 협업 보드 (상태 동기화)
* 사용자 상태 관리
* 알림 시스템
* 인증 및 권한 처리
* 스케일링 구조

---

## 3. Core Features

### 1) Real-time Chat

* Room 기반 채팅
* 메시지 브로드캐스트
* 메시지 히스토리 관리

### 2) Presence System

* 사용자 접속 상태 (online / offline)
* 실시간 상태 전파

### 3) Collaborative Board

* 카드 생성 / 이동 / 삭제
* 다중 사용자 상태 동기화

### 4) Notification System

* 특정 유저 대상 이벤트 전달
* unread 상태 관리

---

## 4. Tech Stack

### Frontend

* React
* Socket.IO Client

### Backend

* Node.js
* Express
* Socket.IO

### Optional (Advanced)

* Redis (Pub/Sub, scaling)
* Database (MongoDB / PostgreSQL)

---

## 5. Architecture

```plaintext
Client (React)
 ├── REST API (초기 데이터 로딩)
 └── Socket.IO (실시간 통신)

Server (Node.js)
 ├── Express (HTTP API)
 └── Socket.IO (Event Server)

Scaling (Optional)
 └── Redis Adapter (Multi-instance)
```

---

## 6. Event Design Strategy

### Naming Convention

#### Client → Server

* `message:send`
* `board:create`
* `board:move`
* `user:join`

#### Server → Client

* `message:new`
* `board:updated`
* `user:online`
* `user:offline`

### Principles

* 도메인 기반 네이밍
* request / response 명확 분리
* 이벤트 최소화

---

## 7. Development Roadmap

---

### STEP 1. Connection Lifecycle

* socket 연결 / 해제 처리
* socket.id 이해

---

### STEP 2. Event Communication

* emit / on 구조
* 단일 / 전체 브로드캐스트

---

### STEP 3. Room System

* join / leave
* room 기반 이벤트 분리

---

### STEP 4. Chat System

* 메시지 전송
* timestamp 처리
* room 채팅

---

### STEP 5. Presence System

* user ↔ socket 매핑
* online/offline 관리

---

### STEP 6. Collaborative Board

* 상태 동기화
* 이벤트 기반 UI 업데이트

---

### STEP 7. Event Architecture

* 이벤트 설계 고도화
* 네이밍 규칙 정립

---

### STEP 8. Reliability

* 재연결 처리
* ACK 패턴
* 중복 이벤트 방지

---

### STEP 9. Authentication

* JWT 기반 인증
* handshake 검증

---

### STEP 10. Notification

* 개인 대상 이벤트 전송
* unread 관리

---

### STEP 11. Namespace

* 기능별 분리
* `/chat`, `/board`, `/admin`

---

### STEP 12. Scaling

* Redis Adapter 적용
* Multi-server 대응

---

### STEP 13. Performance

* payload 최적화
* 이벤트 수 제한
* throttle / debounce

---

### STEP 14. Logging & Monitoring

* 이벤트 로깅
* 에러 추적

---

## 8. Folder Structure (권장)

```plaintext
/server
  /socket
    events/
    handlers/
    middleware/
  /services
  /models

/client
  /components
  /hooks
  /socket
  /store
```

---

## 9. Key Learnings

* 실시간 데이터 흐름 설계
* 이벤트 기반 시스템 구조 이해
* 상태 동기화 전략 (full vs diff)
* 확장 가능한 WebSocket 서버 설계

---

## 10. Rules

* 모든 기능은 단계별로 구현
* 각 Step 완료 후 검증
* 문제 발생 시 원인 분석 후 해결

---

## 11. Next Step

👉 STEP 1 진행

* Socket 서버 생성
* React에서 연결
* connection / disconnect 이벤트 확인
