import type { Meta, StoryObj } from "@storybook/nextjs";
import { WorkspaceHeader } from "./workspace-header.ui";

const meta: Meta<typeof WorkspaceHeader> = {
  title: "Widgets/WorkspaceHeader",
  component: WorkspaceHeader,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof WorkspaceHeader>;

const sampleRoom = {
  id: "room-product",
  name: "프로덕트 전략",
  description: "분기별 목표와 우선순위를 논의하는 메인 룸",
  memberCount: 8,
  unreadCount: 2,
};

const sampleUsers = [
  { id: "u1", name: "김민수", role: "PM", status: "online" as const, lastActiveAt: "방금 전" },
  { id: "u2", name: "박서연", role: "Frontend", status: "online" as const, lastActiveAt: "방금 전" },
  { id: "u3", name: "이도윤", role: "Backend", status: "offline" as const, lastActiveAt: "40분 전" },
];

export const Connected: Story = {
  args: {
    currentRoom: sampleRoom,
    users: sampleUsers,
    connection: {
      isConnected: true,
      transport: "websocket",
      reconnectAttempts: 0,
      latencyMs: 32,
      lastConnectedAt: "오늘 10:08",
    },
  },
};

export const Disconnected: Story = {
  args: {
    ...Connected.args,
    connection: {
      isConnected: false,
      transport: "websocket",
      reconnectAttempts: 5,
      latencyMs: 0,
      lastConnectedAt: "1시간 전",
    },
  },
};

export const LongRoomName: Story = {
  args: {
    ...Connected.args,
    currentRoom: {
      ...sampleRoom,
      name: "굉장히 길고 자세한 프로덕트 전략 토론 룸 이름입니다",
      description: "분기별 목표와 우선순위를 매우 자세하게 논의하고 결정하는 메인 룸입니다",
    },
  },
};
