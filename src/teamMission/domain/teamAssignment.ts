import type { MemberId } from '../../publishedLanguage/memberId.ts'
import { FILL_STEPS } from './scoring.ts'
import { teamNumbers, type TeamAssignment, type TeamNumber } from './Team.ts'

/** 振り分けに使うメンバーの情報。平均歩数を計算できる日がないメンバーは null。 */
export interface AssignmentCandidate {
  readonly memberId: MemberId
  readonly averageSteps: number | null
}

/**
 * ミッション開始時のチーム振り分け（DOMAINS.md）。個人の平均歩数でバランスを取る。
 * 平均歩数の大きい人から順に、人数が少ない隊へ入れる。人数が同じなら平均歩数の合計が小さい隊、
 * それも同じなら若い番号の隊。こうすると人数の差は最大1人になり、力もならされる。
 * 平均歩数を計算できない（過去の歩数がまったくない）メンバーは 8,000 歩とみなす。
 */
export function assignTeams(
  candidates: readonly AssignmentCandidate[],
  teamCount: number,
): TeamAssignment[] {
  const teams = teamNumbers(teamCount).map((team) => ({ team, count: 0, total: 0 }))
  const sorted = [...candidates]
    .map((c) => ({ memberId: c.memberId, average: c.averageSteps ?? FILL_STEPS }))
    .sort((a, b) => b.average - a.average)
  return sorted.map(({ memberId, average }) => {
    const target = [...teams].sort(
      (a, b) => a.count - b.count || a.total - b.total || a.team - b.team,
    )[0]
    target.count += 1
    target.total += average
    return { memberId, team: target.team }
  })
}

/** 途中参加の振り分け。人数が少ない隊に入れ、人数が同じなら壱番隊→弐番隊→参番隊の順。 */
export function teamForLateJoiner(memberCounts: ReadonlyMap<TeamNumber, number>): TeamNumber {
  return [...memberCounts.entries()].sort(([ta, a], [tb, b]) => a - b || ta - tb)[0][0]
}
