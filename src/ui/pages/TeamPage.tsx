import { useState } from 'react'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import type { TeamMissionView } from '../../teamMission/application/TeamMissionService.ts'
import { destinationLogoUrl } from '../design-system/assets.ts'
import { Pictogram, Steps, TeamMark } from '../design-system/components.tsx'
import { useUi } from '../design-system/uiContext.ts'
import { formatDate, formatDateTime, STATUS_LABELS } from '../format.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import { errorMessage } from './errorMessage.ts'
import type { PageProps } from './types.ts'

const RANK_LABELS = ['', '壱位', '弍位', '参位']
const SHORT_NAMES = ['', '壱番隊', '弐番隊', '参番隊']

/**
 * 隊: チームミッション。目的地のロゴと名称、隊ごとの進み具合（WaveBand）、順位（Tanzaku の隊用）。
 * 最終順位の確定後は、優勝チームのメンバーが次の目的地を選ぶ。到達・優勝は朱の落款を1つだけ押す。
 */
export function TeamPage({ app, memberId, refresh, version }: PageProps) {
  const { night } = useUi()
  const state = useAsyncData(() => app.team.view(memberId), [app, memberId, version])
  const [message, setMessage] = useState<string | null>(null)

  async function create(candidateId: string) {
    try {
      await app.team.createMission(memberId, candidateId)
      setMessage(null)
      refresh()
    } catch (e) {
      setMessage(errorMessage(e))
    }
  }

  return (
    <AsyncView state={state}>
      {(view) => {
        if (view.kind === 'none') {
          return (
            <section aria-labelledby="team-title" className="page">
              <h2 id="team-title" className="fs-title">
                隊
              </h2>
              <p className="fs-body">
                まだチームミッションがありません。最初の目的地を選んでください（翌日から始まります）。
              </p>
              {message && <p role="alert">{message}</p>}
              <CandidatePicker candidates={view.candidates} onPick={create} />
            </section>
          )
        }

        const plan = view.plan
        const arrivedTeam = view.teams.find((t) => t.team === view.firstArrivedTeam)
        const finalized = view.status === 'finalized'
        return (
          <section aria-labelledby="team-title" className="page">
            <div className="team__goal">
              <img
                src={destinationLogoUrl(plan.candidateId, night)}
                alt=""
                className="team__logo"
              />
              <div>
                <h2 id="team-title" className="fs-h2">
                  隊・{plan.destination.name}（{plan.destination.kanji}）
                </h2>
                <p className="fs-caption">
                  {plan.destination.province}・{formatDate(view.startDate)}〜
                  {formatDate(view.endDate)}・{STATUS_LABELS[view.status]}
                  {view.daysLeft !== null && `・あと${view.daysLeft}日`}
                </p>
              </div>
            </div>

            {view.status === 'notStarted' && (
              <p className="fs-body">{formatDate(view.startDate)}の 0:00 に始まります。</p>
            )}
            {arrivedTeam && view.finalDay && !finalized && (
              <p className="seal-line">
                <span className="ho-seal" role="img" aria-label="到達">
                  至
                </span>
                {arrivedTeam.name}が{plan.destination.name}に至りました。最終日は
                {formatDate(view.finalDay)}です。
              </p>
            )}
            {view.status === 'accepting' && (
              <p className="fs-body">
                最終日の歩数を {formatDateTime(view.stepDeadline)} まで受け付けています。
              </p>
            )}

            <WaveBand view={view} />

            <div className="team-list">
              {view.teams.map((t) => {
                const mine = t.team === view.myTeam
                return (
                  <article
                    key={t.team}
                    className={`ho-tanzaku ho-tanzaku--team ho-team--${t.team}${mine ? ' ho-tanzaku--mine' : ''}`}
                    aria-label={t.name}
                  >
                    <span className="ho-tanzaku__band" aria-hidden="true" />
                    <div className="ho-tanzaku__head">
                      <span className="ho-teamname">
                        <TeamMark team={t.team} mine={mine} />
                        {SHORT_NAMES[t.team]}
                        {mine && <span className="fs-caption">（自分の隊）</span>}
                      </span>
                      <span className="ho-tanzaku__rank">{RANK_LABELS[t.standing.rank]}</span>
                    </div>
                    <div className="ho-tanzaku__value">
                      <Steps steps={t.standing.finalScore} />
                    </div>
                    <div className="ho-tanzaku__sub">
                      評価 <Steps steps={t.standing.evaluationSteps} /> ＋ 中間{' '}
                      <Steps steps={t.standing.points} />・{t.memberCount}人
                    </div>
                    <div className="ho-tanzaku__sub">
                      進行 <Steps steps={t.standing.progressSteps} /> ／ 目標{' '}
                      <Steps steps={plan.targetSteps} />
                    </div>
                    {mine && view.myTopTwoToday && (
                      <div className="ho-tanzaku__top">今日の上位に入っています</div>
                    )}
                  </article>
                )
              })}
            </div>

            <h3 className="fs-h2">中間地点</h3>
            <ol className="ho-cplog">
              {view.waypoints.map((w, index) => (
                <li key={w.name} className="ho-cplog__row">
                  <Pictogram kind="postTown" />
                  <span className="ho-cplog__name">{w.name}</span>
                  <span className="ho-cplog__meta">
                    <Steps steps={w.progressSteps} />
                    {view.teams.map((t) => {
                      const s = t.waypoints.find((x) => x.waypointIndex === index)
                      return s ? (
                        <span key={t.team} className="block">
                          {SHORT_NAMES[t.team]} {s.rank}着{s.tied && '（同着）'} ＋
                          <Steps steps={s.points} />
                        </span>
                      ) : null
                    })}
                  </span>
                </li>
              ))}
            </ol>

            {view.next && (
              <div className="stack">
                <h3 className="fs-h2">次のミッション</h3>
                <p className="seal-line">
                  <span className="ho-seal" role="img" aria-label="優勝">
                    勝
                  </span>
                  優勝は {view.winners.map((w) => SHORT_NAMES[w]).join('・')}。
                </p>
                {view.next.canCreate ? (
                  <>
                    <p className="fs-body">
                      次の目的地を選んでください。{formatDateTime(view.next.autoConfirmAt)}
                      までに選ばなければ、一番上の目的地に決まります。
                      {formatDate(view.next.startDate)}
                      から始まります。
                    </p>
                    {message && <p role="alert">{message}</p>}
                    <CandidatePicker candidates={view.next.candidates} onPick={create} />
                  </>
                ) : (
                  <p className="fs-body">
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
      }}
    </AsyncView>
  )
}

type MissionView = Extract<TeamMissionView, { kind: 'mission' }>

/** 隊ごとの進み具合を、富士の裾から上がる波の帯で並べる（WaveBand）。 */
function WaveBand({ view }: { view: MissionView }) {
  const target = view.plan.targetSteps
  const ratio = (steps: number) => Math.min(1, steps / target).toFixed(3)
  return (
    <section className="ho-waveband" aria-label="隊の進み具合">
      <div className="ho-waveband__goal">{view.plan.destination.name}</div>
      <div className="ho-waveband__field">
        {view.waypoints.map((w, index) => {
          const passed = view.teams.some((t) => t.waypoints.some((x) => x.waypointIndex === index))
          return (
            <div
              key={w.name}
              className={`ho-waveband__mark${passed ? ' is-passed' : ''}`}
              style={{ ['--at' as string]: ratio(w.progressSteps) }}
            >
              <span className="ho-waveband__mark-label">{w.name}</span>
            </div>
          )
        })}
        {view.teams.map((t) => (
          <div
            key={t.team}
            className={`ho-waveband__lane ho-team--${t.team}`}
            style={{ ['--p' as string]: ratio(t.standing.progressSteps) }}
            role="img"
            aria-label={`${SHORT_NAMES[t.team]} 進行歩数 ${Math.floor(t.standing.progressSteps)}歩`}
          >
            <div className="ho-waveband__fill" />
          </div>
        ))}
      </div>
      <div className="ho-waveband__teams">
        {view.teams.map((t) => (
          <div key={t.team} className={`ho-waveband__team ho-team--${t.team}`}>
            <TeamMark team={t.team} mine={t.team === view.myTeam} />
          </div>
        ))}
      </div>
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
  const { night } = useUi()
  return (
    <ul className="candidate-list" aria-label="ミッション候補">
      {candidates.map((c, i) => (
        <li key={c.candidateId} className="ho-tanzaku candidate">
          <img src={destinationLogoUrl(c.candidateId, night)} alt="" className="candidate__logo" />
          <div className="ho-tanzaku__head">
            <span className="ho-teamname">{c.destination.name}</span>
            {i === 0 && <span className="fs-caption">自動で決まる候補</span>}
          </div>
          <div className="ho-tanzaku__sub">
            {c.destination.province}・目標 <Steps steps={c.targetSteps} />・{c.periodDays}
            日・中間地点 {c.waypoints.length}か所
          </div>
          <p className="memo fs-body">{c.destination.memo}</p>
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
