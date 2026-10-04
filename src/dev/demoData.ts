import { Member } from '../member/domain/Member.ts'
import { DailySteps, RECORDING_START_DATE } from '../stepRecord/domain/DailySteps.ts'
import { addDays, atJst, localDateOf, type LocalDate } from '../shared/LocalDate.ts'

/**
 * PoC 用のダミーメンバー（10人）と、その日ごとの歩数。
 * 平均歩数をばらばらにし、10月1日より後に登録した人と、歩数がまだ1日もない人を含める
 * （チーム振り分けの平均歩数・「8,000歩とみなす」を試すため）。
 * 歩数は乱数の種を固定して作るので、何度作っても同じになる。
 */
export interface DemoMemberProfile {
  readonly id: string
  readonly displayName: string
  /** 1日の歩数の目安（この前後でばらつく）。 */
  readonly typicalSteps: number
  /** 登録日。null は 2026年10月1日。 */
  readonly registeredDate: LocalDate | null
  /** true なら歩数をまだ記録していない（登録したばかり）。 */
  readonly noHistory?: boolean
}

export const DEMO_MEMBERS: readonly DemoMemberProfile[] = [
  { id: 'demo-01', displayName: '一ノ瀬', typicalSteps: 13_000, registeredDate: null },
  { id: 'demo-02', displayName: '二階堂', typicalSteps: 11_500, registeredDate: null },
  { id: 'demo-03', displayName: '三浦', typicalSteps: 10_000, registeredDate: null },
  { id: 'demo-04', displayName: '四方', typicalSteps: 9_000, registeredDate: null },
  { id: 'demo-05', displayName: '五十嵐', typicalSteps: 8_500, registeredDate: null },
  { id: 'demo-06', displayName: '六車', typicalSteps: 7_500, registeredDate: null },
  { id: 'demo-07', displayName: '七海', typicalSteps: 6_500, registeredDate: null },
  { id: 'demo-08', displayName: '八木', typicalSteps: 5_000, registeredDate: null },
  {
    id: 'demo-09',
    displayName: '九条',
    typicalSteps: 9_500,
    registeredDate: '2026-10-03' as LocalDate,
  },
  {
    id: 'demo-10',
    displayName: '十和田',
    typicalSteps: 8_000,
    registeredDate: '2026-10-04' as LocalDate,
    noHistory: true,
  },
]

/** 乱数（種から決まる。mulberry32）。 */
function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedOf(memberId: string, date: LocalDate): number {
  let h = 2166136261
  for (const ch of `${memberId}|${date}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h
}

/**
 * ダミーメンバーのある日の歩数。1割ほどの日は記録しない（null）。
 * 開発用画面の「ダミーの歩数を自動で入れる」でも使う。
 */
export function demoStepsOf(profile: DemoMemberProfile, date: LocalDate): number | null {
  const rand = random(seedOf(profile.id, date))
  if (rand() < 0.1) return null
  const factor = 0.6 + rand() * 0.8
  return Math.round(profile.typicalSteps * factor)
}

/** ダミーメンバーと、登録日から today の前日までの歩数（その日の 22:00 に記録した扱い）。 */
export function buildDemoData(now: Date): { members: Member[]; dailySteps: DailySteps[] } {
  const today = localDateOf(now)
  const members = DEMO_MEMBERS.map((p) =>
    Member.register(p.id, p.displayName, p.registeredDate ?? RECORDING_START_DATE),
  )
  const dailySteps: DailySteps[] = []
  DEMO_MEMBERS.forEach((profile, i) => {
    if (profile.noHistory) return
    for (let date = members[i].registeredDate; date < today; date = addDays(date, 1)) {
      const steps = demoStepsOf(profile, date)
      if (steps === null) continue
      const reflectedAt = atJst(date, 22)
      dailySteps.push(
        DailySteps.record(members[i].id, date, steps, 'manual', reflectedAt).dailySteps,
      )
    }
  })
  return { members, dailySteps }
}
