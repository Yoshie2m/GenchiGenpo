import { useState } from 'react'
import type { App } from '../composition.ts'
import type { MemberId } from '../publishedLanguage/memberId.ts'
import { formatDateTime } from './format.ts'
import { SettingsPage } from './pages/SettingsPage.tsx'
import type { Settings } from './settings.ts'

/** 開発用画面（PoC だけ）: メンバーの切り替え、日付を進める、ダミーの歩数を入れる、表示の設定。 */
export function DevPanel({
  app,
  memberId,
  onMemberChange,
  refresh,
  settings,
  onSettingsChange,
}: {
  app: App
  memberId: MemberId
  onMemberChange: (id: MemberId) => void
  refresh: () => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}) {
  const [name, setName] = useState('')
  const run = (action: () => void) => () => {
    action()
    refresh()
  }
  return (
    <details className="dev-panel">
      <summary>開発用（{formatDateTime(app.clock.now())}）</summary>
      <label className="block">
        メンバー{' '}
        <select value={memberId} onChange={(e) => onMemberChange(e.target.value as MemberId)}>
          {app.members.members().map((m) => (
            <option key={m.memberId} value={m.memberId}>
              {m.displayName}（登録 {m.registeredDate}）
            </option>
          ))}
        </select>
      </label>
      <div className="dev-actions">
        <button type="button" onClick={run(() => app.dev.advanceHours(1))}>
          1時間進める
        </button>
        <button type="button" onClick={run(() => app.dev.advanceDays(1))}>
          1日進める
        </button>
        <button type="button" onClick={run(() => app.dev.fillDemoStepsForToday(memberId))}>
          ほかのメンバーの今日の歩数を入れる
        </button>
        <button type="button" onClick={run(() => app.dev.resetClock())}>
          時計を元に戻す
        </button>
        <button
          type="button"
          onClick={run(() => {
            app.dev.clearAll()
            app.dev.seedDemoIfEmpty()
          })}
        >
          データを初期化する
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() === '') return
          const member = app.registerMember(name)
          setName('')
          onMemberChange(member.id)
          refresh()
        }}
      >
        <label>
          メンバーを登録（途中参加を試す）{' '}
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>{' '}
        <button type="submit">登録する</button>
      </form>
      <SettingsPage settings={settings} onChange={onSettingsChange} />
    </details>
  )
}
