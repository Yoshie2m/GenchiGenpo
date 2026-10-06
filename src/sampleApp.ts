import { createApp, type App } from './composition.ts'
import { MemoryStorage } from './shared/MemoryStorage.ts'

/**
 * ログインできない人に見せるサンプルページ用のアプリ。
 * Supabase にはつながず、保存先もブラウザの localStorage ではなくメモリだけにする。
 * そのため、本番のデータにも、実際のメンバーの保存データにも触れない（ページを閉じると消える）。
 * 中身は、乱数で作った6人のダミーメンバーと歩数。
 */
export async function createSampleApp(random: () => number = Math.random): Promise<App> {
  const app = createApp({ storage: new MemoryStorage() })
  await app.dev.seedSample(random)
  return app
}
