/// <reference types="node" />
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * 結合テスト用（`*.integration.test.ts`、`npm run test:integration`）。
 * ローカルSupabase CLI（`supabase start`）に実際に接続する（ARCHITECTURE.md「テストの方針」）。
 * 既定値は `supabase start` が毎回同じ値で表示する、ローカル専用の固定のデモ値（秘密情報ではない）。
 */
const URL = process.env.SUPABASE_TEST_URL ?? 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

/** service_role（RLSを無視できる）のクライアント。後片付け・テストデータの直接確認に使う。 */
export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
}

let counter = 0

/**
 * テスト用の認証済みメンバーを作る。`auth.users` に実在するユーザーを作り、
 * パスワードでサインインしたクライアントを返す（本番はマジックリンクだが、
 * テストではパスワードで直接サインインする方が速く安定する。どちらも同じ `auth.users` を使う）。
 */
export async function createAuthedMember(
  admin: SupabaseClient,
): Promise<{ client: SupabaseClient; userId: string }> {
  const email = `test-${Date.now()}-${counter++}@example.com`
  const password = 'test-password-123!'
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  const client = createClient(URL, ANON_KEY, { auth: { persistSession: false } })
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { client, userId: data.user.id }
}
