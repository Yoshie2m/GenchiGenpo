import { memberId } from '../../publishedLanguage/memberId.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { parseLocalDate, type LocalDate } from '../../shared/LocalDate.ts'
import { PersonalMission } from './PersonalMission.ts'
import type { Checkpoint, Route } from './Route.ts'

const taro = memberId('taro')
const cp = (name: string, cumulativeSteps: number): Checkpoint => ({
  name,
  kind: 'postTown',
  province: '三河国',
  cumulativeSteps,
  memo: `${name}の一口メモ`,
})
const route: Route = {
  name: 'テストのルート',
  checkpoints: [cp('本社', 0), cp('池鯉鮒宿', 6200), cp('岡崎宿', 26900), cp('藤川宿', 36200)],
}
const oct1 = parseLocalDate('2026-10-01')

function steps(date: string, value: number, reflectedAt: string): StepsRecorded {
  return {
    type: 'StepsRecorded',
    memberId: taro,
    date: parseLocalDate(date) as LocalDate,
    steps: value,
    previousSteps: 0,
    reflectedAt: new Date(reflectedAt),
  }
}

describe('PersonalMission（個人ミッション）', () => {
  test('旅立ちの時点では出発地にいて、次の通過点を示す', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    expect(mission.currentCheckpoint.name).toBe('本社')
    expect(mission.nextCheckpoint?.name).toBe('池鯉鮒宿')
    expect(mission.stepsToNext).toBe(6200)
    expect(mission.checkpointArrivals).toEqual([
      { checkpointIndex: 0, arrivedAt: new Date('2026-09-30T15:00:00Z') },
    ])
  })

  test('累計歩数が次の通過点に達すると着いた記録が残り、目標が次へ進む', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    const reached = mission.recordSteps(steps('2026-10-01', 7000, '2026-10-01T12:00:00Z'))
    expect(reached.map((c) => c.name)).toEqual(['池鯉鮒宿'])
    expect(mission.currentCheckpoint.name).toBe('池鯉鮒宿')
    expect(mission.nextCheckpoint?.name).toBe('岡崎宿')
    expect(mission.stepsToNext).toBe(26900 - 7000)
  })

  test('まとめて記録して一度に複数の通過点に着くこともある（着いた時刻は反映日時）', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    mission.recordSteps(steps('2026-10-01', 15000, '2026-10-05T09:00:00Z'))
    const reached = mission.recordSteps(steps('2026-10-02', 15000, '2026-10-05T09:00:00Z'))
    expect(reached.map((c) => c.name)).toEqual(['岡崎宿'])
    expect(mission.checkpointArrivals.map((a) => a.checkpointIndex)).toEqual([0, 1, 2])
    expect(mission.checkpointArrivals[2].arrivedAt).toEqual(new Date('2026-10-05T09:00:00Z'))
  })

  test('同じ日の歩数は置き換える（足し合わせない）', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    mission.recordSteps(steps('2026-10-01', 3000, '2026-10-01T03:00:00Z'))
    mission.recordSteps(steps('2026-10-01', 5000, '2026-10-01T12:00:00Z'))
    expect(mission.cumulativeSteps).toBe(5000)
  })

  test('誤入力の修正で累計歩数が減っても、着いた記録は消さない', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    mission.recordSteps(steps('2026-10-01', 7000, '2026-10-01T12:00:00Z'))
    mission.recordSteps(steps('2026-10-01', 5000, '2026-10-01T13:00:00Z'))
    expect(mission.cumulativeSteps).toBe(5000)
    expect(mission.currentCheckpoint.name).toBe('池鯉鮒宿')
  })

  test('登録日より前の歩数が記録されたら、旅立ちの日をさかのぼって数える', () => {
    const mission = PersonalMission.begin(taro, route, parseLocalDate('2026-10-10'))
    mission.recordSteps(steps('2026-10-01', 9000, '2026-10-10T03:00:00Z'))
    expect(mission.cumulativeSteps).toBe(9000)
    expect(mission.startDate).toBe('2026-10-01')
    expect(mission.checkpointArrivals[0]).toEqual({
      checkpointIndex: 0,
      arrivedAt: new Date('2026-09-30T15:00:00Z'),
    })
  })

  test('ゴールに着くと旅を終える', () => {
    const mission = PersonalMission.begin(taro, route, oct1)
    mission.recordSteps(steps('2026-10-01', 30000, '2026-10-01T12:00:00Z'))
    mission.recordSteps(steps('2026-10-02', 7000, '2026-10-02T12:00:00Z'))
    expect(mission.isCompleted).toBe(true)
    expect(mission.nextCheckpoint).toBeNull()
    expect(mission.stepsToNext).toBe(0)
  })

  test('累計歩数が増えていかないルートは受け付けない', () => {
    const bad: Route = { name: 'x', checkpoints: [cp('a', 0), cp('b', 100), cp('c', 100)] }
    expect(() => PersonalMission.begin(taro, bad, oct1)).toThrow(DomainError)
  })
})
