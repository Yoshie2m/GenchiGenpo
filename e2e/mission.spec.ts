import { expect, test } from '@playwright/test'
import { dev, open, tab } from './fixtures.ts'

test('1つのチームミッションを、作成から到達・順位確定・次のミッションの自動確定まで通す', async ({
  page,
}) => {
  await open(page, 'team')

  // 最初のミッションは誰でも作成でき、翌日（10/5）から始まる
  await page.getByRole('button', { name: '遠州・浜名屋にする' }).click()
  await expect(page.getByRole('heading', { level: 2 })).toContainText('遠州・浜名屋')
  await expect(page.getByText('10月5日（月）の 0:00 に始まります。')).toBeVisible()

  // 開始日になると、全員が2隊に振り分けられる
  await dev(page, '1日進める')
  await expect(page.getByRole('article')).toHaveCount(2)
  await expect(page.getByText('（自分の隊）')).toBeVisible()

  // 毎日、自分は 30,000 歩、ほかのメンバーもダミーの歩数を記録して進める（どちらかの隊が到達するまで）
  for (let day = 0; day < 8; day++) {
    if (await page.getByRole('img', { name: '到達' }).isVisible()) break
    await tab(page, '今日').click()
    await page.getByLabel('今日の歩数（その日の合計）').fill('30000')
    await page.getByRole('button', { name: '記録する' }).click()
    await expect(page.getByRole('status')).toContainText('記録しました')
    await dev(page, 'ほかのメンバーの今日の歩数を入れる')
    // 隊（チームミッション）は下部タブから外したが、裏では残っている。URL の # から開く
    await page.goto('/#team')
    if (await page.getByRole('img', { name: '到達' }).isVisible()) break
    await dev(page, '1日進める')
  }
  await expect(page.getByText(/に至りました。最終日は/)).toBeVisible()

  // 中間地点の着順と中間通過ポイントが記録される
  await expect(page.getByText(/1着/).first()).toBeVisible()

  // 時計は毎日 12:00。最終日の翌日 12:00 は歩数の受付中で、13:00 に最終順位が確定し、優勝チームが決まる
  await dev(page, '1日進める')
  await expect(page.getByText(/歩数を受付中/)).toBeVisible()
  await dev(page, '1時間進める')
  await expect(page.getByText(/順位確定/)).toBeVisible()
  await expect(page.getByRole('img', { name: '優勝' })).toBeVisible()
  await expect(page.getByText(/優勝は/)).toBeVisible()

  // 誰も次の目的地を選ばなければ、その日の 23:59 を過ぎた時点（翌日 0:00）で一番上の候補（裾野・からくり村）に決まり、始まる
  for (let h = 0; h < 11; h++) await dev(page, '1時間進める')
  await expect(page.getByRole('heading', { level: 2 })).toContainText('裾野・からくり村')
  await expect(page.getByText(/進行中/)).toBeVisible()
})

test('道中試練: 歩数を記録すると進捗（完遂率）が増え、行程・通過記録が出る', async ({ page }) => {
  await open(page, 'journey')
  const progress = page.getByText(/％達成$/)
  const before = Number((await progress.textContent())!.replace(/\D/g, ''))
  await tab(page, '今日').click()
  await page.getByLabel('今日の歩数（その日の合計）').fill('12000')
  await page.getByRole('button', { name: '記録する' }).click()
  await tab(page, '道中').click()
  await expect
    .poll(async () => Number((await progress.textContent())!.replace(/\D/g, '')))
    .toBeGreaterThan(before)
  await expect(page.getByText('道中（行程）')).toBeVisible()
  await expect(page.getByRole('list', { name: '通過記録' })).toBeVisible()
})

test('記録を保存し、開き直しても残っている', async ({ page }) => {
  await open(page)
  await page.getByLabel('今日の歩数（その日の合計）').fill('8432')
  await page.getByRole('button', { name: '記録する' }).click()
  await page.reload()
  await expect(page.getByRole('img', { name: '今日の歩数 8432歩' })).toBeVisible()
})
