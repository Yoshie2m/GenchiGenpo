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

  test('全体成果（日）を出す。全員が全日数で達成すれば対象日数と同じ', () => {
    const result = specialMission([member('a', 'A', 5), member('b', 'B', 5)], 5)
    expect(result!.overallDays).toBe(5)
  })

  test('全体成果は、全員の達成日数の合計 ÷ 人数（1人あたりの平均達成日数）', () => {
    // 2人、対象10日: Aは8日、Bは2日 → 合計10日 ÷ 2人 = 5日
    const result = specialMission([member('a', 'A', 8), member('b', 'B', 2)], 10)
    expect(result!.overallDays).toBe(5)
  })

  test('1日ずつ「その日に達成した人数 ÷ 全員の人数」を足した値と同じになる', () => {
    // 4人、対象3日。1日目は4人中3人、2日目は2人、3日目は1人が達成 → 3/4 + 2/4 + 1/4 = 1.5日
    // （各人の達成日数は 2・2・1・1 日で、合計6日 ÷ 4人 = 1.5日）
    const result = specialMission(
      [member('a', 'A', 2), member('b', 'B', 2), member('c', 'C', 1), member('d', 'D', 1)],
      3,
    )
    expect(result!.overallDays).toBe(1.5)
  })

  test('小数第2位を四捨五入して、小数第1位まで出す', () => {
    // 3人、合計16日 → 16/3 = 5.333… → 5.3
    const three = [member('a', 'A', 6), member('b', 'B', 5), member('c', 'C', 5)]
    expect(specialMission(three, 10)!.overallDays).toBe(5.3)
    // 3人、合計17日 → 5.666… → 5.7
    const up = [member('a', 'A', 6), member('b', 'B', 6), member('c', 'C', 5)]
    expect(specialMission(up, 10)!.overallDays).toBe(5.7)
    // 8人、合計1日 → 0.125 → 0.1、合計3日 → 0.375 → 0.4（ちょうど半分は切り上げ: 0.05 の位が5）
    const eight = (total: number) =>
      Array.from({ length: 8 }, (_, i) => member(`m${i}`, `M${i}`, i === 0 ? total : 0))
    expect(specialMission(eight(1), 10)!.overallDays).toBe(0.1)
    expect(specialMission(eight(3), 10)!.overallDays).toBe(0.4)
    // 4人、合計1日 → 0.25 → 0.3（ちょうど半分は切り上げ）
    const four = [
      member('a', 'A', 1),
      member('b', 'B', 0),
      member('c', 'C', 0),
      member('d', 'D', 0),
    ]
    expect(specialMission(four, 10)!.overallDays).toBe(0.3)
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
