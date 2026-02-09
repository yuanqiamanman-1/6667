'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ClipboardList, Megaphone, ShoppingBag, ShieldCheck } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'
import {
  appendUserPointTxn,
  appendUserRedemption,
  getActiveCampusSchoolId,
  getAssociationMallItems,
  getAssociationRuleSet,
  getAssociationTasks,
  getUserPoints,
  getUserRedemptions,
  getVolunteerHourGrants,
  nowIso,
  setAssociationMallItems,
  setAssociationRuleSet,
  setUserPoints,
  setVolunteerHourGrants,
  uid,
  type AssociationMallItem,
  type AssociationRuleSet,
  type AssociationTask,
  type VolunteerHourGrant,
} from '@/lib/client-store'
import { apiClient } from '@/lib/api-client'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: 'public' | 'campus' | 'aid'
  audience?: string
  school_id?: string | null
  pinned: boolean
  created_at: string
}

export default function CampusAssociationPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const isVolunteerTeacher = canAccessTeacherFeatures(user)
  const isAuditUser = Boolean(user?.capabilities?.can_audit_cross_campus)
  const isAssocAdmin = Boolean(user?.admin_roles?.some(r => r.role_code === 'university_association_admin'))
  const [version, setVersion] = useState(0)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [redeemItemId, setRedeemItemId] = useState<string>('')
  const [redeemHoursOpen, setRedeemHoursOpen] = useState(false)
  const [redeemHours, setRedeemHours] = useState(2)
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcementsData, setAnnouncementsData] = useState<AnnouncementItem[]>([])

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    const schoolId = isAuditUser ? getActiveCampusSchoolId() : user?.school
    if (!schoolId) {
      router.push(isAuditUser ? '/campus' : '/verify')
      return
    }
    const allowed = Boolean(
      isAuditUser ||
        user?.capabilities?.can_access_association ||
        user?.capabilities?.can_manage_association ||
        user?.capabilities?.can_manage_university,
    )
    if (!allowed) router.push('/home')
  }, [isAuditUser, isLoading, isLoggedIn, router, user])

  const eligible = useMemo(() => {
    if (!user) return false
    if (isAuditUser) return true
    if (isVolunteerTeacher) return true
    return Boolean(
      user.capabilities?.can_access_association ||
        user.capabilities?.can_manage_association ||
        user.capabilities?.can_manage_university,
    )
  }, [isAuditUser, isVolunteerTeacher, user])

  const canViewTeachersOnly = useMemo(() => {
    if (!user) return false
    if (isAuditUser) return true
    if (user.capabilities?.can_manage_university || user.capabilities?.can_manage_association) return true
    if (isVolunteerTeacher) return true
    return Boolean(user.capabilities?.can_access_association)
  }, [isAuditUser, isVolunteerTeacher, user])

  const schoolId = (isAuditUser ? getActiveCampusSchoolId() : user?.school) ?? ''

  useEffect(() => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setAnnouncementsLoading(true)
    apiClient
      .get<AnnouncementItem[]>(`/core/announcements?scope=campus&school_id=${encodeURIComponent(schoolId)}`, token)
      .then((raw) => setAnnouncementsData(Array.isArray(raw) ? raw : []))
      .catch((e) => {
        console.error(e)
        setAnnouncementsData([])
      })
      .finally(() => setAnnouncementsLoading(false))
  }, [schoolId])

  const tasks = useMemo<AssociationTask[]>(() => {
    if (!schoolId) return []
    const items = getAssociationTasks(schoolId)
    return [...items].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'urgent' ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [schoolId, version])

  const announcements = useMemo<AnnouncementItem[]>(() => {
    const local = announcementsData
      .filter(a => a.scope === 'campus' && String(a.school_id || '') === schoolId)
      .filter(a => {
        if (!a.audience || a.audience === 'campus_all') return true
        if (a.audience === 'association_teachers_only') return canViewTeachersOnly
        return true
      })
    return [...local].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
    })
  }, [announcementsData, canViewTeachersOnly, schoolId])

  useEffect(() => {
    setVersion(v => v + 1)
  }, [schoolId])

  useEffect(() => {
    if (!schoolId || isAuditUser) return

    const currentRule = getAssociationRuleSet(schoolId)
    if (!currentRule) {
      const seed: AssociationRuleSet = {
        id: uid('rule'),
        schoolId,
        enabled: true,
        pointsPerHour: 100,
        weeklyHourLimit: 10,
        monthlyHourLimit: 30,
        cooldownDays: 7,
        minRating: 4.5,
        requireManualReview: true,
        version: 1,
        updatedAt: nowIso(),
        updatedBy: user?.name ?? '高校志愿者协会',
      }
      setAssociationRuleSet(schoolId, seed)
    }

    const currentMall = getAssociationMallItems(schoolId)
    if (currentMall.length === 0) {
      const seed: AssociationMallItem[] = [
        {
          id: uid('mall'),
          schoolId,
          title: '校内培训证书（电子）',
          description: '完成指定培训与考核后可兑换',
          costPoints: 200,
          stock: 9999,
          enabled: true,
          createdAt: nowIso(),
        },
        {
          id: uid('mall'),
          schoolId,
          title: '志愿者徽章（校内）',
          description: '校内志愿服务纪念徽章',
          costPoints: 300,
          stock: 200,
          enabled: true,
          createdAt: nowIso(),
        },
      ]
      setAssociationMallItems(schoolId, seed)
    }
    setVersion(v => v + 1)
  }, [isAuditUser, schoolId, user?.name])

  const rule = useMemo(() => (schoolId ? getAssociationRuleSet(schoolId) : null), [schoolId, version])
  const mallItems = useMemo(() => {
    if (!schoolId) return []
    return getAssociationMallItems(schoolId)
      .filter(i => i.enabled)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [schoolId, version])

  const selectedRedeemItem = useMemo(
    () => mallItems.find(i => i.id === redeemItemId),
    [mallItems, redeemItemId],
  )

  const myPoints = useMemo(() => {
    if (!user) return 0
    return getUserPoints(user.id, user.points ?? 0)
  }, [user, version])

  const myRedemptions = useMemo(() => {
    if (!user) return []
    return getUserRedemptions(user.id)
  }, [user, version])

  const canRedeemHours = Boolean(!isAuditUser && user && canViewTeachersOnly && rule?.enabled)

  const handleRedeemItem = (itemId: string) => {
    if (!user || !schoolId) return
    if (isAuditUser) return
    const currentMall = getAssociationMallItems(schoolId)
    const item = currentMall.find(i => i.id === itemId)
    if (!item || !item.enabled) return
    if (item.stock <= 0) {
      alert('库存不足')
      return
    }
    const points = getUserPoints(user.id, user.points ?? 0)
    if (points < item.costPoints) {
      alert('积分不足')
      return
    }

    const now = nowIso()
    setUserPoints(user.id, points - item.costPoints)
    appendUserRedemption(user.id, {
      id: uid('redeem'),
      itemId: item.id,
      itemName: item.title,
      pointsCost: item.costPoints,
      createdAt: now,
    })
    appendUserPointTxn(user.id, {
      id: uid('pt'),
      type: 'redeem',
      title: `校内协会商城兑换：${item.title}`,
      points: -item.costPoints,
      createdAt: now,
      meta: { schoolId, itemId: item.id },
    })

    if (item.stock > 0 && item.stock < 9999) {
      setAssociationMallItems(schoolId, currentMall.map(i => (i.id === itemId ? { ...i, stock: Math.max(0, i.stock - 1) } : i)))
    }
    setVersion(v => v + 1)
    alert('兑换成功（原型）')
  }

  const handleRedeemVolunteerHours = () => {
    if (!user || !schoolId || isAuditUser) return
    if (!rule || !rule.enabled) return
    const hours = Math.max(0, Number(redeemHours || 0))
    if (hours <= 0) return
    const pointsRequired = Math.ceil(hours * rule.pointsPerHour)
    const points = getUserPoints(user.id, user.points ?? 0)
    if (points < pointsRequired) {
      alert('积分不足')
      return
    }

    const now = nowIso()
    const current = getVolunteerHourGrants(schoolId)
    const item: VolunteerHourGrant = {
      id: uid('grant'),
      schoolId,
      userId: user.id,
      userName: user.name,
      sourceType: 'redeem',
      sourceId: rule.id,
      hoursGranted: hours,
      pointsUsed: pointsRequired,
      ratioUsed: rule.pointsPerHour,
      ruleVersion: rule.version,
      status: rule.requireManualReview ? 'pending' : 'approved',
      createdAt: now,
      approvedBy: rule.requireManualReview ? undefined : (user.name ?? undefined),
      approvedAt: rule.requireManualReview ? undefined : now,
    }
    setVolunteerHourGrants(schoolId, [item, ...current])
    setUserPoints(user.id, points - pointsRequired)
    appendUserPointTxn(user.id, {
      id: uid('pt'),
      type: 'redeem',
      title: `积分兑换志愿时长：${hours} 小时`,
      points: -pointsRequired,
      createdAt: now,
      meta: { schoolId, pointsPerHour: rule.pointsPerHour, ruleVersion: rule.version },
    })
    setRedeemHoursOpen(false)
    setRedeemHours(2)
    setVersion(v => v + 1)
    alert(rule.requireManualReview ? '已提交兑换申请，等待审核（原型）' : '兑换成功（原型）')
  }

  if (isLoading || !isLoggedIn || !user) return null

  if (!eligible) {
    return (
      <div className="min-h-screen bg-muted/20 pt-16">
        <Navbar />
        <main className="container mx-auto px-4 py-10">
          <Card className="mx-auto max-w-2xl border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                需要通过高校志愿者协会认证
              </CardTitle>
              <CardDescription>进入志愿者协会板块前，需要完成讲师认证或协会认证</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                你可以在认证中心提交“志愿者讲师认证”申请，由本校志愿者协会审核通过后进入本板块。
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/verify" className="flex-1">
                  <Button className="w-full">前往认证中心</Button>
                </Link>
                <Link href="/campus" className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    返回高校入口
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">志愿者协会板块</h1>
            <p className="mt-2 text-muted-foreground">{schoolId} · 专项任务、公告与校内兑换机制</p>
          </div>
          {isAssocAdmin && (
            <Link href="/association/dashboard">
              <Button variant="outline" className="bg-transparent">进入协会控制台</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {isAuditUser && (
              <Card className="border-2">
                <CardContent className="pt-6 text-sm text-muted-foreground">当前为审计模式：仅查看，不可发布与变更数据。</CardContent>
              </Card>
            )}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  专项任务
                </CardTitle>
                <CardDescription>紧急任务优先展示；专项任务按时间倒序</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无任务
                  </div>
                ) : (
                  tasks.map(t => (
                    <motion.div key={t.id} whileHover={{ y: -2 }} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{t.title}</div>
                            <Badge variant={t.type === 'urgent' ? 'destructive' : 'secondary'} className="gap-1">
                              {t.type === 'urgent' ? (
                                <>
                                  <AlertTriangle className="h-3 w-3" />
                                  紧急
                                </>
                              ) : (
                                '专项'
                              )}
                            </Badge>
                            <Badge variant="outline">+{t.volunteerHoursGranted ?? 0} 小时</Badge>
                          </div>
                          <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t.description}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatTime(t.createdAt)}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  协会公告
                </CardTitle>
                <CardDescription>默认仅校内可见；部分公告可同步到全站公示栏</CardDescription>
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{a.pinned ? '【置顶】' : ''}{a.title}</div>
                            <Badge variant="outline">校内</Badge>
                          </div>
                          <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.content}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatTime(String(a.created_at || ''))}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  我的积分
                </CardTitle>
                <CardDescription>校内兑换与时长申请将从积分账户扣减</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="text-sm text-muted-foreground">当前积分</div>
                  <div className="text-2xl font-bold text-foreground">{myPoints}</div>
                </div>
                <Dialog open={redeemHoursOpen} onOpenChange={setRedeemHoursOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={!canRedeemHours}>
                      积分兑换志愿时长
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>积分兑换志愿时长</DialogTitle>
                      <DialogDescription>兑换规则由本校志愿者协会配置，部分申请需人工审核</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                        当前规则：{rule?.enabled ? `${rule.pointsPerHour} 积分 / 小时` : '未启用'}
                      </div>
                      <div className="space-y-2">
                        <Label>兑换时长（小时）</Label>
                        <Input
                          type="number"
                          min={1}
                          value={redeemHours}
                          onChange={(e) => setRedeemHours(Number(e.target.value || 0))}
                        />
                        <div className="text-xs text-muted-foreground">
                          预计扣减：{rule?.enabled ? Math.ceil(redeemHours * rule.pointsPerHour) : 0} 积分
                        </div>
                      </div>
                      <Button className="w-full" onClick={handleRedeemVolunteerHours} disabled={!canRedeemHours}>
                        提交兑换
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {isAssocAdmin && (
                  <Link href="/association/dashboard">
                    <Button variant="outline" className="w-full bg-transparent">去配置规则与商城</Button>
                  </Link>
                )}
                {isAuditUser && (
                  <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">审计模式下不允许进行兑换操作</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  校内协会商城
                </CardTitle>
                <CardDescription>仅展示本校上架项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {mallItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无商品
                  </div>
                ) : (
                  mallItems.slice(0, 6).map(item => (
                    <div key={item.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{item.title}</div>
                            <Badge variant="secondary">{item.costPoints} 积分</Badge>
                            <Badge variant="outline">库存 {item.stock}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{item.description}</div>
                        </div>
                        <Dialog open={redeemOpen && redeemItemId === item.id} onOpenChange={(open) => {
                          setRedeemOpen(open)
                          setRedeemItemId(open ? item.id : '')
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" disabled={isAuditUser || myPoints < item.costPoints || item.stock <= 0}>
                              兑换
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>确认兑换</DialogTitle>
                              <DialogDescription>兑换后将扣减积分并记录在个人中心（原型）</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="rounded-lg border border-border p-4">
                                <div className="font-medium text-foreground">{selectedRedeemItem?.title ?? item.title}</div>
                                <div className="mt-2 text-sm text-muted-foreground">{selectedRedeemItem?.description ?? item.description}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="secondary">{item.costPoints} 积分</Badge>
                                  <Badge variant="outline">我的积分 {myPoints}</Badge>
                                </div>
                              </div>
                              <Button className="w-full" onClick={() => handleRedeemItem(item.id)}>
                                确认兑换
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))
                )}
                {mallItems.length > 6 && (
                  <Button variant="outline" className="w-full bg-transparent" disabled>
                    查看更多（待完善）
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>我的兑换记录</CardTitle>
                <CardDescription>最近 5 条</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {myRedemptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无记录
                  </div>
                ) : (
                  myRedemptions.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{r.itemName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatTime(r.createdAt)}</div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">-{r.pointsCost}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
