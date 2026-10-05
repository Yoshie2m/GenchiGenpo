import { competitionRanks } from '../../shared/ranking.ts'
import type { LocalDate } from '../../shared/LocalDate.ts'
import type { DailySteps } from './DailySteps.ts'

/** 1日の歩数がこの値以上なら「達成」とみなす（DOMAINS.md「達成日数」）。 */
export const ACHIEVEMENT_THRESHOLD = 8_000

/** 期間内（from〜until）で、1日8000歩以上を記録した日の数（DOMAINS.md「達成日数」）。 */
export function achievementDaysOf(
  records: readonly DailySteps[],
  from: LocalDate,
  until: LocalDate,
): number {
  return records.filter(
    (r) => r.date >= from && r.date <= until && r.steps >= ACHIEVEMENT_THRESHOLD,
  ).length
}

/** 特命（DOMAINS.md）に出す2つの平均値。 */
export interface SpecialMission {
  /** 参加メンバー全員の達成日数の平均値。 */
  readonly allAverage: number
  /** 達成日数が多い上位3名（同率は全員含む。番付と同じ考え方）の達成日数の平均値。 */
  readonly top3Average: number
}

/** メンバーごとの達成日数から、特命の2つの平均値を出す。メンバーが1人もいなければ null。 */
export function specialMission(achievementDaysByMember: readonly number[]): SpecialMission | null {
  if (achievementDaysByMember.length === 0) return null
  const average = (values: readonly number[]) => values.reduce((s, v) => s + v, 0) / values.length
  const ranks = competitionRanks(achievementDaysByMember)
  const top3 = achievementDaysByMember.filter((_, i) => ranks[i] <= 3)
  return { allAverage: average(achievementDaysByMember), top3Average: average(top3) }
}
