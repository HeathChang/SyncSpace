import type { Meta, StoryObj } from "@storybook/nextjs";
import { RoomSelector } from "./room-selector.ui";

const meta: Meta<typeof RoomSelector> = {
  title: "Features/RoomSelector",
  component: RoomSelector,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof RoomSelector>;

const sampleRooms = [
  {
    id: "room-product",
    name: "프로덕트 전략",
    description: "분기별 목표와 우선순위",
    memberCount: 8,
    unreadCount: 2,
  },
  {
    id: "room-design",
    name: "디자인 리뷰",
    description: "UI/UX 개선안 공유",
    memberCount: 5,
    unreadCount: 0,
  },
  {
    id: "room-dev",
    name: "개발 싱크",
    description: "기술 이슈와 릴리즈 일정",
    memberCount: 10,
    unreadCount: 4,
  },
];

export const Default: Story = {
  args: {
    rooms: sampleRooms,
    selectedRoomId: "room-product",
    onSelectRoom: () => {},
  },
};

export const NoUnread: Story = {
  args: {
    rooms: sampleRooms.map((room) => ({ ...room, unreadCount: 0 })),
    selectedRoomId: "room-design",
    onSelectRoom: () => {},
  },
};

export const EmptyRooms: Story = {
  args: {
    rooms: [],
    selectedRoomId: "",
    onSelectRoom: () => {},
  },
};
