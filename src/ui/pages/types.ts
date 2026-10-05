import type { App } from '../../composition.ts'
import type { MemberId } from '../../publishedLanguage/memberId.ts'
import type { Settings } from '../settings.ts'

export interface PageProps {
  readonly app: App
  readonly memberId: MemberId
  /** 記録などで状態が変わったら呼ぶ（画面を描き直す）。 */
  readonly refresh: () => void
  /** refresh() が呼ばれるたびに変わる値。非同期の読み込みを再実行する目印に使う。 */
  readonly version: number
  readonly settings: Settings
}
