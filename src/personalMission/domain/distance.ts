/** 1歩あたりの歩幅（m）。東海道五十三次ルートの総距離・総歩数の計算と同じ値（hq-to-shintora-route.md）。 */
const STRIDE_METERS = 0.72

/** 1里（m）。伝統的な里の定義（約3.927km）。 */
const RI_METERS = 3_927

/** 歩数を里に換算する（四捨五入した整数）。 */
export function stepsToRi(steps: number): number {
  return Math.round((steps * STRIDE_METERS) / RI_METERS)
}
