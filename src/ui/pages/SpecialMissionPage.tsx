import { localDateOf } from '../../shared/LocalDate.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

/** 達成日数の平均を「6.4日」の形にする。 */
function formatDays(days: number): string {
  return `${days.toFixed(1)}日`
}

/**
 * 特命: 隊（チームミッション）の代わりに出す画面（DOMAINS.md「特命」）。
 * 参加メンバー全員の達成日数（1日8000歩以上を記録した日の数、10月1日〜昨日）の平均値と、
 * 達成日数が多い上位3名の平均値を、常に両方出す。
 */
export function SpecialMissionPage({ app, version }: PageProps) {
  const state = useAsyncData(async () => {
    const today = localDateOf(app.clock.now())
    const members = await app.members.members()
    return app.steps.specialMission(members, today)
  }, [app, version])

  return (
    <AsyncView state={state}>
      {(result) => (
        <section aria-labelledby="special-mission-title" className="page">
          <h2 id="special-mission-title" className="fs-title">
            特命
          </h2>
          <p className="fs-caption">1日8000歩を達成した日数（10月1日〜昨日）の平均</p>
          {result === null ? (
            <p className="fs-body">まだメンバーがいません。</p>
          ) : (
            <div className="stack">
              <article className="ho-tanzaku" aria-label="参加メンバー全員の平均">
                <span className="ho-tanzaku__title" aria-hidden="true">
                  全員
                </span>
                <p className="fs-h2">{formatDays(result.allAverage)}</p>
              </article>
              <article className="ho-tanzaku" aria-label="上位3名の平均">
                <span className="ho-tanzaku__title" aria-hidden="true">
                  上位3名
                </span>
                <p className="fs-h2">{formatDays(result.top3Average)}</p>
              </article>
            </div>
          )}
        </section>
      )}
    </AsyncView>
  )
}
