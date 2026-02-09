'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  GraduationCap,
  School,
  MessageCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  BarChart3,
  UserCheck,
  Shield
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useUser } from '@/lib/user-context'
import AdminManagementTab from '@/components/admin/admin-management-tab'
import TagDictionaryTab from '@/components/admin/tag-dictionary-tab'
import SystemEventsTab from '@/components/admin/system-events-tab'
import PlatformAnnouncementsTab from '@/components/admin/platform-announcements-tab'
import BasicVerificationReviewTab from '@/components/admin/basic-verification-review-tab'
import AccountManagementTab from '@/components/admin/account-management-tab'
import { apiClient } from '@/lib/api-client'
import { getSystemEvents, getVerificationRequests } from '@/lib/client-store'

const STATS = {
  totalUsers: 12543,
  students: 8934,
  volunteers: 3456,
  schools: 153,
  todayMatches: 234,
  todayQuestions: 156,
  activeChats: 89,
  pendingVerifications: 45,
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [pendingBasicVerifications, setPendingBasicVerifications] = useState(0)
  const roleCodes = user?.admin_roles?.map(r => r.role_code) ?? []
  const isSuperadmin = Boolean(user?.capabilities?.can_manage_platform) && !roleCodes.includes('association_hq')

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (!isSuperadmin) {
      router.push('/home')
    }
  }, [isLoading, isLoggedIn, isSuperadmin, router])

  useEffect(() => {
    if (isLoading || !isLoggedIn || !isSuperadmin) return
    const token = localStorage.getItem('token') || undefined
    if (!token) {
      setPendingBasicVerifications(0)
      return
    }
    apiClient
      .get<any[]>('/association/verifications/requests?type=general_basic&status=pending', token)
      .then((raw) => setPendingBasicVerifications(Array.isArray(raw) ? raw.length : 0))
      .catch(() => setPendingBasicVerifications(getVerificationRequests().filter(r => r.type === 'general_basic' && r.status === 'pending').length))
  }, [isLoading, isLoggedIn, isSuperadmin])

  if (isLoading || !isLoggedIn || !isSuperadmin) {
    return null
  }

  const urgentEvents = getSystemEvents().filter(e => e.group === 'urgent').slice(0, 6)
  const urgentOpenCount = urgentEvents.filter(e => e.status === 'open').length

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">超级管理员控制台</h1>
          <p className="mt-2 text-muted-foreground">云助学平台全局管理与监控</p>
        </div>

        {/* 核心数据概览 */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{STATS.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> 较上月
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">活跃志愿者</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{STATS.volunteers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8%</span> 较上月
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">合作高校</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{STATS.schools}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5</span> 本月新增
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">今日匹配</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{STATS.todayMatches}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+15%</span> 较昨日
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 主要功能标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="system">系统监控</TabsTrigger>
            <TabsTrigger value="announcements">全站公告</TabsTrigger>
            <TabsTrigger value="basicVerification">基础认证</TabsTrigger>
            <TabsTrigger value="admins">管理员</TabsTrigger>
            <TabsTrigger value="accounts">账户</TabsTrigger>
            <TabsTrigger value="tags">标签字典</TabsTrigger>
          </TabsList>

          {/* 概览标签页 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 实时活动 */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>实时活动（紧急优先）</CardTitle>
                  <CardDescription>紧急事件用于系统故障/攻击/重大异常</CardDescription>
                </CardHeader>
                <CardContent>
                  {urgentEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      暂无紧急事件
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {urgentEvents.map((e) => (
                        <div key={e.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                          <div className={`mt-1 h-2 w-2 rounded-full ${e.level === 'critical' ? 'bg-destructive' : 'bg-primary'}`} />
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{e.title}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{formatTime(e.createdAt)}</p>
                          </div>
                          <Badge variant={e.status === 'open' ? 'destructive' : e.status === 'ack' ? 'secondary' : 'outline'}>
                            {e.status === 'open' ? '待处理' : e.status === 'ack' ? '已确认' : '已关闭'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 待处理事项 */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    待处理事项
                    <Badge variant="destructive">{urgentOpenCount + pendingBasicVerifications}</Badge>
                  </CardTitle>
                  <CardDescription>系统紧急告警与过渡期基础认证</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 bg-transparent"
                      onClick={() => setActiveTab('system')}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>系统紧急告警</span>
                      <Badge variant="secondary" className="ml-auto">{urgentOpenCount}</Badge>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 bg-transparent"
                      onClick={() => setActiveTab('basicVerification')}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span>普通用户基础认证（过渡期）</span>
                      <Badge variant="secondary" className="ml-auto">{pendingBasicVerifications}</Badge>
                    </Button>
                    <Link href="/community">
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <TrendingUp className="h-4 w-4" />
                        <span>查看社区公示栏</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 平台健康度 */}
            <Card>
              <CardHeader>
                <CardTitle>平台健康度</CardTitle>
                <CardDescription>关键指标监控</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>用户活跃度</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>匹配成功率</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>用户满意度</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>系统稳定性</span>
                    <span className="font-medium">99.8%</span>
                  </div>
                  <Progress value={99.8} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemEventsTab operatorName={user.name} />
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <PlatformAnnouncementsTab operatorName={user.name} />
          </TabsContent>

          <TabsContent value="basicVerification" className="space-y-6">
            <BasicVerificationReviewTab operatorName={user.name} />
          </TabsContent>

          {/* 管理员管理标签页 */}
          <TabsContent value="admins" className="space-y-6">
            <AdminManagementTab />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <AccountManagementTab />
          </TabsContent>

          {/* 标签字典标签页 */}
          <TabsContent value="tags" className="space-y-6">
            <TagDictionaryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
