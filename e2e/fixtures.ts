import { expect, type Page } from '@playwright/test'

/** E2E の「今」（日本時間 2026-10-04 12:00）。ダミーメンバーの歩数とミッションの日付が毎回同じになる。 */
export const NOW = new Date('2026-10-04T12:00:00+09:00')

/** 時計を止めてから開く（開発用の「日付を進める」は、止めた時刻に進めた分を足す）。 */
export async function open(page: Page, hash = 'today') {
  await page.clock.setFixedTime(NOW)
  await page.goto(`/#${hash}`)
  await expect(page.getByRole('heading', { level: 1, name: '現地現物' })).toBeVisible()
}

export function tab(page: Page, name: string) {
  return page.getByRole('navigation', { name: '主要' }).getByRole('button', { name })
}

/** 開発用画面の操作（開いていなければ開く）。 */
export async function dev(page: Page, button: string) {
  const panel = page.locator('details.dev-panel')
  if (!(await panel.evaluate((d) => (d as HTMLDetailsElement).open))) {
    await panel.locator('summary').click()
  }
  await panel.getByRole('button', { name: button }).click()
}
