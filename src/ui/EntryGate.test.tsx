import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { createApp } from '../composition.ts'
import { createSampleApp } from '../sampleApp.ts'
import { fixedClock } from '../shared/Clock.ts'
import { EntryGate } from './EntryGate.tsx'

/** 認証だけを持つフェイク。from（DBの読み書き）を呼んだら失敗にして、DBに触れないことを確かめる。 */
function fakeClient(session: Session | null) {
  const getSession = vi.fn(async () => ({ data: { session }, error: null }))
  const from = vi.fn(() => {
    throw new Error('DB に触れてはいけない')
  })
  const client = {
    auth: {
      getSession,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
    },
    from,
  } as unknown as SupabaseClient
  return { client, getSession, from }
}

function setup(hash: string) {
  localStorage.clear()
  window.history.replaceState(null, '', `/${hash}`)
  const { client, getSession, from } = fakeClient(null)
  const app = createApp({
    storage: localStorage,
    baseClock: fixedClock(new Date('2026-10-06T03:00:00Z')),
  })
  const createSample = vi.fn(() => createSampleApp())
  render(<EntryGate client={client} app={app} createSample={createSample} />)
  return { getSession, from, createSample }
}

describe('EntryGate（サンプルページ）', () => {
  test('ログイン画面に「まずはここから確認」のリンクがあり、サンプルのアドレスを指す', async () => {
    setup('')
    const link = await screen.findByRole('link', { name: 'まずはここから確認' })
    expect(link).toHaveAttribute('href', '#sample')
  })

  test('サンプルのアドレスでは、ログインなしで特命と番付のサンプルを見せる', async () => {
    const { getSession, from } = setup('#sample')
    expect(await screen.findByText('サンプルです')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '特命' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '番付' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'ログインへ戻る' })).toHaveAttribute('href', '#')
    // ログイン画面は出ない・認証にも問い合わせない
    expect(screen.queryByRole('form', { name: 'ログイン' })).not.toBeInTheDocument()
    expect(getSession).not.toHaveBeenCalled()
    // 本番のDBには触れない・ブラウザの保存データにも書かない
    expect(from).not.toHaveBeenCalled()
    expect(localStorage.length).toBe(0)
  })

  test('サンプルの番付に、カタカナのダミーメンバーの名前が出る', async () => {
    setup('#sample')
    await screen.findByRole('heading', { name: '番付' })
    const names = await screen.findAllByText(
      /^(サトウ|スズキ|タカハシ|タナカ|イトウ|ワタナベ|ヤマモト|ナカムラ|コバヤシ|カトウ|ヨシダ|ヤマダ|ササキ|ヤマグチ|マツモト|イノウエ)/,
    )
    expect(names.length).toBeGreaterThan(0)
    // 見ている人はダミーのだれでもないので、「自分」の印は出ない
    expect(screen.queryByText(/（自分）/)).not.toBeInTheDocument()
  })
})
