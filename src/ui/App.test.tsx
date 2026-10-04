import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createApp } from '../composition.ts'
import { fixedClock } from '../shared/Clock.ts'
import { sequentialIdGenerator } from '../shared/IdGenerator.ts'
import { parseLocalDate } from '../shared/LocalDate.ts'
import App, { CONCEPT } from './App.tsx'

/** 日本時間 2026-10-04 12:00、ダミーメンバー入り。 */
function setup() {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  const app = createApp({
    storage: localStorage,
    baseClock: fixedClock(new Date('2026-10-04T03:00:00Z')),
    ids: sequentialIdGenerator('id'),
    // 画面キャプチャの文字認識は差し替える（10月のカレンダーを読み取った扱い）
    recognizeCalendar: async () => ({
      ok: true,
      calendar: {
        year: 2026,
        month: 10,
        days: [
          { day: 1, steps: 9000 },
          { day: 2, steps: 130000 },
          { day: 3, steps: 1 },
          { day: 5, steps: null },
        ],
        warnings: [],
      },
    }),
  })
  app.dev.seedDemoIfEmpty()
  render(<App app={app} />)
  return { app, user: userEvent.setup() }
}

const tab = (name: string) =>
  within(screen.getByRole('navigation', { name: '主要' })).getByRole('button', { name })

test('下部の5タブで画面を切り替える', async () => {
  const { user } = setup()
  for (const [name, heading] of [
    ['記録', '記録'],
    ['道中', '道中'],
    ['隊', '隊'],
    ['番付', '番付'],
    ['今日', '今日の歩み'],
  ]) {
    await user.click(tab(name))
    expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
    // コンセプト文はどのタブでも上部に出る
    expect(screen.getByText(CONCEPT)).toBeInTheDocument()
    expect(tab(name)).toHaveAttribute('aria-current', 'page')
  }
})

test('今日の歩数を記録すると、今日の画面と道中の累計歩数に反映される', async () => {
  const { app, user } = setup()
  const before = app.personal.view(app.members.members()[0].memberId)!.cumulativeSteps
  await user.type(screen.getByLabelText('今日の歩数（その日の合計）'), '8432')
  await user.click(screen.getByRole('button', { name: '記録する' }))
  expect(screen.getByRole('status')).toHaveTextContent('8,432歩で記録しました')
  expect(screen.getByLabelText('今日の歩数 8432歩')).toBeInTheDocument()
  await user.click(tab('道中'))
  expect(screen.getByLabelText(`累計歩数 ${before + 8432}歩`)).toBeInTheDocument()
})

test('30,000歩を超えて入れると、30,000歩で止めたことを知らせる', async () => {
  const { user } = setup()
  await user.type(screen.getByLabelText('今日の歩数（その日の合計）'), '130000')
  await user.click(screen.getByRole('button', { name: '記録する' }))
  expect(screen.getByRole('status')).toHaveTextContent('30,000歩で記録しました')
})

test('記録の画面では、誤入力の修正に印を付けたときだけ歩数を減らせる', async () => {
  const { app, user } = setup()
  const me = app.members.members()[0].memberId
  const [latest] = app.steps.recordsOf(me)
  await user.click(tab('記録'))
  const row = screen.getAllByRole('listitem').find((li) => li.textContent?.includes('直す'))!
  await user.click(within(row).getByRole('button', { name: '直す' }))
  const form = screen.getByRole('form')
  const input = within(form).getByRole('textbox')
  await user.clear(input)
  await user.type(input, '1')
  await user.click(within(form).getByRole('button', { name: '確定する' }))
  expect(within(form).getByRole('alert')).toHaveTextContent('誤入力の修正だけです')
  await user.click(within(form).getByLabelText('誤入力の修正です（歩数を減らせます）'))
  await user.click(within(form).getByRole('button', { name: '確定する' }))
  expect(app.steps.recordsOf(me).find((r) => r.date === latest.date)?.steps).toBe(1)
})

test('道中の画面に、次の通過点と一口メモが出る', async () => {
  const { user } = setup()
  await user.click(tab('道中'))
  expect(screen.getByText(/次の通過点/)).toBeInTheDocument()
  expect(screen.getByRole('list', { name: '通過記録' })).toBeInTheDocument()
})

test('隊の画面: ミッションがなければ候補から選び、翌日から始まる', async () => {
  const { user } = setup()
  await user.click(tab('隊'))
  await user.click(screen.getByRole('button', { name: '遠州・浜名屋にする' }))
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('遠州・浜名屋')
  expect(screen.getByText(/10月5日（月）の 0:00 に始まります/)).toBeInTheDocument()
})

test('開発用画面で日付を進めると、ミッションが始まり隊に振り分けられる', async () => {
  const { user } = setup()
  await user.click(tab('隊'))
  await user.click(screen.getByRole('button', { name: '遠州・浜名屋にする' }))
  await user.click(screen.getByText(/開発用/))
  await user.click(screen.getByRole('button', { name: '1日進める' }))
  expect(screen.getAllByRole('article')).toHaveLength(2)
  expect(screen.getByText(/（自分の隊）/)).toBeInTheDocument()
})

test('初めて開いたときは昼の色合い', () => {
  setup()
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('表示の設定（開発用画面の中）で昼・夜を切り替えられる', async () => {
  const { user } = setup()
  await user.click(screen.getByText(/開発用/))
  await user.click(screen.getByLabelText('夜（藍染の夜）'))
  expect(document.documentElement.dataset.theme).toBe('night')
  await user.click(screen.getByLabelText('昼（和紙）'))
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('初めて開いたときは、大字の下に算用数字を併記する', async () => {
  const { user } = setup()
  await user.type(screen.getByLabelText('今日の歩数（その日の合計）'), '8432')
  await user.click(screen.getByRole('button', { name: '記録する' }))
  expect(screen.getByText('8,432 歩')).toBeInTheDocument()
})

test('番付: 今日の歩数 → 全日数の総歩数 → 平均歩数 の順に、上位5名を棒グラフで比べる', async () => {
  const { app, user } = setup()
  const me = app.members.members()[0]
  app.steps.recordSteps(me.memberId, parseLocalDate('2026-10-04'), 30000, 'manual')
  app.dev.fillDemoStepsForToday(me.memberId)
  await user.click(tab('番付'))
  const charts = screen.getAllByRole('region').filter((r) => r.classList.contains('ranking'))
  expect(charts.map((c) => c.getAttribute('aria-label'))).toEqual([
    '今日の歩数',
    '全日数の総歩数',
    '平均歩数',
  ])
  for (const chart of charts) {
    expect(within(chart).getAllByRole('listitem').length).toBeLessThanOrEqual(6)
  }
  // 今日の歩数は 30,000 歩の自分が壱位
  const todayRows = within(charts[0]).getAllByRole('listitem')
  expect(todayRows[0]).toHaveTextContent('壱位')
  expect(todayRows[0]).toHaveTextContent(`${me.displayName}（自分）`)
  expect(todayRows[0]).toHaveClass('is-mine')
})

test('画面キャプチャを読み取り、確認画面で確かめてから取り込む', async () => {
  const { app, user } = setup()
  const me = app.members.members()[0].memberId
  const before = new Map(app.steps.recordsOf(me).map((r) => [r.date, r.steps]))
  await user.click(tab('記録'))
  await user.upload(
    screen.getByLabelText('スクリーンショットの画像'),
    new File(['x'], 'capture.png', { type: 'image/png' }),
  )
  const form = await screen.findByRole('form', { name: '読み取った歩数の確認' })
  // 10/2 は 30,000 歩を超えているので止める。10/3 は今の記録より少ない
  expect(within(form).getByText(/30,000歩で止めます/)).toBeInTheDocument()
  expect(within(form).getAllByText(/今の記録より少ないので取り込まない/).length).toBeGreaterThan(0)
  await user.click(within(form).getByRole('button', { name: /取り込む/ }))
  expect(screen.getByText(/日分を取り込みました/)).toBeInTheDocument()
  const after = new Map(app.steps.recordsOf(me).map((r) => [r.date, r.steps]))
  expect(after.get(parseLocalDate('2026-10-02'))).toBe(30000)
  expect(after.get(parseLocalDate('2026-10-03'))).toBe(before.get(parseLocalDate('2026-10-03')))
})
