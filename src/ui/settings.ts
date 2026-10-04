/** 画面の設定（この端末だけのもの）。localStorage が使えなくても初期値で動く。 */
export type ThemeSetting = 'os' | 'light' | 'night'

export interface Settings {
  readonly theme: ThemeSetting
  /** 大字の下に算用数字を併記する（初期値はオフ）。 */
  readonly showArabic: boolean
}

const KEY = 'genchigenpo:uiSettings'
export const DEFAULT_SETTINGS: Settings = { theme: 'os', showArabic: false }

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
      : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // 保存できなくても、今の画面には反映する
  }
}

/** 昼・夜のテーマを画面に当てる（OS に合わせるときは OS の設定を見る）。 */
export function applyTheme(theme: ThemeSetting): void {
  const night =
    theme === 'night' ||
    (theme === 'os' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = night ? 'night' : 'light'
}
