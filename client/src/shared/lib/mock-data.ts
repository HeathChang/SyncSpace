import type { BoardCard, BoardColumnId } from "@/entities/board/model/types";
import type { ChatMessage } from "@/entities/message/model/types";
import type { Room } from "@/entities/room/model/types";
import type { WorkspaceUser } from "@/entities/user/model/types";
import type { ConnectionState } from "@/shared/model/connection";

export const mockRooms: Room[] = [
  {
    id: "room-product",
    name: "프로덕트 전략",
    description: "분기별 목표와 우선순위를 논의하는 메인 룸",
    memberCount: 8,
    unreadCount: 2,
  },
  {
    id: "room-design",
    name: "디자인 리뷰",
    description: "UI/UX 개선안과 피드백을 공유하는 룸",
    memberCount: 5,
    unreadCount: 0,
  },
  {
    id: "room-dev",
    name: "개발 싱크",
    description: "기술 이슈와 릴리즈 일정을 맞추는 룸",
    memberCount: 10,
    unreadCount: 4,
  },
];

export const mockUsers: WorkspaceUser[] = [
  {
    id: "u1",
    name: "김민수",
    role: "PM",
    status: "online",
    lastActiveAt: "방금 전",
  },
  {
    id: "u2",
    name: "박서연",
    role: "Frontend",
    status: "away",
    lastActiveAt: "8분 전",
  },
  {
    id: "u3",
    name: "이도윤",
    role: "Backend",
    status: "online",
    lastActiveAt: "방금 전",
  },
  {
    id: "u4",
    name: "정하은",
    role: "Designer",
    status: "offline",
    lastActiveAt: "40분 전",
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    roomId: "room-product",
    authorId: "u1",
    authorName: "김민수",
    content: "이번 주 목표를 보드에 반영해주세요.",
    createdAt: "10:02",
  },
  {
    id: "m2",
    roomId: "room-product",
    authorId: "u3",
    authorName: "이도윤",
    content: "협업 보드 카드 우선순위를 먼저 정리해둘게요.",
    createdAt: "10:05",
  },
  {
    id: "m3",
    roomId: "room-design",
    authorId: "u4",
    authorName: "정하은",
    content: "새 대시보드 시안 링크 공유합니다.",
    createdAt: "09:40",
  },
  {
    id: "m4",
    roomId: "room-dev",
    authorId: "u2",
    authorName: "박서연",
    content: "소켓 재연결 정책은 UI 상태만 먼저 맞춰둘게요.",
    createdAt: "09:52",
  },
];

export const boardColumns: { id: BoardColumnId; title: string }[] = [
  { id: "todo", title: "대기" },
  { id: "inProgress", title: "진행 중" },
  { id: "done", title: "완료" },
];

export const mockBoardCards: BoardCard[] = [
  {
    id: "b1",
    title: "Room 리스트 UI 고도화",
    assigneeId: "u2",
    column: "todo",
    updatedAt: "오늘 09:20",
    tags: ["채팅", "FSD"],
  },
  {
    id: "b2",
    title: "Presence 상태 배지 정리",
    assigneeId: "u1",
    column: "inProgress",
    updatedAt: "오늘 10:00",
    tags: ["Presence"],
  },
  {
    id: "b3",
    title: "보드 카드 이동 UX 점검",
    assigneeId: "u4",
    column: "done",
    updatedAt: "어제 18:30",
    tags: ["보드", "UX"],
  },
];

export const mockConnectionState: ConnectionState = {
  isConnected: true,
  transport: "websocket",
  reconnectAttempts: 1,
  latencyMs: 32,
  lastConnectedAt: "오늘 10:08",
};

export const upcomingItems: string[] = [
  "이벤트 설계 시스템: 도메인 이벤트 규약 및 버전 전략",
  "알림 시스템: 개인 대상 실시간 알림/읽음 처리",
  "메시지 히스토리: 검색 및 페이징, 스냅샷 복원",
];
