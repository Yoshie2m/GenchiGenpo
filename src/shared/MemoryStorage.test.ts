import { MemoryStorage } from './MemoryStorage.ts'

describe('MemoryStorage', () => {
  test('保存・取得・削除ができ、ブラウザの localStorage には触れない', () => {
    localStorage.clear()
    const storage = new MemoryStorage()
    storage.setItem('a', '1')
    storage.setItem('b', '2')
    expect(storage.getItem('a')).toBe('1')
    expect(storage.getItem('x')).toBeNull()
    expect(storage.length).toBe(2)
    expect([storage.key(0), storage.key(1), storage.key(2)]).toEqual(['a', 'b', null])
    storage.removeItem('a')
    expect(storage.getItem('a')).toBeNull()
    expect(storage.length).toBe(1)
    expect(localStorage.length).toBe(0)
  })
})
