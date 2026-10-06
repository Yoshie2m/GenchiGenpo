/**
 * 現在の進捗（完遂率、%）。累計歩数 ÷ 総歩数を切り捨てた整数で、上限は100。
 * 切り捨てるのは、ゴール前に四捨五入で「100％」と出ないようにするため。
 * ゴールに着いた後も歩数は増え続けるが、100を超えては出さない。
 */
export function progressPercentOf(cumulativeSteps: number, goalSteps: number): number {
  if (goalSteps <= 0) return 0
  const percent = Math.floor((cumulativeSteps / goalSteps) * 100)
  return Math.max(0, Math.min(100, percent))
}
