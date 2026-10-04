import { parseLocalDate } from '../../shared/LocalDate.ts'
import { VersionedStorage, type KeyValueStorage } from '../../shared/VersionedStorage.ts'
import { Member } from '../domain/Member.ts'
import type { MemberRepository } from '../domain/MemberRepository.ts'

export const MEMBER_STORAGE_KEY = 'genchigenpo:member'
const VERSION = 1

interface Stored {
  members: { id: string; displayName: string; registeredDate: string }[]
}

export class LocalStorageMemberRepository implements MemberRepository {
  private readonly storage: VersionedStorage<Stored>

  constructor(storage: KeyValueStorage) {
    this.storage = new VersionedStorage<Stored>(storage, MEMBER_STORAGE_KEY, VERSION)
  }

  load(): Member[] {
    return (this.storage.load()?.members ?? []).map((m) =>
      Member.register(m.id, m.displayName, parseLocalDate(m.registeredDate)),
    )
  }

  save(members: readonly Member[]): void {
    this.storage.save({
      members: members.map((m) => ({
        id: m.id,
        displayName: m.displayName,
        registeredDate: m.registeredDate,
      })),
    })
  }
}
