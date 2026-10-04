import { DomainError } from '../../shared/DomainError.ts'

/** 歩数。0 以上 30,000 以下の整数（1日の上限歩数を当てはめた後の値）。 */
export type Steps = number & { readonly __brand: 'Steps' }

/** 1日の上限歩数。超えた日は 30,000 歩として記録する（DOMAINS.md）。 */
export const DAILY_STEP_LIMIT = 30_000

/**
 * 入力された歩数に1日の上限歩数を当てはめる。
 * 上限で止めたかどうかを返す（読み取り誤りに気づけるよう、確認画面で知らせるため）。
 */
export function capSteps(input: number): { steps: Steps; capped: boolean } {
  if (!Number.isInteger(input) || input < 0) {
    throw new DomainError(`歩数は 0 以上の整数です: ${input}`)
  }
  const capped = input > DAILY_STEP_LIMIT
  return { steps: (capped ? DAILY_STEP_LIMIT : input) as Steps, capped }
}
