import { Member } from '../member/domain/Member.ts'
import { DailySteps, RECORDING_START_DATE } from '../stepRecord/domain/DailySteps.ts'
import { addDays, atJst, localDateOf } from '../shared/LocalDate.ts'

/**
 * ログインできない人に見せるサンプルページ用の、ダミーのメンバー（6人）と日ごとの歩数。
 * 名前はカタカナの名字から選び、歩数も乱数で作る（開くたびに変わる）。実在の人とは関係ない。
 * 乱数は引数で差し替えられる（テストでは種を決めた乱数を渡す）。
 */
export const SAMPLE_MEMBER_COUNT = 6

/** 名字の候補（カタカナ）。ここから重ならないように6人分を選ぶ。 */
export const SAMPLE_SURNAMES: readonly string[] = [
  'サトウ',
  'スズキ',
  'タカハシ',
  'タナカ',
  'イトウ',
  'ワタナベ',
  'ヤマモト',
  'ナカムラ',
  'コバヤシ',
  'カトウ',
  'ヨシダ',
  'ヤマダ',
  'ササキ',
  'ヤマグチ',
  'マツモト',
  'イノウエ',
]

function pick<T>(items: readonly T[], count: number, random: () => number): T[] {
  const rest = [...items]
  const picked: T[] = []
  while (picked.length < count && rest.length > 0) {
    picked.push(rest.splice(Math.floor(random() * rest.length), 1)[0])
  }
  return picked
}

/**
 * サンプルのメンバーと、10月1日から now の日までの歩数。
 * 1人ごとに1日の歩数の目安（5,000〜14,000歩）を決め、日ごとにその6〜14割ほどでばらつかせる。
 * 1割ほどの日は記録しない。今日の分は、now に記録した扱い。
 */
export function buildSampleData(
  now: Date,
  random: () => number = Math.random,
): { members: Member[]; dailySteps: DailySteps[] } {
  const today = localDateOf(now)
  const surnames = pick(SAMPLE_SURNAMES, SAMPLE_MEMBER_COUNT, random)
  const members = surnames.map((name, i) =>
    Member.register(`sample-${i + 1}`, name, RECORDING_START_DATE),
  )
  const dailySteps: DailySteps[] = []
  for (const member of members) {
    const typical = 5_000 + random() * 9_000
    for (let date = RECORDING_START_DATE; date <= today; date = addDays(date, 1)) {
      if (random() < 0.1) continue
      const steps = Math.min(30_000, Math.round(typical * (0.6 + random() * 0.8)))
      const reflectedAt = date === today ? now : atJst(date, 22)
      dailySteps.push(DailySteps.record(member.id, date, steps, 'manual', reflectedAt).dailySteps)
    }
  }
  return { members, dailySteps }
}
