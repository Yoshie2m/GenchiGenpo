import { DEMO_MEMBERS, buildDemoData, demoStepsOf } from './dev/demoData.ts'
import { MemberService } from './member/application/MemberService.ts'
import { LocalStorageMemberRepository } from './member/infrastructure/LocalStorageMemberRepository.ts'
import { CandidateService } from './missionCandidate/application/CandidateService.ts'
import { LocalStorageCandidateListRepository } from './missionCandidate/infrastructure/LocalStorageCandidateListRepository.ts'
import { MISSION_CANDIDATES } from './missionCandidate/masterData/missionCandidates.ts'
import { PersonalMissionService } from './personalMission/application/PersonalMissionService.ts'
import { LocalStoragePersonalMissionRepository } from './personalMission/infrastructure/LocalStoragePersonalMissionRepository.ts'
import { TOKAIDO_ROUTE } from './personalMission/masterData/tokaidoRoute.ts'
import type { MemberId } from './publishedLanguage/memberId.ts'
import type { AppEvent } from './publishedLanguage/queries.ts'
import { AdjustableClock } from './shared/AdjustableClock.ts'
import { systemClock, type Clock } from './shared/Clock.ts'
import { EventBus } from './shared/EventBus.ts'
import { randomIdGenerator, type IdGenerator } from './shared/IdGenerator.ts'
import { localDateOf } from './shared/LocalDate.ts'
import type { KeyValueStorage } from './shared/VersionedStorage.ts'
import {
  ScreenCaptureImportService,
  type CalendarRecognizer,
} from './stepRecord/application/ScreenCaptureImportService.ts'
import { StepRecordService } from './stepRecord/application/StepRecordService.ts'
import { LocalStorageDailyStepsRepository } from './stepRecord/infrastructure/LocalStorageDailyStepsRepository.ts'
import { TeamMissionService } from './teamMission/application/TeamMissionService.ts'
import { LocalStorageTeamMissionRepository } from './teamMission/infrastructure/LocalStorageTeamMissionRepository.ts'

/** PoC のチーム数（DOMAINS.md は3隊。PoC は一旦2隊）。 */
export const POC_TEAM_COUNT = 2

/** localStorage のキーの頭（すべてのデータを消すときに使う）。 */
const KEY_PREFIX = 'genchigenpo:'

export interface AppOptions {
  readonly storage?: KeyValueStorage & { readonly length: number; key(i: number): string | null }
  readonly baseClock?: Clock
  readonly ids?: IdGenerator
  /** 画面キャプチャの文字認識（テストでは差し替える）。 */
  readonly recognizeCalendar?: CalendarRecognizer
}

/** 文字認識は重いので、画面キャプチャを取り込むときに初めて読み込む。 */
const recognizeWithTesseract: CalendarRecognizer = async (image) => {
  const { recognizeStepCalendar } =
    await import('./stepRecord/acl/screenCapture/recognizeStepCalendar.ts')
  return recognizeStepCalendar(image)
}

/**
 * アプリの組み立て（依存の注入）。各コンテキストのサービスを作り、
 * 「歩数が記録された」を個人ミッションとチームミッションに配送する。
 */
export function createApp(options: AppOptions = {}) {
  const storage = options.storage ?? localStorage
  const clock = new AdjustableClock(options.baseClock ?? systemClock, storage)
  const ids = options.ids ?? randomIdGenerator
  const bus = new EventBus<AppEvent>()

  const members = new MemberService(new LocalStorageMemberRepository(storage), clock, ids)
  const steps = new StepRecordService(new LocalStorageDailyStepsRepository(storage), clock, (e) =>
    bus.publish(e),
  )
  const screenCapture = new ScreenCaptureImportService(
    steps,
    clock,
    options.recognizeCalendar ?? recognizeWithTesseract,
  )
  const personal = new PersonalMissionService(
    new LocalStoragePersonalMissionRepository(storage, TOKAIDO_ROUTE),
    TOKAIDO_ROUTE,
  )
  const candidates = new CandidateService(
    new LocalStorageCandidateListRepository(storage),
    MISSION_CANDIDATES,
  )
  const team = new TeamMissionService({
    repository: new LocalStorageTeamMissionRepository(storage),
    clock,
    members,
    history: steps,
    candidates,
    ids,
    teamCount: POC_TEAM_COUNT,
  })

  bus.subscribe('StepsRecorded', (e) => personal.onStepsRecorded(e))
  bus.subscribe('StepsRecorded', (e) => team.onStepsRecorded(e))

  /** メンバーを登録し、個人ミッションの旅を始める（チームミッションには次の tick で途中参加する）。 */
  function registerMember(displayName: string) {
    const member = members.register(displayName)
    personal.ensureStarted(member.id, member.registeredDate)
    team.tick()
    return member
  }

  /** 開発用の操作（PoC の開発用画面から使う）。 */
  const dev = {
    /** メンバーが1人もいなければ、ダミーメンバー10人とその歩数を入れる。 */
    seedDemoIfEmpty(): void {
      if (members.members().length > 0) return
      const data = buildDemoData(clock.now())
      members.replaceAll(data.members)
      for (const m of data.members) personal.ensureStarted(m.id, m.registeredDate)
      for (const d of data.dailySteps) {
        steps.recordStepsAt(d.memberId, d.date, d.steps, d.source, d.reflectedAt)
      }
    },
    /**
     * 今日の分のダミーの歩数を、指定したメンバー以外のダミーメンバーに入れる。
     * 反映日時は1人ずつ1分ずらす（全員が同じ時刻だと、中間地点がいつも同着になるため）。
     */
    fillDemoStepsForToday(except: MemberId | null): void {
      const now = clock.now()
      const today = localDateOf(now)
      DEMO_MEMBERS.forEach((profile, i) => {
        if (profile.id === except) return
        const value = demoStepsOf(profile, today)
        if (value === null) return
        const id = profile.id as MemberId
        const current = steps.recordsOf(id).find((r) => r.date === today)?.steps ?? 0
        const at = new Date(now.getTime() - (DEMO_MEMBERS.length - i) * 60_000)
        if (value > current) steps.recordStepsAt(id, today, value, 'manual', at)
      })
      team.tick()
    },
    advanceDays(days: number): void {
      clock.advanceDays(days)
      team.tick()
    },
    advanceHours(hours: number): void {
      clock.advance(hours * 60 * 60 * 1000)
      team.tick()
    },
    resetClock(): void {
      clock.reset()
    },
    /** すべてのデータ（genchigenpo: で始まるキー）を消す。 */
    clearAll(): void {
      const keys: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(KEY_PREFIX)) keys.push(key)
      }
      for (const key of keys) storage.removeItem(key)
    },
  }

  return { clock, members, steps, screenCapture, personal, candidates, team, registerMember, dev }
}

export type App = ReturnType<typeof createApp>
