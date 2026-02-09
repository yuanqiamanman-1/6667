'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search,
  MessageCircle,
  Bell,
  Settings,
  CheckCheck,
  Users,
  MessageSquare,
  HelpCircle,
  Award,
  Megaphone,
  Shield,
  Gift,
  AlertTriangle
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

function formatTime(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

const NOTIFICATION_CONFIG: Record<string, {
  title: string
  icon: React.ElementType
  iconColor: string
  getLink?: (payload: Record<string, any>) => string | undefined
  getContent: (payload: Record<string, any>) => string
}> = {
  // 社交互动类
  post_commented: {
    title: '帖子有新评论',
    icon: MessageSquare,
    iconColor: 'text-blue-500',
    getLink: (p) => p.scope === 'campus' && p.school_id ? `/campus/community?school_id=${p.school_id}&post=${p.post_id}` : `/community/posts/${p.post_id}`,
    getContent: (p) => `${p.commenter_name} 评论了你的帖子："${p.comment_preview}"`
  },
  // 问答互动类
  question_answered: {
    title: '问题有新回答',
    icon: HelpCircle,
    iconColor: 'text-purple-500',
    getLink: (p) => `/qa/${p.question_id}`,
    getContent: (p) => `${p.answerer_name} 回答了你的问题《${p.question_title}》`
  },
  answer_accepted: {
    title: '回答被采纳',
    icon: Award,
    iconColor: 'text-yellow-500',
    getLink: (p) => `/qa/${p.question_id}`,
    getContent: (p) => p.reward_points > 0 ? `你的回答被采纳，获得 ${p.reward_points} 积分奖励！` : '你的回答被采纳为最佳答案！'
  },
  // 公告类
  announcement_published: {
    title: '新公告',
    icon: Megaphone,
    iconColor: 'text-orange-500',
    getLink: () => '/home',
    getContent: (p) => `${p.publisher_name} 发布了公告："${p.title}"`
  },
  // 匹配与服务类
  match_offer_created: {
    title: '收到求助请求',
    icon: Users,
    iconColor: 'text-blue-500',
    getLink: (p) => p.conversation_id ? `/chat/${p.conversation_id}` : '/match/results',
    getContent: (p) => p.message || '有学生向你发起了求助请求'
  },
  match_offer_accepted: {
    title: '求助已被接受',
    icon: CheckCheck,
    iconColor: 'text-green-500',
    getLink: (p) => p.conversation_id ? `/chat/${p.conversation_id}` : '/match/results',
    getContent: (p) => p.message || '你的求助请求已被老师接受'
  },
  match_offer_declined: {
    title: '求助已被拒绝',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    getLink: () => '/match/help',
    getContent: (p) => p.reason || '你的求助请求已被拒绝，可尝试其他老师'
  },
  // 认证与审核类
  verification_reviewed: {
    title: '认证结果通知',
    icon: Shield,
    iconColor: 'text-green-500',
    getLink: () => '/profile',
    getContent: (p) => p.message || `你的${p.verification_type || '认证'}已审核通过`
  },
  verification_revoked: {
    title: '认证变更通知',
    icon: Shield,
    iconColor: 'text-orange-500',
    getLink: () => '/profile',
    getContent: (p) => p.reason || '你的认证状态已变更'
  },
  // 积分与奖励类
  points_earned: {
    title: '积分奖励',
    icon: Gift,
    iconColor: 'text-green-500',
    getLink: () => '/profile/points',
    getContent: (p) => `你获得了 ${p.points} 积分，来源：${p.source || '系统奖励'}`
  },
  // 默认
  default: {
    title: '系统通知',
    icon: Bell,
    iconColor: 'text-muted-foreground',
    getLink: () => undefined,
    getContent: (p) => p.message || '您有一条新消息'
  }
}

function getNotificationConfig(type: string) {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.default
}

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('chats')
  const [notificationView, setNotificationView] = useState('unread')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0)

  const loadConversations = async (token: string) => {
    setLoading(true)
    try {
      const raw = await apiClient.get<any[]>('/conversations', token)
      setItems(Array.isArray(raw) ? raw : [])
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const loadNotificationsUnreadCount = async (token: string) => {
    try {
      const r = await apiClient.get<{ unread_count: number }>(`/notifications/unread-count`, token)
      setNotificationsUnreadCount(Number(r?.unread_count ?? 0))
    } catch (e) {
      console.error(e)
    }
  }

  const loadNotifications = async (token: string) => {
    setNotificationsLoading(true)
    try {
      const raw = await apiClient.get<any[]>(`/notifications?limit=50`, token)
      setNotifications(Array.isArray(raw) ? raw : [])
    } catch (e) {
      console.error(e)
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  useEffect(() => {
    if (activeTab !== 'notifications') return
    setNotificationView('unread')
  }, [activeTab])

  useEffect(() => {
    if (isLoading || !isLoggedIn) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    loadConversations(token)
    const t = window.setInterval(() => loadConversations(token), 10_000)
    return () => window.clearInterval(t)
  }, [isLoading, isLoggedIn])

  useEffect(() => {
    if (isLoading || !isLoggedIn) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    loadNotificationsUnreadCount(token)
    const t = window.setInterval(() => loadNotificationsUnreadCount(token), 10_000)
    return () => window.clearInterval(t)
  }, [isLoading, isLoggedIn])

  useEffect(() => {
    if (isLoading || !isLoggedIn) return
    if (activeTab !== 'notifications') return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    loadNotifications(token)
    loadNotificationsUnreadCount(token)
    const t = window.setInterval(() => {
      loadNotifications(token)
      loadNotificationsUnreadCount(token)
    }, 10_000)
    return () => window.clearInterval(t)
  }, [activeTab, isLoading, isLoggedIn])

  const markRead = async (id: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    await apiClient.post(`/notifications/${encodeURIComponent(id)}/read`, {}, token)
    setNotifications((prev) => prev.map((n) => (String(n.id) === id ? { ...n, read_at: new Date().toISOString() } : n)))
    loadNotificationsUnreadCount(token)
  }

  const conversations = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase()
    const base = items.map((c) => ({
      id: String(c.id ?? ''),
      peerName: String(c.peer_user?.full_name || c.peer_user?.username || '会话'),
      lastMessage: c.last_message ? String(c.last_message) : '',
      lastMessageAt: c.last_message_at ? String(c.last_message_at) : undefined,
      peer: c.peer_user,
      unreadCount: Number(c?.unread_count ?? 0),
    }))
    if (!kw) return base
    return base.filter((c) => (c.peerName + ' ' + c.lastMessage).toLowerCase().includes(kw))
  }, [items, searchQuery])

  const unreadConversationsCount = useMemo(() => {
    return items.filter((c) => Number(c?.unread_count ?? 0) > 0).length
  }, [items])

  const unreadNotifications = notificationsUnreadCount
  const unreadList = useMemo(() => notifications.filter((n) => !n.read_at), [notifications])
  const readList = useMemo(() => notifications.filter((n) => n.read_at), [notifications])

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">消息</h1>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索消息..."
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="chats" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                会话
                {unreadConversationsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs">
                    {unreadConversationsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                通知
                {unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs">
                    {unreadNotifications}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Chats Tab */}
            <TabsContent value="chats" className="space-y-3">
              {loading ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  加载中...
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  暂无会话
                </div>
              ) : (
                conversations.map((conv, index) => (
                  <AnimatedCard key={conv.id} delay={index * 50}>
                    <Link href={`/chat/${conv.id}`}>
                      <Card className="border-2 transition-all hover:border-primary/50 hover:shadow-md">
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="relative">
                            <Avatar className="h-14 w-14 border-2 border-white shadow">
                              <AvatarImage src="/illustrations/avatar-teacher.jpg" />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {conv.peerName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{conv.peerName}</span>
                                {conv.peer?.role === 'volunteer_teacher' && (
                                  <Badge variant="secondary" className="text-xs">讲师</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{formatTime(conv.lastMessageAt)}</span>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="line-clamp-1 text-sm text-muted-foreground">
                                {conv.lastMessage || ' '}
                              </p>
                              <CheckCheck className="ml-2 h-4 w-4 text-primary" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </AnimatedCard>
                ))
              )}
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-3">
              <Tabs value={notificationView} onValueChange={setNotificationView}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="unread" className="gap-2">
                    未读
                    <Badge variant={unreadNotifications > 0 ? 'destructive' : 'outline'} className="px-2 py-0.5 text-xs">
                      {unreadNotifications}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="read" className="gap-2">
                    已读
                    <Badge variant={readList.length > 0 ? 'secondary' : 'outline'} className="px-2 py-0.5 text-xs">
                      {readList.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="unread" className="space-y-3 pt-3">
                  {notificationsLoading ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      加载中...
                    </div>
                  ) : unreadList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无未读通知
                    </div>
                  ) : (
                    unreadList.map((n, index) => {
                      const payload = n.payload || {}
                      const config = getNotificationConfig(n.type)
                      const IconComponent = config.icon
                      const link = config.getLink?.(payload)
                      return (
                        <AnimatedCard key={String(n.id)} delay={index * 30}>
                          <Card className="border-2 transition-all hover:border-primary/30">
                            <CardContent className="space-y-2 p-4">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-full bg-muted p-2 ${config.iconColor}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="font-medium text-foreground">{config.title}</div>
                                      <Badge variant="destructive" className="text-xs">新</Badge>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => markRead(String(n.id))}>
                                      标为已读
                                    </Button>
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {config.getContent(payload)}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{formatTime(String(n.created_at || ''))}</span>
                                    {link && (
                                      <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                                        <Link href={link}>查看详情</Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </AnimatedCard>
                      )
                    })
                  )}
                </TabsContent>

                <TabsContent value="read" className="space-y-3 pt-3">
                  {notificationsLoading ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      加载中...
                    </div>
                  ) : readList.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无已读通知
                    </div>
                  ) : (
                    readList.map((n, index) => {
                      const payload = n.payload || {}
                      const config = getNotificationConfig(n.type)
                      const IconComponent = config.icon
                      const link = config.getLink?.(payload)
                      return (
                        <AnimatedCard key={String(n.id)} delay={index * 30}>
                          <Card className="border-2 opacity-75">
                            <CardContent className="space-y-2 p-4">
                              <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-full bg-muted p-2 ${config.iconColor}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-foreground">{config.title}</div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {config.getContent(payload)}
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{formatTime(String(n.created_at || ''))}</span>
                                    {link && (
                                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                                        <Link href={link}>查看</Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </AnimatedCard>
                      )
                    })
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
