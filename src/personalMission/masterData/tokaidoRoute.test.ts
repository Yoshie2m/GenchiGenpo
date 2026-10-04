import { assertValidRoute } from '../domain/Route.ts'
import { TOKAIDO_ROUTE } from './tokaidoRoute.ts'

const cps = TOKAIDO_ROUTE.checkpoints

describe('東海道五十三次ルート（hq-to-shintora-route.md から作ったデータ）', () => {
  test('通過点は43か所で、累計歩数は増えていく', () => {
    expect(cps).toHaveLength(43)
    expect(() => assertValidRoute(TOKAIDO_ROUTE)).not.toThrow()
  })

  test('本社（0歩）から新虎オフィス（461,000歩）まで', () => {
    expect(cps[0]).toMatchObject({ name: '本社', kind: 'office', cumulativeSteps: 0 })
    expect(cps.at(-1)).toMatchObject({
      name: '新虎オフィス',
      kind: 'office',
      cumulativeSteps: 461_000,
    })
  })

  test('峠と経過地を見分ける', () => {
    expect(cps.find((c) => c.name === '宇津ノ谷峠')?.kind).toBe('pass')
    expect(cps.find((c) => c.name === '高輪・三田・芝')?.kind).toBe('waypoint')
    expect(cps.filter((c) => c.kind === 'postTown')).toHaveLength(39)
  })

  test('通る国はデザインシステムの景色がある6国', () => {
    expect([...new Set(cps.map((c) => c.province))]).toEqual([
      '三河国',
      '遠江国',
      '駿河国',
      '伊豆国',
      '相模国',
      '武蔵国',
    ])
  })

  test('一口メモはどの通過点も3〜5行', () => {
    for (const c of cps) {
      const lines = c.memo.split('\n').length
      expect(lines, c.name).toBeGreaterThanOrEqual(3)
      expect(lines, c.name).toBeLessThanOrEqual(5)
    }
  })
})
