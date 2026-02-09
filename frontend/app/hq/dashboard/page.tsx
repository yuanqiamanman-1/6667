'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  ClipboardList,
  Megaphone,
  ShieldAlert,
  Users,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import { QaModerationTab } from '@/components/admin/qa-moderation-tab'
import { CommunityModerationTab } from '@/components/admin/community-moderation-tab'
import {
  getAssociationActivityReviews,
  getHqTasks,
  nowIso,
  setAssociationActivityReviews,
  setHqTasks,
  uid,
  type ActivityReviewStatus,
  type AssociationActivityReview,
  type AssociationOnboardingRequest,
  type HqTask,
  type OnboardingStatus,
  type RiskLevel,
  type TaskType,
} from '@/lib/client-store'

const RISK_LABEL: Record<RiskLevel, { label: string; variant: 'outline' | 'secondary' | 'destructive' }> = {
  low: { label: '低风险', variant: 'outline' },
  medium: { label: '中风险', variant: 'secondary' },
  high: { label: '高风险', variant: 'destructive' },
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function AssociationHqDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcementsData, setAnnouncementsData] = useState<any[]>([])
  const [onboarding, setOnboarding] = useState<AssociationOnboardingRequest[]>([])
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [applicantOpen, setApplicantOpen] = useState(false)
  const [applicantLoading, setApplicantLoading] = useState(false)
  const [applicant, setApplicant] = useState<any | null>(null)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    type: 'special' as TaskType,
    published: true,
  })

  const [annOpen, setAnnOpen] = useState(false)
  const [annDraft, setAnnDraft] = useState({
    title: '',
    content: '',
    pinned: false,
  })
  const isHq = Boolean(user?.admin_roles?.some(r => r.role_code === 'association_hq'))

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isHq) {
      router.push('/home')
    }
  }, [isHq, isLoading, isLoggedIn, router])

  useEffect(() => {
    const existing = getHqTasks()
    const reviews = getAssociationActivityReviews()

    if (existing.length === 0) {
      const seed: HqTask[] = [
        {
          id: uid('hq_task'),
          title: '全体任务：寒假线上助学行动',
          description: '面向各高校志愿者协会发布统一行动任务，要求完成培训、组建队伍并按计划开展线上答疑与陪伴服务。',
          type: 'special',
          createdAt: nowIso(),
          status: 'published',
        },
        {
          id: uid('hq_task'),
          title: '紧急任务：考试周答疑支援',
          description: '请各高校协会组织数学/英语方向讲师在晚间 19:00-22:00 提供集中答疑支持。',
          type: 'urgent',
          createdAt: nowIso(),
          status: 'published',
        },
      ]
      setHqTasks(seed)
    }

    if (reviews.length === 0) {
      const seed: AssociationActivityReview[] = [
        {
          id: uid('review'),
          schoolName: '北京大学',
          title: '校内讲师培训与考核（第3期）',
          activityType: '培训活动',
          timeRange: '2026-02-01 ~ 2026-02-07',
          riskLevel: 'low',
          status: 'approved',
          createdAt: nowIso(),
          reviewedAt: nowIso(),
          reviewedBy: user?.name ?? '协会总号',
        },
        {
          id: uid('review'),
          schoolName: '清华大学',
          title: '寒假线上助学行动：应急排班',
          activityType: '专项任务',
          timeRange: '2026-02-03 ~ 2026-02-15',
          riskLevel: 'medium',
          status: 'pending',
          createdAt: nowIso(),
        },
      ]
      setAssociationActivityReviews(seed)
    }
    setVersion(v => v + 1)
  }, [user?.name])

  const hqTasks = useMemo(() => {
    const items = getHqTasks()
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [version])

  useEffect(() => {
    if (!isLoggedIn || !isHq) return
    const token = localStorage.getItem('token') || undefined
    setOnboardingLoading(true)
    apiClient.get<any[]>('/admin/onboarding-requests', token).then((raw) => {
      if (!Array.isArray(raw)) {
        setOnboarding([])
        return
      }
      const mapped = raw.map((r: any) => ({
        id: String(r.id ?? ''),
        userId: String(r.user_id ?? ''),
        schoolName: String(r.school_name ?? ''),
        associationName: String(r.association_name ?? r.school_name ?? ''),
        contactName: String(r.contact_name ?? ''),
        contactEmail: String(r.contact_email ?? ''),
        attachments: (() => {
          try {
            const v = JSON.parse(String(r.evidence_refs ?? '[]'))
            if (!Array.isArray(v)) return []
            return v
              .map((x: any) => {
                if (typeof x === 'string') return { name: x }
                if (x && typeof x === 'object') {
                  const id = x.id ? String(x.id) : undefined
                  const name = x.name ? String(x.name) : (x.url ? String(x.url) : '材料')
                  return { id, name }
                }
                return null
              })
              .filter(Boolean)
          } catch {
            return []
          }
        })(),
        status: (String(r.status ?? 'pending') as OnboardingStatus),
        createdAt: String(r.created_at ?? ''),
        reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
        reviewedBy: r.reviewed_by ? String(r.reviewed_by) : undefined,
        rejectedReason: r.rejected_reason ? String(r.rejected_reason) : undefined,
      })).filter((i: AssociationOnboardingRequest) => Boolean(i.id))
      setOnboarding(mapped.sort((a: AssociationOnboardingRequest, b: AssociationOnboardingRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    }).catch((e) => {
      console.error(e)
      setOnboarding([])
    }).finally(() => setOnboardingLoading(false))
  }, [isHq, isLoggedIn, version])

  useEffect(() => {
    if (!isHq || !isLoggedIn) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setAnnouncementsLoading(true)
    apiClient
      .get<any[]>(`/core/announcements?scope=public`, token)
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : []
        const own = list.filter((a) => String(a?.created_by || '') === String(user?.id || ''))
        setAnnouncementsData(own)
      })
      .catch((e) => {
        console.error(e)
        setAnnouncementsData([])
      })
      .finally(() => setAnnouncementsLoading(false))
  }, [isHq, isLoggedIn, user?.id, version])

  const activityReviews = useMemo(() => {
    const items = getAssociationActivityReviews()
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [version])

  const announcements = useMemo(() => {
    const items = announcementsData
    return [...items].sort((a: any, b: any) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
    })
  }, [announcementsData])

  const pendingOnboarding = onboarding.filter(i => i.status === 'pending').length
  const pendingReviews = activityReviews.filter(i => i.status === 'pending').length
  const publishedTasks = hqTasks.filter(t => t.status === 'published').length

  const handleReviewOnboarding = async (id: string, status: OnboardingStatus) => {
    const token = localStorage.getItem('token') || undefined
    try {
      await apiClient.post(`/admin/onboarding-requests/${id}/review`, { status, rejected_reason: status === 'rejected' ? '材料不完整，请补充授权链路' : undefined }, token)
      setVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('审核失败')
    }
  }

  const openApplicant = async (requestId: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setApplicantOpen(true)
    setApplicantLoading(true)
    try {
      const u = await apiClient.get<any>(`/admin/onboarding-requests/${requestId}/applicant`, token)
      setApplicant(u)
    } catch (e) {
      console.error(e)
      setApplicant(null)
    } finally {
      setApplicantLoading(false)
    }
  }

  const handleReviewActivity = (id: string, status: ActivityReviewStatus) => {
    const current = getAssociationActivityReviews()
    setAssociationActivityReviews(
      current.map(i =>
        i.id === id
          ? {
              ...i,
              status,
              reviewedAt: nowIso(),
              reviewedBy: user?.name ?? '协会总号',
              rejectedReason: status === 'rejected' ? '存在站外引流风险，请修改活动说明模板' : undefined,
            }
          : i,
      ),
    )
    setVersion(v => v + 1)
  }

  const handleCreateTask = () => {
    const title = taskDraft.title.trim()
    const description = taskDraft.description.trim()
    if (!title || !description) return
    const current = getHqTasks()
    const item: HqTask = {
      id: uid('hq_task'),
      title,
      description,
      type: taskDraft.type,
      createdAt: nowIso(),
      status: taskDraft.published ? 'published' : 'draft',
    }
    setHqTasks([item, ...current])
    setTaskDraft({ title: '', description: '', type: 'special', published: true })
    setTaskOpen(false)
    setVersion(v => v + 1)
  }

  const handlePublishAnnouncement = async () => {
    const title = annDraft.title.trim()
    const content = annDraft.content.trim()
    if (!title || !content) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.post(
        `/core/announcements`,
        {
          title,
          content,
          scope: 'public',
          audience: 'public_all',
          pinned: annDraft.pinned,
          version: '1.0',
        },
        token,
      )
      setAnnDraft({ title: '', content: '', pinned: false })
      setAnnOpen(false)
      setVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('发布失败，请稍后重试')
    }
  }

  if (isLoading || !isLoggedIn || !user || !isHq) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">志愿者协会总号控制台</h1>
            <p className="mt-2 text-muted-foreground">发布总公告与全体任务，治理并审核高校志愿者协会</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={annOpen} onOpenChange={setAnnOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  <Megaphone className="mr-2 h-4 w-4" />
                  发布总公告
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>发布总公告</DialogTitle>
                  <DialogDescription>将同步展示到全站公示栏</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>标题 *</Label>
                    <Input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>内容 *</Label>
                    <Textarea
                      value={annDraft.content}
                      onChange={(e) => setAnnDraft({ ...annDraft, content: e.target.value })}
                      className="min-h-32"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">置顶</div>
                      <div className="text-xs text-muted-foreground">置顶后优先展示在公示栏</div>
                    </div>
                    <Switch checked={annDraft.pinned} onCheckedChange={(checked) => setAnnDraft({ ...annDraft, pinned: checked })} />
                  </div>
                  <Button className="w-full" onClick={handlePublishAnnouncement} disabled={!annDraft.title.trim() || !annDraft.content.trim()}>
                    发布
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  发布全体任务
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>发布全体任务</DialogTitle>
                  <DialogDescription>任务将面向所有高校志愿者协会展示</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>任务类型</Label>
                      <Select value={taskDraft.type} onValueChange={(v: TaskType) => setTaskDraft({ ...taskDraft, type: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">紧急任务</SelectItem>
                          <SelectItem value="special">专项任务</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">立即发布</div>
                        <div className="text-xs text-muted-foreground">关闭则保存为草稿</div>
                      </div>
                      <Switch
                        checked={taskDraft.published}
                        onCheckedChange={(checked) => setTaskDraft({ ...taskDraft, published: checked })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>标题 *</Label>
                    <Input value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>说明 *</Label>
                    <Textarea
                      value={taskDraft.description}
                      onChange={(e) => setTaskDraft({ ...taskDraft, description: e.target.value })}
                      className="min-h-32"
                    />
                  </div>
                  <Button className="w-full" onClick={handleCreateTask} disabled={!taskDraft.title.trim() || !taskDraft.description.trim()}>
                    创建
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">待审核入驻申请</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOnboarding}</div>
                <p className="text-xs text-muted-foreground">高校志愿者协会成立/入驻</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">待审核活动</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviews}</div>
                <p className="text-xs text-muted-foreground">高校协会活动/任务抽检</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">已发布全体任务</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publishedTasks}</div>
                <p className="text-xs text-muted-foreground">全体任务与统一行动</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="announcements">总公告</TabsTrigger>
            <TabsTrigger value="tasks">全体任务</TabsTrigger>
            <TabsTrigger value="onboarding">入驻审核</TabsTrigger>
            <TabsTrigger value="reviews">活动审核</TabsTrigger>
            <TabsTrigger value="qa">问答管理</TabsTrigger>
            <TabsTrigger value="community">社区管理</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    最新总公告
                  </CardTitle>
                  <CardDescription>默认同步到全站公示栏</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {announcementsLoading ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      加载中...
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无公告
                    </div>
                  ) : (
                    announcements.slice(0, 5).map(a => (
                      <div key={a.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 font-medium text-foreground">{a.pinned ? '【置顶】' : ''}{a.title}</div>
                          <Badge variant="outline" className="shrink-0">全站</Badge>
                        </div>
                        <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.content}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{formatTime(String(a.created_at || ''))}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    全体任务（最近）
                  </CardTitle>
                  <CardDescription>用于统一行动与专项治理</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hqTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 font-medium text-foreground">{t.title}</div>
                        <Badge variant={t.type === 'urgent' ? 'destructive' : 'secondary'} className="shrink-0">
                          {t.type === 'urgent' ? '紧急' : '专项'}
                        </Badge>
                      </div>
                      <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{t.description}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{formatTime(t.createdAt)}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  总公告管理
                </CardTitle>
                <CardDescription>发布后同步到全站公示栏，可追溯版本</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {announcementsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无公告
                  </div>
                ) : (
                  announcements.map(a => (
                    <div key={a.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 font-medium text-foreground">{a.title}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">全站</Badge>
                          {a.pinned && <Badge>置顶</Badge>}
                        </div>
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.content}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{formatTime(String(a.created_at || ''))}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  全体任务管理
                </CardTitle>
                <CardDescription>面向高校协会统一发布，支持紧急/专项分类</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {hqTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无任务
                  </div>
                ) : (
                  hqTasks.map(t => (
                    <div key={t.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{t.title}</div>
                            <Badge variant={t.type === 'urgent' ? 'destructive' : 'secondary'}>
                              {t.type === 'urgent' ? '紧急任务' : '专项任务'}
                            </Badge>
                            <Badge variant="outline">{t.status === 'published' ? '已发布' : t.status === 'draft' ? '草稿' : '已结束'}</Badge>
                          </div>
                          <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t.description}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatTime(t.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  高校协会入驻申请
                </CardTitle>
                <CardDescription>审核高校志愿者协会成立/入驻申请</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {onboarding.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无申请
                  </div>
                ) : (
                  onboarding.map(i => (
                    <div key={i.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{i.associationName}</div>
                            <Badge variant="outline">{i.schoolName}</Badge>
                            <Badge
                              variant={i.status === 'pending' ? 'secondary' : i.status === 'approved' ? 'default' : 'destructive'}
                            >
                              {i.status === 'pending' ? '待审核' : i.status === 'approved' ? '已通过' : '已驳回'}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            联系人：{i.contactName} · {i.contactEmail}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            附件：
                            {(i.attachments ?? []).length === 0 ? (
                              '无'
                            ) : (
                              <span className="ml-1">
                                {(i.attachments ?? []).map((a, idx) => (
                                  <span key={`${i.id}-${idx}`}>
                                    {idx > 0 ? '、' : null}
                                    {a.id ? (
                                      <a className="underline" href={`${API_BASE_URL}/files/${a.id}`} target="_blank" rel="noreferrer">
                                        {a.name}
                                      </a>
                                    ) : (
                                      a.name
                                    )}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">提交时间：{formatTime(i.createdAt)}</div>
                          {i.rejectedReason && (
                            <div className="mt-2 text-xs text-destructive">驳回原因：{i.rejectedReason}</div>
                          )}
                        </div>
                        {i.status === 'pending' && (
                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openApplicant(i.id)}>
                              申请人
                            </Button>
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleReviewOnboarding(i.id, 'approved')}>
                              通过
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReviewOnboarding(i.id, 'rejected')}>
                              驳回
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  高校协会活动审核与监控
                </CardTitle>
                <CardDescription>审核/抽检高校协会活动与任务执行情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activityReviews.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无记录
                  </div>
                ) : (
                  activityReviews.map(i => (
                    <div key={i.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{i.title}</div>
                            <Badge variant="outline">{i.schoolName}</Badge>
                            <Badge variant={RISK_LABEL[i.riskLevel].variant}>{RISK_LABEL[i.riskLevel].label}</Badge>
                            <Badge
                              variant={i.status === 'pending' ? 'secondary' : i.status === 'approved' ? 'default' : 'destructive'}
                            >
                              {i.status === 'pending' ? '待审核' : i.status === 'approved' ? '已通过' : '已驳回'}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{i.activityType} · {i.timeRange}</div>
                          <div className="mt-2 text-xs text-muted-foreground">提交时间：{formatTime(i.createdAt)}</div>
                          {i.rejectedReason && (
                            <div className="mt-2 text-xs text-destructive">驳回原因：{i.rejectedReason}</div>
                          )}
                        </div>
                        {i.status === 'pending' && (
                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleReviewActivity(i.id, 'approved')}>
                              通过
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReviewActivity(i.id, 'rejected')}>
                              驳回
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qa" className="space-y-6">
            <QaModerationTab />
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <CommunityModerationTab />
          </TabsContent>
        </Tabs>

        <Dialog open={applicantOpen} onOpenChange={setApplicantOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>用户信息</DialogTitle>
            </DialogHeader>
            {applicantLoading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : applicant ? (
              <div className="space-y-2 text-sm">
                <div>用户名：{applicant.username || '-'}</div>
                <div>姓名：{applicant.full_name || '-'}</div>
                <div>邮箱：{applicant.email || '-'}</div>
                <div>角色：{applicant.role || '-'}</div>
                <div>school_id：{applicant.school_id || '-'}</div>
                <div>入驻状态：{applicant.onboarding_status || '-'}</div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">无法获取用户信息</div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
