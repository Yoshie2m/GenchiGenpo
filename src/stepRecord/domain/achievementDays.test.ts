import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { achievementDaysOf, specialMission } from './achievementDays.ts'
import { DailySteps } from './DailySteps.ts'

const taro = memberId('taro')
const d = parseLocalDate
const at = new Date('2026-10-20T00:00:00Z')
const rec = (date: string, steps: number) =>
  DailySteps.reconstruct(taro, d(date), steps, 'manual', at)

describe('achievementDaysOf（達成日数）', () => {
  test('8000歩以上を記録した日だけを数える', () => {
    const records = [rec('2026-10-01', 8_000), rec('2026-10-02', 7_999), rec('2026-10-03', 20_000)]
    expect(achievementDaysOf(records, d('2026-10-01'), d('2026-10-03'))).toBe(2)
  })

  test('期間の外の記録は数えない', () => {
    const records = [rec('2026-10-01', 9_000), rec('2026-10-05', 9_000)]
    expect(achievementDaysOf(records, d('2026-10-01'), d('2026-10-02'))).toBe(1)
  })

  test('記録のない日は達成に数えない(0日)', () => {
    expect(achievementDaysOf([], d('2026-10-01'), d('2026-10-10'))).toBe(0)
  })
})

describe('specialMission（特命）', () => {
  test('全員の平均と、達成日数が多い上位3名の平均を出す', () => {
    // 5人: 10, 8, 6, 4, 2 日
    const result = specialMission([10, 8, 6, 4, 2])
    expect(result).toEqual({ allAverage: 6, top3Average: 8 }) // (10+8+6)/3 = 8
  })

  test('同率の人がいれば、上位3位までの全員を平均に含める(番付と同じ考え方)', () => {
    // 1位8日、2位も8日(同率1位)、3位5日 → 上位3位までに3人入る
    const result = specialMission([8, 8, 5, 1])
    expect(result!.top3Average).toBeCloseTo((8 + 8 + 5) / 3)
  })

  test('メンバーが1人もいなければ null', () => {
    expect(specialMission([])).toBeNull()
  })
})
