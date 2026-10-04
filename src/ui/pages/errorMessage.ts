import { DomainError } from '../../shared/DomainError.ts'

/** ルールに反した操作のメッセージを画面に出す。それ以外のエラーはそのまま投げる。 */
export function errorMessage(e: unknown): string {
  if (e instanceof DomainError) return e.message
  throw e
}
