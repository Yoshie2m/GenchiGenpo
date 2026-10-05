import { useEffect, useState } from 'react'

/** 非同期の読み込み結果をStateにする（ステップ1用。読み込み中の表示は別タスクで作る）。 */
export function useAsyncData<T>(load: () => Promise<T>, deps: readonly unknown[]): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let active = true
    load().then((result) => {
      if (active) setData(result)
    })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return data
}
