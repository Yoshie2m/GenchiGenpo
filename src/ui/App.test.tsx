import { render, screen } from '@testing-library/react'
import App from './App.tsx'

test('アプリの題名を表示する', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: '現地現物' })).toBeInTheDocument()
})
