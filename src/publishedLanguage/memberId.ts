/** メンバーを識別する ID。どのコンテキストでも、メンバーはこの ID だけで指す（DOMAINS.md 2章）。 */
export type MemberId = string & { readonly __brand: 'MemberId' }

export const memberId = (value: string) => value as MemberId
