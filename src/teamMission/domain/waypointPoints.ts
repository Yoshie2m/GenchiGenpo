import type { WaypointPlan } from '../../publishedLanguage/missionPlan.ts'

/** 同着（完全に同じ時刻に反映）のときは、その順位の配点の7割（DOMAINS.md）。 */
export const TIE_RATE = 0.7

/** ある中間地点の、ある隊の着順と中間通過ポイント。 */
export interface WaypointResult {
  readonly rank: number
  readonly tied: boolean
  readonly points: number
}

/**
 * 中間地点の着順と中間通過ポイントを、各隊の到着時刻（反映日時）から決める。
 * 着順は先に反映された順。同じ時刻に反映された隊は同着として同じ着順にし、配点を7割にする。
 * 1位・2位の配点は候補の設定、3位以下は 0 歩。
 */
export function waypointResult(
  waypoint: WaypointPlan,
  arrivedAt: Date,
  othersArrivedAt: readonly Date[],
): WaypointResult {
  const t = arrivedAt.getTime()
  const rank = 1 + othersArrivedAt.filter((o) => o.getTime() < t).length
  const tied = othersArrivedAt.some((o) => o.getTime() === t)
  const base = rank === 1 ? waypoint.points.first : rank === 2 ? waypoint.points.second : 0
  return { rank, tied, points: tied ? Math.round(base * TIE_RATE) : base }
}
