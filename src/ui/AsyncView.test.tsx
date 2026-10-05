import { render, screen } from '@testing-library/react'
import { AsyncView } from './AsyncView.tsx'
import type { AsyncState } from './useAsyncData.ts'

describe('AsyncView', () => {
  test('loading のときは読み込み中と出す', () => {
    const state: AsyncState<string> = { status: 'loading' }
    render(<AsyncView<string> state={state}>{(data) => <p>{data}</p>}</AsyncView>)
    expect(screen.getByText('読み込み中…')).toBeInTheDocument()
  })

  test('error のときは失敗のメッセージを alert で出す', () => {
    const state: AsyncState<string> = { status: 'error', error: new Error('network down') }
    render(<AsyncView<string> state={state}>{(data) => <p>{data}</p>}</AsyncView>)
    expect(screen.getByRole('alert')).toHaveTextContent('読み込みに失敗しました')
  })

  test('ready のときは中身を描く', () => {
    const state: AsyncState<string> = { status: 'ready', data: '読み込めた内容' }
    render(<AsyncView<string> state={state}>{(data) => <p>{data}</p>}</AsyncView>)
    expect(screen.getByText('読み込めた内容')).toBeInTheDocument()
  })
})
