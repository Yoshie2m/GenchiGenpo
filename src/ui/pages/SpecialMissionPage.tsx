import { localDateOf } from '../../shared/LocalDate.ts'
import { AsyncView } from '../AsyncView.tsx'
import { toDaiji } from '../daiji.ts'
import { useUi } from '../design-system/uiContext.ts'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

/** 漢数字の大きな％表示（Daiji コンポーネントと同じ見た目で、単位だけ「％」にしたもの）。 */
function DaijiPercent({ value, label }: { value: number; label: string }) {
  const { showArabic } = useUi()
  return (
    <div>
      <div className="ho-daiji">
        <span role="img" aria-label={`${label} ${value}パーセント`}>
          {toDaiji(value)}
        </span>
        <span className="ho-daiji__unit" aria-hidden="true">
          ％
        </span>
      </div>
      {showArabic && (
        <div className="ho-daiji__arabic" aria-hidden="true">
          {value}％
        </div>
      )}
    </div>
  )
}

/**
 * 特命: 隊（チームミッション）の代わりに出す画面（DOMAINS.md「特命」）。
 * 参加メンバー全員分の達成率（1日8000歩以上を記録した日数の割合、10月1日〜昨日）と、
 * 極上（パーフェクト。対象期間のすべての日で達成した人）の一覧を、漢数字で大きく出す。
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
          {result === null ? (
            <p className="fs-body">まだ数えられる日がありません。</p>
          ) : (
            <div className="stack">
              <p className="fs-caption">
                1日8000歩を達成した日数の割合（10月1日〜昨日、{result.totalDays}日間）
              </p>

              <article className="ho-tanzaku" aria-label="参加メンバー全員分の達成率">
                <span className="ho-tanzaku__title" aria-hidden="true">
                  全員
                </span>
                <DaijiPercent value={result.overallRate} label="参加メンバー全員分の達成率" />
              </article>

              <h3 className="fs-h2">極上（パーフェクト）</h3>
              {result.perfectMembers.length === 0 ? (
                <p className="fs-body">まだ対象期間のすべての日で達成した人はいません。</p>
              ) : (
                <ul
                  className="special-mission__perfect-list stack"
                  aria-label="極上（パーフェクト）の一覧"
                >
                  {result.perfectMembers.map((m) => (
                    <li key={m.memberId} className="ho-tanzaku">
                      <span className="ho-tanzaku__title" aria-hidden="true">
                        極上
                      </span>
                      <p className="fs-h2">{m.displayName}さん</p>
                      <DaijiPercent value={100} label={`${m.displayName}さんの達成率`} />
                      <p className="fs-caption">{m.achievementDays}日間継続</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}
    </AsyncView>
  )
}
