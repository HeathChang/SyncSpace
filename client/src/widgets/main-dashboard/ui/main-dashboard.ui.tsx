"use client";

import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { ChatMessage } from "@/entities/message";
import type { Room } from "@/entities/room";
import type { WorkspaceUser } from "@/entities/user";
import { ChatPanel } from "@/features/chat-panel";
import { CollaborationBoard } from "@/features/collaboration-board";
import { ConnectionPanel } from "@/features/connection-panel";
import { PresencePanel } from "@/features/presence-panel";
import { RoomSelector } from "@/features/room-selector";
import type { ConnectionState } from "@/shared/model";

interface MainDashboardProps {
  rooms: Room[];
  selectedRoomId: string;
  selectedRoom: Room;
  roomMessages: ChatMessage[];
  users: WorkspaceUser[];
  columns: { id: BoardColumnId; title: string }[];
  cards: BoardCard[];
  connection: ConnectionState;
  upcomingItems: string[];
  onSelectRoom: (roomId: string) => void;
  onSendMessage: (content: string) => void;
  onReconnect: () => void;
  onCreateCard: () => void;
  onMoveCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export function MainDashboard({
  rooms,
  selectedRoomId,
  selectedRoom,
  roomMessages,
  users,
  columns,
  cards,
  connection,
  upcomingItems,
  onSelectRoom,
  onSendMessage,
  onReconnect,
  onCreateCard,
  onMoveCard,
  onDeleteCard,
}: MainDashboardProps) {
  return (
    <div className="dashboard-grid">
      <div className="left-column">
        <RoomSelector
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
        />
        <ChatPanel
          room={selectedRoom}
          messages={roomMessages}
          onSendMessage={onSendMessage}
        />
      </div>

      <div className="right-column">
        <PresencePanel users={users} />
        <ConnectionPanel connection={connection} onReconnect={onReconnect} />
      </div>

      <div className="full-width">
        <CollaborationBoard
          columns={columns}
          cards={cards}
          users={users}
          onCreateCard={onCreateCard}
          onMoveCard={onMoveCard}
          onDeleteCard={onDeleteCard}
        />
      </div>

      <section className="panel full-width">
        <div className="panel-header">
          <h2>추후 확장</h2>
        </div>
        <ul className="upcoming-list">
          {upcomingItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
