// デザインシステム「歩（ほ）」の tokens.json から、CSS 変数（昼・夜の2テーマ）と文字スタイルのクラスを作る。
// 使い方: npm run design:tokens（src/ui/design-system/tokens.json → tokens.css）
// tokens.json はデザインシステム（https://claude.ai/artifact/84sXxh4US9sshyPAgtgZCF）の project/tokens.json の写し。
import { readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('../src/ui/design-system/', import.meta.url)
const tokens = JSON.parse(readFileSync(new URL('tokens.json', dir), 'utf8'))
const [first, ...others] = tokens.color.themes.map((t) => t.id)

const colorOf = (t, theme) =>
  typeof t.value === 'string' ? t.value : (t.value[theme] ?? t.value[first])
const colors = (theme) => tokens.color.tokens.map((t) => `  --${t.name}: ${colorOf(t, theme)};`)

const lengths = []
for (const family of ['spacing', 'radius', 'border']) {
  for (const t of tokens[family]?.tokens ?? []) {
    const value = t.value === '0' ? '0px' : t.value
    lengths.push(`  --${t.name}: ${value}; /* ${t.usage} */`)
  }
}
for (const [name, value] of Object.entries(tokens.type.families))
  lengths.push(`  --font-${name}: ${value};`)

const styles = tokens.type.groups.flatMap((group) =>
  group.styles.map(
    (s) =>
      `/* ${s.usage} */\n.${s.name} {\n  font-family: var(--font-${s.family ?? group.family});\n  font-size: ${s.fontSize};\n  line-height: ${s.lineHeight};\n  font-weight: ${s.fontWeight};\n}`,
  ),
)

const css = [
  '/* このファイルは scripts/generate-design-tokens.mjs が tokens.json から作る。直接編集しない（npm run design:tokens）。 */',
  `:root,\n[data-theme='${first}'] {\n${colors(first).join('\n')}\n}`,
  ...others.map((theme) => `[data-theme='${theme}'] {\n${colors(theme).join('\n')}\n}`),
  `:root {\n${lengths.join('\n')}\n}`,
  ...styles,
].join('\n\n')

writeFileSync(new URL('tokens.css', dir), `${css}\n`)
console.log('src/ui/design-system/tokens.css を作りました')
