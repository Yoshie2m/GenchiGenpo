import { memberId } from '../../publishedLanguage/memberId.ts'
import { topEntries } from './leaderboard.ts'

const v = (id: string, value: number) => ({ memberId: memberId(id), value })

describe('topEntries（番付）', () => {
  test('値の大きい順に上位5名', () => {
    const result = topEntries([v('a', 1), v('b', 6), v('c', 3), v('d', 5), v('e', 2), v('f', 4)])
    expect(result.map((e) => [e.memberId, e.rank])).toEqual([
      ['b', 1],
      ['d', 2],
      ['f', 3],
      ['c', 4],
      ['e', 5],
    ])
  })

  test('同じ値は同じ順位（1位・1位・3位）', () => {
    expect(topEntries([v('a', 9), v('b', 9), v('c', 7)]).map((e) => e.rank)).toEqual([1, 1, 3])
  })

  test('5位が同順位で並ぶときは全員を載せる', () => {
    const result = topEntries([v('a', 9), v('b', 8), v('c', 7), v('d', 6), v('e', 5), v('f', 5)])
    expect(result.map((e) => e.memberId)).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
  })

  test('5名に満たなければ、いる人数だけ', () => {
    expect(topEntries([v('a', 1)])).toHaveLength(1)
  })
})
