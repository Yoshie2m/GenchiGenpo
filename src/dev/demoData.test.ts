import { personalAverage } from '../stepRecord/domain/personalAverage.ts'
import { parseLocalDate } from '../shared/LocalDate.ts'
import { buildDemoData, DEMO_MEMBERS } from './demoData.ts'

const now = new Date('2026-10-20T03:00:00Z') // 日本時間 10/20 12:00

describe('ダミーメンバー', () => {
  test('10人で、何度作っても同じ歩数になる', () => {
    const first = buildDemoData(now)
    expect(first.members).toHaveLength(10)
    expect(buildDemoData(now).dailySteps).toEqual(first.dailySteps)
  })

  test('歩数は登録日から昨日まで（今日の分はまだない）、上限 30,000 歩以内', () => {
    const { dailySteps } = buildDemoData(now)
    expect(dailySteps.every((d) => d.date < '2026-10-20' && d.steps <= 30_000)).toBe(true)
    const late = dailySteps.filter((d) => d.memberId === 'demo-09')
    expect(late.every((d) => d.date >= '2026-10-03')).toBe(true)
  })

  test('歩数がまだ1日もないメンバーがいる（振り分けで 8,000 歩とみなす人）', () => {
    const { dailySteps } = buildDemoData(now)
    expect(dailySteps.some((d) => d.memberId === 'demo-10')).toBe(false)
  })

  test('平均歩数はばらつき、目安が大きい人ほど平均も大きい', () => {
    const { members, dailySteps } = buildDemoData(now)
    const until = parseLocalDate('2026-10-19')
    const averages = members.slice(0, 8).map((m) =>
      personalAverage(
        dailySteps.filter((d) => d.memberId === m.id),
        m.registeredDate,
        until,
      ),
    )
    expect(averages[0]).toBeGreaterThan(averages[7]!)
    expect(DEMO_MEMBERS[0].typicalSteps).toBeGreaterThan(DEMO_MEMBERS[7].typicalSteps)
  })
})
