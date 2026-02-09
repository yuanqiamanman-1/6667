import { apiClient } from './api-client'

export type Id = string

export type EvidenceRef = { id?: Id; name: string }

export type PointTxnType =
  | 'reward_out'
  | 'reward_in'
  | 'redeem'
  | 'grant'
  | 'adjust'

export interface PointTxn {
  id: Id
  type: PointTxnType
  title: string
  points: number
  createdAt: string
  meta?: Record<string, unknown>
}

export interface RedemptionRecord {
  id: Id
  itemId: Id
  itemName: string
  pointsCost: number
  createdAt: string
}

export interface TagItem {
  id: Id
  name: string
  category: string
  enabled: boolean
  createdAt: string
}

export type AnnouncementScope = 'public' | 'campus'

export type AnnouncementAudience = 'public_all' | 'campus_all' | 'association_teachers_only' | 'aid_school_only'

export interface AnnouncementItem {
  id: Id
  title: string
  content: string
  scope: AnnouncementScope
  schoolId?: Id
  audience?: AnnouncementAudience
  pinned: boolean
  createdAt: string
  createdBy: {
    role:
      | 'platform'
      | 'association_hq'
      | 'university_admin'
      | 'university_association_admin'
      | 'aid_school_admin'
      | 'school'
      | 'association'
    name: string
    schoolName?: string
  }
}

export type TaskType = 'urgent' | 'special'

export interface AssociationTask {
  id: Id
  title: string
  description: string
  type: TaskType
  schoolId: Id
  createdAt: string
  volunteerHoursGranted?: number
}

export type HqTaskStatus = 'draft' | 'published' | 'closed'

export interface HqTask {
  id: Id
  title: string
  description: string
  type: TaskType
  createdAt: string
  status: HqTaskStatus
}

export type OnboardingStatus = 'pending' | 'approved' | 'rejected'

export interface AssociationOnboardingRequest {
  id: Id
  userId?: Id
  schoolName: string
  associationName: string
  contactName: string
  contactEmail: string
  attachments?: EvidenceRef[]
  status: OnboardingStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

export type ActivityReviewStatus = 'pending' | 'approved' | 'rejected'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface AssociationActivityReview {
  id: Id
  schoolName: string
  title: string
  activityType: string
  timeRange: string
  riskLevel: RiskLevel
  status: ActivityReviewStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

export type VerificationStepStatus = 'none' | 'pending' | 'verified' | 'rejected'

export interface UserLocalState {
  userId: Id
  points?: number
  verification?: {
    school?: VerificationStepStatus
    association?: VerificationStepStatus
    k12SchoolBatch?: VerificationStepStatus
    generalBasic?: VerificationStepStatus
    universityStudent?: VerificationStepStatus
    volunteerTeacher?: VerificationStepStatus
    specialAid?: VerificationStepStatus
  }
}

export type PostVisibility = 'visible' | 'hidden'

export interface CampusTopic {
  id: Id
  schoolId: Id
  name: string
  enabled: boolean
  createdAt: string
}

export interface CampusPost {
  id: Id
  schoolId: Id
  authorId: Id
  authorName: string
  authorAvatar?: string
  content: string
  topicIds: Id[]
  createdAt: string
  likes: number
  comments: number
  pinned?: boolean
  visibility: PostVisibility
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export interface VolunteerTeacherApplication {
  id: Id
  schoolId: Id
  applicantId: Id
  applicantName: string
  applicantAvatar?: string
  evidenceNames: string[]
  tags: string[]
  timeSlots: string[]
  status: ReviewStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

export interface VolunteerTeacherProfile {
  id: Id
  schoolId: Id
  userId: Id
  name: string
  avatar?: string
  mainTag: string
  tagsCount: number
  inPool: boolean
  responseMinutes: number
  completionRate: number
  rating: number
  complaints: number
  riskLevel: RiskLevel
  updatedAt: string
}

export interface AssociationRuleSet {
  id: Id
  schoolId: Id
  enabled: boolean
  pointsPerHour: number
  weeklyHourLimit: number
  monthlyHourLimit: number
  cooldownDays: number
  minRating: number
  requireManualReview: boolean
  version: number
  updatedAt: string
  updatedBy: string
}

export interface AssociationMallItem {
  id: Id
  schoolId: Id
  title: string
  description: string
  costPoints: number
  stock: number
  enabled: boolean
  createdAt: string
}

export type HourGrantSource = 'task' | 'redeem' | 'manual' | 'rollback'
export type HourGrantStatus = 'pending' | 'approved' | 'rejected' | 'rolled_back'

export interface VolunteerHourGrant {
  id: Id
  schoolId: Id
  userId: Id
  userName: string
  sourceType: HourGrantSource
  sourceId?: Id
  hoursGranted: number
  pointsUsed?: number
  ratioUsed?: number
  ruleVersion?: number
  status: HourGrantStatus
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
}

export type AidBatchStatus = 'active' | 'closed'
export type AidVerificationStatus = 'pending' | 'approved' | 'rejected'

export interface AidVerificationBatch {
  id: Id
  aidSchoolId: Id
  title: string
  description: string
  createdAt: string
  status: AidBatchStatus
  totalCount: number
  approvedCount: number
}

export interface AidStudentVerificationRequest {
  id: Id
  aidSchoolId: Id
  batchId?: Id
  studentName: string
  studentSchool: string
  evidenceNames: string[]
  status: AidVerificationStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

export interface AidSafetyConfig {
  aidSchoolId: Id
  allowChat: boolean
  allowVoice: boolean
  allowVideo: boolean
  allowedTimeWindow: string
  updatedAt: string
  updatedBy: string
}

export type VerificationType = 'general_basic' | 'university_student' | 'volunteer_teacher' | 'special_aid'

export interface VerificationRequest {
  id: Id
  type: VerificationType
  applicantId: Id
  applicantName: string
  applicantSchool?: string
  targetSchoolId?: Id
  evidenceNames: string[]
  note?: string
  status: ReviewStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

export type SystemEventGroup = 'daily' | 'urgent'
export type SystemEventStatus = 'open' | 'ack' | 'closed'

export interface SystemEvent {
  id: Id
  group: SystemEventGroup
  title: string
  detail: string
  level: 'info' | 'warning' | 'critical'
  status: SystemEventStatus
  createdAt: string
  handledBy?: string
  handledAt?: string
}

export type OrganizationType = 'university' | 'university_association' | 'aid_school'

export interface OrganizationEntry {
  id: Id
  type: OrganizationType
  displayName: string
  schoolId?: Id
  universityName?: string
  associationName?: string
  aidSchoolId?: Id
  certified: boolean
  createdAt: string
}

export interface CommunityPost {
  id: Id
  authorName: string
  authorAvatar?: string
  authorRole?: string
  authorOrg?: string
  content: string
  tags: string[]
  createdAt: string
  likes: number
  comments: number
  shares: number
}

export interface QaQuestion {
  id: Id
  subject: string
  title: string
  content: string
  tags: string[]
  reward: number
  createdAt: string
  authorId: Id
  authorName: string
  authorAvatar?: string
  views: number
  answers: number
  solved?: boolean
  acceptedAnswerId?: Id
}

export interface QaAnswer {
  id: Id
  questionId: Id
  authorId: Id
  authorName: string
  authorAvatar?: string
  content: string
  likes: number
  createdAt: string
}

const KEY_PREFIX = 'cloudEduMatch'

function safeParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function safeStringify(value: unknown) {
  return JSON.stringify(value)
}

function getKey(parts: string[]) {
  return [KEY_PREFIX, ...parts].join(':')
}

export function nowIso() {
  return new Date().toISOString()
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

export function getUserLocalState(userId: Id): UserLocalState {
  if (typeof window === 'undefined') return { userId }
  const key = getKey(['user', userId, 'state'])
  const parsed = safeParse<UserLocalState>(window.localStorage.getItem(key))
  return parsed && parsed.userId === userId ? parsed : { userId }
}

export function setUserLocalState(userId: Id, updates: Partial<UserLocalState>) {
  if (typeof window === 'undefined') return
  const key = getKey(['user', userId, 'state'])
  const current = getUserLocalState(userId)
  const next: UserLocalState = {
    ...current,
    ...updates,
    userId,
    verification: { ...current.verification, ...updates.verification },
  }
  window.localStorage.setItem(key, safeStringify(next))
}

export function getUserPoints(userId: Id, fallback: number) {
  const state = getUserLocalState(userId)
  return typeof state.points === 'number' ? state.points : fallback
}

export function setUserPoints(userId: Id, points: number) {
  setUserLocalState(userId, { points })
}

export function getUserPointTxns(userId: Id): PointTxn[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['user', userId, 'pointsTxns'])
  return safeParse<PointTxn[]>(window.localStorage.getItem(key)) ?? []
}

export function appendUserPointTxn(userId: Id, txn: PointTxn) {
  if (typeof window === 'undefined') return
  const key = getKey(['user', userId, 'pointsTxns'])
  const current = getUserPointTxns(userId)
  window.localStorage.setItem(key, safeStringify([txn, ...current].slice(0, 200)))
}

export function getUserRedemptions(userId: Id): RedemptionRecord[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['user', userId, 'redemptions'])
  return safeParse<RedemptionRecord[]>(window.localStorage.getItem(key)) ?? []
}

export function appendUserRedemption(userId: Id, record: RedemptionRecord) {
  if (typeof window === 'undefined') return
  const key = getKey(['user', userId, 'redemptions'])
  const current = getUserRedemptions(userId)
  window.localStorage.setItem(key, safeStringify([record, ...current].slice(0, 200)))
}

export async function getTags(): Promise<TagItem[]> {
  try {
    const raw: any = await apiClient.get('/core/tags')
    if (!Array.isArray(raw)) return []
    return raw.map((t: any) => ({
      id: String(t.id ?? ''),
      name: String(t.name ?? ''),
      category: String(t.category ?? ''),
      enabled: Boolean(t.enabled),
      createdAt: String(t.created_at ?? t.createdAt ?? ''),
    })).filter((t: TagItem) => Boolean(t.id && t.name))
  } catch (e) {
    console.error(e)
    return []
  }
}

export function setTags(tags: TagItem[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['tags'])
  window.localStorage.setItem(key, safeStringify(tags))
}

export function getAnnouncements(): AnnouncementItem[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['announcements'])
  return safeParse<AnnouncementItem[]>(window.localStorage.getItem(key)) ?? []
}

export function setAnnouncements(items: AnnouncementItem[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['announcements'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getAssociationTasks(schoolId: Id): AssociationTask[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['association', schoolId, 'tasks'])
  return safeParse<AssociationTask[]>(window.localStorage.getItem(key)) ?? []
}

export function setAssociationTasks(schoolId: Id, tasks: AssociationTask[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'tasks'])
  window.localStorage.setItem(key, safeStringify(tasks))
}

export function getHqTasks(): HqTask[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['hq', 'tasks'])
  return safeParse<HqTask[]>(window.localStorage.getItem(key)) ?? []
}

export function setHqTasks(tasks: HqTask[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['hq', 'tasks'])
  window.localStorage.setItem(key, safeStringify(tasks))
}

export function getAssociationOnboardingRequests(): AssociationOnboardingRequest[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['hq', 'associationOnboarding'])
  return safeParse<AssociationOnboardingRequest[]>(window.localStorage.getItem(key)) ?? []
}

export function setAssociationOnboardingRequests(items: AssociationOnboardingRequest[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['hq', 'associationOnboarding'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getAssociationActivityReviews(): AssociationActivityReview[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['hq', 'activityReviews'])
  return safeParse<AssociationActivityReview[]>(window.localStorage.getItem(key)) ?? []
}

export function setAssociationActivityReviews(items: AssociationActivityReview[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['hq', 'activityReviews'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getCampusTopics(schoolId: Id): CampusTopic[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['campus', schoolId, 'topics'])
  return safeParse<CampusTopic[]>(window.localStorage.getItem(key)) ?? []
}

export function setCampusTopics(schoolId: Id, topics: CampusTopic[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['campus', schoolId, 'topics'])
  window.localStorage.setItem(key, safeStringify(topics))
}

export function getCampusPosts(schoolId: Id): CampusPost[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['campus', schoolId, 'posts'])
  return safeParse<CampusPost[]>(window.localStorage.getItem(key)) ?? []
}

export function setCampusPosts(schoolId: Id, posts: CampusPost[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['campus', schoolId, 'posts'])
  window.localStorage.setItem(key, safeStringify(posts))
}

export function getVolunteerTeacherApplications(schoolId: Id): VolunteerTeacherApplication[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['association', schoolId, 'teacherApplications'])
  return safeParse<VolunteerTeacherApplication[]>(window.localStorage.getItem(key)) ?? []
}

export function setVolunteerTeacherApplications(schoolId: Id, items: VolunteerTeacherApplication[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'teacherApplications'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getVolunteerTeachers(schoolId: Id): VolunteerTeacherProfile[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['association', schoolId, 'teachers'])
  return safeParse<VolunteerTeacherProfile[]>(window.localStorage.getItem(key)) ?? []
}

export function setVolunteerTeachers(schoolId: Id, items: VolunteerTeacherProfile[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'teachers'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getAssociationRuleSet(schoolId: Id): AssociationRuleSet | null {
  if (typeof window === 'undefined') return null
  const key = getKey(['association', schoolId, 'ruleSet'])
  return safeParse<AssociationRuleSet>(window.localStorage.getItem(key))
}

export function setAssociationRuleSet(schoolId: Id, value: AssociationRuleSet) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'ruleSet'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getAssociationMallItems(schoolId: Id): AssociationMallItem[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['association', schoolId, 'mall'])
  return safeParse<AssociationMallItem[]>(window.localStorage.getItem(key)) ?? []
}

export function setAssociationMallItems(schoolId: Id, value: AssociationMallItem[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'mall'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getVolunteerHourGrants(schoolId: Id): VolunteerHourGrant[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['association', schoolId, 'hourGrants'])
  return safeParse<VolunteerHourGrant[]>(window.localStorage.getItem(key)) ?? []
}

export function setVolunteerHourGrants(schoolId: Id, value: VolunteerHourGrant[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['association', schoolId, 'hourGrants'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getAidVerificationBatches(aidSchoolId: Id): AidVerificationBatch[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['aid', aidSchoolId, 'batches'])
  return safeParse<AidVerificationBatch[]>(window.localStorage.getItem(key)) ?? []
}

export function setAidVerificationBatches(aidSchoolId: Id, value: AidVerificationBatch[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['aid', aidSchoolId, 'batches'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getAidVerificationRequests(aidSchoolId: Id): AidStudentVerificationRequest[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['aid', aidSchoolId, 'requests'])
  return safeParse<AidStudentVerificationRequest[]>(window.localStorage.getItem(key)) ?? []
}

export function setAidVerificationRequests(aidSchoolId: Id, value: AidStudentVerificationRequest[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['aid', aidSchoolId, 'requests'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getAidSafetyConfig(aidSchoolId: Id): AidSafetyConfig | null {
  if (typeof window === 'undefined') return null
  const key = getKey(['aid', aidSchoolId, 'safetyConfig'])
  return safeParse<AidSafetyConfig>(window.localStorage.getItem(key))
}

export function setAidSafetyConfig(aidSchoolId: Id, value: AidSafetyConfig) {
  if (typeof window === 'undefined') return
  const key = getKey(['aid', aidSchoolId, 'safetyConfig'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getVerificationRequests(): VerificationRequest[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['verification', 'requests'])
  return safeParse<VerificationRequest[]>(window.localStorage.getItem(key)) ?? []
}

export function setVerificationRequests(value: VerificationRequest[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['verification', 'requests'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getSystemEvents(): SystemEvent[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['system', 'events'])
  return safeParse<SystemEvent[]>(window.localStorage.getItem(key)) ?? []
}

export function setSystemEvents(value: SystemEvent[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['system', 'events'])
  window.localStorage.setItem(key, safeStringify(value))
}

export async function getOrganizations(): Promise<OrganizationEntry[]> {
  try {
    const raw: any = await apiClient.get('/core/orgs?require_admin=true')
    if (!Array.isArray(raw)) return []
    return raw.map((o: any) => ({
      id: String(o.id ?? ''),
      type: o.type,
      displayName: String(o.display_name ?? o.displayName ?? ''),
      schoolId: o.school_id ?? o.schoolId,
      aidSchoolId: o.aid_school_id ?? o.aidSchoolId,
      certified: Boolean(o.certified),
      createdAt: String(o.created_at ?? o.createdAt ?? ''),
    })).filter((o: OrganizationEntry) => Boolean(o.id && o.type && o.displayName))
  } catch (e) {
    console.error(e)
    return []
  }
}

export function setOrganizations(value: OrganizationEntry[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['orgs'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getActiveCampusSchoolId(): Id | null {
  if (typeof window === 'undefined') return null
  const key = getKey(['campus', 'activeSchool'])
  const value = safeParse<{ schoolId: Id }>(window.localStorage.getItem(key))
  return value?.schoolId ?? null
}

export function setActiveCampusSchoolId(schoolId: Id | null) {
  if (typeof window === 'undefined') return
  const key = getKey(['campus', 'activeSchool'])
  if (!schoolId) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(key, safeStringify({ schoolId }))
}

export function getCommunityPosts(): CommunityPost[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['community', 'posts'])
  return safeParse<CommunityPost[]>(window.localStorage.getItem(key)) ?? []
}

export function setCommunityPosts(value: CommunityPost[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['community', 'posts'])
  window.localStorage.setItem(key, safeStringify(value))
}

export function getQaQuestions(): QaQuestion[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['qa', 'questions'])
  return safeParse<QaQuestion[]>(window.localStorage.getItem(key)) ?? []
}

export function setQaQuestions(items: QaQuestion[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['qa', 'questions'])
  window.localStorage.setItem(key, safeStringify(items))
}

export function getQaAnswers(questionId: Id): QaAnswer[] {
  if (typeof window === 'undefined') return []
  const key = getKey(['qa', 'answers', questionId])
  return safeParse<QaAnswer[]>(window.localStorage.getItem(key)) ?? []
}

export function setQaAnswers(questionId: Id, answers: QaAnswer[]) {
  if (typeof window === 'undefined') return
  const key = getKey(['qa', 'answers', questionId])
  window.localStorage.setItem(key, safeStringify(answers))
}
