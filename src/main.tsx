import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from './composition.ts'
import App from './ui/App.tsx'
import './ui/App.css'

const app = createApp()
// PoC: 初めて開いたときは、ダミーメンバー10人とその歩数を入れる
app.dev.seedDemoIfEmpty()
app.team.tick()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App app={app} />
  </StrictMode>,
)
