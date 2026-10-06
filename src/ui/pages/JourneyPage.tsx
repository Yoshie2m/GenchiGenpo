import type { JourneyView } from '../../personalMission/application/PersonalMissionService.ts'
import { provinceSceneUrl } from '../design-system/assets.ts'
import { Icon, Pictogram, Steps } from '../design-system/components.tsx'
import { formatDateTime } from '../format.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

/** 「三河国」のような旧国名を「三河の国」の形にする。 */
function provinceOf(province: string): string {
  return `${province.replace(/国$/, '')}の国`
}

/**
 * 道中: 個人ミッション（本社 → 新虎オフィス）を「道中試練」として出す。試練の説明、行程・総道のり・
 * 進捗・現在地の要約、今いる国の景色、街道の線（RouteLine）、通過記録（CheckpointLog）の順に並べる。
 * 通過点に着いても特別な表示は出さない（記録が残るだけ）。ゴールに着いた後だけ、
 * 「踏破、次の試練は支度中」を出す（ゴール後は別のルートを用意する。DOMAINS.md「個人ミッション」）。
 */
export function JourneyPage({ app, memberId, version }: PageProps) {
  const state = useAsyncData(() => app.personal.view(memberId), [app, memberId, version])
  return (
    <AsyncView state={state}>
      {(view) =>
        view === null ? (
          <section className="page">
            <p>まだ足跡がありません。さあ、参りましょう。</p>
          </section>
        ) : (
          <Journey view={view} />
        )
      }
    </AsyncView>
  )
}

export function Journey({ view }: { view: JourneyView }) {
  const scene = provinceSceneUrl(view.current.province)
  const passedCount = view.nearby.filter((n) => n.passed).length
  // 歩いた区間: 直前に着いた通過点まで（現在地は着いた通過点と次の通過点の間）
  const done = Math.round(((passedCount - 0.5) / view.nearby.length) * 100)

  return (
    <section aria-labelledby="journey-title" className="page journey">
      <h2 id="journey-title" className="fs-title">
        道中試練
      </h2>

      <div className="ho-tanzaku">
        <span className="ho-tanzaku__title" aria-hidden="true">
          其の壱
        </span>
        <p className="fs-body">
          最初の試練は、各々の足跡を刻みつつ「江戸陣屋（新虎）」へ到達すること。
        </p>
      </div>

      {view.completed && (
        <div className="ho-tanzaku">
          <span className="ho-tanzaku__title" aria-hidden="true">
            踏破
          </span>
          <p className="fs-body">其の壱、踏破。次の試練は支度中です。</p>
        </div>
      )}

      <dl className="journey__summary">
        <div>
          <dt className="fs-caption">道中（行程）</dt>
          <dd className="fs-body">
            {view.start.name} ─── {view.current.name} ─── {view.goal.name}
          </dd>
        </div>
        <div>
          <dt className="fs-caption">総道のり（距離）</dt>
          <dd className="fs-body">{view.totalDistanceRi}里</dd>
        </div>
        <div>
          <dt className="fs-caption">現在の進捗（完遂率）</dt>
          <dd className="fs-body">{view.progressPercent}％達成</dd>
        </div>
        <div>
          <dt className="fs-caption">現在地</dt>
          <dd className="fs-body">{provinceOf(view.current.province)}の宿場町</dd>
        </div>
      </dl>

      {scene && (
        <img className="journey__scene" src={scene} alt={`${view.current.province}の景色`} />
      )}

      <section className="ho-routeline" aria-label="街道">
        <ol className="ho-routeline__track" style={{ ['--done' as string]: `${done}%` }}>
          {view.nearby.map(({ checkpoint, passed }, i) => (
            <RouteStop
              key={checkpoint.name}
              name={checkpoint.name}
              kind={checkpoint.kind}
              passed={passed}
              hereAfter={passed && !view.nearby[i + 1]?.passed && !view.completed}
            />
          ))}
        </ol>
      </section>

      <h3 className="fs-h2">通過記録</h3>
      <ol className="ho-cplog" aria-label="通過記録">
        {view.arrivals.map(({ checkpoint, arrivedAt }, i) => (
          <li key={checkpoint.name} className="ho-cplog__row">
            <Pictogram kind={checkpoint.kind} />
            <span className="ho-cplog__name">{checkpoint.name}</span>
            <span className="ho-cplog__meta">
              {formatDateTime(arrivedAt)}
              {i === view.arrivals.length - 1 && '（旅立ち）'}
              <br />
              <Steps steps={checkpoint.cumulativeSteps} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RouteStop({
  name,
  kind,
  passed,
  hereAfter,
}: {
  name: string
  kind: Parameters<typeof Pictogram>[0]['kind']
  passed: boolean
  hereAfter: boolean
}) {
  return (
    <>
      <li className={`ho-routeline__stop${passed ? ' is-passed' : ''}`}>
        <Pictogram kind={kind} />
        {name}
      </li>
      {hereAfter && (
        <li className="ho-routeline__here" aria-label="現在地">
          <Icon name="ho" className="" />
        </li>
      )}
    </>
  )
}
