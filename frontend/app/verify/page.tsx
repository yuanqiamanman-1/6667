'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock, FileCheck, GraduationCap, Shield, Users, XCircle } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import {
  getOrganizations,
  type OrganizationEntry,
  type ReviewStatus,
} from '@/lib/client-store'

type CertKey = 'generalBasic' | 'universityStudent' | 'volunteerTeacher' | 'specialAid'
type UploadedFileRef = { id: string; name: string; size: number; mime?: string | null }

export default function VerifyPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading, refreshUser } = useUser()
  const [version, setVersion] = useState(0)
  const [openKey, setOpenKey] = useState<CertKey | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFileRef | null>(null)
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [aidSchoolName, setAidSchoolName] = useState('云南省昭通市第一中学')
  const [universitySchoolId, setUniversitySchoolId] = useState<string>('')
  const [associationOrgId, setAssociationOrgId] = useState<string>('')
  const [aidOrgId, setAidOrgId] = useState<string>('')
  const [tagsText, setTagsText] = useState('数学,英语,学习方法,写作,心理陪伴')
  const [timeSlotsText, setTimeSlotsText] = useState('周一晚,周三晚,周末下午')
  const [myRequests, setMyRequests] = useState<any[]>([])
  const [requestsVersion, setRequestsVersion] = useState(0)

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    refreshUser()
  }, [isLoading, isLoggedIn, refreshUser, router])

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token') || undefined
    apiClient.get<any[]>('/association/verifications/me/requests', token).then((items) => {
      setMyRequests(Array.isArray(items) ? items : [])
    }).catch((e) => {
      console.error(e)
      setMyRequests([])
    })
  }, [user, requestsVersion])

  const latestStatusByType = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of myRequests) {
      const t = String(r.type ?? '')
      const s = String(r.status ?? '')
      if (!map.has(t)) map.set(t, s)
    }
    return map
  }, [myRequests])

  const certStatus = (key: CertKey): ReviewStatus | 'none' => {
    if (!user) return 'none'
    if (key === 'universityStudent') {
      if (user.role === 'university_student' || user.verification.student === 'verified') return 'approved'
      const s = latestStatusByType.get('university_student')
      if (s === 'pending') return 'pending'
      if (s === 'rejected') return 'rejected'
      return 'none'
    }
    if (key === 'volunteerTeacher') {
      if (user.role === 'volunteer_teacher' || user.verification.teacher === 'verified') return 'approved'
      const s = latestStatusByType.get('volunteer_teacher')
      if (s === 'pending') return 'pending'
      if (s === 'rejected') return 'rejected'
      return 'none'
    }
    if (key === 'generalBasic') {
      const s = latestStatusByType.get('general_basic')
      if (s === 'pending') return 'pending'
      if (s === 'rejected') return 'rejected'
      return 'none'
    }
    if (key === 'specialAid') {
      if (user.role === 'special_aid_student' || user.verification.aid === 'verified') return 'approved'
      const s = latestStatusByType.get('special_aid')
      if (s === 'pending') return 'pending'
      if (s === 'rejected') return 'rejected'
      return 'none'
    }
    return 'none'
  }

  const statusMeta = (s: ReviewStatus | 'none') => {
    if (s === 'approved') return { label: '已通过', icon: CheckCircle2, badge: 'default' as const }
    if (s === 'pending') return { label: '审核中', icon: Clock, badge: 'secondary' as const }
    if (s === 'rejected') return { label: '已驳回', icon: XCircle, badge: 'destructive' as const }
    return { label: '未提交', icon: FileCheck, badge: 'outline' as const }
  }

  const certifications = useMemo(() => {
    return [
      {
        key: 'universityStudent' as const,
        title: '高校学生认证',
        desc: '用于进入本校高校板块（校级共学社区）',
        icon: GraduationCap,
      },
      {
        key: 'volunteerTeacher' as const,
        title: '志愿者讲师认证',
        desc: '提交材料后由本校志愿者协会审核，通过后进入匹配池',
        icon: Users,
      },
      {
        key: 'generalBasic' as const,
        title: '普通用户基础认证',
        desc: '用于提升信任等级与配额（过渡期由平台审核）',
        icon: Shield,
      },
      {
        key: 'specialAid' as const,
        title: '专项援助学生认证',
        desc: '由专项援助学校管理方批次审核，通过后开启专项援助模式',
        icon: Shield,
      },
    ]
  }, [])

  const [organizations, setOrganizations] = useState<OrganizationEntry[]>([])

  useEffect(() => {
    getOrganizations().then(setOrganizations)
  }, [openKey, version])

  const universities = useMemo(() => organizations.filter(o => o.type === 'university' && o.certified), [organizations])
  const associations = useMemo(() => organizations.filter(o => o.type === 'university_association' && o.certified), [organizations])
  const aidSchools = useMemo(() => organizations.filter(o => o.type === 'aid_school' && o.certified), [organizations])
  const verifiedSchoolId = user?.verification.student === 'verified' ? (user.school ?? '').trim() : ''
  const eligibleAssociations = useMemo(
    () => (verifiedSchoolId ? associations.filter(a => a.schoolId === verifiedSchoolId) : associations),
    [associations, verifiedSchoolId],
  )
  const associationTarget = useMemo<OrganizationEntry | undefined>(
    () => eligibleAssociations.find(o => o.id === associationOrgId),
    [associationOrgId, eligibleAssociations],
  )
  const aidTarget = useMemo<OrganizationEntry | undefined>(() => aidSchools.find(o => o.id === aidOrgId), [aidOrgId, aidSchools])

  useEffect(() => {
    if (!verifiedSchoolId) return
    if (eligibleAssociations.length === 0) return
    if (associationOrgId && eligibleAssociations.some(a => a.id === associationOrgId)) return
    setAssociationOrgId(eligibleAssociations[0].id)
  }, [associationOrgId, eligibleAssociations, verifiedSchoolId])

  const handleUpload = async (file: File | undefined) => {
    if (!file) {
      setUploadedFile(null)
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const res = await apiClient.postFormAuth<{ id: string; name: string; url: string; mime?: string | null; size: number }>(
        '/files/upload',
        formData,
        token,
      )
      setUploadedFile({ id: res.id, name: res.name, mime: res.mime, size: res.size })
    } catch (e: any) {
      console.error(e)
      alert(e?.message || '上传失败')
      setUploadedFile(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (key: CertKey) => {
    if (!user) return
    if (!uploadedFile) return

    const token = localStorage.getItem('token') || undefined

    if (key === 'universityStudent') {
      const target = universitySchoolId.trim()
      if (!target) {
        if (schoolName.trim()) {
          alert('该高校尚未入驻，请先走组织入驻/补录流程')
        } else {
          alert('请选择高校')
        }
        return
      }
      await apiClient.post(
        '/association/verifications/requests',
        { type: 'university_student', target_school_id: target, evidence_refs: JSON.stringify([uploadedFile]), note: note.trim() || undefined },
        token,
      )
    }

    if (key === 'volunteerTeacher') {
      if (user?.verification.student !== 'verified') {
        alert('请先完成高校学生认证')
        return
      }
      const school = verifiedSchoolId
      if (!school) return
      if (eligibleAssociations.length === 0) {
        alert('本校志愿者协会尚未入驻，无法发起讲师认证申请')
        return
      }
      const orgId = associationOrgId || eligibleAssociations[0].id
      const tags = tagsText.split(',').map(s => s.trim()).filter(Boolean)
      const timeSlots = timeSlotsText.split(',').map(s => s.trim()).filter(Boolean)

      await apiClient.post(
        '/association/verifications/requests',
        {
          type: 'volunteer_teacher',
          target_school_id: school,
          organization_id: orgId,
          evidence_refs: JSON.stringify([{ file: uploadedFile, tags, timeSlots }]),
          note: note.trim() || undefined,
        },
        token,
      )
    }

    if (key === 'generalBasic') {
      await apiClient.post(
        '/association/verifications/requests',
        { type: 'general_basic', target_school_id: (schoolName || user.school || '').trim() || undefined, evidence_refs: JSON.stringify([uploadedFile]), note: note.trim() || undefined },
        token,
      )
    }

    if (key === 'specialAid') {
      const target = (aidTarget?.aidSchoolId || aidSchoolName).trim()
      if (!target) return
      await apiClient.post(
        '/association/verifications/requests',
        { type: 'special_aid', target_school_id: target, organization_id: aidOrgId || undefined, evidence_refs: JSON.stringify([uploadedFile]), note: note.trim() || undefined },
        token,
      )
    }

    setVersion(v => v + 1)
    setRequestsVersion(v => v + 1)
    setOpenKey(null)
    setUploadedFile(null)
    setNote('')
    setSchoolName('')
    setUniversitySchoolId('')
    setAssociationOrgId('')
    setAidOrgId('')
  }

  if (!isLoggedIn) return null
  const uiDisabled = isLoading || !user

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/home" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
            <h1 className="text-3xl font-bold text-foreground">认证中心</h1>
            <p className="mt-2 text-muted-foreground">按需认证：每个认证项相互独立，根据你的目标选择提交</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  认证项目
                </CardTitle>
                <CardDescription>提交材料后进入对应管理端审核队列</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certifications.map((s) => {
                  const meta = statusMeta(certStatus(s.key))
                  const Icon = meta.icon
                  return (
                    <div key={s.key} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-foreground">{s.title}</div>
                            <Badge variant={meta.badge} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">{s.desc}</div>
                        </div>

                        <Dialog open={openKey === s.key} onOpenChange={(open) => setOpenKey(open ? s.key : null)}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 bg-transparent"
                              data-testid={`open-${s.key}`}
                              disabled={uiDisabled || certStatus(s.key) === 'approved' || certStatus(s.key) === 'pending'}
                            >
                              {certStatus(s.key) === 'approved' ? '已通过' : certStatus(s.key) === 'pending' ? '审核中' : certStatus(s.key) === 'rejected' ? '重新提交' : '提交材料'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>{s.title}</DialogTitle>
                              <DialogDescription>请上传相关证明并填写补充说明</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              {s.key === 'universityStudent' && (
                                <div className="space-y-2">
                                  <Label>选择高校</Label>
                                  <Combobox
                                    items={universities.map(u => ({
                                      value: u.schoolId ?? u.displayName,
                                      label: u.displayName,
                                      description: '已入驻高校',
                                      keywords: [u.universityName ?? u.displayName],
                                    }))}
                                    value={universitySchoolId}
                                    onChange={(v) => setUniversitySchoolId(v)}
                                    placeholder="搜索并选择高校..."
                                    searchPlaceholder="搜索高校..."
                                  />
                                  <div className="space-y-2">
                                    <Label>未找到？手动填写</Label>
                                    <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="如：北京大学" />
                                  </div>
                                </div>
                              )}
                              {s.key === 'generalBasic' && (
                                <div className="space-y-2">
                                  <Label>学校名称</Label>
                                  <Input
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    placeholder={user?.school || '如：云南省昭通市第一中学'}
                                  />
                                </div>
                              )}
                              {s.key === 'specialAid' && (
                                <div className="space-y-2">
                                  <Label>专项援助学校</Label>
                                  <Combobox
                                    items={aidSchools.map(a => ({
                                      value: a.id,
                                      label: a.displayName,
                                      description: '专项援助学校',
                                      keywords: [a.aidSchoolId ?? a.displayName],
                                    }))}
                                    value={aidOrgId}
                                    onChange={(v) => setAidOrgId(v)}
                                    placeholder="搜索并选择专项援助学校..."
                                    searchPlaceholder="搜索专项援助学校..."
                                  />
                                  <div className="space-y-2">
                                    <Label>未找到？手动填写</Label>
                                    <Input value={aidSchoolName} onChange={(e) => setAidSchoolName(e.target.value)} placeholder="如：云南省昭通市第一中学" />
                                  </div>
                                </div>
                              )}
                              {s.key === 'volunteerTeacher' && (
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>选择认证组织（高校志愿者协会）</Label>
                                    <Combobox
                                      items={eligibleAssociations.map(a => ({
                                        value: a.id,
                                        label: a.displayName,
                                        description: a.schoolId ? `归属高校：${a.schoolId}` : undefined,
                                        keywords: [a.schoolId ?? '', a.universityName ?? '', a.associationName ?? a.displayName].filter(Boolean),
                                      }))}
                                      value={associationOrgId}
                                      onChange={(v) => setAssociationOrgId(v)}
                                      placeholder="搜索并选择高校志愿者协会..."
                                      searchPlaceholder="搜索高校志愿者协会..."
                                    />
                                    <div className="text-xs text-muted-foreground">
                                      {verifiedSchoolId ? `已锁定本校：${verifiedSchoolId}（仅可向本校协会申请）` : '请先完成高校学生认证后再申请讲师认证'}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>擅长标签（逗号分隔）</Label>
                                    <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>可用时间槽（逗号分隔）</Label>
                                    <Input value={timeSlotsText} onChange={(e) => setTimeSlotsText(e.target.value)} />
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                <Label>上传文件 *</Label>
                                <Input
                                  type="file"
                                  onChange={(e) => handleUpload(e.target.files?.[0])}
                                />
                                {uploading && <div className="text-xs text-muted-foreground">上传中...</div>}
                                {uploadedFile && <div className="text-xs text-muted-foreground">已上传：{uploadedFile.name}</div>}
                              </div>
                              <div className="space-y-2">
                                <Label>补充说明（可选）</Label>
                                <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-28" placeholder="如：材料说明、联系人、补充信息等" />
                              </div>
                              <Button className="w-full" disabled={!uploadedFile || uploading} onClick={() => handleSubmit(s.key)}>
                                确认提交
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>我的认证信息</CardTitle>
                <CardDescription>当前登录用户：{user?.name ?? '-'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="text-sm text-muted-foreground">角色</div>
                  <div className="font-medium text-foreground">{user?.role ?? '-'}</div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="text-sm text-muted-foreground">学校/组织</div>
                  <div className="font-medium text-foreground">{user?.school ?? '-'}</div>
                </div>

                <Separator />

                <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    温馨提示
                  </div>
                  <div className="mt-2">审核结果以管理员实际审核为准，提交材料请确保清晰可辨。</div>
                  <div className="mt-1">如材料被驳回，可根据原因补充后重新提交。</div>
                </div>

                <Link href="/home">
                  <Button variant="outline" className="w-full bg-transparent">
                    返回首页
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
