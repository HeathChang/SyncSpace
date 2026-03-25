"use client";

import { useMemo, useState } from "react";
import type { ChatMessage } from "@/entities/message/model/types";
import type { Room } from "@/entities/room/model/types";

interface ChatPanelProps {
  room: Room;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

export function ChatPanel({ room, messages, onSendMessage }: ChatPanelProps) {
  const [draft, setDraft] = useState("");

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div>
          <h2>실시간 채팅</h2>
          <p className="muted">{room.name} Room</p>
        </div>
      </div>

      <div className="chat-list">
        {hasMessages ? (
          messages.map((message) => (
            <article key={message.id} className="chat-item">
              <div className="chat-meta">
                <strong>{message.authorName}</strong>
                <span>{message.createdAt}</span>
              </div>
              <p>{message.content}</p>
            </article>
          ))
        ) : (
          <p className="empty-state">아직 메시지가 없습니다. 첫 메시지를 남겨보세요.</p>
        )}
      </div>

      <form
        className="chat-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          onSendMessage(draft);
          setDraft("");
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="메시지를 입력하세요 (소켓 전송은 추후 연결)"
        />
        <button type="submit" disabled={draft.trim().length === 0}>
          전송
        </button>
      </form>
    </section>
  );
}
