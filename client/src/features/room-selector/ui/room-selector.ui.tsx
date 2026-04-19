"use client";

import type { Room } from "@/entities/room";

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
}

export function RoomSelector({
  rooms,
  selectedRoomId,
  onSelectRoom,
}: RoomSelectorProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Room</h2>
        <span className="muted">{rooms.length}개</span>
      </div>
      <div className="room-list">
        {rooms.map((room) => (
          <button
            key={room.id}
            type="button"
            className={`room-item ${room.id === selectedRoomId ? "active" : ""}`}
            onClick={() => onSelectRoom(room.id)}
          >
            <div className="room-title-row">
              <strong>{room.name}</strong>
              {room.unreadCount > 0 ? (
                <span className="badge">{room.unreadCount}</span>
              ) : null}
            </div>
            <p>{room.description}</p>
            <small>참여 {room.memberCount}명</small>
          </button>
        ))}
      </div>
    </section>
  );
}
