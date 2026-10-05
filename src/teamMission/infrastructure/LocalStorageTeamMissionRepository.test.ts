import { jst, startSmallMission, steps, a1, a2, b1 } from '../domain/testHelpers.ts'
import { LocalStorageTeamMissionRepository } from './LocalStorageTeamMissionRepository.ts'

describe('LocalStorageTeamMissionRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存がなければミッションはない', async () => {
    expect((await new LocalStorageTeamMissionRepository(localStorage).load()).missions).toEqual([])
  })

  test('隊・歩数・中間地点の記録・最終日を保存して、同じ順位を出せる', async () => {
    const mission = startSmallMission()
    mission.recordSteps(steps(a1, '2026-10-05', 20000, '2026-10-05 19:00'))
    mission.recordSteps(steps(b1, '2026-10-05', 16000, '2026-10-05 20:00'))
    mission.recordSteps(steps(a2, '2026-10-06', 20000, '2026-10-06 19:00'))
    await new LocalStorageTeamMissionRepository(localStorage).save({ missions: [mission] })
    const [loaded] = (await new LocalStorageTeamMissionRepository(localStorage).load()).missions
    const now = jst('2026-10-07 13:00')
    expect(loaded.toSnapshot()).toEqual(mission.toSnapshot())
    expect(loaded.finalDay).toBe('2026-10-06')
    expect(loaded.standings(now)).toEqual(mission.standings(now))
    expect(loaded.waypointStandings(2)).toEqual(mission.waypointStandings(2))
  })
})
