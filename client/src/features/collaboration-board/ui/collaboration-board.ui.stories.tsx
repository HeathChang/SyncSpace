import type { Meta, StoryObj } from "@storybook/nextjs";
import { CollaborationBoard } from "./collaboration-board.ui";

const meta: Meta<typeof CollaborationBoard> = {
  title: "Features/CollaborationBoard",
  component: CollaborationBoard,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof CollaborationBoard>;

const columns = [
  { id: "todo" as const, title: "대기" },
  { id: "inProgress" as const, title: "진행 중" },
  { id: "done" as const, title: "완료" },
];

const users = [
  { id: "u1", name: "김민수", role: "PM", status: "online" as const, lastActiveAt: "방금 전" },
  { id: "u2", name: "박서연", role: "Frontend", status: "online" as const, lastActiveAt: "방금 전" },
];

export const Default: Story = {
  args: {
    columns,
    cards: [
      {
        id: "c1",
        title: "Room 리스트 UI 고도화",
        assigneeId: "u2",
        column: "todo",
        updatedAt: "오늘 09:20",
        tags: ["채팅", "FSD"],
      },
      {
        id: "c2",
        title: "Presence 배지 정리",
        assigneeId: "u1",
        column: "inProgress",
        updatedAt: "오늘 10:00",
        tags: ["Presence"],
      },
    ],
    users,
    onCreateCard: () => {},
    onMoveCard: () => {},
    onDeleteCard: () => {},
  },
};

export const EmptyBoard: Story = {
  args: {
    ...Default.args,
    cards: [],
  },
};

export const ManyCards: Story = {
  args: {
    ...Default.args,
    cards: Array.from({ length: 12 }, (_, index) => ({
      id: `c${index}`,
      title: `작업 ${index + 1}`,
      assigneeId: index % 2 === 0 ? "u1" : "u2",
      column: (["todo", "inProgress", "done"] as const)[index % 3],
      updatedAt: "방금 전",
      tags: ["테스트"],
    })),
  },
};
