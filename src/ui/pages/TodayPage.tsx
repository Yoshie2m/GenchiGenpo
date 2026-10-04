import { useState, type FormEvent } from 'react'
import { localDateOf } from '../../shared/LocalDate.ts'
import { formatDate, formatSteps } from '../format.ts'
import { errorMessage } from './errorMessage.ts'
import type { PageProps } from './types.ts'

/** 今日: 今日の歩数、歩数の手入力、自分の隊と今日の上位2名に入っているか。 */
export function TodayPage({ app, memberId, refresh }: PageProps) {
  const today = localDateOf(app.clock.now())
  const todaySteps = app.steps.recordsOf(memberId).find((r) => r.date === today)?.steps ?? 0
  const team = app.team.view(memberId)
  const [input, setInput] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(input)
    if (input.trim() === '' || !Number.isInteger(value)) {
      setMessage('歩数を整数で入れてください')
      return
    }
    try {
      const result = app.steps.recordSteps(memberId, today, value, 'manual')
      setMessage(
        result.capped
          ? '30,000歩を超えたので、30,000歩で記録しました。読み間違いでないか確かめてください'
          : result.changed
            ? `${formatSteps(result.steps)}で記録しました`
            : '今と同じ歩数なので、変わりません',
      )
      setInput('')
      refresh()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <section aria-labelledby="today-title">
      <h2 id="today-title">今日の歩み</h2>
      <p>{formatDate(today)}</p>
      <p className="ho-daiji" aria-label={`今日の歩数 ${todaySteps}歩`}>
        {formatSteps(todaySteps)}
      </p>

      <form onSubmit={submit} className="stack">
        <label className="ho-field">
          <span className="ho-field__label">今日の歩数（その日の合計）</span>
          <input
            className="ho-field__input"
            inputMode="numeric"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例: 8432"
          />
        </label>
        <button type="submit" className="ho-btn ho-btn--primary">
          記録する
        </button>
      </form>
      {message && <p role="status">{message}</p>}

      {team.kind === 'mission' && team.myTeam !== null && (
        <p>
          {team.teams.find((t) => t.team === team.myTeam)?.name}・{team.plan.destination.name}
          {team.myTopTwoToday && <span className="ho-tanzaku__top"> 今日の上位に入っています</span>}
        </p>
      )}
    </section>
  )
}
