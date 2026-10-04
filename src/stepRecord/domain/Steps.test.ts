import { DomainError } from '../../shared/DomainError.ts'
import { capSteps, DAILY_STEP_LIMIT } from './Steps.ts'

describe('capSteps（1日の上限歩数）', () => {
  test('30,000 歩までは入力どおり', () => {
    expect(capSteps(0)).toEqual({ steps: 0, capped: false })
    expect(capSteps(DAILY_STEP_LIMIT)).toEqual({ steps: 30_000, capped: false })
  })

  test('30,000 歩を超えた日は 30,000 歩にし、止めたことを返す', () => {
    expect(capSteps(30_001)).toEqual({ steps: 30_000, capped: true })
    expect(capSteps(130_000)).toEqual({ steps: 30_000, capped: true })
  })

  test('負の数や小数は受け付けない', () => {
    expect(() => capSteps(-1)).toThrow(DomainError)
    expect(() => capSteps(1.5)).toThrow(DomainError)
  })
})
