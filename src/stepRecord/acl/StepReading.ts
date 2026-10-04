/**
 * 外部（画面キャプチャ）から読み取った1日分の歩数（腐敗防止層）。
 * 確認画面で本人が確かめてから、歩数記録（DailySteps）に取り込む。
 */
export interface StepReading {
  /** YYYY-MM-DD */
  date: string
  steps: number
}

/**
 * 歩数として受け付けられない値なら、その理由を返す（確認画面で修正を求める）。
 * 30,000 歩を超える値は修正を求めず、1日の上限歩数で止めて取り込む（DOMAINS.md）。
 */
export function stepValueError(steps: number): string | undefined {
  if (!Number.isInteger(steps) || steps < 0) return '歩数は 0 以上の整数で入れてください'
  return undefined
}

/** カンマやピリオドの区切りを除いて歩数を読む。数字以外が含まれていれば undefined。 */
export function parseStepText(text: string): number | undefined {
  const digits = text.trim().replace(/[,.，]/g, '')
  return /^\d+$/.test(digits) ? Number(digits) : undefined
}
