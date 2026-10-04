/**
 * 歩数を大字（壱・弍・参…）で表す（デザインシステム「歩（ほ）」の numerals.md の位取り表記）。
 * - 「拾」「百」「千」の直前の「壱」は省き、「壱萬」は省かない。途中の 0 は飛ばし、0 歩だけ「零」。
 * - 「二」は旧字形の「弍」を使う。
 */
const DIGITS = ['零', '壱', '弍', '参', '四', '五', '六', '七', '八', '九']

export function toDaiji(n: number): string {
  const value = Math.floor(n)
  if (value === 0) return '零'
  const man = Math.floor(value / 10000)
  const rest = value % 10000
  let out = ''
  if (man > 0) out += (man === 1 ? '壱' : toDaiji(man)) + '萬'
  let r = rest
  for (const [unit, label] of [
    [1000, '千'],
    [100, '百'],
    [10, '拾'],
  ] as const) {
    const d = Math.floor(r / unit)
    if (d > 0) out += (d === 1 ? '' : DIGITS[d]) + label
    r %= unit
  }
  if (r > 0) out += DIGITS[r]
  return out
}
