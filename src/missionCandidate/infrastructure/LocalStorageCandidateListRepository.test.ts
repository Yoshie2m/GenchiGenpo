import { MISSION_CANDIDATES } from '../masterData/missionCandidates.ts'
import { LocalStorageCandidateListRepository } from './LocalStorageCandidateListRepository.ts'

const ids = (list: { candidates: readonly { candidateId: string }[] }) =>
  list.candidates.map((c) => c.candidateId)

describe('LocalStorageCandidateListRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存がなければマスターデータの並び順', async () => {
    const list = await new LocalStorageCandidateListRepository(localStorage).load(
      MISSION_CANDIDATES,
    )
    expect(list.top.candidateId).toBe('hamaki')
  })

  test('使った候補を一番下に回した並び順を保存して戻せる', async () => {
    const repo = new LocalStorageCandidateListRepository(localStorage)
    await repo.save((await repo.load(MISSION_CANDIDATES)).markUsed('hamaki'))
    const list = await new LocalStorageCandidateListRepository(localStorage).load(
      MISSION_CANDIDATES,
    )
    expect(list.top.candidateId).toBe('shokuho')
    expect(ids(list).at(-1)).toBe('hamaki')
  })

  test('マスターデータに増えた候補は末尾に足し、なくなった候補は外す', async () => {
    const repo = new LocalStorageCandidateListRepository(localStorage)
    await repo.save((await repo.load(MISSION_CANDIDATES.slice(0, 2))).markUsed('hamaki'))
    const list = await repo.load([MISSION_CANDIDATES[0], MISSION_CANDIDATES[2]])
    expect(ids(list)).toEqual(['hamaki', 'irin'])
  })
})
