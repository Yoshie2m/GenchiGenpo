import { DomainError } from '../../shared/DomainError.ts'

/** 通過点の種類（デザインシステムのピクトグラムに合わせる）。 */
export type CheckpointKind = 'office' | 'postTown' | 'pass' | 'waypoint'

/** 個人ミッションの道のりに並ぶ地点（DOMAINS.md）。 */
export interface Checkpoint {
  readonly name: string
  readonly kind: CheckpointKind
  /** 旧国名（例: 三河国）。今いる国の景色を出すのに使う。 */
  readonly province: string
  /** 出発からこの通過点までに必要な累計歩数。 */
  readonly cumulativeSteps: number
  /** 次の通過点として示すときの一口メモ（3〜5行）。 */
  readonly memo: string
}

/** 個人ミッションのルート（固定）。最初の通過点が出発地（累計 0 歩）、最後がゴール。 */
export interface Route {
  readonly name: string
  readonly checkpoints: readonly Checkpoint[]
}

export function assertValidRoute(route: Route): void {
  const cps = route.checkpoints
  if (cps.length < 2) throw new DomainError('ルートには出発地とゴールが必要です')
  if (cps[0].cumulativeSteps !== 0) throw new DomainError('出発地の累計歩数は 0 です')
  for (let i = 1; i < cps.length; i++) {
    if (cps[i].cumulativeSteps <= cps[i - 1].cumulativeSteps) {
      throw new DomainError(`通過点の累計歩数は増えていく必要があります: ${cps[i].name}`)
    }
  }
}
