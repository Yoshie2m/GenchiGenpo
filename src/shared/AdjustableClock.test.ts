import { AdjustableClock } from './AdjustableClock.ts'
import { fixedClock } from './Clock.ts'

const base = fixedClock(new Date('2026-10-04T03:00:00Z'))

describe('AdjustableClock（開発用の時計）', () => {
  beforeEach(() => localStorage.clear())

  test('進めていなければ本物の時刻', () => {
    expect(new AdjustableClock(base, localStorage).now()).toEqual(new Date('2026-10-04T03:00:00Z'))
  })

  test('日付を進めると、その分だけ先の時刻を返す', () => {
    const clock = new AdjustableClock(base, localStorage)
    clock.advanceDays(2)
    clock.advance(60 * 60 * 1000)
    expect(clock.now()).toEqual(new Date('2026-10-06T04:00:00Z'))
  })

  test('進めた分は保存され、作り直しても続きから', () => {
    new AdjustableClock(base, localStorage).advanceDays(1)
    expect(new AdjustableClock(base, localStorage).now()).toEqual(new Date('2026-10-05T03:00:00Z'))
  })

  test('元に戻せる', () => {
    const clock = new AdjustableClock(base, localStorage)
    clock.advanceDays(3)
    clock.reset()
    expect(clock.now()).toEqual(new Date('2026-10-04T03:00:00Z'))
  })
})
