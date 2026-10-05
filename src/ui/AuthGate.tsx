import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState, type FormEvent } from 'react'
import type { App as AppServices } from '../composition.ts'
import { memberId as toMemberId, type MemberId } from '../publishedLanguage/memberId.ts'
import App from './App.tsx'
import { errorMessage } from './pages/errorMessage.ts'

type MemberLookup = 'loading' | 'found' | 'notFound'

/**
 * 本番の認証フロー（マジックリンク＋招待制。ARCHITECTURE.md 4.4）。
 * ログイン → （初回だけ）表示名を入力してメンバー登録 → 本来の画面、の順に進む。
 */
export function AuthGate({ client, app }: { client: SupabaseClient; app: AppServices }) {
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [lookup, setLookup] = useState<MemberLookup>('loading')
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    client.auth.getSession().then(({ data }) => setSession(data.session))
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => subscription.unsubscribe()
  }, [client])

  useEffect(() => {
    if (session === 'loading' || session === null) return
    let active = true
    app.members.find(toMemberId(session.user.id)).then((found) => {
      if (active) setLookup(found ? 'found' : 'notFound')
    })
    return () => {
      active = false
    }
  }, [app, session, refreshToken])

  if (session === 'loading') return null
  if (session === null) return <SignInForm client={client} />
  if (lookup === 'loading') return null
  if (lookup === 'notFound') {
    return (
      <Onboarding
        app={app}
        memberId={toMemberId(session.user.id)}
        onDone={() => setRefreshToken((v) => v + 1)}
      />
    )
  }
  return (
    <App
      app={app}
      auth={{
        memberId: toMemberId(session.user.id),
        onSignOut: () => client.auth.signOut(),
      }}
    />
  )
}

function SignInForm({ client }: { client: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const { error } = await client.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="page stack" aria-live="polite">
        <p className="fs-title">メールを確認してください</p>
        <p>{email} 宛にログイン用のリンクを送りました。リンクを開くとログインできます。</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="page stack" aria-label="ログイン">
      <p className="fs-title">現地現歩にログイン</p>
      <label className="ho-field">
        <span className="ho-field__label">招待を受けたメールアドレス</span>
        <input
          className="ho-field__input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {message && <p role="alert">{message}</p>}
      <button type="submit" className="ho-btn ho-btn--primary">
        ログイン用のリンクを送る
      </button>
    </form>
  )
}

function Onboarding({
  app,
  memberId,
  onDone,
}: {
  app: AppServices
  memberId: MemberId
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await app.registerMemberWithId(memberId, name)
      onDone()
    } catch (err) {
      setMessage(errorMessage(err))
    }
  }

  return (
    <form onSubmit={submit} className="page stack" aria-label="はじめまして">
      <p className="fs-title">はじめまして</p>
      <label className="ho-field">
        <span className="ho-field__label">表示名</span>
        <input className="ho-field__input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {message && <p role="alert">{message}</p>}
      <button type="submit" className="ho-btn ho-btn--primary">
        登録する
      </button>
    </form>
  )
}
