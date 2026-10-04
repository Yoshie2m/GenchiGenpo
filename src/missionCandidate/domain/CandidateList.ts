import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { DomainError } from '../../shared/DomainError.ts'

/**
 * 管理者が用意するミッション候補の一覧（DOMAINS.md）。並び順が自動確定の優先順になる。
 * 一度使った候補は一覧の一番下に回す（自動確定で同じ目的地が続かないようにするため）。
 */
export class CandidateList {
  readonly candidates: readonly MissionPlan[]

  private constructor(candidates: readonly MissionPlan[]) {
    this.candidates = candidates
  }

  static of(candidates: readonly MissionPlan[]): CandidateList {
    if (candidates.length === 0) throw new DomainError('ミッション候補が1つもありません')
    const ids = new Set(candidates.map((c) => c.candidateId))
    if (ids.size !== candidates.length)
      throw new DomainError('ミッション候補の ID が重複しています')
    return new CandidateList(candidates)
  }

  /** 一番上の候補（誰も作成しなかったときに自動で確定する候補）。 */
  get top(): MissionPlan {
    return this.candidates[0]
  }

  find(candidateId: string): MissionPlan {
    const found = this.candidates.find((c) => c.candidateId === candidateId)
    if (!found) throw new DomainError(`ミッション候補が見つかりません: ${candidateId}`)
    return found
  }

  /** 使った候補を一番下に回す。 */
  markUsed(candidateId: string): CandidateList {
    const used = this.find(candidateId)
    return new CandidateList([...this.candidates.filter((c) => c !== used), used])
  }
}
