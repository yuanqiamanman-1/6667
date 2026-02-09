'use client'

import { Badge } from "@/components/ui/badge"

import { AvatarImage } from "@/components/ui/avatar"

import { CardHeader } from "@/components/ui/card"

import { TabsTrigger } from "@/components/ui/tabs"

import { TabsList } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { AvatarFallback } from "@/components/ui/avatar"

import { Avatar } from "@/components/ui/avatar"

import { CardContent } from "@/components/ui/card"

import { Card } from "@/components/ui/card"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Search,
  Plus,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  TrendingUp,
  Users,
  Hash
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { StaggerContainer, StaggerItem } from '@/components/animated/stagger-container'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { apiClient } from '@/lib/api-client'
import { useUser } from '@/lib/user-context'

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: 'public' | 'campus' | 'aid'
  audience: string
  school_id?: string | null
  pinned: boolean
  version?: string
  created_at: string
  created_by_user?: { id: string; username: string; full_name?: string | null } | null
}

const TRENDING_TOPICS = [
  { tag: '学习方法', count: 1234 },
  { tag: '高考加油', count: 892 },
  { tag: '云助学故事', count: 567 },
  { tag: '经验分享', count: 445 },
  { tag: '志愿者招募', count: 323 },
]

export default function CommunityPage() {
  const { user, isLoggedIn } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('recommend')
  const [composeText, setComposeText] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [annLoading, setAnnLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [announcementOpen, setAnnouncementOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null)

  const loadAnnouncements = async () => {
    setAnnLoading(true)
    try {
      const list = await apiClient.get<AnnouncementItem[]>(`/core/announcements?scope=public`)
      setAnnouncements(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error(e)
      setLoadError('网络波动：公告加载失败，可稍后重试')
    } finally {
      setAnnLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    const doLoad = async () => {
      setPostsLoading(true)
      try {
        const raw = await apiClient.get<any[]>(`/content/community/posts?skip=0&limit=50`)
        console.log('[Community] loadPosts raw:', raw)
        const list = Array.isArray(raw) ? raw : []
        setLoadError(null)
        setPosts(
          list.map((p) => {
            const authorName = String(p.author?.full_name || p.author?.username || '用户')
            const tags = (() => {
              try {
                const v = JSON.parse(String(p.tags ?? '[]'))
                return Array.isArray(v) ? v : []
              } catch {
                return []
              }
            })()
            return {
              id: String(p.id),
              author: { name: authorName, avatar: undefined, role: 'user', university: '', school: '' },
              content: String(p.content || ''),
              images: [],
              likes: Number(p.likes_count ?? 0),
              comments: Number(p.comments_count ?? 0),
              shares: Number(p.shares_count ?? 0),
              createdAt: new Date(String(p.created_at || '')).toLocaleString('zh-CN'),
              tags,
              liked: false,
              bookmarked: false,
            }
          }),
        )
      } catch (e) {
        console.error('[Community] loadPosts error:', e)
        setLoadError('网络波动：帖子加载失败')
      } finally {
        setPostsLoading(false)
      }
    }
    console.log('[Community] Initial load triggered')
    doLoad()
    loadAnnouncements()
  }, [])

  // 发帖后刷新列表
  const reloadPosts = async () => {
    try {
      const raw = await apiClient.get<any[]>(`/content/community/posts?skip=0&limit=50`)
      const list = Array.isArray(raw) ? raw : []
      setPosts(
        list.map((p) => {
          const authorName = String(p.author?.full_name || p.author?.username || '用户')
          const tags = (() => {
            try {
              const v = JSON.parse(String(p.tags ?? '[]'))
              return Array.isArray(v) ? v : []
            } catch {
              return []
            }
          })()
          return {
            id: String(p.id),
            author: { name: authorName, avatar: undefined, role: 'user', university: '', school: '' },
            content: String(p.content || ''),
            images: [],
            likes: Number(p.likes_count ?? 0),
            comments: Number(p.comments_count ?? 0),
            shares: Number(p.shares_count ?? 0),
            createdAt: new Date(String(p.created_at || '')).toLocaleString('zh-CN'),
            tags,
            liked: false,
            bookmarked: false,
          }
        }),
      )
      return true
    } catch (e) {
      console.error('[Community] reloadPosts error:', e)
      return false
    }
  }

  const announcementList = useMemo(() => {
    const items = announcements.filter(a => a.scope === 'public')
    return [...items].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
    })
  }, [announcements])

  const handleLike = (postId) => {
    setPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, liked: !post.liked } : post)),
    )
  }

  const handleBookmark = (postId) => {
    setPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, bookmarked: !post.bookmarked } : post)),
    )
  }

  const handlePublishPost = async () => {
    if (publishing) return
    const text = composeText.trim()
    if (text.length < 5) {
      alert('内容至少 5 个字')
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) {
      alert('请先登录')
      return
    }
    setPublishing(true)
    try {
      const created = await apiClient.post<any>(
        '/content/community/posts',
        { content: text, tags: JSON.stringify([]) },
        token,
      )
      setPosts((prev) => [
        {
          id: String(created?.id || `local_${Date.now()}`),
          author: { name: user?.name || '我', avatar: undefined, role: 'user', university: '', school: '' },
          content: text,
          images: [],
          likes: 0,
          comments: 0,
          shares: 0,
          createdAt: new Date().toLocaleString('zh-CN'),
          tags: [],
          liked: false,
          bookmarked: false,
        },
        ...prev,
      ])
      setComposeText('')
      const ok = await reloadPosts()
      if (!ok) {
        alert('发布成功，但列表刷新失败，请稍后手动刷新')
      }
    } catch (e: any) {
      console.error(e)
      const status = typeof e?.status === 'number' ? e.status : undefined
      if (status === 401) alert('登录已失效，请重新登录')
      else if (status === 403) alert('没有权限发布')
      else alert('发布失败，请稍后重试')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">社区广场</h1>
              <p className="mt-2 text-muted-foreground">
                分享学习心得，结识志同道合的伙伴
              </p>
            </div>

            {/* Create Post Card */}
            <Card className="mb-8 border-2">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-white">{(user?.name || '我').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input 
                      placeholder="分享你的学习心得、经验或想法..."
                      value={composeText}
                      onChange={(e) => setComposeText(e.target.value)}
                      className="mb-4 border-0 bg-muted/50 focus-visible:ring-0"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                          图片
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          话题
                        </Button>
                      </div>
                      <Button size="sm" onClick={handlePublishPost} disabled={publishing || composeText.trim().length < 5}>
                        {publishing ? '发布中...' : '发布'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="recommend" className="mb-6">
              <TabsList>
                <TabsTrigger value="recommend">推荐</TabsTrigger>
                <TabsTrigger value="following">关注</TabsTrigger>
                <TabsTrigger value="hot">热门</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Posts */}
            {loadError && (
              <div className="mb-4 rounded-lg border border-dashed border-border bg-white p-3 text-sm text-muted-foreground">
                {loadError}
              </div>
            )}
            <StaggerContainer className="space-y-6">
              {postsLoading ? (
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
                              <AvatarImage src={post.author?.avatar || "/placeholder.svg"} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {(post.author?.name || '?').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">
                                {post.author?.name || '匿名用户'}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{post.author?.university || post.author?.school || '未知学校'}</span>
                                <span>·</span>
                                <span>{post.createdAt}</span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="whitespace-pre-line leading-relaxed text-foreground">
                          {post.content}
                        </p>

                        {post.images.length > 0 && (
                          <div className="grid gap-2">
                            {post.images.map((img, i) => (
                              <div key={i} className="relative aspect-video overflow-hidden rounded-xl">
                                <img
                                  src={img || "/placeholder.svg"}
                                  alt=""
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleLike(post.id)}
                              className={`gap-2 ${post.liked ? 'text-red-500' : 'text-muted-foreground'}`}
                            >
                              <Heart className={`h-4 w-4 ${post.liked ? 'fill-current' : ''}`} />
                              {post.likes}
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
                              <Link href={`/community/posts/${encodeURIComponent(String(post.id))}`}>
                                <MessageCircle className="h-4 w-4" />
                                {post.comments}
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                              <Share2 className="h-4 w-4" />
                              {post.shares}
                            </Button>
                          </div>
                          <Button variant="outline" size="sm" className="bg-transparent" asChild>
                            <Link href={`/community/posts/${encodeURIComponent(String(post.id))}`}>
                              查看详情
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleBookmark(post.id)}
                            className={post.bookmarked ? 'text-primary' : 'text-muted-foreground'}
                          >
                            <Bookmark className={`h-4 w-4 ${post.bookmarked ? 'fill-current' : ''}`} />
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

          {/* Sidebar - Sticky */}
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    公示栏
                  </div>
                  <Badge variant="secondary" className="h-6 px-2 text-xs">
                    {announcementList.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {annLoading ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : announcementList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    暂无公告
                  </div>
                ) : (
                  announcementList.slice(0, 5).map((a) => (
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
                              {a.scope === 'public' ? '全站' : a.scope === 'campus' ? '校内' : '援助'}
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

            {/* Trending Topics */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  热门话题
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {TRENDING_TOPICS.map((topic, index) => (
                  <motion.div
                    key={topic.tag}
                    whileHover={{ x: 4 }}
                    className="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-foreground">#{topic.tag}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{topic.count}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Suggested Users */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5 text-primary" />
                  推荐关注
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: '数学达人', university: '北京大学', followers: 1234 },
                  { name: '英语小王子', university: '清华大学', followers: 892 },
                  { name: '物理老师', university: '复旦大学', followers: 567 },
                ].map((user) => (
                  <div key={user.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.university}</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      关注
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedAnnouncement?.title ?? '公告'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAnnouncement?.created_by_user?.full_name || selectedAnnouncement?.created_by_user?.username
                ? `发布方：${selectedAnnouncement.created_by_user.full_name || selectedAnnouncement.created_by_user.username} · `
                : ''}
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
