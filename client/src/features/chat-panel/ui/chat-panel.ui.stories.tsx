import type { Meta, StoryObj } from "@storybook/nextjs";
import { ChatPanelUi } from "./chat-panel.ui";

const meta: Meta<typeof ChatPanelUi> = {
  title: "Features/ChatPanel",
  component: ChatPanelUi,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof ChatPanelUi>;

const sampleMessages = [
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
];

export const Default: Story = {
  args: {
    roomName: "프로덕트 전략",
    messages: sampleMessages,
    draft: "",
    hasMessages: true,
    isDraftEmpty: true,
    onDraftChange: () => {},
    onSubmit: () => {},
  },
};

export const EmptyMessages: Story = {
  args: {
    ...Default.args,
    messages: [],
    hasMessages: false,
  },
};

export const WithDraft: Story = {
  args: {
    ...Default.args,
    draft: "답장 초안입니다",
    isDraftEmpty: false,
  },
};

export const LongContent: Story = {
  args: {
    ...Default.args,
    messages: [
      {
        ...sampleMessages[0],
        content:
          "아주 긴 메시지 테스트입니다. ".repeat(20),
      },
    ],
  },
};
