import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { createApp } from '../composition.ts'
import { fixedClock } from '../shared/Clock.ts'
import { AuthGate } from './AuthGate.tsx'

/** AuthGate が使う auth.* だけを持つ最小限のフェイク。 */
function fakeClient(session: Session | null): SupabaseClient {
  return {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
    },
  } as unknown as SupabaseClient
}

function setupApp() {
  localStorage.clear()
  return createApp({
    storage: localStorage,
    baseClock: fixedClock(new Date('2026-10-04T03:00:00Z')),
  })
}

describe('AuthGate', () => {
  test('未ログインなら、読み込み中を経てログイン画面を表示する（止まったまま残らない）', async () => {
    render(<AuthGate client={fakeClient(null)} app={setupApp()} />)
    expect(await screen.findByText('現地現歩にログイン')).toBeInTheDocument()
    expect(screen.getByLabelText('招待を受けたメールアドレス')).toBeInTheDocument()
  })

  test('ログイン済みでメンバー未登録なら、初回登録画面を表示する', async () => {
    const session = { user: { id: 'auth-user-1' } } as Session
    render(<AuthGate client={fakeClient(session)} app={setupApp()} />)
    expect(await screen.findByText('はじめまして')).toBeInTheDocument()
  })

  test('ログイン済みでメンバー登録済みなら、本来の画面を表示する', async () => {
    const session = { user: { id: 'auth-user-1' } } as Session
    const app = setupApp()
    await app.registerMemberWithId('auth-user-1', '認証太郎')
    render(<AuthGate client={fakeClient(session)} app={app} />)
    expect(await screen.findByRole('heading', { level: 1, name: '現地現歩' })).toBeInTheDocument()
    expect(screen.getByText('ログアウト')).toBeInTheDocument()
  })
})
