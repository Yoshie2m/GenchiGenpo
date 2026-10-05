import { useEffect, useState } from 'react'
import type { App as AppServices } from '../composition.ts'
import type { MemberId } from '../publishedLanguage/memberId.ts'
import { DevPanel } from './DevPanel.tsx'
import { logoUrl } from './design-system/assets.ts'
import { Icon, type IconName } from './design-system/components.tsx'
import { UiContext } from './design-system/uiContext.ts'
import { JourneyPage } from './pages/JourneyPage.tsx'
import { RankingPage } from './pages/RankingPage.tsx'
import { RecordPage } from './pages/RecordPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { TeamPage } from './pages/TeamPage.tsx'
import { TodayPage } from './pages/TodayPage.tsx'
import { applyTheme, isNight, loadSettings, saveSettings, type Settings } from './settings.ts'
import { useAsyncData } from './useAsyncData.ts'

/** 本番の認証フロー（Supabase）で使う。渡したときは、開発用のメンバー切り替えのかわりにこれを使う。 */
export interface AuthSession {
  readonly memberId: MemberId
  readonly onSignOut: () => void
}

const TABS: readonly { id: TabId; label: string; icon: IconName }[] = [
  { id: 'today', label: '今日', icon: 'ho' },
  { id: 'record', label: '記録', icon: 'ki' },
  { id: 'journey', label: '道中', icon: 'michi' },
  { id: 'team', label: '隊', icon: 'tai' },
  { id: 'ranking', label: '番付', icon: 'banzuke' },
]
type TabId = 'today' | 'record' | 'journey' | 'team' | 'ranking'

/** コンセプト文（デザインシステム「アプリ名とコンセプト」。言い換えずにそのまま使う）。どのタブでも上部に出す。 */
export const CONCEPT =
  '「画面を見るな、現場へ走れ。」足で稼ぐビジネスパーソンのための、現地現物ライフログ。'

const MEMBER_KEY = 'genchigenpo:devCurrentMember'

async function initialMember(app: AppServices): Promise<MemberId> {
  const members = await app.members.members()
  let saved: string | null = null
  try {
    saved = localStorage.getItem(MEMBER_KEY)
  } catch {
    // 保存できない環境では最初のメンバー
  }
  return (members.find((m) => m.memberId === saved) ?? members[0]).memberId
}

/** PoC の画面の骨組み: 下部の5タブ（今日 / 記録 / 道中 / 隊 / 番付）と開発用画面（表示の設定もここ）。 */
function tabFromHash(): TabId {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? (id as TabId) : 'today'
}

export default function App({ app, auth }: { app: AppServices; auth?: AuthSession }) {
  const [tab, setTabState] = useState<TabId>(tabFromHash)
  const [memberId, setMemberId] = useState<MemberId | null>(auth?.memberId ?? null)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [version, setVersion] = useState(0)
  const refresh = () => setVersion((v) => v + 1)
  const night = isNight(settings.theme)

  useEffect(() => applyTheme(night), [night])

  // 本番の認証フローのときは auth.memberId を使うので、開発用の決め方はしない。
  useEffect(() => {
    if (auth) return
    let active = true
    initialMember(app).then((id) => {
      if (active) setMemberId(id)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 開いているタブを URL の # に合わせる（戻るボタンで前のタブに戻れる）
  useEffect(() => {
    const onChange = () => setTabState(tabFromHash())
    window.addEventListener('hashchange', onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      window.removeEventListener('hashchange', onChange)
      window.removeEventListener('popstate', onChange)
    }
  }, [])

  function setTab(id: TabId) {
    setTabState(id)
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  }

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

  const meState = useAsyncData(
    () => (memberId === null ? Promise.resolve(undefined) : app.members.find(memberId)),
    [app, memberId, version],
  )
  const me = meState.status === 'ready' ? meState.data : undefined

  if (memberId === null) return null

  const props = { app, memberId, refresh, version, settings }

  return (
    <UiContext.Provider value={{ night, showArabic: settings.showArabic }}>
      <div className="app">
        <header className="app__header">
          <img src={logoUrl(night)} alt="歩" className="app__logo" />
          <div>
            <h1 className="app__title">現地現歩</h1>
            <p className="fs-caption">
              {me?.displayName}さん
              {auth && (
                <>
                  {' '}
                  <button type="button" className="ho-btn ho-btn--text" onClick={auth.onSignOut}>
                    ログアウト
                  </button>
                </>
              )}
            </p>
          </div>
          <p className="app__concept">{CONCEPT}</p>
        </header>
        {auth ? (
          <SettingsPage settings={settings} onChange={changeSettings} />
        ) : (
          <DevPanel
            app={app}
            memberId={memberId}
            onMemberChange={changeMember}
            refresh={refresh}
            version={version}
            settings={settings}
            onSettingsChange={changeSettings}
          />
        )}
        <main className="app__main">
          {tab === 'today' && <TodayPage {...props} />}
          {tab === 'record' && <RecordPage {...props} />}
          {tab === 'journey' && <JourneyPage {...props} />}
          {tab === 'team' && <TeamPage {...props} />}
          {tab === 'ranking' && <RankingPage {...props} />}
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
              <Icon name={t.icon} />
              <span className="ho-tab__label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </UiContext.Provider>
  )
}
