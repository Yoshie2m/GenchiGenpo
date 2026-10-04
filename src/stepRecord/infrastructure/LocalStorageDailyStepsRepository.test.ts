import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { DailySteps } from '../domain/DailySteps.ts'
import { LocalStorageDailyStepsRepository } from './LocalStorageDailyStepsRepository.ts'

describe('LocalStorageDailyStepsRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存がなければ空', () => {
    expect(new LocalStorageDailyStepsRepository(localStorage).load()).toEqual([])
  })

  test('保存した歩数（反映日時を含む）を読み戻せる', () => {
    const at = new Date('2026-10-04T12:00:00Z')
    const record = DailySteps.reconstruct(
      memberId('taro'),
      parseLocalDate('2026-10-04'),
      8432,
      'iosShortcut',
      at,
    )
    new LocalStorageDailyStepsRepository(localStorage).save([record])
    const [loaded] = new LocalStorageDailyStepsRepository(localStorage).load()
    expect(loaded).toEqual(record)
    expect(loaded.reflectedAt).toEqual(at)
  })
})
