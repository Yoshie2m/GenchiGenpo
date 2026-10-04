import { formatDate, formatDateTime, formatSteps } from '../format.ts'
import type { PageProps } from './types.ts'

const KIND_LABELS = {
  office: 'オフィス',
  postTown: '宿場町',
  pass: '峠',
  waypoint: '経過地',
} as const

/** 道中: 個人ミッション（本社 → 新虎オフィス）。累計歩数、次の通過点と一口メモ、街道の線、通過記録。 */
export function JourneyPage({ app, memberId }: PageProps) {
  const view = app.personal.view(memberId)
  if (!view) return <p>まだ足跡がありません。さあ、参りましょう。</p>

  return (
    <section aria-labelledby="journey-title" data-province={view.current.province}>
      <h2 id="journey-title">道中</h2>
      <p className="ho-field__label">
        {view.routeName}・{view.current.province}・旅立ち {formatDate(view.startDate)}
      </p>
      <p className="ho-daiji" aria-label={`累計歩数 ${view.cumulativeSteps}歩`}>
        {formatSteps(view.cumulativeSteps)}
      </p>

      {view.completed || !view.next ? (
        <div>
          <p>旅を終えました。</p>
          <p>次の道は支度中です。</p>
        </div>
      ) : (
        <div className="ho-tanzaku">
          <p className="ho-routeline__next">
            次の通過点 {view.next.name}まで あと <b>{formatSteps(view.stepsToNext)}</b>
          </p>
          <p className="memo">{view.next.memo}</p>
        </div>
      )}

      <ol className="ho-routeline__track" aria-label="街道">
        {view.nearby.map(({ checkpoint, passed }) => (
          <li
            key={checkpoint.name}
            className={`ho-routeline__stop${passed ? ' is-passed' : ''}`}
            aria-current={checkpoint === view.current ? 'location' : undefined}
          >
            <span className="kind">{KIND_LABELS[checkpoint.kind]}</span>
            {checkpoint.name}
          </li>
        ))}
      </ol>

      <h3>通過記録</h3>
      <ol className="ho-cplog" aria-label="通過記録">
        {view.arrivals.map(({ checkpoint, arrivedAt }) => (
          <li key={checkpoint.name} className="ho-cplog__row">
            <span className="kind">{KIND_LABELS[checkpoint.kind]}</span>
            <span className="ho-cplog__name">{checkpoint.name}</span>
            <span className="ho-cplog__meta">
              {formatDateTime(arrivedAt)}
              <br />
              {formatSteps(checkpoint.cumulativeSteps)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
