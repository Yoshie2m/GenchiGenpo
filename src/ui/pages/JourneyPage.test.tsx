import { render, screen } from '@testing-library/react'
import type { JourneyView } from '../../personalMission/application/PersonalMissionService.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { Journey } from './JourneyPage.tsx'

type Checkpoint = JourneyView['current']

const cp = (name: string, cumulativeSteps: number): Checkpoint => ({
  name,
  kind: 'postTown',
  province: '三河国',
  cumulativeSteps,
  memo: `${name}の一口メモ`,
})
const start = cp('本社', 0)
const goal = cp('新虎オフィス', 461_000)

function view(overrides: Partial<JourneyView>): JourneyView {
  return {
    routeName: '東海道五十三次ルート',
    startDate: parseLocalDate('2026-10-01'),
    cumulativeSteps: 100_000,
    goalSteps: goal.cumulativeSteps,
    start,
    goal,
    current: start,
    next: goal,
    stepsToNext: 361_000,
    completed: false,
    totalDistanceRi: 85,
    progressPercent: 21,
    nearby: [
      { checkpoint: start, passed: true },
      { checkpoint: goal, passed: false },
    ],
    arrivals: [{ checkpoint: start, arrivedAt: new Date('2026-10-01T00:00:00Z') }],
    ...overrides,
  }
}

describe('Journey（道中試練）', () => {
  test('旅の途中では、踏破のお知らせを出さない', () => {
    render(<Journey view={view({})} />)
    expect(screen.getByText('21％達成')).toBeInTheDocument()
    expect(screen.queryByText(/次の試練は支度中/)).not.toBeInTheDocument()
  })

  test('ゴールに着いた後は、100％達成と「次の試練は支度中」を出す', () => {
    render(
      <Journey
        view={view({
          completed: true,
          next: null,
          stepsToNext: 0,
          current: goal,
          cumulativeSteps: 500_000,
          progressPercent: 100,
          nearby: [
            { checkpoint: start, passed: true },
            { checkpoint: goal, passed: true },
          ],
        })}
      />,
    )
    expect(screen.getByText('100％達成')).toBeInTheDocument()
    expect(screen.getByText('其の壱、踏破。次の試練は支度中です。')).toBeInTheDocument()
  })
})
