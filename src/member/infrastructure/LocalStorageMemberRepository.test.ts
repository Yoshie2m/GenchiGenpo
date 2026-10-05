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
    await new LocalStorageMemberRepository(localStorage).save(members)
    expect(await new LocalStorageMemberRepository(localStorage).load()).toEqual(members)
  })
})
