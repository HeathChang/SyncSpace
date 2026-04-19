import type { Meta, StoryObj } from "@storybook/nextjs";
import { PresencePanel } from "./presence-panel.ui";

const meta: Meta<typeof PresencePanel> = {
  title: "Features/PresencePanel",
  component: PresencePanel,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PresencePanel>;

export const Default: Story = {
  args: {
    users: [
      { id: "u1", name: "김민수", role: "PM", status: "online", lastActiveAt: "방금 전" },
      { id: "u2", name: "박서연", role: "Frontend", status: "away", lastActiveAt: "8분 전" },
      { id: "u3", name: "이도윤", role: "Backend", status: "offline", lastActiveAt: "40분 전" },
    ],
  },
};

export const AllOnline: Story = {
  args: {
    users: [
      { id: "u1", name: "김민수", role: "PM", status: "online", lastActiveAt: "방금 전" },
      { id: "u2", name: "박서연", role: "Frontend", status: "online", lastActiveAt: "방금 전" },
    ],
  },
};

export const AllOffline: Story = {
  args: {
    users: [
      { id: "u1", name: "김민수", role: "PM", status: "offline", lastActiveAt: "1시간 전" },
      { id: "u2", name: "박서연", role: "Frontend", status: "offline", lastActiveAt: "2시간 전" },
    ],
  },
};

export const EmptyUsers: Story = {
  args: {
    users: [],
  },
};
