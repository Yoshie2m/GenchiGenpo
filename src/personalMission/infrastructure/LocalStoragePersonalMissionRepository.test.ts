import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { PersonalMission } from '../domain/PersonalMission.ts'
import { TOKAIDO_ROUTE } from '../masterData/tokaidoRoute.ts'
import { LocalStoragePersonalMissionRepository } from './LocalStoragePersonalMissionRepository.ts'

describe('LocalStoragePersonalMissionRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存がなければ null', async () => {
    const repository = new LocalStoragePersonalMissionRepository(localStorage, TOKAIDO_ROUTE)
    expect(await repository.findByMember(memberId('taro'))).toBeNull()
  })

  test('累計歩数と着いた記録を保存して、同じ状態に戻せる', async () => {
    const taro = memberId('taro')
    const mission = PersonalMission.begin(taro, TOKAIDO_ROUTE, parseLocalDate('2026-10-01'))
    mission.recordSteps({
      type: 'StepsRecorded',
      memberId: taro,
      date: parseLocalDate('2026-10-01'),
      steps: 30000,
      previousSteps: 0,
      reflectedAt: new Date('2026-10-01T12:00:00Z'),
    })
    await new LocalStoragePersonalMissionRepository(localStorage, TOKAIDO_ROUTE).save(mission)
    const loaded = await new LocalStoragePersonalMissionRepository(
      localStorage,
      TOKAIDO_ROUTE,
    ).findByMember(taro)
    expect(loaded).not.toBeNull()
    expect(loaded!.toSnapshot()).toEqual(mission.toSnapshot())
    expect(loaded!.currentCheckpoint.name).toBe('岡崎宿')
    expect(loaded!.stepsToNext).toBe(mission.stepsToNext)
  })
})
