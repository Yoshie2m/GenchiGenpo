import { DomainError } from './DomainError.ts'

/**
 * 時刻を持たない、日本時間（JST）での日付（YYYY-MM-DD）。文字列のまま大小比較できる。
 * 「1日」の区切りはすべて日本時間で判定する（DOMAINS.md）。端末のタイムゾーンには左右されない。
 */
export type LocalDate = string & { readonly __brand: 'LocalDate' }

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
/** 日本時間は UTC+9 で、夏時間がない。 */
const JST_OFFSET_HOURS = 9
const DAY_MS = 24 * 60 * 60 * 1000

export function parseLocalDate(value: string): LocalDate {
  const match = PATTERN.exec(value)
  if (!match) throw new DomainError(`日付の形式が正しくありません: ${value}`)
  const [, y, m, d] = match.map(Number)
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) {
    throw new DomainError(`存在しない日付です: ${value}`)
  }
  return value as LocalDate
}

/** その時刻が、日本時間で何日にあたるか。 */
export function localDateOf(instant: Date): LocalDate {
  const jst = new Date(instant.getTime() + JST_OFFSET_HOURS * 60 * 60 * 1000)
  return localDateFromParts(jst.getUTCFullYear(), jst.getUTCMonth() + 1, jst.getUTCDate())
}

export function localDateFromParts(year: number, month: number, day: number): LocalDate {
  const pad = (n: number, width: number) => String(n).padStart(width, '0')
  return parseLocalDate(`${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`)
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 日本時間のその日の、指定した時刻（例: 最終日の翌日 13:00）。 */
export function atJst(date: LocalDate, hour = 0, minute = 0, second = 0): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, hour - JST_OFFSET_HOURS, minute, second))
}

/** 日付を days 日ずらす（負の数でさかのぼる）。 */
export function addDays(date: LocalDate, days: number): LocalDate {
  return localDateOf(new Date(atJst(date).getTime() + days * DAY_MS))
}

/** from から to まで何日あるか（to が後なら正、同じ日なら 0）。 */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round((atJst(to).getTime() - atJst(from).getTime()) / DAY_MS)
}
