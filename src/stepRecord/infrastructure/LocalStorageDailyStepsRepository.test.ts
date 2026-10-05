import { memberId } from '../../publishedLanguage/memberId.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { DailySteps } from '../domain/DailySteps.ts'
import { LocalStorageDailyStepsRepository } from './LocalStorageDailyStepsRepository.ts'

describe('LocalStorageDailyStepsRepository', () => {
  beforeEach(() => localStorage.clear())

  test('保存がなければ null・空', async () => {
    const repository = new LocalStorageDailyStepsRepository(localStorage)
    expect(await repository.findOne(memberId('taro'), parseLocalDate('2026-10-04'))).toBeNull()
    expect(await repository.findByMember(memberId('taro'))).toEqual([])
    expect(await repository.findByDate(parseLocalDate('2026-10-04'))).toEqual([])
  })

  test('保存した歩数（反映日時を含む）を読み戻せる', async () => {
    const at = new Date('2026-10-04T12:00:00Z')
    const record = DailySteps.reconstruct(
      memberId('taro'),
      parseLocalDate('2026-10-04'),
      8432,
      'iosShortcut',
      at,
    )
    const repository = new LocalStorageDailyStepsRepository(localStorage)
    await repository.save(record, true)
    const loaded = await repository.findOne(memberId('taro'), parseLocalDate('2026-10-04'))
    expect(loaded).toEqual(record)
    expect(loaded!.reflectedAt).toEqual(at)
    expect(await repository.findByMember(memberId('taro'))).toEqual([record])
    expect(await repository.findByDate(parseLocalDate('2026-10-04'))).toEqual([record])
  })

  test('guard が true のときは、今より小さい値では上書きしない', async () => {
    const repository = new LocalStorageDailyStepsRepository(localStorage)
    const taro = memberId('taro')
    const date = parseLocalDate('2026-10-04')
    await repository.save(DailySteps.reconstruct(taro, date, 8000, 'manual', new Date()), true)
    await repository.save(DailySteps.reconstruct(taro, date, 5000, 'manual', new Date()), true)
    expect((await repository.findOne(taro, date))!.steps).toBe(8000)
  })

  test('guard が false のときは、今より小さい値でも上書きする（誤入力の修正）', async () => {
    const repository = new LocalStorageDailyStepsRepository(localStorage)
    const taro = memberId('taro')
    const date = parseLocalDate('2026-10-04')
    await repository.save(DailySteps.reconstruct(taro, date, 8000, 'manual', new Date()), true)
    await repository.save(DailySteps.reconstruct(taro, date, 5000, 'manual', new Date()), false)
    expect((await repository.findOne(taro, date))!.steps).toBe(5000)
  })

  test('findByMember に range を渡すと、その期間だけに絞られる', async () => {
    const repository = new LocalStorageDailyStepsRepository(localStorage)
    const taro = memberId('taro')
    await repository.save(
      DailySteps.reconstruct(taro, parseLocalDate('2026-10-01'), 1000, 'manual', new Date()),
      true,
    )
    await repository.save(
      DailySteps.reconstruct(taro, parseLocalDate('2026-10-05'), 2000, 'manual', new Date()),
      true,
    )
    const records = await repository.findByMember(taro, {
      from: parseLocalDate('2026-10-03'),
      until: parseLocalDate('2026-10-10'),
    })
    expect(records.map((r) => r.date)).toEqual(['2026-10-05'])
  })
})
