import { autoConfirmAt, canCreateNext, creationOpensAt, nextStartDate } from './nextMission.ts'
import { a1, a2, b1, jst, startSmallMission, steps } from './testHelpers.ts'

/** 壱番隊が 10/6 に到達して優勝するミッション（最終日 10/6、順位確定 10/7 13:00）。 */
function finishedMission() {
  const m = startSmallMission()
  m.recordSteps(steps(a1, '2026-10-05', 20000, '2026-10-06 20:00'))
  m.recordSteps(steps(a2, '2026-10-05', 20000, '2026-10-06 20:00'))
  return m
}

describe('次のミッションの作成', () => {
  test('最終順位の確定（翌日 13:00）から、その日の 23:59 を過ぎるまで作成できる', () => {
    const m = finishedMission()
    expect(creationOpensAt(m)).toEqual(jst('2026-10-07 13:00'))
    expect(autoConfirmAt(m)).toEqual(jst('2026-10-08 00:00'))
  })

  test('次のミッションは、作成・確定した日の翌日に始まる', () => {
    expect(nextStartDate(finishedMission())).toBe('2026-10-08')
  })

  test('優勝チームのメンバーだけが作成できる', () => {
    const m = finishedMission()
    const now = jst('2026-10-07 15:00')
    expect(canCreateNext(a2, m, now, false)).toBe(true)
    expect(canCreateNext(b1, m, now, false)).toBe(false)
  })

  test('期間の外や、すでに作成済みなら作成できない', () => {
    const m = finishedMission()
    expect(canCreateNext(a1, m, jst('2026-10-07 12:59'), false)).toBe(false)
    expect(canCreateNext(a1, m, jst('2026-10-08 00:00'), false)).toBe(false)
    expect(canCreateNext(a1, m, jst('2026-10-07 15:00'), true)).toBe(false)
  })

  test('同率1位なら、同率の全隊のメンバーが作成できる', () => {
    const m = startSmallMission() // 誰も歩かず期限切れ（同率1位）
    const now = jst('2026-10-10 15:00')
    expect(canCreateNext(a1, m, now, false)).toBe(true)
    expect(canCreateNext(b1, m, now, false)).toBe(true)
  })
})
