import { memberId } from '../../publishedLanguage/memberId.ts'
import { fixedClock } from '../../shared/Clock.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { LocalStorageDailyStepsRepository } from '../infrastructure/LocalStorageDailyStepsRepository.ts'
import { StepRecordService } from './StepRecordService.ts'

const d = parseLocalDate
const member = (id: string, registered = '2026-10-01') => ({
  memberId: memberId(id),
  displayName: id,
  registeredDate: d(registered),
})

describe('StepRecordService.leaderboard（番付）', () => {
  test('今日の歩数・総歩数・平均歩数の上位を返す', async () => {
    localStorage.clear()
    const at = new Date('2026-10-03T12:00:00Z') // 日本時間 10/3 21:00
    const steps = new StepRecordService(
      new LocalStorageDailyStepsRepository(localStorage),
      fixedClock(at),
      () => {},
    )
    await steps.recordSteps(memberId('a'), d('2026-10-01'), 20000, 'manual')
    await steps.recordSteps(memberId('a'), d('2026-10-03'), 1000, 'manual')
    await steps.recordSteps(memberId('b'), d('2026-10-03'), 9000, 'manual')
    await steps.recordSteps(memberId('c'), d('2026-10-03'), 6000, 'manual')
    const board = await steps.leaderboard(
      [member('a'), member('b'), member('c', '2026-10-03'), member('x')],
      d('2026-10-03'),
    )
    // 今日の歩数は記録した人だけ
    expect(board.today.map((e) => [e.memberId, e.value])).toEqual([
      ['b', 9000],
      ['c', 6000],
      ['a', 1000],
    ])
    // 総歩数は全員（記録がなければ 0）
    expect(board.total.map((e) => [e.memberId, e.value])).toEqual([
      ['a', 21000],
      ['b', 9000],
      ['c', 6000],
      ['x', 0],
    ])
    // 平均歩数は昨日（10/2）まで: a は 10/1〜10/2 の2日で 20,000 歩、b・x は 0 歩。
    // c は今日（10/3）登録したので、昨日までに数える日がなく載せない
    expect(board.average.map((e) => [e.memberId, e.value])).toEqual([
      ['a', 10000],
      ['b', 0],
      ['x', 0],
    ])
  })
})
