import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** 本番の接続情報（ARCHITECTURE.md「接続情報の管理」）から Supabase クライアントを作る。 */
export function createSupabaseClient(): SupabaseClient {
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
}
