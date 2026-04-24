"use client";

import type { Room } from "@/entities/room";
import type { WorkspaceUser } from "@/entities/user";
import type { ConnectionState } from "@/shared/model";

interface WorkspaceHeaderProps {
  currentRoom: Room;
  users: WorkspaceUser[];
  connection: ConnectionState;
  currentUserName?: string;
  unreadNotificationCount?: number;
  onLogout?: () => void;
}

export function WorkspaceHeader({
  currentRoom,
  users,
  connection,
  currentUserName,
  unreadNotificationCount,
  onLogout,
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
        {typeof unreadNotificationCount === "number" ? (
          <article>
            <span>알림</span>
            <strong>{unreadNotificationCount}건</strong>
          </article>
        ) : null}
        {currentUserName ? (
          <article className="user-badge">
            <span>로그인</span>
            <strong>{currentUserName}</strong>
            {onLogout ? (
              <button type="button" className="ghost" onClick={onLogout} aria-label="로그아웃">
                로그아웃
              </button>
            ) : null}
          </article>
        ) : null}
      </div>
    </header>
  );
}
