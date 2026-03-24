export type BoardColumnId = "todo" | "inProgress" | "done";

export interface BoardCard {
  id: string;
  title: string;
  assigneeId: string;
  column: BoardColumnId;
  updatedAt: string;
  tags: string[];
}
