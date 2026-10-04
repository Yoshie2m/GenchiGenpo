import { addDays, daysBetween, type LocalDate } from '../../shared/LocalDate.ts'
import type { DailySteps } from './DailySteps.ts'

/**
 * 個人の平均歩数（チーム振り分けに使う。DOMAINS.md）。
 * from（2026年10月1日、または10月1日からの歩数がないメンバーは登録日）から until までの
 * すべての日で割る。記録しなかった日は 0 歩として数える。
 * 数える日が1日もないとき（until が from より前）は null。
 */
export function personalAverage(
  records: readonly DailySteps[],
  from: LocalDate,
  until: LocalDate,
): number | null {
  const days = daysBetween(from, until) + 1
  if (days <= 0) return null
  const last = addDays(from, days - 1)
  const total = records
    .filter((r) => r.date >= from && r.date <= last)
    .reduce((sum, r) => sum + r.steps, 0)
  return total / days
}
