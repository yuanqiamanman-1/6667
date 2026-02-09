'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BadgeCheck, FileCheck, Settings2, ShieldAlert, Users } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import {
  getAidSafetyConfig,
  getAidVerificationBatches,
  nowIso,
  setAidSafetyConfig,
  setAidVerificationBatches,
  uid,
  type AidSafetyConfig,
  type AidVerificationBatch,
  type AidVerificationStatus,
} from '@/lib/client-store'

type AidVerificationRequestItem = {
  id: string
  studentName: string
  studentSchool: string
  evidences: Array<{ id?: string; name: string }>
  note?: string
  status: AidVerificationStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

function statusBadge(status: AidVerificationStatus) {
  if (status === 'approved') return <Badge className="bg-green-500/10 text-green-600">已通过</Badge>
  if (status === 'rejected') return <Badge variant="destructive">已驳回</Badge>
  return <Badge variant="secondary">待审核</Badge>
}

export default function AidSchoolDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const isAidAdmin = Boolean(user?.admin_roles?.some(r => r.role_code === 'aid_school_admin'))
  const [requests, setRequests] = useState<AidVerificationRequestItem[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [applicantOpen, setApplicantOpen] = useState(false)
  const [applicantLoading, setApplicantLoading] = useState(false)
  const [applicant, setApplicant] = useState<any | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null)
  const [revoking, setRevoking] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchDraft, setBatchDraft] = useState({ title: '', description: '', students: '' })

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isAidAdmin) {
      router.push('/home')
    }
  }, [isLoading, isLoggedIn, isAidAdmin, router])

  const aidSchoolId = user?.school ?? ''

  useEffect(() => {
    if (!aidSchoolId) return
    const batches = getAidVerificationBatches(aidSchoolId)
    const config = getAidSafetyConfig(aidSchoolId)

    if (batches.length === 0) {
      const seed: AidVerificationBatch[] = [
        {
          id: uid('batch'),
          aidSchoolId,
          title: '2026 春季专项援助认证批次',
          description: '面向高一/高二受助学生统一核验名单与材料',
          createdAt: nowIso(),
          status: 'active',
          totalCount: 0,
          approvedCount: 0,
        },
      ]
      setAidVerificationBatches(aidSchoolId, seed)
    }

    if (!config) {
      const seed: AidSafetyConfig = {
        aidSchoolId,
        allowChat: true,
        allowVoice: false,
        allowVideo: false,
        allowedTimeWindow: '18:00-22:00',
        updatedAt: nowIso(),
        updatedBy: user?.name ?? '专项援助学校管理',
      }
      setAidSafetyConfig(aidSchoolId, seed)
    }

    setVersion(v => v + 1)
  }, [aidSchoolId, user?.name])

  useEffect(() => {
    if (!aidSchoolId) return
    if (activeTab !== 'students') return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setStudentsLoading(true)
    apiClient
      .get<any[]>('/aid/students', token)
      .then((raw) => setStudents(Array.isArray(raw) ? raw : []))
      .catch((e) => {
        console.error(e)
        setStudents([])
      })
      .finally(() => setStudentsLoading(false))
  }, [activeTab, aidSchoolId, version])

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase()
    if (!q) return students
    return students.filter((u) => {
      const text = [u.username, u.email, u.full_name, u.school_id, u.role].filter(Boolean).join(' ').toLowerCase()
      return text.includes(q)
    })
  }, [studentQuery, students])

  const revokeStudentAid = async (userId: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return false
    try {
      await apiClient.post(`/aid/students/${userId}/revoke`, {}, token)
      setStudents(prev => prev.filter(u => u.id !== userId))
      return true
    } catch (e) {
      console.error(e)
      alert('撤销失败')
      return false
    }
  }

  const batches = useMemo(() => {
    if (!aidSchoolId) return []
    return [...getAidVerificationBatches(aidSchoolId)].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [aidSchoolId, version])

  useEffect(() => {
    if (!aidSchoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setRequestsLoading(true)
    apiClient
      .get<any[]>(`/association/verifications/requests?type=special_aid&school_id=${encodeURIComponent(aidSchoolId)}`, token)
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : []
        const mapped: AidVerificationRequestItem[] = list.map((r: any) => {
          const evidences = (() => {
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
          })()
          return {
            id: String(r.id ?? ''),
            studentName: String(r.applicant_name ?? ''),
            studentSchool: String(r.target_school_id ?? ''),
            evidences: evidences as any,
            note: r.note ? String(r.note) : undefined,
            status: String(r.status ?? 'pending') as AidVerificationStatus,
            createdAt: String(r.created_at ?? ''),
            reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
            reviewedBy: r.reviewed_by ? String(r.reviewed_by) : undefined,
            rejectedReason: r.rejected_reason ? String(r.rejected_reason) : undefined,
          }
        })
        setRequests(mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      })
      .catch((e) => {
        console.error(e)
        setRequests([])
      })
      .finally(() => setRequestsLoading(false))
  }, [aidSchoolId, version])

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length

  const config = useMemo(() => {
    if (!aidSchoolId) return null
    return getAidSafetyConfig(aidSchoolId)
  }, [aidSchoolId, version])

  const handleReview = async (id: string, status: AidVerificationStatus) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const rejected_reason = status === 'rejected' ? '材料不清晰，请补充上传' : undefined
    await apiClient.post(`/association/verifications/requests/${id}/review`, { status, rejected_reason }, token)
    setVersion(v => v + 1)
  }

  const openApplicant = async (requestId: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setApplicantOpen(true)
    setApplicantLoading(true)
    try {
      const u = await apiClient.get<any>(`/association/verifications/requests/${requestId}/applicant`, token)
      setApplicant(u)
    } catch (e) {
      console.error(e)
      setApplicant(null)
    } finally {
      setApplicantLoading(false)
    }
  }

  const handleCreateBatch = () => {
    if (!aidSchoolId) return
    const title = batchDraft.title.trim()
    const description = batchDraft.description.trim()
    if (!title) return

    const batchId = uid('batch')
    const batch: AidVerificationBatch = {
      id: batchId,
      aidSchoolId,
      title,
      description,
      createdAt: nowIso(),
      status: 'active',
      totalCount: 0,
      approvedCount: 0,
    }

    setAidVerificationBatches(aidSchoolId, [batch, ...getAidVerificationBatches(aidSchoolId)])

    setBatchDraft({ title: '', description: '', students: '' })
    setBatchOpen(false)
    setVersion(v => v + 1)
  }

  const handleSaveConfig = (partial: Partial<AidSafetyConfig>) => {
    if (!aidSchoolId) return
    const current = getAidSafetyConfig(aidSchoolId)
    if (!current) return
    setAidSafetyConfig(aidSchoolId, { ...current, ...partial, updatedAt: nowIso(), updatedBy: user?.name ?? current.updatedBy })
    setVersion(v => v + 1)
  }

  if (isLoading || !isLoggedIn || !user || !isAidAdmin) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">专项援助学校管理端</h1>
            <p className="mt-2 text-muted-foreground">{aidSchoolId} · 批次认证与安全配置</p>
          </div>
          <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <BadgeCheck className="h-4 w-4" />
                新建认证批次
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>新建认证批次</DialogTitle>
                <DialogDescription>支持批量导入学生名单（原型：每行一个姓名）</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>批次名称 *</Label>
                  <Input value={batchDraft.title} onChange={(e) => setBatchDraft({ ...batchDraft, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>说明（可选）</Label>
                  <Textarea value={batchDraft.description} onChange={(e) => setBatchDraft({ ...batchDraft, description: e.target.value })} className="min-h-24" />
                </div>
                <div className="space-y-2">
                  <Label>批量导入名单（可选）</Label>
                  <Textarea value={batchDraft.students} onChange={(e) => setBatchDraft({ ...batchDraft, students: e.target.value })} className="min-h-32" placeholder="每行一个姓名" />
                </div>
                <Button className="w-full" onClick={handleCreateBatch} disabled={!batchDraft.title.trim()}>
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">待审核</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">专项援助学生认证申请</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">已通过</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedCount}</div>
                <p className="text-xs text-muted-foreground">可开启专项援助模式</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">认证批次</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{batches.length}</div>
                <p className="text-xs text-muted-foreground">批次管理与名单导入</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="batches">批次管理</TabsTrigger>
            <TabsTrigger value="requests">认证审核</TabsTrigger>
            <TabsTrigger value="students">学生管理</TabsTrigger>
            <TabsTrigger value="safety">安全配置</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>批次概览</CardTitle>
                  <CardDescription>用于规模化认证与名单校验</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {batches.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无批次
                    </div>
                  ) : (
                    batches.slice(0, 5).map(b => (
                      <div key={b.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 font-medium text-foreground">{b.title}</div>
                          <Badge variant="outline">{b.status === 'active' ? '进行中' : '已关闭'}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{b.description || '—'}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{formatTime(b.createdAt)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>专项援助模式（默认）</CardTitle>
                  <CardDescription>更严格默认安全策略 + 更明确对接范围</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    通过认证的学生可开启专项援助模式：匹配优先推荐志愿者讲师池，通话能力更严格分层开放，站外引流更严格拦截。
                  </div>
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => setActiveTab('safety')}>
                    查看安全配置
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="batches" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>认证批次管理</CardTitle>
                <CardDescription>创建批次并导入名单，用于集中审核</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {batches.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无批次
                  </div>
                ) : (
                  batches.map(b => (
                    <div key={b.id} className="rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{b.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{b.description || '—'}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatTime(b.createdAt)}</div>
                        </div>
                        <Badge variant="outline">{b.status === 'active' ? '进行中' : '已关闭'}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>认证审核</CardTitle>
                <CardDescription>审核专项援助学生认证申请</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requestsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无申请
                  </div>
                ) : (
                  requests.map(r => (
                    <div key={r.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{r.studentName}</div>
                            {statusBadge(r.status)}
                            <Badge variant="outline">{r.studentSchool}</Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            材料：
                            {r.evidences.length === 0 ? '—' : (
                              <span className="ml-1">
                                {r.evidences.map((e, idx) => (
                                  <span key={`${r.id}-${idx}`}>
                                    {idx > 0 ? '、' : null}
                                    {e.id ? (
                                      <a className="underline" href={`${API_BASE_URL}/files/${e.id}`} target="_blank" rel="noreferrer">
                                        {e.name}
                                      </a>
                                    ) : (
                                      e.name
                                    )}
                                  </span>
                                ))}
                              </span>
                            )}
                          </div>
                          {r.note && <div className="mt-2 text-sm text-muted-foreground">说明：{r.note}</div>}
                          <div className="mt-2 text-xs text-muted-foreground">提交时间：{formatTime(r.createdAt)}</div>
                          {r.rejectedReason && <div className="mt-2 text-xs text-destructive">驳回原因：{r.rejectedReason}</div>}
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex shrink-0 gap-2">
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openApplicant(r.id)}>
                              用户
                            </Button>
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleReview(r.id, 'approved')}>
                              通过
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReview(r.id, 'rejected')}>
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

          <TabsContent value="students" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  援助学生管理
                </CardTitle>
                <CardDescription>管理本校专项援助学生账号（仅展示当前有效账号）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="搜索用户名/邮箱/姓名..."
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                />

                {studentsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无学生
                  </div>
                ) : (
                  filteredStudents.map((u) => {
                    const verification = (() => {
                      try {
                        const p = JSON.parse(String(u.profile ?? '{}'))
                        return p && typeof p === 'object' ? p.verification : undefined
                      } catch {
                        return undefined
                      }
                    })()
                    const aidStatus = verification?.aid ?? verification?.specialAid ?? verification?.special_aid

                    return (
                      <div key={u.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate font-medium text-foreground">{u.full_name || u.username}</div>
                            <Badge variant="outline">{u.username}</Badge>
                            {aidStatus && <Badge variant="secondary">援助认证：{String(aidStatus)}</Badge>}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">邮箱：{u.email || '—'}</div>
                          <div className="mt-1 text-xs text-muted-foreground">school_id：{u.school_id || '—'}</div>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRevokeTarget(u)}
                          >
                            撤销认证
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            <AlertDialog open={Boolean(revokeTarget)} onOpenChange={(open) => !open && setRevokeTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认撤销援助认证</AlertDialogTitle>
                  <AlertDialogDescription>
                    将撤销该学生的“专项援助学生认证”，账号不会被删除，但会回退为普通学生并需重新认证。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={revoking}>取消</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={revoking}
                    onClick={async () => {
                      if (!revokeTarget) return
                      setRevoking(true)
                      const target = revokeTarget
                      const ok = await revokeStudentAid(String(target.id))
                      setRevoking(false)
                      if (ok) setRevokeTarget(null)
                    }}
                  >
                    确认撤销
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="safety" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  对接安全配置
                </CardTitle>
                <CardDescription>配置专项援助模式下的沟通方式与时间窗</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!config ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无配置
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <div className="font-medium text-foreground">允许文字私聊</div>
                          <div className="text-xs text-muted-foreground">建议开启</div>
                        </div>
                        <Switch checked={config.allowChat} onCheckedChange={(checked) => handleSaveConfig({ allowChat: checked })} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <div className="font-medium text-foreground">允许语音</div>
                          <div className="text-xs text-muted-foreground">更高门槛</div>
                        </div>
                        <Switch checked={config.allowVoice} onCheckedChange={(checked) => handleSaveConfig({ allowVoice: checked })} />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <div className="font-medium text-foreground">允许视频</div>
                          <div className="text-xs text-muted-foreground">最严格</div>
                        </div>
                        <Switch checked={config.allowVideo} onCheckedChange={(checked) => handleSaveConfig({ allowVideo: checked })} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>允许对接时间窗</Label>
                      <Input value={config.allowedTimeWindow} onChange={(e) => handleSaveConfig({ allowedTimeWindow: e.target.value })} />
                      <div className="text-xs text-muted-foreground">示例：18:00-22:00（用于默认限制与提醒）</div>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
                      最近更新：{formatTime(config.updatedAt)} · {config.updatedBy}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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
