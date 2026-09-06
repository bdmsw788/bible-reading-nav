// 通読スケジュール型定義

export interface ReadingEntry {
  id: string;          // ユニークID "2026-06-11_0", "2026-06-11_1" ...
  date: string;        // ISO形式 "2026-06-11"
  book: string;        // 書名 例: "創世記"
  passage: string;     // 章節 例: "1章〜2章"
  completed: boolean;
}

export interface DayGroup {
  date: string;
  readings: ReadingEntry[];
  allCompleted: boolean;
  completedCount: number;
  totalCount: number;
}

export interface ProgressState {
  streak: number;              // 連続達成日数（全箇所完了した日の連続）
  totalCompletedReadings: number;  // 完了した個別箇所数
  totalReadings: number;       // 全箇所数
  totalCompletedDays: number;  // 全箇所完了した日数
  totalDays: number;           // 全スケジュール日数
  completionRate: number;      // 箇所ベース達成率 (%)
  lastCompletedDate: string | null;
}

export interface AppState {
  today: DayGroup | null;
  progress: ProgressState;
  scheduleLoaded: boolean;
}
