import missingDaySample from '../../../../tests/fixtures/step-calendar-sample-missing-day.ocr.json'
import sample from '../../../../tests/fixtures/step-calendar-sample.ocr.json'
import { parseStepCalendar, toStepReadings, type OcrWord } from './parseStepCalendar.ts'

/** tests/fixtures/step-calendar-sample.png を Tesseract.js で読み取った結果(画面全体の語)。 */
const sampleWords: OcrWord[] = sample.words

/**
 * tests/fixtures/step-calendar-sample-missing-day.png を Tesseract.js で読み取った結果。
 * 10月4日のマスの日付の数字だけをOCRが読み落としている、実際に起きた例(同じ行のほかの日付から
 * 推測して歩数を対応づける機能の回帰テスト)。
 */
const missingDayWords: OcrWord[] = missingDaySample.words

const EXPECTED_SEPTEMBER_2026: Record<number, number | null> = {
  1: null,
  2: null,
  3: null,
  4: 13_186,
  5: 5_917,
  6: 15_081,
  7: 12_398,
  8: 11_180,
  9: 11_134,
  10: 11_671,
  11: 16_182,
  12: 7_259,
  13: 13_796,
  14: 14_780,
  15: 9_956,
  16: 15_515,
  17: 13_667,
  18: 12_830,
  19: 10,
  20: null,
  21: null,
  22: null,
  23: null,
  24: null,
  25: null,
  26: null,
  27: null,
  28: null,
  29: null,
  30: null,
}

describe('parseStepCalendar(サンプル画面)', () => {
  const result = parseStepCalendar(sampleWords)
  if (!result.ok) throw new Error(result.error)
  const { calendar } = result

  it('年月を読み取る', () => {
    expect(calendar).toMatchObject({ year: 2026, month: 9, warnings: [] })
  })

  it('1〜30日の日付と歩数を対応づける(空欄は null)', () => {
    expect(Object.fromEntries(calendar.days.map((d) => [d.day, d.steps]))).toEqual(
      EXPECTED_SEPTEMBER_2026,
    )
  })

  it('歩数のある日だけを取り込み用の読み取り結果にする', () => {
    const readings = toStepReadings(calendar)
    expect(readings).toHaveLength(16)
    expect(readings[0]).toEqual({ date: '2026-09-04', steps: 13_186 })
    expect(readings.at(-1)).toEqual({ date: '2026-09-19', steps: 10 })
  })
})

describe('parseStepCalendar(日付の数字が1つ読み取れなかったサンプル画面)', () => {
  const result = parseStepCalendar(missingDayWords)
  if (!result.ok) throw new Error(result.error)
  const { calendar } = result

  it('年月を読み取り、警告なしで10月4日の歩数も対応づける', () => {
    expect(calendar).toMatchObject({ year: 2026, month: 10, warnings: [] })
    expect(toStepReadings(calendar)).toEqual([
      { date: '2026-10-01', steps: 13_038 },
      { date: '2026-10-02', steps: 14_420 },
      { date: '2026-10-03', steps: 12_112 },
      { date: '2026-10-04', steps: 8_266 },
    ])
  })
})

describe('parseStepCalendar(読み取れない場合)', () => {
  const word = (text: string, x0: number, y0: number): OcrWord => ({
    text,
    bbox: { x0, y0, x1: x0 + 30, y1: y0 + 20 },
  })

  it('年月がなければエラー', () => {
    expect(parseStepCalendar([word('SUN', 0, 0), word('SAT', 600, 0)])).toEqual({
      ok: false,
      error: expect.stringContaining('年月'),
    })
  })

  it('曜日の見出しがなければエラー', () => {
    expect(parseStepCalendar([word('2026/09', 0, 0)])).toEqual({
      ok: false,
      error: expect.stringContaining('曜日'),
    })
  })

  it('曜日の見出しが一部しか読めなくても、残りの列を補う', () => {
    const words = [
      word('2026/09', 0, 0),
      word('SUN', 35, 100),
      word('SAT', 935, 100),
      word('1', 280, 150), // TUE 列(中心 350、左端 275)の左寄せ
      word('8,000', 340, 200),
    ]
    const result = parseStepCalendar(words)
    expect(result.ok && result.calendar.days.find((d) => d.day === 1)).toEqual({
      day: 1,
      steps: 8_000,
    })
  })

  it('同じ行で日付の数字を1つ読み取れなくても、ほかの日付から推測して歩数を対応づける', () => {
    const words = [
      word('2026/09', 0, 0),
      word('SUN', 35, 100),
      word('SAT', 935, 100),
      word('1', -20, 150), // SUN 列(中心 50、左端 -25)の左寄せ
      word('3', 275, 150), // TUE 列(中心 350、左端 275)の左寄せ。MON 列の「2」は読み取れなかった想定
      word('9,500', 185, 200), // MON 列(中心 200、左端 125)の歩数
    ]
    const result = parseStepCalendar(words)
    expect(result.ok && result.calendar.days.find((d) => d.day === 2)).toEqual({
      day: 2,
      steps: 9_500,
    })
  })

  it('曜日の並びが年月と合わなければ警告する', () => {
    const words = [
      word('2026/09', 0, 0),
      word('SUN', 35, 100),
      word('SAT', 935, 100),
      word('1', 0, 150), // 2026/09/01 は火曜だが、日曜の列(左端 -25)にある
    ]
    const result = parseStepCalendar(words)
    expect(result.ok && result.calendar.warnings).toEqual([expect.stringContaining('曜日の並び')])
  })
})
