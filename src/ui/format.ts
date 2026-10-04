import type { LocalDate } from '../shared/LocalDate.ts'
import type { TeamMissionView } from '../teamMission/application/TeamMissionService.ts'

/** 歩数を算用数字で表す（メッセージなど、文の中で大字を使わないところ）。 */
export function formatSteps(steps: number): string {
  return `${Math.floor(steps).toLocaleString('ja-JP')}歩`
}

/** 「10月4日（日）」の形。 */
export function formatDate(date: LocalDate): string {
  const [y, m, d] = date.split('-').map(Number)
  const week = '日月火水木金土'[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${m}月${d}日（${week}）`
}

/** 日本時間の「10月4日 13:00」の形。 */
export function formatDateTime(at: Date): string {
  return at.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Status = Extract<TeamMissionView, { kind: 'mission' }>['status']

export const STATUS_LABELS: Readonly<Record<Status, string>> = {
  notStarted: '開始待ち',
  inProgress: '進行中',
  accepting: '歩数を受付中',
  finalized: '順位確定',
}
