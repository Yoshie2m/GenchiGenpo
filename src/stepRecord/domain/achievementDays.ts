import type { MemberId } from '../../publishedLanguage/memberId.ts'
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

export interface SpecialMissionMember {
  readonly memberId: MemberId
  readonly displayName: string
  readonly achievementDays: number
}

/** パーフェクト（対象期間のすべての日で達成）のメンバー。 */
export interface PerfectMember {
  readonly memberId: MemberId
  readonly displayName: string
  readonly achievementDays: number
}

/** 特命（DOMAINS.md）に出す内容。 */
export interface SpecialMission {
  /** 参加メンバー全員分の達成率（%、0〜100の整数。全員が対象期間すべてで達成すれば100）。 */
  readonly overallRate: number
  /** 達成日数の対象日数（全員共通の分母）。 */
  readonly totalDays: number
  /** 極上（パーフェクト）: 対象期間のすべての日で達成したメンバー。 */
  readonly perfectMembers: readonly PerfectMember[]
}

/**
 * メンバーごとの達成日数から、特命の内容を出す。
 * メンバーが1人もいない、または対象日数が0以下のとき（まだ数えられる日がないとき）は null。
 */
export function specialMission(
  members: readonly SpecialMissionMember[],
  totalDays: number,
): SpecialMission | null {
  if (members.length === 0 || totalDays <= 0) return null
  const totalAchievementDays = members.reduce((sum, m) => sum + m.achievementDays, 0)
  const overallRate = Math.round((totalAchievementDays / (members.length * totalDays)) * 100)
  const perfectMembers = members
    .filter((m) => m.achievementDays >= totalDays)
    .map((m) => ({
      memberId: m.memberId,
      displayName: m.displayName,
      achievementDays: m.achievementDays,
    }))
  return { overallRate, totalDays, perfectMembers }
}
