type Handler<E> = (event: E) => void | Promise<void>

/** アプリ内でイベントを配送する。ハンドラは登録順に、1つずつ待ってから次へ進む。 */
export class EventBus<E extends { type: string }> {
  private readonly handlers = new Map<E['type'], Handler<E>[]>()

  subscribe<T extends E['type']>(type: T, handler: Handler<Extract<E, { type: T }>>): () => void {
    const list = this.handlers.get(type) ?? []
    list.push(handler as Handler<E>)
    this.handlers.set(type, list)
    return () => {
      this.handlers.set(
        type,
        (this.handlers.get(type) ?? []).filter((h) => h !== handler),
      )
    }
  }

  async publish(event: E): Promise<void> {
    for (const handler of this.handlers.get(event.type as E['type']) ?? []) await handler(event)
  }
}
