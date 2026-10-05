import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from './composition.ts'
import { createSupabaseClient } from './shared/supabaseClient.ts'
import './ui/design-system/index.ts'
import App from './ui/App.tsx'
import { AuthGate } from './ui/AuthGate.tsx'
import './ui/App.css'

const root = createRoot(document.getElementById('root')!)

// VITE_SUPABASE_URL があれば本番の認証フロー（Supabase）、なければ PoC（localStorage・
// 開発用画面でのメンバー切り替え）。ARCHITECTURE.md「接続情報の管理」「招待制の運用」。
if (import.meta.env.VITE_SUPABASE_URL) {
  const client = createSupabaseClient()
  const app = createApp({ supabase: client })
  root.render(
    <StrictMode>
      <AuthGate client={client} app={app} />
    </StrictMode>,
  )
} else {
  const app = createApp()
  // PoC: 初めて開いたときは、ダミーメンバー10人とその歩数を入れる
  app.dev.seedDemoIfEmpty()
  app.team.tick()
  root.render(
    <StrictMode>
      <App app={app} />
    </StrictMode>,
  )
}
