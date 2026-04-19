"use client";

import type { ChatMessage } from "@/entities/message";

interface ChatPanelUiProps {
  roomName: string;
  messages: ChatMessage[];
  draft: string;
  hasMessages: boolean;
  isDraftEmpty: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}

export function ChatPanelUi({
  roomName,
  messages,
  draft,
  hasMessages,
  isDraftEmpty,
  onDraftChange,
  onSubmit,
}: ChatPanelUiProps) {
  return (
    <section className="panel chat-panel">
      <div className="panel-header">
        <div>
          <h2>실시간 채팅</h2>
          <p className="muted">{roomName} Room</p>
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
          onSubmit();
        }}
      >
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="메시지를 입력하세요 (소켓 전송은 추후 연결)"
        />
        <button type="submit" disabled={isDraftEmpty}>
          전송
        </button>
      </form>
    </section>
  );
}
