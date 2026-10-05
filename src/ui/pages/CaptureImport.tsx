import { useState, type ChangeEvent } from 'react'
import type { CaptureRow } from '../../stepRecord/application/ScreenCaptureImportService.ts'
import { Steps } from '../design-system/components.tsx'
import { formatDate } from '../format.ts'
import { errorMessage } from './errorMessage.ts'
import type { PageProps } from './types.ts'

const STATUS_TEXT: Record<CaptureRow['status'], string> = {
  import: '取り込む',
  same: '今と同じ',
  smaller: '今の記録より少ないので取り込まない',
  outOfRange: '10月1日より前・今日より後なので取り込まない',
}

type State =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'review'; rows: CaptureRow[]; warnings: readonly string[] }

/**
 * 画面キャプチャから取り込む（記録の画面の一部）。ヘルスケアアプリの歩数画面のスクリーンショットを読み、
 * 確認画面で本人が確かめて（必要なら直して）から取り込む。文字認識はブラウザの中で行い、画像は送らない。
 */
export function CaptureImport({ app, memberId, refresh }: Omit<PageProps, 'settings'>) {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [message, setMessage] = useState<string | null>(null)

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMessage(null)
    setState({ kind: 'reading' })
    try {
      const review = await app.screenCapture.read(memberId, file)
      if (!review.ok) {
        setMessage(review.error)
        setState({ kind: 'idle' })
        return
      }
      if (review.rows.length === 0) {
        setMessage('歩数を読み取れた日がありませんでした')
        setState({ kind: 'idle' })
        return
      }
      setState({ kind: 'review', rows: [...review.rows], warnings: review.warnings })
    } catch (err) {
      setMessage(errorMessage(err))
      setState({ kind: 'idle' })
    }
  }

  async function edit(index: number, value: string) {
    if (state.kind !== 'review') return
    const steps = Number(value)
    if (value.trim() === '' || !Number.isInteger(steps) || steps < 0) return
    const readings = state.rows.map((r, i) => ({
      date: r.date,
      steps: i === index ? steps : r.readSteps,
    }))
    setState({ ...state, rows: await app.screenCapture.review(memberId, readings) })
  }

  async function confirm() {
    if (state.kind !== 'review') return
    try {
      const summary = await app.screenCapture.importRows(
        memberId,
        state.rows.map((r) => ({ date: r.date, steps: r.readSteps })),
      )
      setMessage(`${summary.imported}日分を取り込みました`)
      setState({ kind: 'idle' })
      refresh()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <section aria-labelledby="capture-title" className="ho-tanzaku stack">
      <h3 id="capture-title" className="fs-h2">
        画面キャプチャから取り込む
      </h3>
      <p className="fs-caption">
        ヘルスケアアプリの歩数画面（月のカレンダー）のスクリーンショットを選んでください。読み取りはこの端末の中で行い、画像は送りません。
      </p>
      <label className="ho-btn ho-btn--secondary capture__pick">
        画像を選ぶ
        <input
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={state.kind === 'reading'}
          className="visually-hidden"
          aria-label="スクリーンショットの画像"
        />
      </label>
      {state.kind === 'reading' && (
        <p role="status">読み取り中です…（初回は少し時間がかかります）</p>
      )}
      {message && <p role="status">{message}</p>}

      {state.kind === 'review' && (
        <form
          className="ho-dialog stack"
          aria-label="読み取った歩数の確認"
          onSubmit={(e) => {
            e.preventDefault()
            confirm()
          }}
        >
          <span className="ho-dialog__title" aria-hidden="true">
            確認
          </span>
          {state.warnings.map((w) => (
            <p key={w} role="alert" className="fs-caption">
              {w}
            </p>
          ))}
          <p className="fs-caption">読み間違いがあれば、歩数を直してから取り込んでください。</p>
          <ul className="record-list">
            {state.rows.map((row, i) => (
              <li key={row.date} className="capture-row">
                <span>{formatDate(row.date)}</span>
                <input
                  className="ho-field__input"
                  inputMode="numeric"
                  defaultValue={row.readSteps}
                  aria-label={`${formatDate(row.date)}の歩数`}
                  disabled={row.status === 'outOfRange'}
                  onBlur={(e) => edit(i, e.target.value)}
                />
                <span className="fs-caption">
                  {STATUS_TEXT[row.status]}
                  {row.capped && row.status === 'import' && '（30,000歩で止めます）'}
                  {row.currentSteps !== null && (
                    <>
                      ・今 <Steps steps={row.currentSteps} />
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <div className="ho-dialog__actions">
            <button
              type="button"
              className="ho-btn ho-btn--secondary"
              onClick={() => setState({ kind: 'idle' })}
            >
              やめる
            </button>
            <button type="submit" className="ho-btn ho-btn--primary">
              取り込む（{state.rows.filter((r) => r.status === 'import').length}日分）
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
