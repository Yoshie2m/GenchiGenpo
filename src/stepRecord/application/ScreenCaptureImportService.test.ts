import sample from '../../../tests/fixtures/step-calendar-sample.ocr.json'
import { memberId } from '../../publishedLanguage/memberId.ts'
import { fixedClock } from '../../shared/Clock.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { parseStepCalendar } from '../acl/screenCapture/parseStepCalendar.ts'
import { LocalStorageDailyStepsRepository } from '../infrastructure/LocalStorageDailyStepsRepository.ts'
import { ScreenCaptureImportService } from './ScreenCaptureImportService.ts'
import { StepRecordService } from './StepRecordService.ts'

const taro = memberId('taro')
// 日本時間 2026-10-10 12:00
const clock = fixedClock(new Date('2026-10-10T03:00:00Z'))

function setup() {
  localStorage.clear()
  const published: unknown[] = []
  const steps = new StepRecordService(
    new LocalStorageDailyStepsRepository(localStorage),
    clock,
    (e) => {
      published.push(e)
    },
  )
  const service = new ScreenCaptureImportService(steps, clock, async () =>
    parseStepCalendar(sample.words),
  )
  return { steps, service, published }
}

describe('画面キャプチャの取り込み', () => {
  test('サンプル画面（2026年9月）を読み取り、10月1日より前の日は取り込まない', async () => {
    const { service } = setup()
    const review = await service.read(taro, new Blob())
    if (!review.ok) throw new Error(review.error)
    expect(review.rows).toHaveLength(16)
    expect(review.rows.every((r) => r.status === 'outOfRange')).toBe(true)
  })

  test('今日より後の日は取り込まない', async () => {
    const { service } = setup()
    const [row] = await service.review(taro, [{ date: '2026-10-11', steps: 5000 }])
    expect(row.status).toBe('outOfRange')
  })

  test('30,000歩を超える値は30,000歩で取り込み、止めたことを示す', async () => {
    const { service, steps } = setup()
    const [row] = await service.review(taro, [{ date: '2026-10-03', steps: 130_000 }])
    expect(row).toMatchObject({ steps: 30_000, capped: true, status: 'import' })
    await service.importRows(taro, [{ date: '2026-10-03', steps: 130_000 }])
    expect((await steps.recordsOf(taro))[0]).toMatchObject({
      steps: 30_000,
      source: 'screenCapture',
    })
  })

  test('今の記録より大きい日だけ取り込み、同じ・小さい日は取り込まない', async () => {
    const { service, steps, published } = setup()
    await steps.recordSteps(taro, parseLocalDate('2026-10-01'), 8000, 'manual')
    await steps.recordSteps(taro, parseLocalDate('2026-10-02'), 8000, 'manual')
    await steps.recordSteps(taro, parseLocalDate('2026-10-03'), 8000, 'manual')
    const readings = [
      { date: '2026-10-01', steps: 9000 },
      { date: '2026-10-02', steps: 8000 },
      { date: '2026-10-03', steps: 7000 },
      { date: '2026-10-04', steps: 6000 },
    ]
    expect((await service.review(taro, readings)).map((r) => r.status)).toEqual([
      'import',
      'same',
      'smaller',
      'import',
    ])
    published.length = 0
    expect(await service.importRows(taro, readings)).toEqual({ imported: 2, skipped: 2 })
    expect(published).toHaveLength(2)
    expect((await steps.recordsOf(taro)).find((r) => r.date === '2026-10-03')?.steps).toBe(8000)
  })

  test('確認画面で負の数や小数を入れたら取り込めない', async () => {
    const { service } = setup()
    await expect(service.review(taro, [{ date: '2026-10-03', steps: -1 }])).rejects.toThrow(
      DomainError,
    )
  })

  test('読み取りに失敗したら、その理由を返す', async () => {
    const { steps } = setup()
    const failing = new ScreenCaptureImportService(steps, clock, async () => ({
      ok: false,
      error: 'カレンダーの年月(例: 2026/09)が読み取れませんでした',
    }))
    expect(await failing.read(taro, new Blob())).toEqual({
      ok: false,
      error: 'カレンダーの年月(例: 2026/09)が読み取れませんでした',
    })
  })
})
