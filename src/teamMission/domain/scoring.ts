import { addDays, daysBetween, type LocalDate } from '../../shared/LocalDate.ts'

/** 補充歩数。日別上位2名平均歩数で、歩数のあるメンバーが2名に満たない日の不足分（DOMAINS.md）。 */
export const FILL_STEPS = 8_000

/** ある隊のある日の、メンバーごとの歩数（記録したメンバーだけ）。 */
export type DayStepsOfTeam = readonly number[]

function topTwo(steps: DayStepsOfTeam): number[] {
  return [...steps].sort((a, b) => b - a).slice(0, 2)
}

/** その日の上位2名の歩数の合計（補充なし）。進行歩数のもと。 */
export function dailyTopTwoSum(steps: DayStepsOfTeam): number {
  return topTwo(steps).reduce((sum, s) => sum + s, 0)
}

/**
 * 日別上位2名平均歩数。歩数のあるメンバーが2名に満たない日は、不足分を1人 8,000 歩とする。
 * 2人目が 8,000 歩未満でも、そのまま平均する（意図どおりの仕様）。
 */
export function dailyTopTwoAverage(steps: DayStepsOfTeam): number {
  const top = topTwo(steps)
  while (top.length < 2) top.push(FILL_STEPS)
  return (top[0] + top[1]) / 2
}

/** 進行歩数: 期間の各日の上位2名の歩数の合計を累積したもの（補充なし）。 */
export function progressSteps(stepsOfDay: (date: LocalDate) => DayStepsOfTeam, days: LocalDate[]) {
  return days.reduce((sum, date) => sum + dailyTopTwoSum(stepsOfDay(date)), 0)
}

/** チーム評価歩数: 開始日から最終日（または今日）までの日別上位2名平均歩数の合計。 */
export function evaluationSteps(
  stepsOfDay: (date: LocalDate) => DayStepsOfTeam,
  days: LocalDate[],
) {
  return days.reduce((sum, date) => sum + dailyTopTwoAverage(stepsOfDay(date)), 0)
}

/** from から to までの日付（両端を含む）。to が前なら空。 */
export function datesFrom(from: LocalDate, to: LocalDate): LocalDate[] {
  const count = daysBetween(from, to) + 1
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(from, i))
}
