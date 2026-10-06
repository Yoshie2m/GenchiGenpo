import { RECORDING_START_DATE } from '../stepRecord/domain/DailySteps.ts'
import { localDateOf } from '../shared/LocalDate.ts'
import { SAMPLE_MEMBER_COUNT, SAMPLE_SURNAMES, buildSampleData } from './sampleData.ts'

/** 種から決まる乱数（テスト用）。 */
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0
    return a / 4294967296
  }
}

const now = new Date('2026-10-06T03:00:00Z') // 日本時間 2026-10-06 12:00

describe('buildSampleData', () => {
  test('カタカナの名字の6人を、重ならないように作る', () => {
    const { members } = buildSampleData(now, seeded(1))
    expect(members).toHaveLength(SAMPLE_MEMBER_COUNT)
    const names = members.map((m) => m.displayName)
    expect(new Set(names).size).toBe(SAMPLE_MEMBER_COUNT)
    for (const name of names) {
      expect(SAMPLE_SURNAMES).toContain(name)
      expect(name).toMatch(/^[゠-ヿ]+$/)
    }
  })

  test('歩数は10月1日から今日までで、0〜30,000歩の範囲に収まる', () => {
    const { members, dailySteps } = buildSampleData(now, seeded(2))
    const today = localDateOf(now)
    expect(dailySteps.length).toBeGreaterThan(0)
    for (const d of dailySteps) {
      expect(d.date >= RECORDING_START_DATE && d.date <= today).toBe(true)
      expect(d.steps).toBeGreaterThanOrEqual(0)
      expect(d.steps).toBeLessThanOrEqual(30_000)
      expect(members.map((m) => m.id)).toContain(d.memberId)
    }
  })

  test('乱数の種が同じなら同じ内容、違えば違う内容になる', () => {
    const summary = (seed: number) => {
      const { members, dailySteps } = buildSampleData(now, seeded(seed))
      return JSON.stringify([members.map((m) => m.displayName), dailySteps.map((d) => d.steps)])
    }
    expect(summary(3)).toBe(summary(3))
    expect(summary(3)).not.toBe(summary(4))
  })
})
