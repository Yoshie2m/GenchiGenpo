import { progressPercentOf } from './progress.ts'

describe('progressPercentOf', () => {
  test('累計歩数 ÷ 総歩数 を百分率（切り捨て）にする', () => {
    expect(progressPercentOf(0, 460_000)).toBe(0)
    expect(progressPercentOf(230_000, 460_000)).toBe(50)
    expect(progressPercentOf(100_000, 460_000)).toBe(21)
  })

  test('ゴール前は、四捨五入なら100になる歩数でも99までにする', () => {
    expect(progressPercentOf(457_000, 460_000)).toBe(99)
    expect(progressPercentOf(459_999, 460_000)).toBe(99)
  })

  test('ちょうどゴールで100になる', () => {
    expect(progressPercentOf(460_000, 460_000)).toBe(100)
  })

  test('ゴールを過ぎても100を超えない', () => {
    expect(progressPercentOf(461_000, 460_000)).toBe(100)
    expect(progressPercentOf(600_000, 460_000)).toBe(100)
  })

  test('総歩数が0以下なら0にする', () => {
    expect(progressPercentOf(1_000, 0)).toBe(0)
  })
})
