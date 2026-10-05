import type { LeaderboardEntry } from '../../stepRecord/application/StepRecordService.ts'
import { localDateOf } from '../../shared/LocalDate.ts'
import { Steps } from '../design-system/components.tsx'
import { formatDate } from '../format.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

const RANK_LABELS = ['', '壱位', '弍位', '参位', '四位', '五位']

/**
 * 番付: 登録メンバーの上位5名を、棒グラフで比べる。
 * 上から 今日の歩数 → 全日数の総歩数 → 平均歩数 の順に並べる（デザインシステムの Ranking）。自分の棒は濃い藍で示す。
 * 平均歩数は昨日まで（今日は途中の歩数なので数えない）。
 */
export function RankingPage({ app, memberId, version }: PageProps) {
  const today = localDateOf(app.clock.now())
  const state = useAsyncData(async () => {
    const members = await app.members.members()
    const board = await app.steps.leaderboard(members, today)
    return { names: new Map(members.map((m) => [m.memberId, m.displayName])), board }
  }, [app, today, version])
  return (
    <AsyncView state={state}>
      {({ names, board }) => (
        <section aria-labelledby="ranking-title" className="page">
          <h2 id="ranking-title" className="fs-title">
            番付
          </h2>
          <p className="fs-caption">{formatDate(today)}・上位5名</p>
          <RankingChart
            title="今日の歩数"
            entries={board.today}
            names={names}
            memberId={memberId}
            empty="まだ今日の歩数を記録した人がいません。"
          />
          <RankingChart
            title="全日数の総歩数"
            entries={board.total}
            names={names}
            memberId={memberId}
            empty="まだ記録がありません。"
          />
          <RankingChart
            title="平均歩数"
            entries={board.average}
            names={names}
            memberId={memberId}
            empty="まだ記録がありません。"
          />
        </section>
      )}
    </AsyncView>
  )
}

function RankingChart({
  title,
  entries,
  names,
  memberId,
  empty,
}: {
  title: string
  entries: readonly LeaderboardEntry[]
  names: ReadonlyMap<string, string>
  memberId: string
  empty: string
}) {
  const max = Math.max(1, ...entries.map((e) => e.value))
  return (
    <section className="ho-tanzaku ranking" aria-label={title}>
      <h3 className="fs-h2">{title}</h3>
      {entries.length === 0 ? (
        <p className="fs-body">{empty}</p>
      ) : (
        <ol className="ho-ranking__list">
          {entries.map((e) => {
            const mine = e.memberId === memberId
            return (
              <li key={e.memberId} className={`ho-ranking__row${mine ? ' is-mine' : ''}`}>
                <span className="ho-ranking__rank">{RANK_LABELS[e.rank] ?? `${e.rank}位`}</span>
                <span className="ho-ranking__name">
                  {names.get(e.memberId) ?? e.memberId}
                  {mine && <span className="fs-caption">（自分）</span>}
                </span>
                <span className="ho-ranking__bar" aria-hidden="true">
                  <span style={{ width: `${(e.value / max) * 100}%` }} />
                </span>
                <span className="ho-ranking__value">
                  <Steps steps={e.value} />
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
