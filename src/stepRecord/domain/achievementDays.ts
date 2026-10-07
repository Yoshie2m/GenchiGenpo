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

/** 達成率90%以上で「筆頭仕事人」、80%以上で「精鋭仕事人」（DOMAINS.md「特命」）。 */
const RIGHT_HAND_WORKER_THRESHOLD = 90
const ELITE_WORKER_THRESHOLD = 80

/** 称号（しょうごう）を持つメンバー。1人は最も高い称号だけを持つ。 */
export interface TierMember {
  readonly memberId: MemberId
  readonly displayName: string
  readonly achievementDays: number
  /** このメンバーの達成率（%、0〜100の整数）。 */
  readonly rate: number
}

/** 特命（DOMAINS.md）に出す内容。 */
export interface SpecialMission {
  /**
   * 全体成果（DOMAINS.md）: メンバー1人あたりの平均達成日数（日、小数第2位を四捨五入した小数第1位まで）。
   * 1日ずつ「その日に達成した人数 ÷ 全員の人数」を足し合わせた値と同じ。全員が対象期間すべてで達成すれば対象日数と同じ。
   */
  readonly overallDays: number
  /** 達成日数の対象日数（全員共通の分母）。 */
  readonly totalDays: number
  /** 極上仕事人（ごくじょう）: 対象期間のすべての日で達成したメンバー（達成率100%）。 */
  readonly legendaryWorkers: readonly TierMember[]
  /** 筆頭仕事人（ひっとう）: 達成率90%以上100%未満のメンバー。 */
  readonly rightHandWorkers: readonly TierMember[]
  /** 精鋭仕事人（せいえい）: 達成率80%以上90%未満のメンバー。 */
  readonly eliteWorkers: readonly TierMember[]
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
  // 整数のまま10倍して四捨五入し、10で割る（小数のまま掛けて端数の誤差が出るのを避ける）
  const overallDays = Math.round((totalAchievementDays * 10) / members.length) / 10

  const legendaryWorkers = members
    .filter((m) => m.achievementDays >= totalDays)
    .map((m) => ({
      memberId: m.memberId,
      displayName: m.displayName,
      achievementDays: m.achievementDays,
      rate: 100,
    }))

  // 100%ちょうど（全日数で達成）は極上仕事人なので、四捨五入で100%になりうる端数は筆頭・精鋭からは除く。
  const withRate = members
    .filter((m) => m.achievementDays < totalDays)
    .map((m) => ({
      memberId: m.memberId,
      displayName: m.displayName,
      achievementDays: m.achievementDays,
      rate: Math.round((m.achievementDays / totalDays) * 100),
    }))
  const rightHandWorkers = withRate.filter((m) => m.rate >= RIGHT_HAND_WORKER_THRESHOLD)
  const eliteWorkers = withRate.filter(
    (m) => m.rate >= ELITE_WORKER_THRESHOLD && m.rate < RIGHT_HAND_WORKER_THRESHOLD,
  )

  return { overallDays, totalDays, legendaryWorkers, rightHandWorkers, eliteWorkers }
}
