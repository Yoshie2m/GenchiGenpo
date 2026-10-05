import { useState, type FormEvent } from 'react'
import { addDays, localDateOf, type LocalDate } from '../../shared/LocalDate.ts'
import { Steps } from '../design-system/components.tsx'
import { formatDate } from '../format.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import { CaptureImport } from './CaptureImport.tsx'
import { errorMessage } from './errorMessage.ts'
import type { PageProps } from './types.ts'

/** 記録: 日ごとの歩数の一覧、後日記録と誤入力の修正（本人が確認画面で）。 */
export function RecordPage({ app, memberId, refresh, version }: PageProps) {
  const today = localDateOf(app.clock.now())
  const state = useAsyncData(async () => {
    const journey = await app.personal.view(memberId)
    const records = new Map((await app.steps.recordsOf(memberId)).map((r) => [r.date, r.steps]))
    return { journey, records }
  }, [app, memberId, version])

  const [editing, setEditing] = useState<LocalDate | null>(null)

  return (
    <AsyncView state={state}>
      {({ journey, records }) => {
        const start = journey?.startDate ?? today
        const dates: LocalDate[] = []
        for (let d = today; d >= start; d = addDays(d, -1)) dates.push(d)

        return (
          <section aria-labelledby="record-title" className="page">
            <h2 id="record-title" className="fs-title">
              記録
            </h2>
            <p className="ho-field__label">
              過去の日の歩数も、後から記録できます。減らせるのは誤入力の修正だけです。チームミッションには、歩数受付締切（最終日の翌日13:00）までの分が数えられます。
            </p>
            <CaptureImport app={app} memberId={memberId} refresh={refresh} version={version} />
            <ul className="record-list">
              {dates.map((date) => (
                <li key={date} className="record-row">
                  <span>{formatDate(date)}</span>
                  <span>
                    {records.has(date) ? <Steps steps={records.get(date)!} /> : '記録なし'}
                  </span>
                  <button
                    type="button"
                    className="ho-btn ho-btn--text"
                    onClick={() => setEditing(editing === date ? null : date)}
                    aria-expanded={editing === date}
                  >
                    {records.has(date) ? '直す' : '記録する'}
                  </button>
                  {editing === date && (
                    <EditForm
                      key={date}
                      app={app}
                      memberId={memberId}
                      date={date}
                      current={records.get(date) ?? null}
                      onDone={() => {
                        setEditing(null)
                        refresh()
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      }}
    </AsyncView>
  )
}

interface EditFormProps {
  readonly app: PageProps['app']
  readonly memberId: PageProps['memberId']
  readonly date: LocalDate
  readonly current: number | null
  readonly onDone: () => void
}

/** 1日分の記録・修正の確認画面。減らすときは「誤入力の修正です」に印を付けてもらう。 */
function EditForm({ app, memberId, date, current, onDone }: EditFormProps) {
  const [input, setInput] = useState(current === null ? '' : String(current))
  const [isCorrection, setIsCorrection] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(input)
    if (input.trim() === '' || !Number.isInteger(value)) {
      setMessage('歩数を整数で入れてください')
      return
    }
    if (current !== null && value < current && !isCorrection) {
      setMessage(
        '歩数を減らせるのは誤入力の修正だけです。誤入力なら「誤入力の修正です」に印を付けてください',
      )
      return
    }
    try {
      if (isCorrection) await app.steps.correctSteps(memberId, date, value)
      else await app.steps.recordSteps(memberId, date, value, 'manual')
      onDone()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="ho-dialog stack" aria-label={`${formatDate(date)}の歩数`}>
      <span className="ho-dialog__title" aria-hidden="true">
        記録
      </span>
      <label className="ho-field">
        <span className="ho-field__label">{formatDate(date)}の歩数（その日の合計）</span>
        <input
          className="ho-field__input"
          inputMode="numeric"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      {current !== null && (
        <label>
          <input
            type="checkbox"
            checked={isCorrection}
            onChange={(e) => setIsCorrection(e.target.checked)}
          />{' '}
          誤入力の修正です（歩数を減らせます）
        </label>
      )}
      {message && <p role="alert">{message}</p>}
      <div className="ho-dialog__actions">
        <button type="button" className="ho-btn ho-btn--secondary" onClick={onDone}>
          やめる
        </button>
        <button type="submit" className="ho-btn ho-btn--primary">
          確定する
        </button>
      </div>
    </form>
  )
}
