import { competitionRanks } from './ranking.ts'

describe('competitionRanks（最終順位）', () => {
  test('大きい順に順位をつける', () => {
    expect(competitionRanks([300, 500, 400])).toEqual([3, 1, 2])
  })

  test('同じ値は同じ順位にし、次の順位を飛ばす（1位・1位・3位）', () => {
    expect(competitionRanks([500, 500, 400])).toEqual([1, 1, 3])
    expect(competitionRanks([500, 400, 400])).toEqual([1, 2, 2])
  })
})
