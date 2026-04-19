"use client";

import type { BoardCard, BoardColumnId } from "@/entities/board";
import type { WorkspaceUser } from "@/entities/user";

interface BoardColumn {
  id: BoardColumnId;
  title: string;
}

interface CollaborationBoardProps {
  columns: BoardColumn[];
  cards: BoardCard[];
  users: WorkspaceUser[];
  onCreateCard: () => void;
  onMoveCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export function CollaborationBoard({
  columns,
  cards,
  users,
  onCreateCard,
  onMoveCard,
  onDeleteCard,
}: CollaborationBoardProps) {
  const userMap = new Map(users.map((user) => [user.id, user.name]));

  return (
    <section className="panel board-panel">
      <div className="panel-header">
        <h2>협업 보드</h2>
        <button type="button" onClick={onCreateCard}>
          카드 추가
        </button>
      </div>

      <div className="board-grid">
        {columns.map((column) => {
          const columnCards = cards.filter((card) => card.column === column.id);

          return (
            <div key={column.id} className="board-column">
              <div className="board-column-header">
                <strong>{column.title}</strong>
                <span>{columnCards.length}</span>
              </div>

              <div className="board-cards">
                {columnCards.map((card) => (
                  <article key={card.id} className="board-card">
                    <h3>{card.title}</h3>
                    <p className="muted">담당: {userMap.get(card.assigneeId) ?? "-"}</p>
                    <div className="tag-row">
                      {card.tags.map((tag) => (
                        <span key={`${card.id}-${tag}`} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <small className="muted">업데이트: {card.updatedAt}</small>
                    <div className="row-actions">
                      <button type="button" onClick={() => onMoveCard(card.id)}>
                        다음 단계
                      </button>
                      <button
                        type="button"
                        className="ghost danger"
                        onClick={() => onDeleteCard(card.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
