import { memberId } from '../../publishedLanguage/memberId.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { DailySteps } from './DailySteps.ts'

const taro = memberId('taro')
const oct4 = parseLocalDate('2026-10-04')
// 日本時間 2026-10-04 21:00
const evening = new Date('2026-10-04T12:00:00Z')
const later = new Date('2026-10-04T13:00:00Z')

const recorded = (steps: number) =>
  DailySteps.record(taro, oct4, steps, 'manual', evening).dailySteps

describe('DailySteps.record（その日の最初の記録）', () => {
  test('歩数と反映日時を記録し、「歩数が記録された」を出す', () => {
    const { dailySteps, event, capped } = DailySteps.record(taro, oct4, 8432, 'manual', evening)
    expect(dailySteps.steps).toBe(8432)
    expect(dailySteps.reflectedAt).toEqual(evening)
    expect(capped).toBe(false)
    expect(event).toEqual({
      type: 'StepsRecorded',
      memberId: taro,
      date: oct4,
      steps: 8432,
      previousSteps: 0,
      reflectedAt: evening,
    })
  })

  test('30,000 歩を超えた日は 30,000 歩で記録する', () => {
    const { dailySteps, capped } = DailySteps.record(taro, oct4, 42_000, 'screenCapture', evening)
    expect(dailySteps.steps).toBe(30_000)
    expect(capped).toBe(true)
  })

  test('今日より後の日は記録できない（今日は日本時間で判定する）', () => {
    const tomorrow = parseLocalDate('2026-10-05')
    expect(() => DailySteps.record(taro, tomorrow, 100, 'manual', evening)).toThrow(DomainError)
    // 日本時間 10/5 0:00 を過ぎていれば 10/5 を記録できる
    const afterMidnight = new Date('2026-10-04T15:00:00Z')
    expect(DailySteps.record(taro, tomorrow, 100, 'manual', afterMidnight).dailySteps.date).toBe(
      '2026-10-05',
    )
  })

  test('2026年10月1日より前の日は記録できない', () => {
    expect(() =>
      DailySteps.record(taro, parseLocalDate('2026-09-30'), 100, 'manual', evening),
    ).toThrow(DomainError)
  })
})

describe('DailySteps.update（日次合計の上書き）', () => {
  test('大きい値で上書きし、反映日時を新しくする', () => {
    const { dailySteps, event } = recorded(5000).update(9000, 'iosShortcut', later)
    expect(dailySteps.steps).toBe(9000)
    expect(dailySteps.source).toBe('iosShortcut')
    expect(dailySteps.reflectedAt).toEqual(later)
    expect(event?.previousSteps).toBe(5000)
  })

  test('今より小さい値は受け付けない', () => {
    expect(() => recorded(5000).update(4999, 'manual', later)).toThrow(DomainError)
  })

  test('同じ値なら何も変えない（反映日時も変わらず、イベントも出ない）', () => {
    const before = recorded(5000)
    const { dailySteps, event } = before.update(5000, 'iosShortcut', later)
    expect(dailySteps).toBe(before)
    expect(event).toBeNull()
  })

  test('上限で止めた値が今と同じなら何も変えない', () => {
    const atLimit = recorded(30_000)
    const { dailySteps, event, capped } = atLimit.update(35_000, 'manual', later)
    expect(dailySteps).toBe(atLimit)
    expect(event).toBeNull()
    expect(capped).toBe(true)
  })
})

describe('DailySteps.correct（誤入力の修正）', () => {
  test('誤入力の修正なら歩数を減らせる', () => {
    const { dailySteps, event } = recorded(8_500).correct(8_000, later)
    expect(dailySteps.steps).toBe(8000)
    expect(dailySteps.reflectedAt).toEqual(later)
    expect(event).toMatchObject({ steps: 8000, previousSteps: 8500 })
  })

  test('修正でも 30,000 歩の上限を当てはめる', () => {
    expect(recorded(1000).correct(31_000, later).dailySteps.steps).toBe(30_000)
  })
})
