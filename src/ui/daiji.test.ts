import { toDaiji, toDaijiDecimal } from './daiji.ts'

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

describe('toDaijiDecimal（小数第1位までの大字）', () => {
  test.each([
    [0, '零・零'],
    [0.5, '零・五'],
    [3.4, '参・四'], // 3.4 は浮動小数で 3.3999… になっても「四」にする
    [7.0, '七・零'],
    [12.3, '拾弍・参'],
    [10, '拾・零'],
    [29.9, '弍拾九・九'],
  ])('%f 日 → %s', (n, expected) => {
    expect(toDaijiDecimal(n)).toBe(expected)
  })
})
