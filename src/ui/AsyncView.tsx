import type { ReactNode } from 'react'
import type { AsyncState } from './useAsyncData.ts'

/**
 * 読み込み中・失敗を共通の見た目で出し、読み込めたときだけ中身を描く
 * （非同期化にともなうUIの対応。ARCHITECTURE.md「5. 実装固有の設計」）。
 */
export function AsyncView<T>({
  state,
  children,
}: {
  readonly state: AsyncState<T>
  readonly children: (data: T) => ReactNode
}): ReactNode {
  if (state.status === 'loading') return <p className="fs-body">読み込み中…</p>
  if (state.status === 'error') {
    return <p role="alert">読み込みに失敗しました。少し待ってから開き直してください。</p>
  }
  return children(state.data)
}
