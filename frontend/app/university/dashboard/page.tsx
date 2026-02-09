'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { BookOpen, Hash, Megaphone, Shield, Trash2 } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import {
  type ReviewStatus,
} from '@/lib/client-store'
import { ApiError } from '@/lib/api-client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

type AnnouncementAudience = 'public_all' | 'campus_all' | 'association_teachers_only'

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: 'public' | 'campus' | 'aid'
  audience: AnnouncementAudience | string
  school_id?: string | null
  pinned: boolean
  created_at: string
  created_by?: string
}

type CampusTopic = {
  id: string
  school_id: string
  name: string
  enabled: boolean
  created_at: string
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function UniversityAdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const [mounted] = useState(true)

  const [topicOpen, setTopicOpen] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topics, setTopics] = useState<CampusTopic[]>([])

  const [annOpen, setAnnOpen] = useState(false)
  const [annDraft, setAnnDraft] = useState({
    title: '',
    content: '',
    pinned: false,
    audience: 'campus_all' as AnnouncementAudience,
    syncToPublic: false,
  })
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({})
  const isUniversityAdmin = Boolean(user?.admin_roles?.some(r => r.role_code === 'university_admin'))
  const [applicantOpen, setApplicantOpen] = useState(false)
  const [applicantLoading, setApplicantLoading] = useState(false)
  const [applicant, setApplicant] = useState<any | null>(null)
  const [applicantReqId, setApplicantReqId] = useState<string | null>(null)
  const [verificationRequests, setVerificationRequests] = useState<Array<{
    id: string
    applicantName: string
    targetSchoolId: string
    evidences: Array<{ id?: string; name: string }>
    note?: string
    status: ReviewStatus
    createdAt: string
    rejectedReason?: string
  }>>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsVersion, setRequestsVersion] = useState(0)

  const [postsData, setPostsData] = useState<Array<{
    id: string
    authorName: string
    content: string
    pinned: boolean
    visibility: 'visible' | 'hidden'
    createdAt: string
  }>>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsVersion, setPostsVersion] = useState(0)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [deleteAllPostsOpen, setDeleteAllPostsOpen] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isUniversityAdmin) {
      router.push('/home')
    }
  }, [isLoading, isLoggedIn, isUniversityAdmin, router])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (!tab) return
    if (tab === 'overview' || tab === 'verification' || tab === 'posts' || tab === 'topics' || tab === 'announcements') {
      setActiveTab(tab)
    }
  }, [searchParams])

  const schoolId = user?.school ?? ''

  const loadTopics = async () => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setTopicsLoading(true)
    try {
      const raw = await apiClient.get<any[]>(`/content/campus/${encodeURIComponent(schoolId)}/topics`, token)
      const list = Array.isArray(raw) ? raw : []
      setTopics(
        [...list]
          .map((t) => ({
            id: String(t.id),
            school_id: String(t.school_id),
            name: String(t.name || ''),
            enabled: Boolean(t.enabled),
            created_at: String(t.created_at || ''),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
      )
    } catch (e) {
      console.error(e)
      setTopics([])
    } finally {
      setTopicsLoading(false)
    }
  }

  const loadAnnouncements = async () => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setAnnouncementsLoading(true)
    try {
      const [publicRaw, campusRaw] = await Promise.all([
        apiClient.get<any[]>(`/core/announcements?scope=public`, token),
        apiClient.get<any[]>(`/core/announcements?scope=campus&school_id=${encodeURIComponent(schoolId)}`, token),
      ])
      const merged = [...(Array.isArray(publicRaw) ? publicRaw : []), ...(Array.isArray(campusRaw) ? campusRaw : [])]
      const own = merged.filter((a) => String(a?.created_by || '') === String(user?.id || ''))
      setAnnouncements(
        [...own]
          .map((a) => ({
            id: String(a.id),
            title: String(a.title || ''),
            content: String(a.content || ''),
            scope: String(a.scope || 'campus') as any,
            audience: String(a.audience || 'campus_all') as any,
            school_id: a.school_id ? String(a.school_id) : null,
            pinned: Boolean(a.pinned),
            created_at: String(a.created_at || ''),
            created_by: a.created_by ? String(a.created_by) : undefined,
          }))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
            return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
          }),
      )
    } catch (e) {
      console.error(e)
      setAnnouncements([])
    } finally {
      setAnnouncementsLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return
    if (!schoolId) return
    if (!isUniversityAdmin) return
    loadTopics()
    loadAnnouncements()
  }, [isUniversityAdmin, mounted, schoolId, version, user?.id])

  const posts = useMemo(() => {
    return [...postsData].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [postsData])

  useEffect(() => {
    if (!mounted) return
    setVersion(v => v + 1)
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    if (!schoolId) return
    if (!isUniversityAdmin) return
    const token = localStorage.getItem('token') || undefined
    setRequestsLoading(true)
    apiClient
      .get<any[]>(
        `/association/verifications/requests?type=university_student&school_id=${encodeURIComponent(schoolId)}`,
        token,
      )
      .then((raw) => {
        if (!Array.isArray(raw)) {
          setVerificationRequests([])
          return
        }
        const mapped = raw
          .map((r: any) => {
            const evidences = (() => {
              try {
                const v = JSON.parse(String(r.evidence_refs ?? '[]'))
                if (!Array.isArray(v)) return []
                return v
                  .map((x: any) => {
                    if (typeof x === 'string') return { name: x }
                    if (x && typeof x === 'object') {
                      const id = x.id ? String(x.id) : undefined
                      const name = x.name ? String(x.name) : (x.file ? String(x.file) : (x.url ? String(x.url) : '材料'))
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
              applicantName: String(r.applicant_name ?? ''),
              targetSchoolId: String(r.target_school_id ?? ''),
              evidences,
              note: r.note ? String(r.note) : undefined,
              status: (String(r.status ?? 'pending') as ReviewStatus),
              createdAt: String(r.created_at ?? ''),
              rejectedReason: r.rejected_reason ? String(r.rejected_reason) : undefined,
            }
          })
          .filter((r: any) => Boolean(r.id))
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setVerificationRequests(mapped)
      })
      .catch((e) => {
        console.error(e)
        setVerificationRequests([])
      })
      .finally(() => setRequestsLoading(false))
  }, [isUniversityAdmin, mounted, requestsVersion, schoolId])

  useEffect(() => {
    if (!mounted) return
    if (!schoolId) return
    if (!isUniversityAdmin) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setPostsLoading(true)
    apiClient
      .get<any[]>(
        `/content/campus/${encodeURIComponent(schoolId)}/posts/admin?limit=200&include_hidden=true`,
        token,
      )
      .then((raw) => {
        if (!Array.isArray(raw)) {
          setPostsData([])
          return
        }
        setPostsData(
          raw
            .map((p: any) => {
              const id = String(p.id ?? '')
              if (!id) return null
              const author = p.author || {}
              const authorName = String(author.full_name || author.username || p.author_id || '—')
              const visibility = String(p.visibility || 'visible') as 'visible' | 'hidden'
              const pinned = Boolean(p.pinned)
              const createdAt = String(p.created_at || p.createdAt || '')
              const content = String(p.content || '')
              return { id, authorName, content, pinned, visibility, createdAt }
            })
            .filter(Boolean),
        )
      })
      .catch((e) => {
        console.error(e)
        setPostsData([])
      })
      .finally(() => setPostsLoading(false))
  }, [isUniversityAdmin, mounted, postsVersion, schoolId])

  const pendingVerification = verificationRequests.filter(r => r.status === 'pending').length

  const openApplicant = async (requestId: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setApplicantReqId(requestId)
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

  const visiblePosts = posts.filter(p => p.visibility === 'visible').length
  const hiddenPosts = posts.filter(p => p.visibility === 'hidden').length

  const handleCreateTopic = async () => {
    if (!schoolId) return
    const name = topicName.trim()
    if (!name) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    if (topics.some(t => t.name === name)) return
    try {
      await apiClient.post(`/content/campus/${encodeURIComponent(schoolId)}/topics`, { name, enabled: true }, token)
      setTopicName('')
      setTopicOpen(false)
      await loadTopics()
    } catch (e) {
      console.error(e)
      alert('创建话题失败')
    }
  }

  const handleToggleTopic = async (id: string, enabled: boolean) => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.patch(`/content/campus/${encodeURIComponent(schoolId)}/topics/${encodeURIComponent(id)}`, { enabled }, token)
      await loadTopics()
    } catch (e) {
      console.error(e)
      alert('更新失败')
    }
  }

  const handleHidePost = async (id: string) => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.patch(
        `/content/campus/${encodeURIComponent(schoolId)}/posts/${encodeURIComponent(id)}`,
        { visibility: 'hidden' },
        token,
      )
      setPostsVersion(v => v + 1)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        alert('帖子不存在或已被删除，将刷新列表')
        setPostsVersion(v => v + 1)
        return
      }
      if (e instanceof ApiError && e.status === 403) {
        alert('没有权限操作该帖子')
        return
      }
      console.error(e)
      alert('操作失败')
    }
  }

  const handleUnhidePost = async (id: string) => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.patch(
        `/content/campus/${encodeURIComponent(schoolId)}/posts/${encodeURIComponent(id)}`,
        { visibility: 'visible' },
        token,
      )
      setPostsVersion(v => v + 1)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        alert('帖子不存在或已被删除，将刷新列表')
        setPostsVersion(v => v + 1)
        return
      }
      if (e instanceof ApiError && e.status === 403) {
        alert('没有权限操作该帖子')
        return
      }
      console.error(e)
      alert('操作失败')
    }
  }

  const handleTogglePinPost = async (id: string) => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const current = postsData.find(p => p.id === id)
    const nextPinned = !current?.pinned
    try {
      await apiClient.patch(
        `/content/campus/${encodeURIComponent(schoolId)}/posts/${encodeURIComponent(id)}`,
        { pinned: nextPinned },
        token,
      )
      setPostsVersion(v => v + 1)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        alert('帖子不存在或已被删除，将刷新列表')
        setPostsVersion(v => v + 1)
        return
      }
      if (e instanceof ApiError && e.status === 403) {
        alert('没有权限操作该帖子')
        return
      }
      console.error(e)
      alert('操作失败')
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.delete(
        `/content/campus/${encodeURIComponent(schoolId)}/posts/${encodeURIComponent(id)}`,
        token,
      )
      setPostsVersion(v => v + 1)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        alert('帖子不存在或已被删除，将刷新列表')
        setPostsVersion(v => v + 1)
        return
      }
      if (e instanceof ApiError && e.status === 403) {
        alert('没有权限删除该帖子')
        return
      }
      console.error(e)
      alert('删除失败')
    } finally {
      setDeletePostId(null)
    }
  }

  const handleDeleteAllPosts = async () => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setDeletingAll(true)
    try {
      // 批量删除所有帖子
      for (const p of posts) {
        try {
          await apiClient.delete(
            `/content/campus/${encodeURIComponent(schoolId)}/posts/${encodeURIComponent(p.id)}`,
            token,
          )
        } catch (e) {
          console.error(`Failed to delete post ${p.id}:`, e)
        }
      }
      setPostsVersion(v => v + 1)
      alert('批量删除完成')
    } catch (e) {
      console.error(e)
      alert('批量删除失败')
    } finally {
      setDeletingAll(false)
      setDeleteAllPostsOpen(false)
    }
  }

  const handlePublishAnnouncement = async () => {
    if (!schoolId) return
    const title = annDraft.title.trim()
    const content = annDraft.content.trim()
    if (!title || !content) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const scope = annDraft.syncToPublic ? 'public' : 'campus'
    const audience: AnnouncementAudience = annDraft.syncToPublic ? 'public_all' : annDraft.audience
    try {
      await apiClient.post(
        `/core/announcements`,
        {
          title,
          content,
          scope,
          audience,
          school_id: scope === 'campus' ? schoolId : undefined,
          pinned: annDraft.pinned,
          version: '1.0',
        },
        token,
      )
      setAnnDraft({ title: '', content: '', pinned: false, audience: 'campus_all', syncToPublic: false })
      setAnnOpen(false)
      await loadAnnouncements()
      setVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('发布失败，请稍后重试')
    }
  }

  const updateRequest = async (id: string, status: ReviewStatus) => {
    const token = localStorage.getItem('token') || undefined
    try {
      await apiClient.post(
        `/association/verifications/requests/${id}/review`,
        { status, rejected_reason: status === 'rejected' ? (rejectReasonById[id]?.trim() || '材料不完整，请补充后重提') : undefined },
        token,
      )
      setRequestsVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('操作失败')
    }
  }

  if (isLoading || !isLoggedIn || !user || !isUniversityAdmin) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">高校账号控制台</h1>
            <p className="mt-2 text-muted-foreground">{schoolId} · 校级共学社区治理与资源精选</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={annOpen} onOpenChange={setAnnOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  发布校内公告
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>发布校内公告</DialogTitle>
                  <DialogDescription>高校账号可面向本校高校板块或本校已认证讲师发布公告</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>标题 *</Label>
                    <Input value={annDraft.title} onChange={(e) => setAnnDraft({ ...annDraft, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>内容 *</Label>
                    <Textarea value={annDraft.content} onChange={(e) => setAnnDraft({ ...annDraft, content: e.target.value })} className="min-h-32" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>校内可见人群</Label>
                      <Select
                        value={annDraft.audience}
                        onValueChange={(v: AnnouncementAudience) => setAnnDraft({ ...annDraft, audience: v })}
                        disabled={annDraft.syncToPublic}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="campus_all">本校高校板块可见</SelectItem>
                          <SelectItem value="association_teachers_only">仅本校已认证讲师可见</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>同步全站公示栏</Label>
                      <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="text-sm text-muted-foreground">同步后全站可见</div>
                        <Switch checked={annDraft.syncToPublic} onCheckedChange={(checked) => setAnnDraft({ ...annDraft, syncToPublic: checked })} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">置顶</div>
                      <div className="text-xs text-muted-foreground">置顶后在高校板块优先展示</div>
                    </div>
                    <Switch checked={annDraft.pinned} onCheckedChange={(checked) => setAnnDraft({ ...annDraft, pinned: checked })} />
                  </div>
                  <Button className="w-full" onClick={handlePublishAnnouncement} disabled={!annDraft.title.trim() || !annDraft.content.trim()}>
                    发布
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="bg-transparent" asChild>
              <Link href="/campus/community">进入校级共学社区</Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">可见帖子</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{visiblePosts}</div>
                <p className="text-xs text-muted-foreground">校内信息流展示</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">已隐藏帖子</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hiddenPosts}</div>
                <p className="text-xs text-muted-foreground">等待申诉或复核</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">待审核学生认证</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingVerification}</div>
                <p className="text-xs text-muted-foreground">高校学生认证申请</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="verification">学生认证</TabsTrigger>
            <TabsTrigger value="posts">帖子治理</TabsTrigger>
            <TabsTrigger value="topics">话题管理</TabsTrigger>
            <TabsTrigger value="announcements">校内公告</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    最近公告
                  </CardTitle>
                  <CardDescription>仅展示由高校账号发布的校内公告</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {announcements.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无公告
                    </div>
                  ) : (
                    announcements.slice(0, 5).map(a => (
                      <div key={a.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 font-medium text-foreground">{a.pinned ? '【置顶】' : ''}{a.title}</div>
                          <Badge variant="outline">
                            {a.scope === 'public'
                              ? '全站'
                              : a.audience === 'association_teachers_only'
                                ? '校内（讲师）'
                                : '校内（全体）'}
                          </Badge>
                        </div>
                        <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.content}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{formatTime(a.createdAt)}</div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    资源精选（占位）
                  </CardTitle>
                  <CardDescription>后续可接入校内知识库审核与精选机制</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                    资源精选、版权申诉、重复检测等能力将在后续完善。
                  </div>
                  <Button variant="outline" className="w-full bg-transparent" disabled>
                    进入资源治理
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>高校学生认证审核</CardTitle>
                <CardDescription>用于进入本校高校板块（未接入 SSO 时的人工核验兜底）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {requestsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : verificationRequests.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无申请
                  </div>
                ) : (
                  verificationRequests.map(r => (
                    <div key={r.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{r.applicantName}</div>
                            <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'}>
                              {r.status === 'pending' ? '待审核' : r.status === 'approved' ? '已通过' : '已驳回'}
                            </Badge>
                            <Badge variant="outline">{r.targetSchoolId}</Badge>
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
                          <div className="w-full max-w-xs space-y-2">
                            <Button variant="outline" className="w-full bg-transparent" onClick={() => openApplicant(r.id)}>
                              查看用户
                            </Button>
                            <Input
                              value={rejectReasonById[r.id] ?? ''}
                              onChange={(e) => setRejectReasonById(prev => ({ ...prev, [r.id]: e.target.value }))}
                              placeholder="驳回原因（可选）"
                            />
                            <div className="flex gap-2">
                              <Button className="flex-1" onClick={() => updateRequest(r.id, 'approved')}>
                                通过
                              </Button>
                              <Button variant="destructive" className="flex-1" onClick={() => updateRequest(r.id, 'rejected')}>
                                驳回
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <Dialog open={applicantOpen} onOpenChange={(open) => { setApplicantOpen(open); if (!open) setApplicantReqId(null) }}>
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
              {applicantReqId && (
                <div className="text-xs text-muted-foreground">申请ID：{applicantReqId}</div>
              )}
            </DialogContent>
          </Dialog>

          <TabsContent value="posts" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>帖子治理</CardTitle>
                    <CardDescription>支持置顶、隐藏与删除（原型：不含申诉流转）</CardDescription>
                  </div>
                  {posts.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      onClick={() => setDeleteAllPostsOpen(true)}
                      disabled={deletingAll}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingAll ? '删除中...' : '一键删除所有'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {postsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无帖子
                  </div>
                ) : (
                  posts.map(p => (
                    <div key={p.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-foreground">{p.authorName}</div>
                            {p.pinned && <Badge>置顶</Badge>}
                            <Badge variant={p.visibility === 'visible' ? 'secondary' : 'outline'}>
                              {p.visibility === 'visible' ? '可见' : '已隐藏'}
                            </Badge>
                          </div>
                          <div className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{p.content}</div>
                          <div className="mt-2 text-xs text-muted-foreground">{formatTime(p.createdAt)}</div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleTogglePinPost(p.id)}>
                            {p.pinned ? '取消置顶' : '置顶'}
                          </Button>
                          {p.visibility === 'visible' ? (
                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleHidePost(p.id)}>
                              隐藏
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => handleUnhidePost(p.id)}>
                              恢复
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1 bg-transparent text-destructive hover:bg-destructive/10" onClick={() => setDeletePostId(p.id)}>
                            <Trash2 className="h-4 w-4" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">话题管理</h3>
                <p className="text-sm text-muted-foreground">启用/停用话题，避免标签碎片化</p>
              </div>
              <Dialog open={topicOpen} onOpenChange={setTopicOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Hash className="h-4 w-4" />
                    新建话题
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>新建话题</DialogTitle>
                    <DialogDescription>话题将出现在校内社区发布与筛选中</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>话题名称 *</Label>
                      <Input value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="如：考研经验" />
                    </div>
                    <Button className="w-full" onClick={handleCreateTopic} disabled={!topicName.trim()}>
                      创建
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-primary" />
                  话题列表
                </CardTitle>
                <CardDescription>共 {topics.length} 个</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topicsLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : topics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无话题
                  </div>
                ) : (
                  topics.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">#{t.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{formatTime(String(t.created_at || ''))}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={t.enabled ? 'secondary' : 'outline'}>{t.enabled ? '启用' : '停用'}</Badge>
                        <Switch checked={t.enabled} onCheckedChange={(checked) => handleToggleTopic(t.id, checked)} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>校内公告</CardTitle>
                <CardDescription>发布主体：高校账号（校级共学社区负责人）</CardDescription>
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
                        <div className="min-w-0 font-medium text-foreground">{a.pinned ? '【置顶】' : ''}{a.title}</div>
                        <Badge variant="outline">
                          {a.scope === 'public'
                            ? '全站'
                            : a.audience === 'association_teachers_only'
                              ? '校内（讲师）'
                              : '校内（全体）'}
                        </Badge>
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.content}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{formatTime(String(a.created_at || ''))}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 删除单个帖子确认对话框 */}
        <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除帖子</AlertDialogTitle>
              <AlertDialogDescription>
                此操作不可撤销。确定要删除该帖子吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deletePostId && handleDeletePost(deletePostId)}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 一键删除所有帖子确认对话框 */}
        <AlertDialog open={deleteAllPostsOpen} onOpenChange={setDeleteAllPostsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认批量删除</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将删除所有 {posts.length} 条帖子，不可撤销。确定要继续吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingAll}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteAllPosts}
                disabled={deletingAll}
              >
                {deletingAll ? '删除中...' : '确认删除所有'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
