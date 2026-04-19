import type { Meta, StoryObj } from "@storybook/nextjs";
import { ConnectionPanel } from "./connection-panel.ui";

const meta: Meta<typeof ConnectionPanel> = {
  title: "Features/ConnectionPanel",
  component: ConnectionPanel,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ConnectionPanel>;

export const Connected: Story = {
  args: {
    connection: {
      isConnected: true,
      transport: "websocket",
      reconnectAttempts: 0,
      latencyMs: 32,
      lastConnectedAt: "오늘 10:08",
    },
    onReconnect: () => {},
  },
};

export const Disconnected: Story = {
  args: {
    connection: {
      isConnected: false,
      transport: "websocket",
      reconnectAttempts: 3,
      latencyMs: 0,
      lastConnectedAt: "1시간 전",
    },
    onReconnect: () => {},
  },
};

export const HighLatency: Story = {
  args: {
    connection: {
      isConnected: true,
      transport: "polling",
      reconnectAttempts: 1,
      latencyMs: 850,
      lastConnectedAt: "오늘 10:00",
    },
    onReconnect: () => {},
  },
};
