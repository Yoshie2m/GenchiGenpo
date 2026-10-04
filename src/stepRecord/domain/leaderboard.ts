import type { MemberId } from '../../publishedLanguage/memberId.ts'
import { competitionRanks } from '../../shared/ranking.ts'

/** 番付の1行。 */
export interface LeaderboardEntry {
  readonly memberId: MemberId
  readonly value: number
  /** 同じ値は同じ順位（1位・1位・3位）。 */
  readonly rank: number
}

/** 番付に載せる人数。 */
export const LEADERBOARD_SIZE = 5

/**
 * 値の大きい順に並べ、上位 LEADERBOARD_SIZE 名を返す（DOMAINS.md「番付」）。
 * 同じ値は同じ順位にし、5位が同順位で並ぶときは、その全員を載せる。
 * 同じ値の並びは、渡した順（登録の順）。
 */
export function topEntries(
  values: readonly { readonly memberId: MemberId; readonly value: number }[],
  size = LEADERBOARD_SIZE,
): LeaderboardEntry[] {
  const sorted = [...values].sort((a, b) => b.value - a.value)
  const ranks = competitionRanks(sorted.map((v) => v.value))
  return sorted
    .map((v, i) => ({ memberId: v.memberId, value: v.value, rank: ranks[i] }))
    .filter((e) => e.rank <= size)
}
