import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { DailySteps } from './DailySteps.ts'
import { personalAverage } from './personalAverage.ts'

const taro = memberId('taro')
const d = parseLocalDate
const at = new Date('2026-10-20T00:00:00Z')
const rec = (date: string, steps: number) =>
  DailySteps.reconstruct(taro, d(date), steps, 'manual', at)

describe('personalAverage（個人の平均歩数）', () => {
  test('期間のすべての日で割り、記録しなかった日は 0 歩として数える', () => {
    const records = [rec('2026-10-01', 9000), rec('2026-10-03', 6000)]
    // 10/1〜10/4 の4日で 15,000 歩
    expect(personalAverage(records, d('2026-10-01'), d('2026-10-04'))).toBe(3750)
  })

  test('期間の外の記録は数えない', () => {
    const records = [rec('2026-10-01', 9000), rec('2026-10-05', 30000)]
    expect(personalAverage(records, d('2026-10-01'), d('2026-10-02'))).toBe(4500)
  })

  test('登録日から数え始められる', () => {
    const records = [rec('2026-10-10', 8000), rec('2026-10-11', 10000)]
    expect(personalAverage(records, d('2026-10-10'), d('2026-10-11'))).toBe(9000)
  })

  test('数える日がないときは null', () => {
    expect(personalAverage([], d('2026-10-10'), d('2026-10-09'))).toBeNull()
  })
})
