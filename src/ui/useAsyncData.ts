import { useEffect, useState } from 'react'

/** 非同期の読み込みの状態。読み込み中・失敗・読み込めた、を区別する。 */
export type AsyncState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'ready'; readonly data: T }

/** 非同期の読み込み結果をStateにする（読み込み中・失敗を区別できる）。 */
export function useAsyncData<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  useEffect(() => {
    let active = true
    load().then(
      (data) => {
        if (active) setState({ status: 'ready', data })
      },
      (error) => {
        if (active) setState({ status: 'error', error })
      },
    )
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
