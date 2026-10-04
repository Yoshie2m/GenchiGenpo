/** 同じ値は同じ順位にし、次の順位は同順位の数だけ飛ばす（1位・1位・3位）。大きいほど上位（最終順位・番付で使う）。 */
export function competitionRanks(values: readonly number[]): number[] {
  return values.map((v) => 1 + values.filter((other) => other > v).length)
}
