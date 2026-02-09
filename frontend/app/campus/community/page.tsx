'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bookmark, Heart, Hash, Megaphone, MessageCircle, MoreHorizontal, Search, Share2 } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { StaggerContainer, StaggerItem } from '@/components/animated/stagger-container'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/user-context'
import {
  getActiveCampusSchoolId,
} from '@/lib/client-store'
import { apiClient } from '@/lib/api-client'

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: 'public' | 'campus' | 'aid'
  audience: string
  school_id?: string | null
  pinned: boolean
  created_at: string
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function CampusCommunityPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const isAuditUser = Boolean(user?.capabilities?.can_audit_cross_campus)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('recommend')
  const [activeTopicId, setActiveTopicId] = useState<string>('all')
  const [compose, setCompose] = useState('')
  const [topics, setTopics] = useState<any[]>([])
  const [postsData, setPostsData] = useState<any[]>([])
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [annLoading, setAnnLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null)

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
    const allowed = Boolean(isAuditUser || user?.capabilities?.can_access_campus || user?.capabilities?.can_manage_university)
    if (!allowed) router.push('/home')
  }, [isAuditUser, isLoading, isLoggedIn, router, user])

  const schoolId = (isAuditUser ? getActiveCampusSchoolId() : user?.school) ?? ''

  // 用 ref 记录上一次的 schoolId，避免重复加载
  const prevSchoolIdRef = useRef<string>('')
  const loadingRef = useRef(false)

  useEffect(() => {
    // 如果 schoolId 没变化，不重复加载
    if (!schoolId || schoolId === prevSchoolIdRef.current) return
    // 防止并发加载
    if (loadingRef.current) return
    
    prevSchoolIdRef.current = schoolId
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    
    loadingRef.current = true
    setLoadingTopics(true)
    setLoadingPosts(true)
    setAnnLoading(true)
    console.log('[CampusCommunity] Loading data for school:', schoolId)
    
    Promise.all([
      apiClient.get<any[]>(`/content/campus/${encodeURIComponent(schoolId)}/topics?skip=0&limit=50`, token),
      apiClient.get<any[]>(`/content/campus/${encodeURIComponent(schoolId)}/posts?skip=0&limit=50`, token),
      apiClient.get<AnnouncementItem[]>(`/core/announcements?scope=campus&school_id=${encodeURIComponent(schoolId)}`, token),
    ])
      .then(([topicRaw, postRaw, annRaw]) => {
        console.log('[CampusCommunity] Loaded posts:', postRaw)
        const t = Array.isArray(topicRaw) ? topicRaw : []
        setTopics(t.filter((x) => x && x.enabled !== false))
        const list = Array.isArray(postRaw) ? postRaw : []
        // 如果后端返回空但本地有数据，保留本地数据
        if (list.length === 0 && postsData.length > 0) {
          console.warn('[CampusCommunity] Backend returned empty, keeping local posts')
          setLoadError(null)
        } else {
          setLoadError(null)
          setPostsData(
            list.map((p) => {
              const topicIds = (() => {
                try {
                  const v = JSON.parse(String(p.topic_ids ?? '[]'))
                  return Array.isArray(v) ? v : []
                } catch {
                  return []
                }
              })()
              return {
                id: String(p.id),
                schoolId: String(p.school_id),
                authorId: String(p.author_id),
                authorName: String(p.author?.full_name || p.author?.username || '用户'),
                authorAvatar: undefined,
                content: String(p.content || ''),
                topicIds,
                createdAt: String(p.created_at || ''),
                likes: Number(p.likes_count ?? 0),
                comments: Number(p.comments_count ?? 0),
                pinned: Boolean(p.pinned),
                visibility: String(p.visibility || 'visible'),
              }
            }),
          )
        }
        setAnnouncements(Array.isArray(annRaw) ? annRaw : [])
      })
      .catch((e) => {
        console.error('[CampusCommunity] Load error:', e)
        setLoadError('网络波动：数据加载失败，已保留上次内容')
      })
      .finally(() => {
        loadingRef.current = false
        setLoadingTopics(false)
        setLoadingPosts(false)
        setAnnLoading(false)
      })
  }, [schoolId])

  const posts = useMemo(() => {
    if (!schoolId) return []
    const all = postsData.filter(p => p.visibility === 'visible')
    let filtered = all

    if (activeTopicId !== 'all') {
      filtered = filtered.filter(p => p.topicIds.includes(activeTopicId))
    }

    const kw = searchQuery.trim()
    if (kw) {
      const topicNameById = new Map(topics.map(t => [t.id, t.name] as const))
      filtered = filtered.filter(p => {
        const topicText = p.topicIds.map(id => topicNameById.get(id)).filter(Boolean).join(' ')
        return p.content.includes(kw) || p.authorName.includes(kw) || topicText.includes(kw)
      })
    }

    if (activeTab === 'hot') {
      filtered = [...filtered].sort((a, b) => b.likes - a.likes)
    } else {
      filtered = [...filtered].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    }
    return filtered
  }, [activeTab, activeTopicId, schoolId, postsData, searchQuery, topics])

  const campusAnnouncements = useMemo<AnnouncementItem[]>(() => {
    if (!schoolId) return []
    const items = announcements
      .filter(a => a.scope === 'campus' && String(a.school_id || '') === schoolId)
      .filter(a => !a.audience || a.audience === 'campus_all')
    return [...items].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
    })
  }, [announcements, schoolId])

  const reloadPosts = async () => {
    if (!schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setLoadingPosts(true)
    try {
      const postRaw = await apiClient.get<any[]>(
        `/content/campus/${encodeURIComponent(schoolId)}/posts?skip=0&limit=50`,
        token,
      )
      console.log('[CampusCommunity] reloadPosts raw:', postRaw)
      const list = Array.isArray(postRaw) ? postRaw : []
      // 如果后端返回空但本地有数据，保留本地数据
      if (list.length === 0 && postsData.length > 0) {
        console.warn('[CampusCommunity] reloadPosts: Backend returned empty, keeping local')
        setLoadError(null)
        return
      }
      setLoadError(null)
      setPostsData(
        list.map((p) => {
          const topicIds = (() => {
            try {
              const v = JSON.parse(String(p.topic_ids ?? '[]'))
              return Array.isArray(v) ? v : []
            } catch {
              return []
            }
          })()
          return {
            id: String(p.id),
            schoolId: String(p.school_id),
            authorId: String(p.author_id),
            authorName: String(p.author?.full_name || p.author?.username || '用户'),
            authorAvatar: undefined,
            content: String(p.content || ''),
            topicIds,
            createdAt: String(p.created_at || ''),
            likes: Number(p.likes_count ?? 0),
            comments: Number(p.comments_count ?? 0),
            pinned: Boolean(p.pinned),
            visibility: String(p.visibility || 'visible'),
          }
        }),
      )
    } catch (e) {
      console.error('[CampusCommunity] reloadPosts error:', e)
      setLoadError('网络波动：刷新失败，已保留上次内容')
    } finally {
      setLoadingPosts(false)
    }
  }

  const handlePublish = async () => {
    if (isAuditUser) return
    if (!schoolId) return
    if (publishing) return
    const text = compose.trim()
    if (text.length < 5) return
    const topicIds = activeTopicId === 'all' ? [] : [activeTopicId]
    const token = localStorage.getItem('token') || undefined
    if (!token) {
      alert('请先登录')
      return
    }
    setPublishing(true)
    try {
      const created = await apiClient.post<any>(
        `/content/campus/${encodeURIComponent(schoolId)}/posts`,
        { content: text, topic_ids: JSON.stringify(topicIds) },
        token,
      )
      setPostsData((prev) => [
        {
          id: String(created?.id || `local_${Date.now()}`),
          schoolId,
          authorId: String(user?.id || ''),
          authorName: String(user?.name || '我'),
          authorAvatar: undefined,
          content: text,
          topicIds,
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
          pinned: false,
          visibility: 'visible',
        },
        ...prev,
      ])
      setCompose('')
      await reloadPosts()
    } catch (e: any) {
      console.error(e)
      const status = typeof e?.status === 'number' ? e.status : undefined
      if (status === 401) alert('登录已失效，请重新登录')
      else if (status === 403) alert('没有权限发布（请确认加入本校或完成认证）')
      else alert('发布失败，请稍后重试')
    } finally {
      setPublishing(false)
    }
  }

  const handleLike = (id: string) => {
    setPostsData(prev => prev.map(p => (p.id === id ? { ...p, likes: p.likes + 1 } : p)))
  }

  if (isLoading || !isLoggedIn || !user) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">校级共学社区</h1>
          <p className="mt-2 text-muted-foreground">{schoolId} · 校内交流与资源共建</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            {isAuditUser && (
              <Card className="mb-8 border-2">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  当前为审计模式：仅查看，不可发布内容与变更数据。
                </CardContent>
              </Card>
            )}
            <Card className="mb-8 border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || '/placeholder.svg'} />
                    <AvatarFallback className="bg-primary text-white">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      placeholder="分享校内学习方法、资源或想法..."
                      value={compose}
                      onChange={(e) => setCompose(e.target.value)}
                      className="mb-4 border-0 bg-muted/50 focus-visible:ring-0"
                      disabled={isAuditUser}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          话题
                        </Button>
                      </div>
                      <Button size="sm" onClick={handlePublish} disabled={isAuditUser || publishing || compose.trim().length < 5}>
                        {publishing ? '发布中...' : '发布'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="recommend">推荐</TabsTrigger>
                <TabsTrigger value="hot">热门</TabsTrigger>
              </TabsList>
            </Tabs>

            {loadError && (
              <div className="mb-4 rounded-lg border border-dashed border-border bg-white p-3 text-sm text-muted-foreground">
                {loadError}
              </div>
            )}
            <StaggerContainer className="space-y-6">
              {loadingPosts ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  加载中...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  暂无帖子
                </div>
              ) : (
                posts.map((post, index) => (
                  <StaggerItem key={post.id}>
                    <AnimatedCard delay={index * 50}>
                      <Card className="border-2 transition-all hover:shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                              <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {post.authorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">{post.authorName}</div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{formatTime(post.createdAt)}</span>
                                {post.pinned && <Badge variant="secondary" className="h-5 px-2 text-xs">置顶</Badge>}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="whitespace-pre-line leading-relaxed text-foreground">{post.content}</p>

                        <div className="flex flex-wrap gap-2">
                          {post.topicIds
                            .map(id => topics.find(t => t.id === id))
                            .filter(Boolean)
                            .map(t => (
                              <Badge key={t!.id} variant="secondary" className="cursor-pointer">
                                #{t!.name}
                              </Badge>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className="gap-2 text-muted-foreground"
                            >
                              <Heart className="h-4 w-4" />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
                              <Link href={`/campus/community/posts/${encodeURIComponent(String(post.id))}`}>
                                <MessageCircle className="h-4 w-4" />
                                {post.comments}
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                              <Share2 className="h-4 w-4" />
                              0
                            </Button>
                          </div>
                          <Button variant="outline" size="sm" className="bg-transparent" asChild>
                            <Link href={`/campus/community/posts/${encodeURIComponent(String(post.id))}`}>
                              查看详情
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                      </Card>
                    </AnimatedCard>
                  </StaggerItem>
                ))
              )}
            </StaggerContainer>

            {/* Load More */}
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" className="bg-transparent">
                加载更多
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Megaphone className="h-5 w-5 text-primary" />
                    本校公告
                  </div>
                  <Badge variant="secondary" className="h-6 px-2 text-xs">
                    {campusAnnouncements.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {annLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : campusAnnouncements.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    暂无公告
                  </div>
                ) : (
                  campusAnnouncements.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="w-full rounded-lg border border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
                      onClick={() => {
                        setSelectedAnnouncement(a)
                        setAnnouncementOpen(true)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-medium text-foreground">
                            {a.pinned ? '【置顶】' : ''}
                            {a.title}
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="h-5 px-2 text-[10px]">
                              校内
                            </Badge>
                            <span>{new Date(String(a.created_at || '')).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <Hash className="h-5 w-5 text-primary" />
                    校内话题
                  </div>
                  <Badge variant="secondary" className="h-6 px-2 text-xs">
                    {topics.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={activeTopicId === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => setActiveTopicId('all')}
                >
                  全部
                </Button>
                {topics.map((t) => (
                  <Button
                    key={t.id}
                    variant={activeTopicId === t.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => setActiveTopicId(t.id)}
                  >
                    #{t.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <Search className="h-5 w-5 text-primary" />
                  校内搜索
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="搜索内容/作者/话题..." />
                <div className="text-xs text-muted-foreground">
                  搜索范围仅限本校内容
                </div>
              </CardContent>
            </Card>

            <motion.div whileHover={{ y: -2 }}>
              <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/10">
                <CardContent className="pt-6">
                  <div className="text-sm font-medium text-foreground">校内资源专区</div>
                  <div className="mt-2 text-xs text-muted-foreground">资源精选与下载将在后续完善</div>
                  <Button variant="outline" size="sm" className="mt-4 w-full bg-transparent" disabled>
                    进入资源专区
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedAnnouncement?.title ?? '公告'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnnouncement?.created_at ? new Date(String(selectedAnnouncement.created_at)).toLocaleString('zh-CN') : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="whitespace-pre-line text-sm text-foreground">
            {selectedAnnouncement?.content ?? ''}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>关闭</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
