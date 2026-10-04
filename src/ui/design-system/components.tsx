import { toDaiji } from '../daiji.ts'
import { pictogramUrl, type PictogramKind } from './assets.ts'
import { useUi } from './uiContext.ts'

/** 大字の歩数（今日の歩数・累計歩数など、画面の主役）。読み上げは算用数字。 */
export function Daiji({ steps, label }: { steps: number; label: string }) {
  const { showArabic } = useUi()
  const value = Math.floor(steps)
  const text = toDaiji(value)
  return (
    <div>
      <div className="ho-daiji" style={{ fontSize: daijiSize(text.length) }}>
        <span role="img" aria-label={`${label} ${value}歩`}>
          {text}
        </span>
        <span className="ho-daiji__unit" aria-hidden="true">
          歩
        </span>
      </div>
      {showArabic && (
        <div className="ho-daiji__arabic" aria-hidden="true">
          {value.toLocaleString('ja-JP')} 歩
        </div>
      )}
    </div>
  )
}

/**
 * 大字の文字の大きさ。fs-daiji（72px）を基本にし、桁が多くて画面の幅（360px）に収まらないときは小さくする。
 * 1行に収め、改行で数字が読みにくくならないようにするため。
 */
function daijiSize(chars: number): string {
  if (chars <= 4) return '72px'
  if (chars <= 6) return '48px'
  if (chars <= 8) return '36px'
  return '30px'
}

/** 文の中の歩数（大字＋「歩」）。読み上げは算用数字。 */
export function Steps({ steps }: { steps: number }) {
  const { showArabic } = useUi()
  const value = Math.floor(steps)
  return (
    <span aria-label={`${value}歩`}>
      <span aria-hidden="true">{toDaiji(value)}歩</span>
      {showArabic && (
        <span className="ho-daiji__arabic" aria-hidden="true">
          （{value.toLocaleString('ja-JP')}）
        </span>
      )}
    </span>
  )
}

const TEAM_MARKS = ['', '壱', '弍', '参']

/** 隊の印（壱・弍・参）。隊名の前に必ず付ける。 */
export function TeamMark({ team, mine = false }: { team: number; mine?: boolean }) {
  return (
    <span className={`ho-teammark${mine ? ' ho-teammark--mine' : ''}`} aria-hidden="true">
      {TEAM_MARKS[team]}
    </span>
  )
}

/** 地点のピクトグラム（オフィス・宿場町・峠・経過地）。地点名は呼び出し側で必ず併記する。 */
export function Pictogram({ kind }: { kind: PictogramKind }) {
  const { night } = useUi()
  return <img src={pictogramUrl(kind, night)} alt="" width={24} height={24} />
}

/** タブのアイコン（歩・記・道・隊・設）。currentColor で文字色に合わせる。 */
const ICON_PATHS = {
  ho: '<path d="M7.4 21.2c-1.5 0-2.6-1.2-2.6-3 0-1.3.6-2.3.6-3.6 0-1.7.9-2.9 2.2-2.9s2.2 1.2 2.2 2.9c0 1.5-.6 2.5-.6 3.8 0 1.7-.7 2.8-1.8 2.8z"/><circle cx="5.6" cy="9.9" r=".7"/><circle cx="7.6" cy="9.2" r=".7"/><circle cx="9.5" cy="9.9" r=".7"/><path d="M16.4 15.2c-1.5 0-2.6-1.2-2.6-3 0-1.3.6-2.3.6-3.6 0-1.7.9-2.9 2.2-2.9s2.2 1.2 2.2 2.9c0 1.5-.6 2.5-.6 3.8 0 1.7-.7 2.8-1.8 2.8z"/><circle cx="14.6" cy="3.9" r=".7"/><circle cx="16.6" cy="3.2" r=".7"/><circle cx="18.5" cy="3.9" r=".7"/>',
  ki: '<rect x="3" y="4" width="3" height="16" rx="1.5"/><rect x="18" y="4" width="3" height="16" rx="1.5"/><path d="M6 6h12M6 18h12"/><path d="M9 9.5h6M9 12h6M9 14.5h4"/>',
  michi:
    '<path d="M3 4h18"/><path d="M10.5 4L7 21M13.5 4L17 21"/><path d="M12 7v1.5M12 11v2M12 16v2.5"/>',
  tai: '<path d="M6 3v18"/><path d="M6 4.5h11.5v10H6"/><path d="M9.5 8h4.5M9.5 11h4.5"/>',
  setsu:
    '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18"/><path d="M7.5 5v14M12 5v14M16.5 5v14"/><rect x="6" y="6.5" width="3" height="2" rx="1"/><rect x="10.5" y="6.5" width="3" height="2" rx="1"/><rect x="15" y="6.5" width="3" height="2" rx="1"/><rect x="6" y="11.5" width="3" height="2" rx="1"/><rect x="10.5" y="14.5" width="3" height="2" rx="1"/><rect x="15" y="11.5" width="3" height="2" rx="1"/>',
  banzuke:
    '<path d="M4 3v18"/><rect x="6" y="5" width="14" height="3.5" rx="1"/><rect x="6" y="10.25" width="10" height="3.5" rx="1"/><rect x="6" y="15.5" width="6" height="3.5" rx="1"/>',
} as const
export type IconName = keyof typeof ICON_PATHS

export function Icon({ name, className = 'ho-tab__icon' }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }}
    />
  )
}
