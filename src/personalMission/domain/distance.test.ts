import { stepsToRi } from './distance.ts'

describe('stepsToRi', () => {
  test('歩数を歩幅72cm・1里3,927mで里に換算する（四捨五入）', () => {
    expect(stepsToRi(0)).toBe(0)
    // 5,454歩 × 0.72m = 3,927m = 1里
    expect(stepsToRi(5_454)).toBe(1)
    // 東海道五十三次ルートの総歩数（約461,000歩 ≒ 331.9km）は約84.5里 → 85里
    expect(stepsToRi(461_000)).toBe(85)
  })
})
