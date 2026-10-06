import { useEffect } from 'react'
import type { App as AppServices } from '../composition.ts'
import { memberId as toMemberId } from '../publishedLanguage/memberId.ts'
import { UiContext } from './design-system/uiContext.ts'
import { logoUrl } from './design-system/assets.ts'
import { RankingPage } from './pages/RankingPage.tsx'
import { SpecialMissionPage } from './pages/SpecialMissionPage.tsx'
import { applyTheme, DEFAULT_SETTINGS } from './settings.ts'

/** サンプルページのアドレス（URL の # の後ろ）。 */
export const SAMPLE_HASH = '#sample'

/**
 * ログインできない人向けのサンプルページ。特命と番付を、ダミーの6人のデータで見せる。
 * ダミーのデータは、このページを開くたびに乱数で作り直す（本番のデータにはつながない）。
 * 見た目は昼・算用数字の併記で固定する。
 */
export function SamplePage({ app }: { app: AppServices }) {
  useEffect(() => applyTheme(false), [])
  const props = {
    app,
    // サンプルを見る人は、ダミーのメンバーのだれでもない。番付に「自分」の印が出ないよう、一覧にないIDにする
    memberId: toMemberId('sample-viewer'),
    refresh: () => {},
    version: 0,
    settings: DEFAULT_SETTINGS,
  }
  return (
    <UiContext.Provider value={{ night: false, showArabic: true }}>
      <div className="app">
        <header className="app__header">
          <img src={logoUrl(false)} alt="歩" className="app__logo" />
          <div>
            <h1 className="app__title">現地現歩</h1>
          </div>
        </header>
        <div className="page stack sample__notice" role="note">
          <p className="fs-title">サンプルです</p>
          <p className="fs-body">
            実際のデータではありません。名前も歩数も、このページを開くたびに作る架空のものです。
          </p>
          <p>
            <a href="#" className="ho-btn ho-btn--text">
              ログインへ戻る
            </a>
          </p>
        </div>
        <main className="app__main">
          <SpecialMissionPage {...props} />
          <RankingPage {...props} />
        </main>
      </div>
    </UiContext.Provider>
  )
}
