import type { JourneyView } from '../../personalMission/application/PersonalMissionService.ts'
import { provinceSceneUrl } from '../design-system/assets.ts'
import { Daiji, Icon, Pictogram, Steps } from '../design-system/components.tsx'
import { formatDate, formatDateTime } from '../format.ts'
import { AsyncView } from '../AsyncView.tsx'
import { useAsyncData } from '../useAsyncData.ts'
import type { PageProps } from './types.ts'

/**
 * 道中: 個人ミッション（本社 → 新虎オフィス）。今いる国の景色を背景に、累計歩数（大字）、
 * 次の通過点と一口メモ、街道の線（RouteLine）、通過記録（CheckpointLog）を出す。
 * 通過点に着いても特別な表示は出さない（記録が残るだけ）。
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

function Journey({ view }: { view: JourneyView }) {
  const scene = provinceSceneUrl(view.current.province)
  const passedCount = view.nearby.filter((n) => n.passed).length
  // 歩いた区間: 直前に着いた通過点まで（現在地は着いた通過点と次の通過点の間）
  const done = Math.round(((passedCount - 0.5) / view.nearby.length) * 100)

  return (
    <section aria-labelledby="journey-title" className="page journey">
      {scene && (
        <img className="journey__scene" src={scene} alt={`${view.current.province}の景色`} />
      )}
      <h2 id="journey-title" className="fs-title">
        道中
      </h2>
      <p className="fs-caption">
        {view.routeName}・旅立ち {formatDate(view.startDate)}
      </p>
      <Daiji steps={view.cumulativeSteps} label="累計歩数" />

      {view.completed || !view.next ? (
        <div className="ho-tanzaku">
          <p className="fs-body">旅を終えました。</p>
          <p className="fs-body">次の道は支度中です。</p>
        </div>
      ) : (
        <div className="ho-tanzaku">
          <span className="ho-tanzaku__title" aria-hidden="true">
            次
          </span>
          <p className="ho-routeline__next">
            次の通過点 {view.next.name}まで あと{' '}
            <b>
              <Steps steps={view.stepsToNext} />
            </b>
          </p>
          <p className="memo fs-body">{view.next.memo}</p>
        </div>
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
