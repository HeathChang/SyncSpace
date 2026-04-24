"use client";

import type { Notification } from "@/entities/notification";

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkRead: (notificationId: string) => void;
}

export function NotificationPanel({ notifications, onMarkRead }: NotificationPanelProps) {
    const unreadCount = notifications.filter((item) => !item.readAt).length;

    return (
        <section className="panel notification-panel">
            <div className="panel-header">
                <h2>알림</h2>
                <span className="muted">읽지 않음 {unreadCount}건</span>
            </div>

            <div className="notification-list">
                {notifications.length === 0 ? (
                    <p className="empty-state">받은 알림이 없습니다.</p>
                ) : (
                    notifications.map((notification) => {
                        const isUnread = !notification.readAt;
                        return (
                            <article
                                key={notification.id}
                                className={`notification-item${isUnread ? " unread" : ""}`}
                            >
                                <div className="notification-meta">
                                    <strong>{notification.title}</strong>
                                    <span className="muted">
                                        {new Date(notification.createdAt).toLocaleTimeString("ko-KR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                        })}
                                    </span>
                                </div>
                                <p>{notification.body}</p>
                                {isUnread ? (
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={() => onMarkRead(notification.id)}
                                        aria-label="알림 읽음 처리"
                                    >
                                        읽음 처리
                                    </button>
                                ) : null}
                            </article>
                        );
                    })
                )}
            </div>
        </section>
    );
}
