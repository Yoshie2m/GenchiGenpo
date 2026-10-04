import { memberId } from '../../publishedLanguage/memberId.ts'
import { assignTeams, teamForLateJoiner } from './teamAssignment.ts'

const m = (id: string, averageSteps: number | null) => ({ memberId: memberId(id), averageSteps })

describe('assignTeams（開始時のチーム振り分け）', () => {
  test('人数の差は最大1人で、平均歩数の合計がならされる', () => {
    const result = assignTeams(
      [m('a', 12000), m('b', 10000), m('c', 9000), m('d', 7000), m('e', 6000)],
      2,
    )
    const byTeam = (team: number) => result.filter((r) => r.team === team).map((r) => r.memberId)
    expect(byTeam(1)).toEqual(['a', 'd', 'e'])
    expect(byTeam(2)).toEqual(['b', 'c'])
  })

  test('平均歩数を計算できないメンバーは 8,000 歩とみなす', () => {
    const result = assignTeams([m('a', 9000), m('new', null), m('b', 7000)], 2)
    // 9,000 → 壱。8,000（みなし）→ 人数の少ない弐。7,000 → 人数が同じなので合計の小さい弐（8,000 < 9,000）
    expect(result).toEqual([
      { memberId: 'a', team: 1 },
      { memberId: 'new', team: 2 },
      { memberId: 'b', team: 2 },
    ])
  })

  test('3隊にも振り分けられる', () => {
    const result = assignTeams([m('a', 3), m('b', 2), m('c', 1)], 3)
    expect(result.map((r) => r.team)).toEqual([1, 2, 3])
  })
})

describe('teamForLateJoiner（途中参加）', () => {
  test('人数が少ない隊に入れる', () => {
    expect(
      teamForLateJoiner(
        new Map([
          [1, 3],
          [2, 2],
        ]),
      ),
    ).toBe(2)
  })

  test('人数が同じなら壱番隊→弐番隊→参番隊の順', () => {
    expect(
      teamForLateJoiner(
        new Map([
          [2, 2],
          [1, 2],
          [3, 2],
        ]),
      ),
    ).toBe(1)
  })
})
