"use client";

import type { Room } from "@/entities/room";
import type { WorkspaceUser } from "@/entities/user";
import type { ConnectionState } from "@/shared/model";

interface WorkspaceHeaderProps {
  currentRoom: Room;
  users: WorkspaceUser[];
  connection: ConnectionState;
}

export function WorkspaceHeader({
  currentRoom,
  users,
  connection,
}: WorkspaceHeaderProps) {
  const onlineCount = users.filter((user) => user.status === "online").length;

  return (
    <header className="workspace-header">
      <div>
        <p className="eyebrow">SyncSpace</p>
        <h1>{currentRoom.name}</h1>
        <p className="muted">{currentRoom.description}</p>
      </div>

      <div className="header-stats">
        <article>
          <span>참여자</span>
          <strong>{currentRoom.memberCount}명</strong>
        </article>
        <article>
          <span>온라인</span>
          <strong>{onlineCount}명</strong>
        </article>
        <article>
          <span>소켓 상태</span>
          <strong>{connection.isConnected ? "정상" : "점검 필요"}</strong>
        </article>
      </div>
    </header>
  );
}
