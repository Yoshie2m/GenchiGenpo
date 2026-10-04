import { toDaiji } from './daiji.ts'

describe('toDaiji（大字の位取り表記）', () => {
  test.each([
    [0, '零'],
    [7, '七'],
    [12, '拾弍'],
    [305, '参百五'],
    [8432, '八千四百参拾弍'],
    [10000, '壱萬'],
    [12500, '壱萬弍千五百'],
    [461000, '四拾六萬千'], // 千の前の壱は省く
    [1027000, '百弍萬七千'],
  ])('%i 歩 → %s', (n, expected) => {
    expect(toDaiji(n)).toBe(expected)
  })

  test('0.5 歩の端数は切り捨てて表す（評価歩数の表示）', () => {
    expect(toDaiji(10000.5)).toBe('壱萬')
  })
})
