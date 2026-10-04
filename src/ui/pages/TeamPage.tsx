import { useState } from 'react'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { formatDate, formatDateTime, formatSteps, STATUS_LABELS } from '../format.ts'
import { errorMessage } from './errorMessage.ts'
import type { PageProps } from './types.ts'

const RANK_LABELS = ['', '壱位', '弍位', '参位']

/** 隊: チームミッション。進み具合・順位、最終順位の後は次のミッションの作成。 */
export function TeamPage({ app, memberId, refresh }: PageProps) {
  const view = app.team.view(memberId)
  const [message, setMessage] = useState<string | null>(null)

  function create(candidateId: string) {
    try {
      app.team.createMission(memberId, candidateId)
      setMessage(null)
      refresh()
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  if (view.kind === 'none') {
    return (
      <section aria-labelledby="team-title">
        <h2 id="team-title">隊</h2>
        <p>
          まだチームミッションがありません。最初の目的地を選んでください（翌日から始まります）。
        </p>
        {message && <p role="alert">{message}</p>}
        <CandidatePicker candidates={view.candidates} onPick={create} />
      </section>
    )
  }

  const plan = view.plan
  return (
    <section aria-labelledby="team-title">
      <h2 id="team-title">
        隊・{plan.destination.name}（{plan.destination.kanji}）
      </h2>
      <p className="ho-field__label">
        {plan.destination.province}・目標 {formatSteps(plan.targetSteps)}・
        {formatDate(view.startDate)}〜{formatDate(view.endDate)}・{STATUS_LABELS[view.status]}
        {view.daysLeft !== null && `・あと${view.daysLeft}日`}
      </p>
      {view.status === 'notStarted' && <p>{formatDate(view.startDate)}の 0:00 に始まります。</p>}
      {view.finalDay && (
        <p>
          {view.teams.find((t) => t.team === view.firstArrivedTeam)?.name}が
          {formatDate(view.finalDay)}に{plan.destination.name}に至りました。最終日は
          {formatDate(view.finalDay)}です。
        </p>
      )}
      {view.status === 'accepting' && (
        <p>最終日の歩数を {formatDateTime(view.stepDeadline)} まで受け付けています。</p>
      )}

      <div className="team-list">
        {view.teams.map((t) => {
          const mine = t.team === view.myTeam
          return (
            <article
              key={t.team}
              className={`ho-tanzaku ho-tanzaku--team ho-team--${t.team}${mine ? ' ho-tanzaku--mine' : ''}`}
              aria-label={t.name}
            >
              <div className="ho-tanzaku__head">
                <span className="ho-teamname">
                  {t.name}
                  {mine && '（自分の隊）'}
                </span>
                <span className="ho-tanzaku__rank">{RANK_LABELS[t.standing.rank]}</span>
              </div>
              <div className="ho-tanzaku__value">{formatSteps(t.standing.finalScore)}</div>
              <div className="ho-tanzaku__sub">
                評価 {formatSteps(t.standing.evaluationSteps)} ＋ 中間{' '}
                {formatSteps(t.standing.points)}・{t.memberCount}人
              </div>
              <progress
                max={plan.targetSteps}
                value={Math.min(t.standing.progressSteps, plan.targetSteps)}
                aria-label={`${t.name}の進行歩数`}
              />
              <div className="ho-tanzaku__sub">
                進行 {formatSteps(t.standing.progressSteps)} / {formatSteps(plan.targetSteps)}
              </div>
              {mine && view.myTopTwoToday && (
                <div className="ho-tanzaku__top">今日の上位に入っています</div>
              )}
            </article>
          )
        })}
      </div>

      <h3>中間地点</h3>
      <ol className="ho-cplog">
        {view.waypoints.map((w, index) => (
          <li key={w.name} className="ho-cplog__row">
            <span className="ho-cplog__name">{w.name}</span>
            <span className="ho-cplog__meta">
              {formatSteps(w.progressSteps)}・1位 {formatSteps(w.points.first)}／2位{' '}
              {formatSteps(w.points.second)}
              {view.teams.map((t) => {
                const s = t.waypoints.find((x) => x.waypointIndex === index)
                return s ? (
                  <span key={t.team}>
                    <br />
                    {t.name} {s.rank}着{s.tied && '（同着）'} ＋{formatSteps(s.points)}
                  </span>
                ) : null
              })}
            </span>
          </li>
        ))}
      </ol>

      {view.next && (
        <div>
          <h3>次のミッション</h3>
          <p>
            優勝: {view.winners.map((w) => view.teams.find((t) => t.team === w)?.name).join('・')}
          </p>
          {view.next.canCreate ? (
            <>
              <p>
                次の目的地を選んでください。{formatDateTime(view.next.autoConfirmAt)}
                までに選ばなければ、一番上の目的地に決まります。{formatDate(view.next.startDate)}
                から始まります。
              </p>
              {message && <p role="alert">{message}</p>}
              <CandidatePicker candidates={view.next.candidates} onPick={create} />
            </>
          ) : (
            <p>
              優勝チームのメンバーが次の目的地を選んでいます。
              {formatDateTime(view.next.autoConfirmAt)}
              を過ぎると、一番上の目的地（{view.next.candidates[0]?.destination.name}
              ）に決まります。
            </p>
          )}
        </div>
      )}
    </section>
  )
}

/** ミッション作成: 候補（目的地・期間・目標歩数・中間地点・配点のプリセット）から選ぶ。 */
function CandidatePicker({
  candidates,
  onPick,
}: {
  candidates: readonly MissionPlan[]
  onPick: (candidateId: string) => void
}) {
  return (
    <ul className="candidate-list" aria-label="ミッション候補">
      {candidates.map((c, i) => (
        <li key={c.candidateId} className="ho-tanzaku">
          <div className="ho-tanzaku__head">
            <span className="ho-teamname">
              【{c.destination.kanji}】{c.destination.name}
            </span>
            {i === 0 && <span className="ho-tanzaku__sub">自動で決まる候補</span>}
          </div>
          <div className="ho-tanzaku__sub">
            {c.destination.province}・目標 {formatSteps(c.targetSteps)}・{c.periodDays}日・中間地点{' '}
            {c.waypoints.length}か所
          </div>
          <p className="memo">{c.destination.memo}</p>
          <button
            type="button"
            className="ho-btn ho-btn--primary"
            onClick={() => onPick(c.candidateId)}
          >
            {c.destination.name}にする
          </button>
        </li>
      ))}
    </ul>
  )
}
