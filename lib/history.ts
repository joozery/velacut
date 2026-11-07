export type HistoryKind = "topup" | "poster" | "transfer" | "reward" | "adjust";
export type HistoryStatus = "completed" | "pending" | "failed";
export type HistoryRecord = {
  id: string;
  kind: HistoryKind;
  status: HistoryStatus;
  title: string;
  description: string;
  date: string;
  coins: number;
  baht?: number;
  note: string;
};
