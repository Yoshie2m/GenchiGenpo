import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { Clock } from '../../shared/Clock.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { localDateOf, parseLocalDate, type LocalDate } from '../../shared/LocalDate.ts'
import { toStepReadings, type StepCalendarResult } from '../acl/screenCapture/parseStepCalendar.ts'
import { stepValueError, type StepReading } from '../acl/StepReading.ts'
import { RECORDING_START_DATE } from '../domain/DailySteps.ts'
import { DAILY_STEP_LIMIT } from '../domain/Steps.ts'
import type { StepRecordService } from './StepRecordService.ts'

/** 画像からカレンダーを読み取る（腐敗防止層。PoC は Tesseract.js でブラウザ内で読む）。 */
export type CalendarRecognizer = (image: Blob) => Promise<StepCalendarResult>

/** 確認画面の1行の扱い。 */
export type CaptureRowStatus =
  /** 取り込む（今より大きい、または初めての日） */
  | 'import'
  /** 今と同じ歩数（変わらない） */
  | 'same'
  /** 今の記録より小さい（減らすのは誤入力の修正だけなので、取り込まない） */
  | 'smaller'
  /** 2026年10月1日より前、または今日より後（取り込まない） */
  | 'outOfRange'

export interface CaptureRow {
  readonly date: LocalDate
  /** 読み取った歩数。 */
  readonly readSteps: number
  /** 記録する歩数（30,000 歩を超えていれば 30,000 歩）。 */
  readonly steps: number
  readonly capped: boolean
  /** 今の記録（なければ null）。 */
  readonly currentSteps: number | null
  readonly status: CaptureRowStatus
}

export type CaptureReview =
  | {
      readonly ok: true
      readonly rows: readonly CaptureRow[]
      readonly warnings: readonly string[]
    }
  | { readonly ok: false; readonly error: string }

export interface CaptureImportSummary {
  readonly imported: number
  readonly skipped: number
}

/**
 * 画面キャプチャの取り込み（ARCHITECTURE.md 4.3）。ヘルスケアアプリの歩数画面のスクリーンショットから
 * 月のカレンダーを読み取り、確認画面で本人が確かめてから取り込む。
 * - 取り込む日は 2026年10月1日以降、今日まで（日本時間）。
 * - 30,000 歩を超える値は 30,000 歩で取り込み、確認画面で止めたことを知らせる。
 * - 今の記録より小さい値は取り込まない（減らせるのは誤入力の修正だけ）。
 */
export class ScreenCaptureImportService {
  private readonly steps: StepRecordService
  private readonly clock: Clock
  private readonly recognize: CalendarRecognizer

  constructor(steps: StepRecordService, clock: Clock, recognize: CalendarRecognizer) {
    this.steps = steps
    this.clock = clock
    this.recognize = recognize
  }

  async read(memberId: MemberId, image: Blob): Promise<CaptureReview> {
    const result = await this.recognize(image)
    if (!result.ok) return result
    return {
      ok: true,
      rows: this.review(memberId, toStepReadings(result.calendar)),
      warnings: result.calendar.warnings,
    }
  }

  /** 読み取り結果（確認画面で直した値を含む）を、取り込みの扱いごとに並べる。 */
  review(memberId: MemberId, readings: readonly StepReading[]): CaptureRow[] {
    const today = localDateOf(this.clock.now())
    const current = new Map(this.steps.recordsOf(memberId).map((r) => [r.date, r.steps as number]))
    return readings.map((reading) => {
      const error = stepValueError(reading.steps)
      if (error) throw new DomainError(`${reading.date}: ${error}`)
      const date = parseLocalDate(reading.date)
      const steps = Math.min(reading.steps, DAILY_STEP_LIMIT)
      const currentSteps = current.get(date) ?? null
      const status: CaptureRowStatus =
        date < RECORDING_START_DATE || date > today
          ? 'outOfRange'
          : currentSteps === null || steps > currentSteps
            ? 'import'
            : steps === currentSteps
              ? 'same'
              : 'smaller'
      return {
        date,
        readSteps: reading.steps,
        steps,
        capped: reading.steps > DAILY_STEP_LIMIT,
        currentSteps,
        status,
      }
    })
  }

  /** 確認画面で確定した行のうち、取り込める行だけを記録する（取り込み元は画面キャプチャ）。 */
  importRows(memberId: MemberId, readings: readonly StepReading[]): CaptureImportSummary {
    const rows = this.review(memberId, readings)
    let imported = 0
    for (const row of rows) {
      if (row.status !== 'import') continue
      this.steps.recordSteps(memberId, row.date, row.readSteps, 'screenCapture')
      imported++
    }
    return { imported, skipped: rows.length - imported }
  }
}
