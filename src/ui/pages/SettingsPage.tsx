import type { Settings, ThemeSetting } from '../settings.ts'

const THEMES: { value: ThemeSetting; label: string }[] = [
  { value: 'light', label: '昼（和紙）' },
  { value: 'night', label: '夜（藍染の夜）' },
  { value: 'os', label: '端末の設定に合わせる' },
]

/** 設定: 昼・夜の切り替え、算用数字の併記。 */
export function SettingsPage({
  settings,
  onChange,
}: {
  settings: Settings
  onChange: (settings: Settings) => void
}) {
  return (
    <section aria-labelledby="settings-title" className="page stack">
      <h2 id="settings-title" className="fs-title">
        設定
      </h2>
      <fieldset className="settings__group">
        <legend className="fs-h2">画面の色</legend>
        {THEMES.map((t) => (
          <label key={t.value} className="block">
            <input
              type="radio"
              name="theme"
              value={t.value}
              checked={settings.theme === t.value}
              onChange={() => onChange({ ...settings, theme: t.value })}
            />{' '}
            {t.label}
          </label>
        ))}
      </fieldset>
      <label className="block">
        <input
          type="checkbox"
          checked={settings.showArabic}
          onChange={(e) => onChange({ ...settings, showArabic: e.target.checked })}
        />{' '}
        大字の下に算用数字を併記する
      </label>
    </section>
  )
}
