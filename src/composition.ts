import type { SupabaseClient } from '@supabase/supabase-js'
import { DEMO_MEMBERS, buildDemoData, demoStepsOf } from './dev/demoData.ts'
import type { MemberRepository } from './member/domain/MemberRepository.ts'
import { MemberService } from './member/application/MemberService.ts'
import { LocalStorageMemberRepository } from './member/infrastructure/LocalStorageMemberRepository.ts'
import { SupabaseMemberRepository } from './member/infrastructure/SupabaseMemberRepository.ts'
import { CandidateService } from './missionCandidate/application/CandidateService.ts'
import type { CandidateListRepository } from './missionCandidate/domain/CandidateListRepository.ts'
import { LocalStorageCandidateListRepository } from './missionCandidate/infrastructure/LocalStorageCandidateListRepository.ts'
import { SupabaseCandidateListRepository } from './missionCandidate/infrastructure/SupabaseCandidateListRepository.ts'
import { MISSION_CANDIDATES } from './missionCandidate/masterData/missionCandidates.ts'
import { PersonalMissionService } from './personalMission/application/PersonalMissionService.ts'
import type { PersonalMissionRepository } from './personalMission/domain/PersonalMissionRepository.ts'
import { LocalStoragePersonalMissionRepository } from './personalMission/infrastructure/LocalStoragePersonalMissionRepository.ts'
import { SupabasePersonalMissionRepository } from './personalMission/infrastructure/SupabasePersonalMissionRepository.ts'
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
import type { DailyStepsRepository } from './stepRecord/domain/DailyStepsRepository.ts'
import { LocalStorageDailyStepsRepository } from './stepRecord/infrastructure/LocalStorageDailyStepsRepository.ts'
import { SupabaseDailyStepsRepository } from './stepRecord/infrastructure/SupabaseDailyStepsRepository.ts'
import { TeamMissionService } from './teamMission/application/TeamMissionService.ts'
import type { TeamMissionRepository } from './teamMission/domain/TeamMissionRepository.ts'
import { LocalStorageTeamMissionRepository } from './teamMission/infrastructure/LocalStorageTeamMissionRepository.ts'
import { SupabaseTeamMissionRepository } from './teamMission/infrastructure/SupabaseTeamMissionRepository.ts'

/** PoC のチーム数（DOMAINS.md は3隊。PoC は一旦2隊）。 */
export const POC_TEAM_COUNT = 2

/** localStorage のキーの頭（すべてのデータを消すときに使う）。 */
const KEY_PREFIX = 'genchigenpo:'

export interface AppOptions {
  readonly storage?: KeyValueStorage & { readonly length: number; key(i: number): string | null }
  /**
   * 渡すと各コンテキストの Repository は Supabase 実装になる（本番）。
   * 渡さなければ localStorage 実装になる（PoC・開発用）。
   */
  readonly supabase?: SupabaseClient
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

  const supabase = options.supabase
  const memberRepository: MemberRepository = supabase
    ? new SupabaseMemberRepository(supabase)
    : new LocalStorageMemberRepository(storage)
  const dailyStepsRepository: DailyStepsRepository = supabase
    ? new SupabaseDailyStepsRepository(supabase)
    : new LocalStorageDailyStepsRepository(storage)
  const personalMissionRepository: PersonalMissionRepository = supabase
    ? new SupabasePersonalMissionRepository(supabase, TOKAIDO_ROUTE)
    : new LocalStoragePersonalMissionRepository(storage, TOKAIDO_ROUTE)
  const candidateListRepository: CandidateListRepository = supabase
    ? new SupabaseCandidateListRepository(supabase)
    : new LocalStorageCandidateListRepository(storage)
  const teamMissionRepository: TeamMissionRepository = supabase
    ? new SupabaseTeamMissionRepository(supabase)
    : new LocalStorageTeamMissionRepository(storage)

  const members = new MemberService(memberRepository, clock, ids)
  const steps = new StepRecordService(dailyStepsRepository, clock, (e) => bus.publish(e))
  const screenCapture = new ScreenCaptureImportService(
    steps,
    clock,
    options.recognizeCalendar ?? recognizeWithTesseract,
  )
  const personal = new PersonalMissionService(personalMissionRepository, TOKAIDO_ROUTE)
  const candidates = new CandidateService(candidateListRepository, MISSION_CANDIDATES)
  const team = new TeamMissionService({
    repository: teamMissionRepository,
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
  async function registerMember(displayName: string) {
    return afterRegister(await members.register(displayName))
  }

  /**
   * IDを指定して登録する（本番の認証フローの初回ログイン用。関連: ARCHITECTURE.md 4.4
   * 「招待制の運用」）。
   */
  async function registerMemberWithId(id: string, displayName: string) {
    return afterRegister(await members.registerWithId(id, displayName))
  }

  async function afterRegister(member: Awaited<ReturnType<typeof members.register>>) {
    await personal.ensureStarted(member.id, member.registeredDate)
    await team.tick()
    return member
  }

  /** 開発用の操作（PoC の開発用画面から使う）。 */
  const dev = {
    /** メンバーが1人もいなければ、ダミーメンバー10人とその歩数を入れる。 */
    async seedDemoIfEmpty(): Promise<void> {
      if ((await members.members()).length > 0) return
      const data = buildDemoData(clock.now())
      await members.replaceAll(data.members)
      for (const m of data.members) await personal.ensureStarted(m.id, m.registeredDate)
      for (const d of data.dailySteps) {
        await steps.recordStepsAt(d.memberId, d.date, d.steps, d.source, d.reflectedAt)
      }
    },
    /**
     * 今日の分のダミーの歩数を、指定したメンバー以外のダミーメンバーに入れる。
     * 反映日時は1人ずつ1分ずらす（全員が同じ時刻だと、中間地点がいつも同着になるため）。
     */
    async fillDemoStepsForToday(except: MemberId | null): Promise<void> {
      const now = clock.now()
      const today = localDateOf(now)
      for (const [i, profile] of DEMO_MEMBERS.entries()) {
        if (profile.id === except) continue
        const value = demoStepsOf(profile, today)
        if (value === null) continue
        const id = profile.id as MemberId
        const current = (await steps.recordsOf(id)).find((r) => r.date === today)?.steps ?? 0
        const at = new Date(now.getTime() - (DEMO_MEMBERS.length - i) * 60_000)
        if (value > current) await steps.recordStepsAt(id, today, value, 'manual', at)
      }
      await team.tick()
    },
    async advanceDays(days: number): Promise<void> {
      clock.advanceDays(days)
      await team.tick()
    },
    async advanceHours(hours: number): Promise<void> {
      clock.advance(hours * 60 * 60 * 1000)
      await team.tick()
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

  return {
    clock,
    members,
    steps,
    screenCapture,
    personal,
    candidates,
    team,
    registerMember,
    registerMemberWithId,
    dev,
  }
}

export type App = ReturnType<typeof createApp>
