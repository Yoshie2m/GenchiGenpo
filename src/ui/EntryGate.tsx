import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import type { App as AppServices } from '../composition.ts'
import { AuthGate } from './AuthGate.tsx'
import { SAMPLE_HASH, SamplePage } from './SamplePage.tsx'

/**
 * 入り口。アドレスの # が「サンプル」のときだけ、ログインなしで見られるサンプルページを出す。
 * サンプルは本番のデータにつながない別のアプリ（createSample が作る）で動かし、
 * それ以外は今までどおりログイン（AuthGate）に進む。
 */
export function EntryGate({
  client,
  app,
  createSample,
}: {
  client: SupabaseClient
  app: AppServices
  createSample: () => Promise<AppServices>
}) {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  if (hash === SAMPLE_HASH) return <Sample createSample={createSample} />
  return <AuthGate client={client} app={app} />
}

function Sample({ createSample }: { createSample: () => Promise<AppServices> }) {
  const [sample, setSample] = useState<AppServices | null>(null)
  useEffect(() => {
    let active = true
    createSample().then((created) => {
      if (active) setSample(created)
    })
    return () => {
      active = false
    }
  }, [createSample])
  if (sample === null) return null
  return <SamplePage app={sample} />
}
