"use client";

import type { WorkspaceUser } from "@/entities/user";

interface PresencePanelProps {
  users: WorkspaceUser[];
}

const statusLabel: Record<WorkspaceUser["status"], string> = {
  online: "온라인",
  away: "자리비움",
  offline: "오프라인",
};

export function PresencePanel({ users }: PresencePanelProps) {
  const onlineCount = users.filter((user) => user.status === "online").length;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Presence</h2>
        <span className="muted">온라인 {onlineCount}명</span>
      </div>
      <div className="presence-list">
        {users.map((user) => (
          <article key={user.id} className="presence-item">
            <div>
              <strong>{user.name}</strong>
              <p>{user.role}</p>
            </div>
            <div className={`presence-badge ${user.status}`}>
              {statusLabel[user.status]}
            </div>
            <small className="muted">최근 활동: {user.lastActiveAt}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
