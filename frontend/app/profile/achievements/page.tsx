'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import type { ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Award, BookOpen, Heart, Shield, Star, Trophy } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'

type Achievement = {
  id: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  category: '学习' | '公益' | '社区'
  getProgress: (u: { points: number; stats: { helpCount: number; answerCount: number; postCount: number } }) => { current: number; target: number }
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'points_500',
    title: '学习新星',
    description: '累计获得 500 积分',
    icon: Star,
    category: '学习',
    getProgress: (u) => ({ current: u.points, target: 500 }),
  },
  {
    id: 'answers_10',
    title: '热心答主',
    description: '累计回答 10 个问题',
    icon: BookOpen,
    category: '学习',
    getProgress: (u) => ({ current: u.stats.answerCount, target: 10 }),
  },
  {
    id: 'help_10',
    title: '公益先锋',
    description: '累计帮助 10 位同学',
    icon: Trophy,
    category: '公益',
    getProgress: (u) => ({ current: u.stats.helpCount, target: 10 }),
  },
  {
    id: 'posts_10',
    title: '社区达人',
    description: '累计发布 10 条动态',
    icon: Heart,
    category: '社区',
    getProgress: (u) => ({ current: u.stats.postCount, target: 10 }),
  },
]

export default function AchievementsPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useUser()
  const isTeacher = canAccessTeacherFeatures(user)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  const computed = useMemo(() => {
    if (!user) return null
    const items = ACHIEVEMENTS.map(a => {
      const p = a.getProgress(user)
      const current = Math.min(p.current, p.target)
      const unlocked = p.current >= p.target
      const percent = p.target === 0 ? 100 : Math.round((current / p.target) * 100)
      return { ...a, progress: p, unlocked, percent }
    })
    const unlockedCount = items.filter(i => i.unlocked).length
    const total = items.length
    const overall = total === 0 ? 0 : Math.round((unlockedCount / total) * 100)
    return { items, unlockedCount, total, overall }
  }, [user])

  if (!isLoggedIn || !user || !computed) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回个人中心
            </Link>
            <h1 className="text-3xl font-bold text-foreground">我的成就</h1>
            <p className="mt-2 text-muted-foreground">
              {isTeacher ? '记录你的公益与分享里程碑' : '记录你的学习与成长里程碑'}
            </p>
          </div>
          <Link href="/profile/points">
            <Button variant="outline" className="bg-transparent">
              查看积分
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                成就进度
              </CardTitle>
              <CardDescription>已解锁 {computed.unlockedCount} / {computed.total}</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={computed.overall} className="h-2" />
              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>总体完成度</span>
                <span className="font-medium text-foreground">{computed.overall}%</span>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    当前积分
                  </div>
                  <div className="font-semibold text-primary">{user.points}</div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    认证状态
                  </div>
                  <Badge variant={user.verification.student === 'verified' || user.verification.teacher === 'verified' ? 'default' : 'secondary'}>
                    {user.verification.student === 'verified' || user.verification.teacher === 'verified' ? '已认证' : '未认证'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {(['学习', '公益', '社区'] as const).map(category => {
              const items = computed.items.filter(i => i.category === category)
              if (items.length === 0) return null
              return (
                <Card key={category} className="border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{category}成就</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    {items.map(item => (
                      <div key={item.id} className="rounded-xl border border-border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.unlocked ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                <item.icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground">{item.title}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{item.description}</div>
                              </div>
                            </div>
                          </div>
                          <Badge variant={item.unlocked ? 'default' : 'outline'} className="shrink-0">
                            {item.unlocked ? '已解锁' : `${item.percent}%`}
                          </Badge>
                        </div>

                        <div className="mt-4">
                          <Progress value={item.percent} className="h-2" />
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{Math.min(item.progress.current, item.progress.target)} / {item.progress.target}</span>
                            <span>{item.unlocked ? '已完成' : '进行中'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
