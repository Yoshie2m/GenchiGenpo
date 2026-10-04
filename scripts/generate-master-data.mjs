// hq-to-shintora-route.md と team-tokaido-mobility-map.md から、PoC で使うデータ（TypeScript）を作る。
// md が正。データを直したいときは md を直してから `npm run master-data` を実行する。
// CI は、作り直した結果がコミット済みのファイルと一致するかを確かめる。
import { readFileSync, writeFileSync } from 'node:fs'
import * as prettier from 'prettier'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const num = (s) => Number(s.replaceAll(',', ''))

function fail(message) {
  throw new Error(`マスターデータを作れません: ${message}`)
}

// ---- 個人ミッション: 東海道五十三次ルート（本社 → 新虎オフィス） ----

function parseRoute(md) {
  const rows = [
    ...md.matchAll(/^\| (\d+) \| (.+?) \| (.+?国) \| [\d.]+ \| [\d.]+ \| ([\d,]+) \| .* \|$/gm),
  ]
  const memos = new Map()
  for (const m of md.matchAll(/^### (\d+)\. .+\n((?:.+\n?)+)/gm)) {
    memos.set(Number(m[1]), m[2].trim())
  }
  const checkpoints = rows.map(([, index, name, province, steps]) => {
    const memo = memos.get(Number(index))
    if (!memo) fail(`通過点 ${index}（${name}）の一口メモがありません`)
    return { name, kind: kindOf(name), province, cumulativeSteps: num(steps), memo }
  })
  if (checkpoints.length !== 43) fail(`通過点が 43 ではありません: ${checkpoints.length}`)
  return { name: '東海道五十三次ルート（本社 → 新虎オフィス）', checkpoints }
}

function kindOf(name) {
  if (name === '本社' || name.includes('オフィス')) return 'office'
  if (name.endsWith('峠')) return 'pass'
  if (name.endsWith('宿') || name.includes('宿（')) return 'postTown'
  return 'waypoint'
}

// ---- チームミッション: ミッション候補（目的地 9 か所） ----

function parseCandidates(md) {
  const destinations = [
    ...md.matchAll(
      /^- \[ \] 【(.+?)】 \*\*(\d)\. (.+?)\*\*\n {2}- \*\*所在地\*\*: (.+)\n {2}- \*\*刈谷からの距離\*\*: 約 [\d,]+ km（約 ([\d,]+) 歩）.*\n {2}- \*\*メモ\*\*: (.+?) 代表漢字「.+?」の読み: \*\*(.+?)\*\*$/gm,
    ),
  ]
  const summary = new Map(
    [
      ...md.matchAll(
        /^\| (\d) \| .+? \| [\d,]+歩 \| .+? \| (\d+) \| .+? \| ([\d,]+) \/ ([\d,]+) \/ 0歩 \| .+ \|$/gm,
      ),
    ].map(([, no, count, first, second]) => [
      no,
      { count: Number(count), first: num(first), second: num(second) },
    ]),
  )
  const periods = new Map(
    [...md.matchAll(/^\| (\d) \| .+? \| [\d,]+歩 \| .+? \| \*\*(\d+)日\*\* \|$/gm)].map(
      ([, no, days]) => [no, Number(days)],
    ),
  )
  const waypointRows = new Map(
    [...md.matchAll(/^\| (\d) \| .+? \| (\d[\d,]*（.*) \|$/gm)].map(([, no, cell]) => [no, cell]),
  )
  const candidates = destinations.map(([, kanji, no, name, province, target, memo, reading]) => {
    const s = summary.get(no)
    const periodDays = periods.get(no)
    const cell = waypointRows.get(no)
    if (!s || !periodDays || !cell) fail(`目的地 ${no}（${name}）の設定が足りません`)
    const waypoints = cell.split('→').map((part) => {
      const m = /^\s*([\d,]+)（(.*)）\s*$/.exec(part)
      if (!m) fail(`目的地 ${no} の中間地点を読めません: ${part}`)
      return { name: m[2], progressSteps: num(m[1]), points: { first: s.first, second: s.second } }
    })
    if (waypoints.length !== s.count) fail(`目的地 ${no} の中間地点の数が一覧と合いません`)
    return {
      candidateId: reading.toLowerCase(),
      destination: { name, kanji, reading, province, memo },
      targetSteps: num(target),
      periodDays,
      waypoints,
    }
  })
  if (candidates.length !== 9) fail(`目的地が 9 ではありません: ${candidates.length}`)
  return candidates
}

// ---- 書き出し ----

const HEADER = (source) =>
  `// このファイルは scripts/generate-master-data.mjs が ${source} から作る。直接編集しない（npm run master-data）。\n`

async function write(path, source, body) {
  const text = await prettier.format(HEADER(source) + body, {
    ...(await prettier.resolveConfig(new URL(path, root).pathname)),
    parser: 'typescript',
  })
  writeFileSync(new URL(path, root), text)
}

const route = parseRoute(read('hq-to-shintora-route.md'))
await write(
  'src/personalMission/masterData/tokaidoRoute.ts',
  'hq-to-shintora-route.md',
  `import type { Route } from '../domain/Route.ts'\n\nexport const TOKAIDO_ROUTE: Route = ${JSON.stringify(route, null, 2)}\n`,
)

const candidates = parseCandidates(read('team-tokaido-mobility-map.md'))
await write(
  'src/missionCandidate/masterData/missionCandidates.ts',
  'team-tokaido-mobility-map.md',
  `import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'\n\n/** ミッション候補の一覧（並び順が自動確定の優先順）。 */\nexport const MISSION_CANDIDATES: readonly MissionPlan[] = ${JSON.stringify(candidates, null, 2)}\n`,
)

console.log(
  `通過点 ${route.checkpoints.length} か所、ミッション候補 ${candidates.length} 件を書き出しました`,
)
