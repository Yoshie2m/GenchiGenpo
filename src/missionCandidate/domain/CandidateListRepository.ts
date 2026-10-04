import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import type { CandidateList } from './CandidateList.ts'

/** 候補の中身はマスターデータで、保存するのは並び順だけ。 */
export interface CandidateListRepository {
  /** 保存した並び順で候補の一覧を返す。まだ保存がなければ、マスターデータの並び順。 */
  load(master: readonly MissionPlan[]): CandidateList
  save(list: CandidateList): void
}
