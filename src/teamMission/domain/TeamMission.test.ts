import { memberId } from '../../publishedLanguage/memberId.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { a1, a2, b1, b2, jst, startSmallMission, steps } from './testHelpers.ts'

describe('TeamMission の状態', () => {
  test('開始日の 0:00 から進行中、期限の翌日 0:00 から歩数受付中、翌日 13:00 で確定', () => {
    const m = startSmallMission() // 10/5〜10/9
    expect(m.status(jst('2026-10-04 23:59'))).toBe('notStarted')
    expect(m.status(jst('2026-10-05 00:00'))).toBe('inProgress')
    expect(m.status(jst('2026-10-09 23:59'))).toBe('inProgress')
    expect(m.status(jst('2026-10-10 00:00'))).toBe('accepting')
    expect(m.status(jst('2026-10-10 12:59'))).toBe('accepting')
    expect(m.status(jst('2026-10-10 13:00'))).toBe('finalized')
  })
})

describe('到達と最終日', () => {
  test('最初の1隊が到達した日（反映日時の日）が最終日になり、その日の終わりで終わる', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 20000, '2026-10-07 10:00'))
    m.recordSteps(steps(a2, '2026-10-05', 20000, '2026-10-07 10:00'))
    expect(m.finalDay).toBe('2026-10-07')
    expect(m.firstArrivedTeam).toBe(1)
    expect(m.endsAt).toEqual(jst('2026-10-08 00:00'))
    expect(m.stepDeadline).toEqual(jst('2026-10-08 13:00'))
  })

  test('到達日は歩いた日にさかのぼらない（5日目に3日目の歩数で到達したら5日目）', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 15000, '2026-10-05 20:00'))
    m.recordSteps(steps(a2, '2026-10-05', 10000, '2026-10-05 20:00'))
    m.recordSteps(steps(a1, '2026-10-07', 15000, '2026-10-09 08:00'))
    expect(m.finalDay).toBe('2026-10-09')
  })

  test('どの隊も到達しなければ、期限の日が最後の日になる', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 9000, '2026-10-05 20:00'))
    expect(m.finalDay).toBeNull()
    expect(m.lastDay).toBe('2026-10-09')
  })

  test('ミッションが終わった後に反映された歩数では、到達しない', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-09', 25000, '2026-10-10 08:00'))
    m.recordSteps(steps(a2, '2026-10-09', 25000, '2026-10-10 08:00'))
    expect(m.finalDay).toBeNull()
    // チーム評価歩数には数える（歩数受付締切まで）
    expect(m.standings(jst('2026-10-10 13:00'))[0].progressSteps).toBe(50000)
  })
})

describe('歩数を数える範囲', () => {
  test('歩数受付締切を過ぎて反映された歩数は数えない', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-09', 9000, '2026-10-10 13:00'))
    expect(m.standings(jst('2026-10-10 13:00'))[0].progressSteps).toBe(0)
  })

  test('開始日より前・最後の日より後の日付は数えない', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-04', 9000, '2026-10-05 08:00'))
    m.recordSteps(steps(a1, '2026-10-05', 20000, '2026-10-06 08:00'))
    m.recordSteps(steps(a2, '2026-10-05', 20000, '2026-10-06 08:00')) // 10/6 に到達
    m.recordSteps(steps(a1, '2026-10-07', 9000, '2026-10-06 23:00')) // あり得ないが、最後の日より後は数えない
    expect(m.standings(jst('2026-10-07 13:00'))[0].progressSteps).toBe(40000)
  })

  test('ミッションに参加していないメンバーの歩数は数えない', () => {
    const m = startSmallMission()
    m.recordSteps(steps(memberId('x'), '2026-10-05', 9000, '2026-10-05 20:00'))
    expect(m.standings(jst('2026-10-05 21:00')).map((s) => s.progressSteps)).toEqual([0, 0])
  })

  test('メンバーは1つの隊にだけ所属し、ミッション中に移動しない', () => {
    const m = startSmallMission()
    expect(() => m.addMember(a1, 2)).toThrow(DomainError)
  })
})

describe('中間地点と中間通過ポイント', () => {
  test('先に反映された隊が1位（1,000歩）、次が2位（500歩）', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 16000, '2026-10-05 19:00'))
    m.recordSteps(steps(b1, '2026-10-05', 16000, '2026-10-05 20:00'))
    expect(m.waypointStandings(1)).toMatchObject([{ waypointIndex: 0, rank: 1, points: 1000 }])
    expect(m.waypointStandings(2)).toMatchObject([{ waypointIndex: 0, rank: 2, points: 500 }])
  })

  test('完全に同じ時刻に反映されたら同着で、7割（700歩）ずつ', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 16000, '2026-10-05 19:00'))
    m.recordSteps(steps(b1, '2026-10-05', 16000, '2026-10-05 19:00'))
    expect(m.waypointStandings(1)).toMatchObject([{ rank: 1, tied: true, points: 700 }])
    expect(m.waypointStandings(2)).toMatchObject([{ rank: 1, tied: true, points: 700 }])
  })

  test('一度に複数の中間地点を通過することもある', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 16000, '2026-10-06 08:00'))
    m.recordSteps(steps(a2, '2026-10-05', 16000, '2026-10-06 08:00'))
    expect(m.waypointStandings(1).map((w) => w.waypointIndex)).toEqual([0, 1])
  })

  test('誤入力の修正で進行歩数が減っても、通過の記録は残す', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 16000, '2026-10-05 19:00'))
    m.recordSteps(steps(a1, '2026-10-05', 6000, '2026-10-05 20:00'))
    expect(m.waypointStandings(1)).toHaveLength(1)
    expect(m.standings(jst('2026-10-05 21:00'))[0].progressSteps).toBe(6000)
  })
})

describe('チーム評価歩数・最終評価歩数・最終順位', () => {
  test('評価歩数は開始日から今日まで（来ていない日は数えない）、歩数がない日は 8,000 歩', () => {
    const m = startSmallMission()
    m.recordSteps(steps(a1, '2026-10-05', 12000, '2026-10-05 20:00'))
    const [team1, team2] = m.standings(jst('2026-10-06 09:00'))
    // 壱番隊: 10/5 は (12,000 + 8,000) / 2、10/6 は 8,000
    expect(team1.evaluationSteps).toBe(10000 + 8000)
    expect(team2.evaluationSteps).toBe(8000 + 8000)
  })

  test('最終評価歩数 = チーム評価歩数 + 中間通過ポイント。最初に到達した隊が1位とは限らない', () => {
    const m = startSmallMission()
    // 壱番隊は1人だけたくさん歩いて、先に中間地点に着き、先に到達する
    m.recordSteps(steps(a1, '2026-10-05', 30000, '2026-10-05 20:00'))
    m.recordSteps(steps(a1, '2026-10-06', 10000, '2026-10-06 20:00'))
    // 弐番隊は2人で歩く（中間地点には後から着き、到達も後）
    m.recordSteps(steps(b1, '2026-10-05', 16000, '2026-10-05 21:00'))
    m.recordSteps(steps(b2, '2026-10-05', 16000, '2026-10-05 21:00'))
    m.recordSteps(steps(b1, '2026-10-06', 16000, '2026-10-06 21:00'))
    m.recordSteps(steps(b2, '2026-10-06', 16000, '2026-10-06 21:00'))
    expect(m.finalDay).toBe('2026-10-06')
    expect(m.firstArrivedTeam).toBe(1)
    const [team1, team2] = m.standings(jst('2026-10-07 13:00'))
    // 壱番隊: (30,000+8,000)/2 + (10,000+8,000)/2 = 28,000、中間地点2つとも1位 = 2,000
    expect(team1).toMatchObject({
      evaluationSteps: 28000,
      points: 2000,
      finalScore: 30000,
      rank: 2,
    })
    // 弐番隊: 16,000 + 16,000 = 32,000、中間地点2つとも2位 = 1,000
    expect(team2).toMatchObject({
      evaluationSteps: 32000,
      points: 1000,
      finalScore: 33000,
      rank: 1,
    })
    expect(m.winners(jst('2026-10-07 13:00'))).toEqual([2])
  })

  test('最終評価歩数が同じなら同じ順位、優勝チームは全隊', () => {
    const m = startSmallMission()
    const now = jst('2026-10-10 13:00')
    expect(m.standings(now).map((s) => s.rank)).toEqual([1, 1])
    expect(m.winners(now)).toEqual([1, 2])
  })

  test('最終順位が確定するまでは優勝チームはない', () => {
    const m = startSmallMission()
    expect(m.winners(jst('2026-10-10 12:59'))).toEqual([])
  })
})
