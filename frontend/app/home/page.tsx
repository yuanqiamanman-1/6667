'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, MessageCircle, Users, BookOpen, GraduationCap, 
  Heart, Bell, TrendingUp, Clock, Star, ChevronRight,
  HelpCircle, Award, Zap
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { StaggerContainer, StaggerItem } from '@/components/animated/stagger-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

export default function HomePage() {
  const router = useRouter()
  const { user, isLoggedIn } = useUser()
  const [greeting, setGreeting] = useState('你好')
  const [teacherOffers, setTeacherOffers] = useState<any[]>([])
  const [teacherOffersLoading, setTeacherOffersLoading] = useState(false)
  const [recentConversations, setRecentConversations] = useState<any[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    
    const roleCodes = user?.admin_roles?.map(r => r.role_code) ?? []
    if (user?.capabilities?.can_manage_platform) {
      if (roleCodes.includes('association_hq')) router.push('/hq/dashboard')
      else router.push('/admin')
      return
    }
    if (roleCodes.includes('university_association_admin')) {
      router.push('/association/dashboard')
      return
    }
    if (roleCodes.includes('university_admin')) {
      router.push('/university/dashboard')
      return
    }
    if (roleCodes.includes('aid_school_admin')) {
      router.push('/aid-school/dashboard')
      return
    }
  }, [isLoggedIn, user, router])

  const isTeacher = user ? canAccessTeacherFeatures(user) : false

  useEffect(() => {
    if (!isLoggedIn || !isTeacher) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    let alive = true
    const run = async () => {
      setTeacherOffersLoading(true)
      try {
        const raw = await apiClient.get<any[]>(`/match/offers/inbox`, token)
        if (!alive) return
        setTeacherOffers(Array.isArray(raw) ? raw : [])
      } catch (e) {
        console.error(e)
        if (!alive) return
        setTeacherOffers([])
      } finally {
        if (alive) setTeacherOffersLoading(false)
      }
    }
    run()
    const timer = setInterval(run, 10000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [isLoggedIn, isTeacher])

  useEffect(() => {
    if (!isLoggedIn || !user) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    apiClient
      .get<any[]>('/conversations', token)
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : []
        setRecentConversations(list.slice(0, 4))
      })
      .catch((e) => {
        console.error(e)
        setRecentConversations([])
      })
  }, [isLoggedIn, user?.id])

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadTotal(0)
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    let cancelled = false
    const load = async () => {
      try {
        const [n, c] = await Promise.all([
          apiClient.get<{ unread_count: number }>('/notifications/unread-count', token),
          apiClient.get<{ unread_conversations_count: number }>('/conversations/unread-count', token),
        ])
        if (cancelled) return
        const total = Number(n?.unread_count ?? 0) + Number(c?.unread_conversations_count ?? 0)
        setUnreadTotal(Math.max(0, total))
      } catch (e) {
        if (cancelled) return
        console.error(e)
      }
    }
    load()
    const t = window.setInterval(load, 10_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [isLoggedIn])

  if (!isLoggedIn || !user) {
    return null
  }

  const recentMatches = recentConversations.map((c, idx) => {
    const peerName = String(c?.peer_user?.full_name || c?.peer_user?.username || '会话')
    const lastAt = String(c?.last_message_at || '')
    const time = lastAt ? new Date(lastAt).toLocaleString('zh-CN') : ''
    const lastMessage = String(c?.last_message || '')
    return {
      id: String(c?.id || idx),
      name: peerName,
      subject: lastMessage ? lastMessage : '私聊会话',
      time,
      status: '会话',
      avatar: '/illustrations/avatar-teacher.jpg',
      conversationId: String(c?.id || ''),
    }
  })

  const hotQuestions = [
    { id: 1, title: '高二数学导数求极值的技巧', reward: 50, answers: 12 },
    { id: 2, title: '英语作文如何提高得分', reward: 30, answers: 8 },
    { id: 3, title: '物理电磁感应难点解析', reward: 80, answers: 5 },
  ]

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 pt-20">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  {greeting}，{user.name}
                </h1>
                <p className="text-muted-foreground">
                  {isTeacher ? '感谢你的付出，今天继续传递知识的力量' : '今天想学点什么？'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => router.push('/messages')}>
                <Bell className="h-4 w-4" />
                消息
                {unreadTotal > 0 && (
                  <Badge className="ml-1 bg-destructive text-destructive-foreground">{unreadTotal}</Badge>
                )}
              </Button>
              {!isTeacher && (
                <Button className="gap-2" asChild>
                  <Link href="/match/help">
                    <HelpCircle className="h-4 w-4" />
                    发起求助
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <StaggerContainer className="mb-8 grid gap-4 md:grid-cols-4">
          {isTeacher ? (
            <>
              <StaggerItem>
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.answerCount}</p>
                      <p className="text-sm text-muted-foreground">帮助学生</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.rating}</p>
                      <p className="text-sm text-muted-foreground">平均评分</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.points}</p>
                      <p className="text-sm text-muted-foreground">公益积分</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Lv.{user.level}</p>
                      <p className="text-sm text-muted-foreground">当前等级</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </>
          ) : (
            <>
              <StaggerItem>
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.helpCount}</p>
                      <p className="text-sm text-muted-foreground">求助次数</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-accent">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.stats.answerCount}</p>
                      <p className="text-sm text-muted-foreground">回答问题</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-secondary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/30 text-secondary-foreground">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{user.points}</p>
                      <p className="text-sm text-muted-foreground">学习积分</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
              <StaggerItem>
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">Lv.{user.level}</p>
                      <p className="text-sm text-muted-foreground">当前等级</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            </>
          )}
        </StaggerContainer>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Actions */}
            <AnimatedCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  快捷入口
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { icon: Users, label: '智能匹配', href: '/match/help', color: 'primary' },
                    { icon: MessageCircle, label: '问答广场', href: '/qa', color: 'accent' },
                    { icon: Heart, label: '社区交流', href: '/community', color: 'secondary' },
                    { icon: BookOpen, label: '知识库', href: '/knowledge', color: 'green-600' },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}>
                      <div className="flex flex-col items-center gap-2 rounded-xl p-4 transition-all hover:bg-muted">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${item.color}/10 text-${item.color}`}>
                          <item.icon className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Teacher: Pending Requests */}
            {isTeacher && (
              <AnimatedCard delay={100}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    待响应的求助
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                    <Link href="/messages">
                      查看通知 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacherOffersLoading ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        加载中...
                      </div>
                    ) : teacherOffers.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                        暂无待响应求助
                      </div>
                    ) : (
                      teacherOffers.map((offer) => {
                        const studentName = offer.student?.full_name || offer.student?.username || '学生'
                        const tags = (() => {
                          try {
                            const v = JSON.parse(String(offer.request?.tags ?? '[]'))
                            return Array.isArray(v) ? v : []
                          } catch {
                            return []
                          }
                        })()
                        return (
                          <div
                            key={String(offer.id)}
                            className="rounded-xl border p-4 transition-all hover:border-primary hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                    {studentName.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="truncate font-medium">{studentName}</div>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {tags.slice(0, 6).map((t: string) => (
                                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                {offer.request?.note && (
                                  <div className="mt-2 text-sm text-muted-foreground">说明：{String(offer.request.note)}</div>
                                )}
                              </div>
                              <div className="flex shrink-0 flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    const token = localStorage.getItem('token') || undefined
                                    if (!token) return
                                    const res = await apiClient.post<any>(
                                      `/match/offers/${encodeURIComponent(String(offer.id))}/accept`,
                                      {},
                                      token,
                                    )
                                    const cid = res?.conversation_id
                                    if (cid) router.push(`/chat/${encodeURIComponent(String(cid))}`)
                                  }}
                                >
                                  接受
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-transparent"
                                  onClick={async () => {
                                    const token = localStorage.getItem('token') || undefined
                                    if (!token) return
                                    await apiClient.post(`/match/offers/${encodeURIComponent(String(offer.id))}/decline`, {}, token)
                                    setTeacherOffers(prev => prev.filter(o => String(o.id) !== String(offer.id)))
                                  }}
                                >
                                  拒绝
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            )}

            {/* Student: Recent Matches */}
            {!isTeacher && (
              <AnimatedCard delay={100}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    最近的辅导
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                    <Link href="/messages">
                      查看全部 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentMatches.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        暂无会话
                      </div>
                    ) : (
                      recentMatches.map((match) => {
                        const content = (
                          <div className="flex items-center justify-between rounded-xl border p-4 transition-all hover:border-primary hover:shadow-sm">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={match.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{match.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{match.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {match.subject} · {match.time}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">{match.status}</Badge>
                          </div>
                        )
                        return match.conversationId ? (
                          <Link key={match.id} href={`/chat/${encodeURIComponent(match.conversationId)}`} className="block">
                            {content}
                          </Link>
                        ) : (
                          <div key={match.id}>{content}</div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </AnimatedCard>
            )}

            {/* Hot Questions */}
            <AnimatedCard delay={200}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  热门问答
                </CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                  <Link href="/qa">
                    查看全部 <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hotQuestions.map((q, index) => (
                    <Link key={q.id} href={`/qa/${q.id}`}>
                      <div className="flex items-center gap-4 rounded-xl p-3 transition-all hover:bg-muted">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {index + 1}
                        </span>
                        <div className="flex-1 truncate">
                          <div className="truncate font-medium">{q.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {q.answers} 回答 · {q.reward} 积分悬赏
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </AnimatedCard>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Level Progress */}
            <AnimatedCard delay={300}>
              <CardHeader>
                <CardTitle className="text-lg">等级进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Lv.{user.level}</span>
                  <span>Lv.{user.level + 1}</span>
                </div>
                <Progress value={65} className="h-2" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  还需 {350 - (user.points % 350)} 积分升级
                </p>
              </CardContent>
            </AnimatedCard>

            {/* Badges */}
            <AnimatedCard delay={400}>
              <CardHeader>
                <CardTitle className="text-lg">我的徽章</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {tag}
                    </Badge>
                  )) || (
                    <p className="text-sm text-muted-foreground">暂无徽章</p>
                  )}
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Community Activity */}
            <AnimatedCard delay={500}>
              <CardHeader>
                <CardTitle className="text-lg">社区动态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: '小雪', action: '回答了问题', content: '如何提高英语听力？', time: '5分钟前' },
                    { user: '陈老师', action: '发布了资料', content: '高考数学知识点汇总', time: '1小时前' },
                    { user: '小明', action: '发起了求助', content: '物理电路题求解', time: '2小时前' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {activity.user[0]}
                      </div>
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-muted-foreground"> {activity.action}</span>
                        <div className="truncate text-muted-foreground">{activity.content}</div>
                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="mt-4 w-full text-primary" asChild>
                  <Link href="/community">
                    查看更多动态
                  </Link>
                </Button>
              </CardContent>
            </AnimatedCard>
          </div>
        </div>
      </main>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}
