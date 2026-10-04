import type { MemberId } from '../../publishedLanguage/memberId.ts'
import { addDays, atJst, type LocalDate } from '../../shared/LocalDate.ts'
import type { TeamMission } from './TeamMission.ts'

/**
 * 次のミッションの作成（DOMAINS.md「ミッションの作成」）。
 * 流れ: 最終日 → 翌日 13:00 に最終順位が確定 → その日のうちに優勝チームのメンバーが作成
 * （誰も作成しなければ 23:59 を過ぎた時点で一番上の候補で自動確定）→ 翌日 0:00 に開始。
 */

/** 作成できる期間の始まり（最終順位が確定した時刻）。 */
export function creationOpensAt(previous: TeamMission): Date {
  return previous.stepDeadline
}

/** 自動確定する時刻（最終順位が確定した日の 23:59 を過ぎた時点）。 */
export function autoConfirmAt(previous: TeamMission): Date {
  return atJst(addDays(previous.lastDay, 2))
}

/** 次のミッションの開始日（作成・確定した日の翌日）。 */
export function nextStartDate(previous: TeamMission): LocalDate {
  return addDays(previous.lastDay, 2)
}

/**
 * このメンバーが今、次のミッションを作成できるか。
 * 前回の優勝チーム（同率1位なら全隊）のメンバー全員が作成できる。作成できるのは最終順位の確定から
 * 自動確定までの間。最初に作成した人の内容で確定するので、すでに作成済みなら作成できない。
 */
export function canCreateNext(
  memberId: MemberId,
  previous: TeamMission,
  now: Date,
  alreadyCreated: boolean,
): boolean {
  if (alreadyCreated) return false
  if (now < creationOpensAt(previous) || now >= autoConfirmAt(previous)) return false
  const team = previous.teamOf(memberId)
  return team !== null && previous.winners(now).includes(team)
}
