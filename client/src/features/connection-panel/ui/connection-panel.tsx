"use client";

import type { ConnectionState } from "@/shared/model/connection";

interface ConnectionPanelProps {
  connection: ConnectionState;
  onReconnect: () => void;
}

export function ConnectionPanel({
  connection,
  onReconnect,
}: ConnectionPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Socket 연결 관리</h2>
        <span className={connection.isConnected ? "state-ok" : "state-bad"}>
          {connection.isConnected ? "연결됨" : "연결 끊김"}
        </span>
      </div>

      <dl className="connection-info">
        <div>
          <dt>전송 방식</dt>
          <dd>{connection.transport}</dd>
        </div>
        <div>
          <dt>마지막 연결</dt>
          <dd>{connection.lastConnectedAt}</dd>
        </div>
        <div>
          <dt>지연 시간</dt>
          <dd>{connection.latencyMs}ms</dd>
        </div>
        <div>
          <dt>재연결 시도</dt>
          <dd>{connection.reconnectAttempts}회</dd>
        </div>
      </dl>

      <div className="row-actions">
        <button type="button" onClick={onReconnect}>
          재연결 시뮬레이션
        </button>
        <button type="button" className="ghost">
          ACK 점검 (예정)
        </button>
      </div>
    </section>
  );
}
