import type { Meta, StoryObj } from "@storybook/nextjs";
import { MainDashboard } from "./main-dashboard.ui";

const meta: Meta<typeof MainDashboard> = {
  title: "Widgets/MainDashboard",
  component: MainDashboard,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof MainDashboard>;

const users = [
  { id: "u1", name: "김민수", role: "PM", status: "online" as const, lastActiveAt: "방금 전" },
  { id: "u2", name: "박서연", role: "Frontend", status: "away" as const, lastActiveAt: "8분 전" },
];

const rooms = [
  { id: "room-product", name: "프로덕트", description: "메인 룸", memberCount: 8, unreadCount: 2 },
  { id: "room-dev", name: "개발", description: "개발 싱크", memberCount: 10, unreadCount: 0 },
];

const columns = [
  { id: "todo" as const, title: "대기" },
  { id: "inProgress" as const, title: "진행 중" },
  { id: "done" as const, title: "완료" },
];

export const Default: Story = {
  args: {
    rooms,
    selectedRoomId: "room-product",
    selectedRoom: rooms[0],
    roomMessages: [
      {
        id: "m1",
        roomId: "room-product",
        authorId: "u1",
        authorName: "김민수",
        content: "환영합니다",
        createdAt: "10:00",
      },
    ],
    users,
    columns,
    cards: [
      {
        id: "c1",
        title: "카드 1",
        assigneeId: "u1",
        column: "todo",
        updatedAt: "방금 전",
        tags: ["MVP"],
      },
    ],
    connection: {
      isConnected: true,
      transport: "websocket",
      reconnectAttempts: 0,
      latencyMs: 32,
      lastConnectedAt: "오늘 10:08",
    },
    upcomingItems: ["알림 시스템 개발", "메시지 히스토리 구현"],
    onSelectRoom: () => {},
    onSendMessage: () => {},
    onReconnect: () => {},
    onCreateCard: () => {},
    onMoveCard: () => {},
    onDeleteCard: () => {},
  },
};

export const EmptyState: Story = {
  args: {
    ...Default.args,
    roomMessages: [],
    cards: [],
    upcomingItems: [],
  },
};
