import { CandidateList } from '../domain/CandidateList.ts'
import { MISSION_CANDIDATES } from './missionCandidates.ts'

describe('ミッション候補（team-tokaido-mobility-map.md から作ったデータ）', () => {
  test('9つの目的地が、浜名屋を一番上にして並ぶ', () => {
    const list = CandidateList.of(MISSION_CANDIDATES)
    expect(list.candidates.map((c) => c.destination.kanji)).toEqual([
      '浜木',
      '織豊',
      '伊鈴',
      '星昴',
      '陽野',
      '夢本',
      '魂松',
      '絆豊',
      '九豊',
    ])
    expect(list.top.destination.name).toBe('遠州・浜名屋')
  })

  test('目標歩数・期間・中間地点の数が一覧のとおり', () => {
    expect(
      MISSION_CANDIDATES.map((c) => [c.targetSteps, c.periodDays, c.waypoints.length]),
    ).toEqual([
      [114_000, 11, 2],
      [305_000, 29, 6],
      [388_000, 37, 8],
      [465_000, 44, 9],
      [569_000, 54, 12],
      [632_000, 60, 13],
      [653_000, 62, 14],
      [916_000, 86, 19],
      [1_027_000, 97, 22],
    ])
  })

  test('中間地点は増えていき、目標歩数より手前にある', () => {
    for (const c of MISSION_CANDIDATES) {
      const steps = c.waypoints.map((w) => w.progressSteps)
      expect(
        [...steps].sort((a, b) => a - b),
        c.candidateId,
      ).toEqual(steps)
      expect(new Set(steps).size, c.candidateId).toBe(steps.length)
      expect(Math.max(...steps), c.candidateId).toBeLessThan(c.targetSteps)
    }
  })

  test('配点は1位が2位の2倍（3位は0歩）', () => {
    for (const c of MISSION_CANDIDATES) {
      for (const w of c.waypoints) expect(w.points.first, c.candidateId).toBe(w.points.second * 2)
    }
  })

  test('会社名を含まない（言い換えた名前と旧国名だけ）', () => {
    const text = JSON.stringify(MISSION_CANDIDATES)
    for (const company of ['スズキ', 'トヨタ', 'いすゞ', 'スバル', '日野', 'ホンダ', 'マツダ']) {
      expect(text).not.toContain(company)
    }
  })
})
