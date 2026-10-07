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

/**
 * 小数第1位までの数を大字で表す（例: 3.4 → 「参・四」、0.5 → 「零・五」、10 → 「拾・零」）。
 * 小数第2位以下は切り捨てる（呼び出し側で四捨五入してから渡す）。小数点は「・」。
 */
export function toDaijiDecimal(n: number): string {
  const tenths = Math.floor(Math.round(n * 100) / 10) // 浮動小数の誤差（3.4 → 3.3999…）を避けて10倍の整数にする
  return `${toDaiji(Math.floor(tenths / 10))}・${DIGITS[tenths % 10]}`
}
