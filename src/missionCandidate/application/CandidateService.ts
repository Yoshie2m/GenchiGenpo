import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import type { MissionCandidateCatalog } from '../../publishedLanguage/queries.ts'
import type { CandidateListRepository } from '../domain/CandidateListRepository.ts'

/** ミッション候補のユースケース。チームミッションには MissionCandidateCatalog として渡す。 */
export class CandidateService implements MissionCandidateCatalog {
  private readonly repository: CandidateListRepository
  private readonly master: readonly MissionPlan[]

  constructor(repository: CandidateListRepository, master: readonly MissionPlan[]) {
    this.repository = repository
    this.master = master
  }

  /** 候補の一覧（並び順が自動確定の優先順。一番上が自動で決まる候補）。 */
  list(): readonly MissionPlan[] {
    return this.repository.load(this.master).candidates
  }

  markUsed(candidateId: string): void {
    this.repository.save(this.repository.load(this.master).markUsed(candidateId))
  }
}
