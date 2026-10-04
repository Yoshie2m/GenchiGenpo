import type { WaypointPlan } from '../../publishedLanguage/missionPlan.ts'
import { waypointResult } from './waypointPoints.ts'

const wp: WaypointPlan = {
  name: '藤川宿',
  progressSteps: 38000,
  points: { first: 1000, second: 500 },
}
const t = (iso: string) => new Date(iso)

describe('waypointResult（中間地点の着順と中間通過ポイント）', () => {
  test('先に反映された隊が1位、次が2位、その次は 0 歩', () => {
    const a = t('2026-10-03T03:00:00Z')
    const b = t('2026-10-03T05:00:00Z')
    const c = t('2026-10-04T01:00:00Z')
    expect(waypointResult(wp, a, [b, c])).toEqual({ rank: 1, tied: false, points: 1000 })
    expect(waypointResult(wp, b, [a, c])).toEqual({ rank: 2, tied: false, points: 500 })
    expect(waypointResult(wp, c, [a, b])).toEqual({ rank: 3, tied: false, points: 0 })
  })

  test('同じ日の通過でも、反映された順で順位をつける', () => {
    const morning = t('2026-10-03T00:00:00Z')
    const night = t('2026-10-03T12:00:00Z')
    expect(waypointResult(wp, night, [morning]).rank).toBe(2)
  })

  test('完全に同じ時刻なら同着で、その順位の配点の7割', () => {
    const same = t('2026-10-03T03:00:00Z')
    expect(waypointResult(wp, same, [same])).toEqual({ rank: 1, tied: true, points: 700 })
  })

  test('まだ着いていない隊は数えない（ほかの隊がいなければ1位）', () => {
    expect(waypointResult(wp, t('2026-10-03T03:00:00Z'), []).rank).toBe(1)
  })
})
