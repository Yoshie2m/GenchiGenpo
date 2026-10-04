import type { MissionPlan } from '../../publishedLanguage/missionPlan.ts'
import { DomainError } from '../../shared/DomainError.ts'
import { CandidateList } from './CandidateList.ts'

const plan = (candidateId: string): MissionPlan => ({
  candidateId,
  destination: {
    name: candidateId,
    kanji: '浜木',
    reading: 'Hamaki',
    province: '遠江国',
    memo: '',
  },
  targetSteps: 114_000,
  periodDays: 11,
  waypoints: [],
})

describe('CandidateList（ミッション候補の一覧）', () => {
  test('一番上の候補が自動確定の候補になる', () => {
    expect(CandidateList.of([plan('a'), plan('b'), plan('c')]).top.candidateId).toBe('a')
  })

  test('使った候補は一番下に回す', () => {
    const list = CandidateList.of([plan('a'), plan('b'), plan('c')]).markUsed('a')
    expect(list.candidates.map((c) => c.candidateId)).toEqual(['b', 'c', 'a'])
    expect(list.top.candidateId).toBe('b')
  })

  test('空の一覧や重複した ID は受け付けない', () => {
    expect(() => CandidateList.of([])).toThrow(DomainError)
    expect(() => CandidateList.of([plan('a'), plan('a')])).toThrow(DomainError)
  })

  test('ない候補は選べない', () => {
    expect(() => CandidateList.of([plan('a')]).find('x')).toThrow(DomainError)
  })
})
