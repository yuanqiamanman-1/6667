'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Settings,
  Edit,
  Award,
  Heart,
  BookOpen,
  Star,
  Calendar,
  MapPin,
  GraduationCap,
  Shield,
  Wallet,
  ChevronRight,
  Bell,
  HelpCircle,
  LogOut,
  Users
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'

const MENU_ITEMS = [
  { icon: Wallet, label: '我的积分', href: '/profile/points' },
  { icon: Award, label: '我的成就', href: '/profile/achievements' },
  { icon: BookOpen, label: '学习记录', href: '/profile/history' },
  { icon: Heart, label: '我的收藏', href: '/profile/favorites' },
  { icon: Bell, label: '消息通知', href: '/messages' },
  { icon: Shield, label: '身份认证', href: '/verify' },
  { icon: Settings, label: '设置', href: '/settings' },
  { icon: HelpCircle, label: '帮助中心', href: '/help' },
]

const BADGES = [
  { id: 1, name: '学习新星', icon: Star },
  { id: 2, name: '好学不倦', icon: BookOpen },
  { id: 3, name: '社区达人', icon: Heart },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoggedIn, logout } = useUser()
  const isTeacher = canAccessTeacherFeatures(user)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isVerified = user.verification.student === 'verified' || user.verification.teacher === 'verified'

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Sidebar - User Info */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-2 text-center">
              <CardContent className="pt-8">
                <div className="relative mx-auto mb-4 w-fit">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-2xl text-white">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {isVerified && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow">
                      <Shield className="h-5 w-5 text-green-500" />
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {isVerified && (
                    <Badge className="bg-green-500/10 text-green-600">已认证</Badge>
                  )}
                  {isTeacher ? (
                    <Badge className="bg-primary/10 text-primary">志愿讲师</Badge>
                  ) : (
                    <Badge className="bg-secondary/20 text-secondary-foreground">学生</Badge>
                  )}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">{user.bio || '这个人很懒，还没有写简介~'}</p>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{user.school || '未填写'} · {user.grade || '未填写'}</span>
                </div>
                <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')} 加入</span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                  <div>
                    <div className="text-xl font-bold text-primary">{user.stats.helpCount}</div>
                    <div className="text-xs text-muted-foreground">{isTeacher ? '帮助学生' : '求助次数'}</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{user.stats.answerCount}</div>
                    <div className="text-xs text-muted-foreground">回答问题</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-primary">{user.stats.postCount}</div>
                    <div className="text-xs text-muted-foreground">发布帖子</div>
                  </div>
                </div>

                <Button className="mt-6 w-full gap-2">
                  <Edit className="h-4 w-4" />
                  编辑资料
                </Button>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                      {user.level}
                    </div>
                    <div>
                      <div className="font-medium">等级 {user.level}</div>
                      <div className="text-xs text-muted-foreground">{isTeacher ? '公益先锋' : '学习新星'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{user.points}</div>
                    <div className="text-xs text-muted-foreground">积分</div>
                  </div>
                </div>
                <Progress value={(user.points % 500) / 5} className="h-2" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  再获得 {500 - (user.points % 500)} 积分升级到下一等级
                </p>
              </CardContent>
            </Card>

            {/* Tags/Badges */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{isTeacher ? '擅长领域' : '我的标签'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  )) || <span className="text-sm text-muted-foreground">暂无标签</span>}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {BADGES.map((badge) => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.05 }}
                      className="flex flex-col items-center rounded-xl bg-muted/50 p-3 text-center"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <badge.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{badge.name}</span>
                    </motion.div>
                  ))}
                </div>
                <Link href="/profile/achievements">
                  <Button variant="ghost" className="mt-4 w-full text-primary">
                    查看全部成就
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Menu Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {MENU_ITEMS.map((item, index) => (
                <AnimatedCard key={item.label} delay={index * 50}>
                  <Link href={item.href}>
                    <Card className="group border-2 transition-all hover:border-primary/50 hover:shadow-md">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                            <item.icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-foreground">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.value && (
                            <Badge variant="secondary">{item.value}</Badge>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimatedCard>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>最近动态</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="questions">
                  <TabsList className="mb-4">
                    <TabsTrigger value="questions">我的提问</TabsTrigger>
                    <TabsTrigger value="sessions">咨询记录</TabsTrigger>
                    <TabsTrigger value="posts">我的帖子</TabsTrigger>
                  </TabsList>
                  <TabsContent value="questions" className="space-y-3">
                    {[
                      { title: '二次函数图像变换的技巧', status: '已解决', time: '2天前' },
                      { title: '英语完形填空技巧分享', status: '待解答', time: '5天前' },
                    ].map((q) => (
                      <div key={q.title} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <div className="font-medium text-foreground">{q.title}</div>
                          <div className="text-sm text-muted-foreground">{q.time}</div>
                        </div>
                        <Badge variant={q.status === '已解决' ? 'default' : 'secondary'}>
                          {q.status}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="sessions" className="space-y-3">
                    {[
                      { teacher: '张老师', subject: '数学', time: '1天前', duration: '45分钟' },
                      { teacher: '李老师', subject: '物理', time: '3天前', duration: '30分钟' },
                    ].map((s) => (
                      <div key={`${s.teacher}-${s.time}`} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {s.teacher.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{s.teacher} · {s.subject}</div>
                            <div className="text-sm text-muted-foreground">{s.time} · {s.duration}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          查看详情
                        </Button>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="posts">
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Image
                        src="/illustrations/empty-state.jpg"
                        alt="暂无内容"
                        width={120}
                        height={120}
                        className="mb-4 opacity-50"
                      />
                      <p>暂无帖子</p>
                      <Link href="/community">
                        <Button variant="link" className="mt-2 text-primary">
                          去发布第一条帖子
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card className="border-2 border-destructive/20">
              <CardContent className="p-4">
                <Button 
                  variant="ghost" 
                  className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
