import type { DailySteps } from './DailySteps.ts'

/** 歩数記録コンテキストの状態。まとめて読み込み、まとめて保存する（同じ保存単位）。 */
export interface DailyStepsRepository {
  load(): Promise<DailySteps[]>
  save(records: readonly DailySteps[]): Promise<void>
}
