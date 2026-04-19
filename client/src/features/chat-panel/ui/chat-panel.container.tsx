"use client";

import { useState } from "react";
import type { ChatMessage } from "@/entities/message";
import type { Room } from "@/entities/room";
import { ChatPanelUi } from "./chat-panel.ui";

interface ChatPanelProps {
  room: Room;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export function ChatPanel({ room, messages, onSendMessage }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const hasMessages = messages.length > 0;

  const handleSubmit = () => {
    onSendMessage(draft);
    setDraft("");
  };

  return (
    <ChatPanelUi
      roomName={room.name}
      messages={messages}
      draft={draft}
      hasMessages={hasMessages}
      isDraftEmpty={draft.trim().length === 0}
      onDraftChange={setDraft}
      onSubmit={handleSubmit}
    />
  );
}
