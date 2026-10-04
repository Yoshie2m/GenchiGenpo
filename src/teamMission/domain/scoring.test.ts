import { parseLocalDate } from '../../shared/LocalDate.ts'
import {
  dailyTopTwoAverage,
  dailyTopTwoSum,
  datesFrom,
  evaluationSteps,
  progressSteps,
} from './scoring.ts'

describe('dailyTopTwoSum（上位2名の合計・補充なし）', () => {
  test('最も歩数の多い2名の合計', () => {
    expect(dailyTopTwoSum([5000, 12000, 9000])).toBe(21000)
  })

  test('1名ならその1名分だけ、0名なら 0 歩', () => {
    expect(dailyTopTwoSum([12000])).toBe(12000)
    expect(dailyTopTwoSum([])).toBe(0)
  })
})

describe('dailyTopTwoAverage（日別上位2名平均歩数）', () => {
  test('上位2名の平均', () => {
    expect(dailyTopTwoAverage([5000, 12000, 9000])).toBe(10500)
  })

  test('歩数のあるメンバーが1名なら、不足分を 8,000 歩として平均する', () => {
    expect(dailyTopTwoAverage([12000])).toBe(10000)
  })

  test('0名なら 8,000 歩', () => {
    expect(dailyTopTwoAverage([])).toBe(8000)
  })

  test('2人目が 8,000 歩未満なら、記録しない場合より下がる（意図どおり）', () => {
    expect(dailyTopTwoAverage([12000, 3000])).toBe(7500)
    expect(dailyTopTwoAverage([12000])).toBe(10000)
  })
})

describe('progressSteps と evaluationSteps', () => {
  const days = datesFrom(parseLocalDate('2026-10-01'), parseLocalDate('2026-10-03'))
  const table: Record<string, number[]> = {
    '2026-10-01': [10000, 8000, 2000],
    '2026-10-02': [12000],
    '2026-10-03': [],
  }
  const stepsOfDay = (date: string) => table[date] ?? []

  test('進行歩数は各日の上位2名の合計を累積する（補充なし）', () => {
    expect(progressSteps(stepsOfDay, days)).toBe(18000 + 12000 + 0)
  })

  test('チーム評価歩数は各日の上位2名平均を合計する（補充あり）', () => {
    expect(evaluationSteps(stepsOfDay, days)).toBe(9000 + 10000 + 8000)
  })

  test('datesFrom は両端を含む', () => {
    expect(days).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
    expect(datesFrom(parseLocalDate('2026-10-03'), parseLocalDate('2026-10-01'))).toEqual([])
  })
})
