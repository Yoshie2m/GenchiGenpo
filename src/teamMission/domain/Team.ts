import type { MemberId } from '../../publishedLanguage/memberId.ts'

/** 隊の番号。PoC は2隊、本番は3隊（チーム数は設定値）。 */
export type TeamNumber = 1 | 2 | 3

/** 隊の名前（DOMAINS.md。名前と意味はどのミッションでも同じ）。 */
export const TEAM_NAMES: Readonly<Record<TeamNumber, string>> = {
  1: '壱番隊（足跡）',
  2: '弐番隊（軌跡）',
  3: '参番隊（道程）',
}

export function teamNumbers(teamCount: number): TeamNumber[] {
  return ([1, 2, 3] as const).slice(0, teamCount)
}

/** 隊の所属。メンバーは1つのミッションで1つの隊にだけ所属し、ミッション中は移動しない。 */
export interface TeamAssignment {
  readonly memberId: MemberId
  readonly team: TeamNumber
}
