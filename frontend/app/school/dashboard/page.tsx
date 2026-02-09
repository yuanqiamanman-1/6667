'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, GraduationCap, Award, TrendingUp, CheckCircle, 
  AlertCircle, Clock, FileText, Settings, Download
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useUser } from '@/lib/user-context'
import ActivityForm from '@/components/admin/activity-form'

export default function SchoolDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const isUniversityAdmin = Boolean(user?.admin_roles?.some(r => r.role_code === 'university_admin'))

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (isUniversityAdmin) {
      router.push('/university/dashboard')
      return
    }
    router.push('/home')
  }, [isLoading, isLoggedIn, isUniversityAdmin, router])

  if (isLoading || !isLoggedIn || !user || !isUniversityAdmin) {
    return null
  }

  const stats = {
    totalVolunteers: 156,
    activeVolunteers: 89,
    totalSessions: 2340,
    studentsSupported: 1200
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{user.school} - 管理中心</h1>
            <p className="mt-2 text-muted-foreground">欢迎回来，{user.name}</p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
        
        {/* 数据统计卡片 */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本校志愿者</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12</span> 较上月
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃志愿者</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeVolunteers}</div>
              <p className="text-xs text-muted-foreground">本月服务中</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">服务场次</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">累计完成</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">受助学生</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.studentsSupported}</div>
              <p className="text-xs text-muted-foreground">覆盖人数</p>
            </CardContent>
          </Card>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="volunteers">志愿者管理</TabsTrigger>
            <TabsTrigger value="verification">认证审核</TabsTrigger>
            <TabsTrigger value="activities">活动管理</TabsTrigger>
            <TabsTrigger value="publish">发布活动</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>本月活跃志愿者</CardTitle>
                  <CardDescription>按服务时长排序</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: '张三', hours: 24, avatar: '/avatars/avatar-06.jpg' },
                      { name: '李四', hours: 20, avatar: '/avatars/avatar-07.jpg' },
                      { name: '王五', hours: 18, avatar: '/avatars/avatar-08.jpg' },
                    ].map((volunteer, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={volunteer.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{volunteer.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{volunteer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              服务 {volunteer.hours} 小时
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Award className="mr-1 h-3 w-3" />
                          优秀
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>待处理事项</CardTitle>
                  <CardDescription>需要您的关注</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                      <div className="flex-1">
                        <p className="font-medium">3个志愿者认证待审核</p>
                        <p className="text-sm text-muted-foreground">
                          请及时审核志愿者资质
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">本月服务目标已达成</p>
                        <p className="text-sm text-muted-foreground">
                          完成率 105%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="volunteers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>志愿者列表</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">志愿者管理功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>已发布活动</CardTitle>
                <CardDescription>查看和管理已发布的活动</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">暂无活动数据</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>发布新活动</CardTitle>
                <CardDescription>提交活动申请，需要超级管理员审核通过后才会发布</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityForm
                  onSubmit={(data) => {
                    alert('活动已提交，等待超级管理员审核')
                  }}
                  onCancel={() => setActiveTab('overview')}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
