import { memberId, type MemberId } from '../../publishedLanguage/memberId.ts'
import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import type { StepsRecorded } from '../../publishedLanguage/stepRecordEvents.ts'
import { parseLocalDate } from '../../shared/LocalDate.ts'
import { TeamMission } from './TeamMission.ts'

export const a1 = memberId('a1')
export const a2 = memberId('a2')
export const b1 = memberId('b1')
export const b2 = memberId('b2')

/** 目標 40,000 歩、期間5日、中間地点 15,000 歩・30,000 歩の小さなミッション。 */
export const smallPlan: MissionPlan = {
  candidateId: 'small',
  destination: {
    name: '遠州・浜名屋',
    kanji: '浜木',
    reading: 'Hamaki',
    province: '遠江国',
    memo: '',
  },
  targetSteps: 40_000,
  periodDays: 5,
  waypoints: [
    { name: '藤川宿', progressSteps: 15_000, points: { first: 1000, second: 500 } },
    { name: '二川宿', progressSteps: 30_000, points: { first: 1000, second: 500 } },
  ],
}

/** 2026-10-05 開始、壱番隊（a1・a2）と弐番隊（b1・b2）。 */
export function startSmallMission(): TeamMission {
  return TeamMission.start('m1', smallPlan, parseLocalDate('2026-10-05'), 2, [
    { memberId: a1, team: 1 },
    { memberId: a2, team: 1 },
    { memberId: b1, team: 2 },
    { memberId: b2, team: 2 },
  ])
}

/** 日本時間の「YYYY-MM-DD hh:mm」を Date にする。 */
export function jst(value: string): Date {
  return new Date(`${value.replace(' ', 'T')}:00+09:00`)
}

export function steps(member: MemberId, date: string, value: number, reflectedAt: string) {
  const event: StepsRecorded = {
    type: 'StepsRecorded',
    memberId: member,
    date: parseLocalDate(date),
    steps: value,
    previousSteps: 0,
    reflectedAt: jst(reflectedAt),
  }
  return event
}
