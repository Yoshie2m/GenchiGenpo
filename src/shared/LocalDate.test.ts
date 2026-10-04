import { DomainError } from './DomainError.ts'
import { addDays, atJst, daysBetween, localDateOf, parseLocalDate } from './LocalDate.ts'

describe('localDateOf', () => {
  test('日本時間で日付を決める（UTC の 14:59 は日本時間の同じ日の 23:59）', () => {
    expect(localDateOf(new Date('2026-10-04T14:59:59Z'))).toBe('2026-10-04')
  })

  test('日本時間の 0:00 で日付が変わる（UTC の 15:00 は日本時間の翌日 0:00）', () => {
    expect(localDateOf(new Date('2026-10-04T15:00:00Z'))).toBe('2026-10-05')
  })
})

describe('parseLocalDate', () => {
  test('形式が正しくない日付は受け付けない', () => {
    expect(() => parseLocalDate('2026/10/04')).toThrow(DomainError)
  })

  test('存在しない日付は受け付けない', () => {
    expect(() => parseLocalDate('2026-02-29')).toThrow(DomainError)
    expect(parseLocalDate('2028-02-29')).toBe('2028-02-29')
  })
})

describe('atJst', () => {
  test('日本時間のその日の時刻を返す（最終日の翌日 13:00 など）', () => {
    expect(atJst(parseLocalDate('2026-10-05'), 13).toISOString()).toBe('2026-10-05T04:00:00.000Z')
  })

  test('時刻を省くと日本時間の 0:00', () => {
    expect(atJst(parseLocalDate('2026-10-01')).toISOString()).toBe('2026-09-30T15:00:00.000Z')
  })
})

describe('addDays と daysBetween', () => {
  test('月や年をまたいで日付をずらせる', () => {
    expect(addDays(parseLocalDate('2026-10-31'), 1)).toBe('2026-11-01')
    expect(addDays(parseLocalDate('2027-01-01'), -1)).toBe('2026-12-31')
  })

  test('2つの日付の差を日数で返す', () => {
    expect(daysBetween(parseLocalDate('2026-10-01'), parseLocalDate('2026-10-11'))).toBe(10)
    expect(daysBetween(parseLocalDate('2026-10-11'), parseLocalDate('2026-10-01'))).toBe(-10)
    expect(daysBetween(parseLocalDate('2026-10-01'), parseLocalDate('2026-10-01'))).toBe(0)
  })
})
