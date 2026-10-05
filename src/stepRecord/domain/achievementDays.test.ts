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
  const member = (id: string, name: string, days: number) => ({
    memberId: memberId(id),
    displayName: name,
    achievementDays: days,
  })

  test('全員分の達成率（%）を出す。全員が全日数で達成すれば100', () => {
    const result = specialMission([member('a', 'A', 5), member('b', 'B', 5)], 5)
    expect(result!.overallRate).toBe(100)
  })

  test('達成率は全員分の達成日数の合計 ÷（人数×対象日数）', () => {
    // 2人、対象10日: Aは10日中8日、Bは10日中2日 → 合計10日 ÷ 20日 = 50%
    const result = specialMission([member('a', 'A', 8), member('b', 'B', 2)], 10)
    expect(result!.overallRate).toBe(50)
  })

  test('四捨五入する', () => {
    // 3人、対象10日、合計16日 → 16/30 = 53.33...% → 53%
    const result = specialMission(
      [member('a', 'A', 6), member('b', 'B', 5), member('c', 'C', 5)],
      10,
    )
    expect(result!.overallRate).toBe(53)
  })

  test('全日数で達成した人だけを極上仕事人に含める', () => {
    const result = specialMission(
      [member('a', 'A', 10), member('b', 'B', 9), member('c', 'C', 10)],
      10,
    )
    expect(result!.legendaryWorkers).toEqual([
      { memberId: memberId('a'), displayName: 'A', achievementDays: 10, rate: 100 },
      { memberId: memberId('c'), displayName: 'C', achievementDays: 10, rate: 100 },
    ])
  })

  test('達成率90%以上100%未満の人を筆頭仕事人に含める', () => {
    const result = specialMission([member('a', 'A', 9)], 10)
    expect(result!.rightHandWorkers).toEqual([
      { memberId: memberId('a'), displayName: 'A', achievementDays: 9, rate: 90 },
    ])
    expect(result!.legendaryWorkers).toEqual([])
    expect(result!.eliteWorkers).toEqual([])
  })

  test('達成率80%以上90%未満の人を精鋭仕事人に含める', () => {
    const result = specialMission([member('a', 'A', 8)], 10)
    expect(result!.eliteWorkers).toEqual([
      { memberId: memberId('a'), displayName: 'A', achievementDays: 8, rate: 80 },
    ])
    expect(result!.rightHandWorkers).toEqual([])
  })

  test('達成率80%未満の人はどの称号にも含めない', () => {
    const result = specialMission([member('a', 'A', 7)], 10)
    expect(result!.legendaryWorkers).toEqual([])
    expect(result!.rightHandWorkers).toEqual([])
    expect(result!.eliteWorkers).toEqual([])
  })

  test('称号を持つ人がいなければ、それぞれ空配列', () => {
    const result = specialMission([member('a', 'A', 1)], 10)
    expect(result!.legendaryWorkers).toEqual([])
    expect(result!.rightHandWorkers).toEqual([])
    expect(result!.eliteWorkers).toEqual([])
  })

  test('メンバーが1人もいなければ null', () => {
    expect(specialMission([], 10)).toBeNull()
  })

  test('対象日数が0以下なら null', () => {
    expect(specialMission([member('a', 'A', 0)], 0)).toBeNull()
  })
})
