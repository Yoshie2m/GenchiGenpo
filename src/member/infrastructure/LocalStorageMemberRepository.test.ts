import { parseLocalDate } from '../../shared/LocalDate.ts'
import { Member } from '../domain/Member.ts'
import { LocalStorageMemberRepository } from './LocalStorageMemberRepository.ts'

describe('LocalStorageMemberRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存したメンバーを読み戻せる', async () => {
    const members = [
      Member.register('m1', '佐藤', parseLocalDate('2026-10-01')),
      Member.register('m2', '高橋', parseLocalDate('2026-10-12')),
    ]
    await new LocalStorageMemberRepository(localStorage).replaceAll(members)
    expect(await new LocalStorageMemberRepository(localStorage).all()).toEqual(members)
  })

  test('1件追加すると、既存のメンバーに追加される', async () => {
    const m1 = Member.register('m1', '佐藤', parseLocalDate('2026-10-01'))
    const m2 = Member.register('m2', '高橋', parseLocalDate('2026-10-12'))
    const repository = new LocalStorageMemberRepository(localStorage)
    await repository.add(m1)
    await repository.add(m2)
    expect(await repository.all()).toEqual([m1, m2])
  })
})
