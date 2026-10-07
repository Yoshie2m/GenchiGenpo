import type { TierMember } from '../../stepRecord/application/StepRecordService.ts'
import { localDateOf } from '../../shared/LocalDate.ts'
import { AsyncView } from '../AsyncView.tsx'
import { toDaiji, toDaijiDecimal } from '../daiji.ts'
import { useUi } from '../design-system/uiContext.ts'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

/**
 * 達成率に応じた3つの称号（DOMAINS.md「特命」）。名札には略称（badge）を出す。
 * layout は一覧の並べ方: legendary は横3人分、support は横5人分のサイズで並べ、
 * それぞれ人数が少なければ中央寄せ、多ければ同じサイズのまま2段に折り返す（App.css）。
 */
const TIERS: readonly {
  key: 'legendaryWorkers' | 'rightHandWorkers' | 'eliteWorkers'
  title: string
  badge: string
  description: string
  emptyText: string
  layout: 'legendary' | 'support'
}[] = [
  {
    key: 'legendaryWorkers',
    title: '極上仕事人（ごくじょう）',
    badge: '極上',
    description: '伝説の達人。',
    emptyText: 'まだ対象期間のすべての日で達成した人はいません。',
    layout: 'legendary',
  },
  {
    key: 'rightHandWorkers',
    title: '筆頭仕事人（ひっとう）',
    badge: '筆頭',
    description: '隊を引っ張る、頼れるナンバーツー。',
    emptyText: 'まだ該当する人はいません。',
    layout: 'support',
  },
  {
    key: 'eliteWorkers',
    title: '精鋭仕事人（せいえい）',
    badge: '精鋭',
    description: '実力のある、現場の主戦力。',
    emptyText: 'まだ該当する人はいません。',
    layout: 'support',
  },
]

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

/** 漢数字の大きな日数表示（小数第1位まで。例: 「参・四」日）。Daiji コンポーネントと同じ見た目で、単位だけ「日」にしたもの。 */
function DaijiDays({ value, label }: { value: number; label: string }) {
  const { showArabic } = useUi()
  return (
    <div>
      <div className="ho-daiji">
        <span role="img" aria-label={`${label} ${value.toFixed(1)}日`}>
          {toDaijiDecimal(value)}
        </span>
        <span className="ho-daiji__unit" aria-hidden="true">
          日
        </span>
      </div>
      {showArabic && (
        <div className="ho-daiji__arabic" aria-hidden="true">
          {value.toFixed(1)}日
        </div>
      )}
    </div>
  )
}

/** 称号を持つメンバーの一覧（TIERS の1項目分）。 */
function TierSection({
  tier,
  members,
}: {
  tier: (typeof TIERS)[number]
  members: readonly TierMember[]
}) {
  return (
    <section aria-labelledby={`tier-${tier.key}-title`}>
      <h4 id={`tier-${tier.key}-title`} className="fs-h2">
        {tier.title}
      </h4>
      <p className="fs-caption">{tier.description}</p>
      {members.length === 0 ? (
        <p className="fs-body">{tier.emptyText}</p>
      ) : (
        <ul
          className={`special-mission__tier-list special-mission__tier-list--${tier.layout}`}
          aria-label={`${tier.title}の一覧`}
        >
          {members.map((m) => (
            <li key={m.memberId} className="ho-tanzaku">
              <span className="ho-tanzaku__title" aria-hidden="true">
                {tier.badge}
              </span>
              <p className="fs-h2">{m.displayName}さん</p>
              <DaijiPercent value={m.rate} label={`${m.displayName}さんの達成率`} />
              <p className="fs-caption">{m.achievementDays}日間継続</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/**
 * 特命: 隊（チームミッション）の代わりに出す画面（DOMAINS.md「特命」）。
 * 全体成果（メンバー1人あたりの平均達成日数。1日8000歩以上を記録した日数、10月1日〜昨日）と、
 * 達成率に応じた3つの称号（極上仕事人・筆頭仕事人・精鋭仕事人）の一覧を、漢数字で大きく出す。
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
              <section aria-labelledby="special-mission-overall-title">
                <h3 id="special-mission-overall-title" className="fs-h2">
                  全体成果
                </h3>
                <p className="fs-caption">
                  1人あたりの平均達成日数（1日8000歩以上、10月1日〜昨日の{result.totalDays}日間）
                </p>

                <article
                  className="ho-tanzaku special-mission__overall"
                  aria-label="参加メンバー全員分の全体成果"
                >
                  <span className="ho-tanzaku__title" aria-hidden="true">
                    全員
                  </span>
                  <DaijiDays value={result.overallDays} label="全体成果" />
                </article>
              </section>

              <section aria-labelledby="special-mission-tiers-title" className="stack">
                <h3 id="special-mission-tiers-title" className="fs-h2">
                  凄腕仕事人一覧
                </h3>
                {TIERS.map((tier) => (
                  <TierSection key={tier.key} tier={tier} members={result[tier.key]} />
                ))}
              </section>
            </div>
          )}
        </section>
      )}
    </AsyncView>
  )
}
