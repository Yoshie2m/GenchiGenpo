import { useEffect, useState } from 'react'
import type { App as AppServices } from '../composition.ts'
import type { MemberId } from '../publishedLanguage/memberId.ts'
import { DevPanel } from './DevPanel.tsx'
import { JourneyPage } from './pages/JourneyPage.tsx'
import { RecordPage } from './pages/RecordPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { TeamPage } from './pages/TeamPage.tsx'
import { TodayPage } from './pages/TodayPage.tsx'
import { applyTheme, loadSettings, saveSettings, type Settings } from './settings.ts'

const TABS = [
  { id: 'today', label: '今日' },
  { id: 'record', label: '記録' },
  { id: 'journey', label: '道中' },
  { id: 'team', label: '隊' },
  { id: 'settings', label: '設定' },
] as const
type TabId = (typeof TABS)[number]['id']

const MEMBER_KEY = 'genchigenpo:devCurrentMember'

function initialMember(app: AppServices): MemberId {
  const members = app.members.members()
  let saved: string | null = null
  try {
    saved = localStorage.getItem(MEMBER_KEY)
  } catch {
    // 保存できない環境では最初のメンバー
  }
  return (members.find((m) => m.memberId === saved) ?? members[0]).memberId
}

/** PoC の画面の骨組み: 下部の5タブ（今日 / 記録 / 道中 / 隊 / 設定）と開発用画面。 */
export default function App({ app }: { app: AppServices }) {
  const [tab, setTab] = useState<TabId>('today')
  const [memberId, setMemberId] = useState<MemberId>(() => initialMember(app))
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)

  useEffect(() => applyTheme(settings.theme), [settings.theme])

  function changeMember(id: MemberId) {
    setMemberId(id)
    try {
      localStorage.setItem(MEMBER_KEY, id)
    } catch {
      // 保存できなくても、今の画面では切り替える
    }
  }

  function changeSettings(next: Settings) {
    setSettings(next)
    saveSettings(next)
  }

  const me = app.members.find(memberId)
  const props = { app, memberId, refresh, settings }

  return (
    <div className="app">
      <header className="app__header">
        <h1>現地現物</h1>
        <p className="ho-field__label">{me?.displayName}さん</p>
        <DevPanel app={app} memberId={memberId} onMemberChange={changeMember} refresh={refresh} />
      </header>
      <main className="app__main">
        {tab === 'today' && <TodayPage {...props} />}
        {tab === 'record' && <RecordPage {...props} />}
        {tab === 'journey' && <JourneyPage {...props} />}
        {tab === 'team' && <TeamPage {...props} />}
        {tab === 'settings' && <SettingsPage settings={settings} onChange={changeSettings} />}
      </main>
      <nav className="ho-tabbar app__tabs" aria-label="主要">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ho-tab"
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="ho-tab__label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
