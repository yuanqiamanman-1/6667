'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Award, ClipboardList, Megaphone, ShieldCheck, Users } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import AnnouncementManagementTab from '@/components/association/announcement-management-tab'
import TaskManagementTab from '@/components/association/task-management-tab'
import VolunteerTeacherReviewTab from '@/components/association/volunteer-teacher-review-tab'
import VolunteerTeacherManagementTab from '@/components/association/volunteer-teacher-management-tab'
import AssociationMallRuleTab from '@/components/association/association-mall-rule-tab'
import {
  getAssociationTasks,
  getVolunteerHourGrants,
} from '@/lib/client-store'

export default function AssociationDashboard() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const isAssocAdmin = Boolean(user?.admin_roles?.some(r => r.role_code === 'university_association_admin'))
  const schoolId = user?.school ?? ''
  const [pendingApplications, setPendingApplications] = useState(0)
  const [teachersInPool, setTeachersInPool] = useState(0)

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn || !isAssocAdmin) {
      router.push('/home')
    }
  }, [isLoading, isLoggedIn, isAssocAdmin, router])

  useEffect(() => {
    setVersion(v => v + 1)
  }, [])

  useEffect(() => {
    const handler = () => setVersion(v => v + 1)
    window.addEventListener('teacher-pool-updated', handler)
    return () => window.removeEventListener('teacher-pool-updated', handler)
  }, [])

  useEffect(() => {
    setVersion(v => v + 1)
  }, [activeTab])

  useEffect(() => {
    if (!schoolId) {
      setPendingApplications(0)
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    apiClient
      .get<any[]>(`/association/verifications/requests?type=volunteer_teacher&status=pending&school_id=${encodeURIComponent(schoolId)}`, token)
      .then((raw) => setPendingApplications(Array.isArray(raw) ? raw.length : 0))
      .catch(() => setPendingApplications(0))
  }, [schoolId, version])

  useEffect(() => {
    if (!schoolId) {
      setTeachersInPool(0)
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    apiClient
      .get<any[]>(`/association/teachers?school_id=${encodeURIComponent(schoolId)}`, token)
      .then((raw) => {
        if (!Array.isArray(raw)) {
          setTeachersInPool(0)
          return
        }
        setTeachersInPool(raw.filter((t: any) => Boolean(t?.in_pool)).length)
      })
      .catch(() => setTeachersInPool(0))
  }, [schoolId, version])

  const taskCount = useMemo(() => {
    if (!schoolId) return 0
    return getAssociationTasks(schoolId).length
  }, [schoolId, version])

  const hourGranted = useMemo(() => {
    if (!schoolId) return 0
    return getVolunteerHourGrants(schoolId)
      .filter(g => g.status === 'approved')
      .reduce((sum, g) => sum + (g.hoursGranted ?? 0), 0)
  }, [schoolId, version])

  if (isLoading || !isLoggedIn || !user || !isAssocAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">高校志愿者协会控制台</h1>
        <p className="mb-8 text-muted-foreground">{schoolId} · 讲师审核、专项任务、公告与校内兑换机制</p>
        
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待审核讲师</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications}</div>
              <p className="text-xs text-muted-foreground">志愿者讲师认证申请</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">匹配池讲师</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachersInPool}</div>
              <p className="text-xs text-muted-foreground">可被推荐与接单</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">服务时长</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hourGranted}</div>
              <p className="text-xs text-muted-foreground">本校累计发放（原型）</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">专项任务</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskCount}</div>
              <p className="text-xs text-muted-foreground">紧急/专项任务</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-6 lg:inline-grid lg:w-auto">
            <TabsTrigger value="overview">总览</TabsTrigger>
            <TabsTrigger value="teacherReview">讲师审核</TabsTrigger>
            <TabsTrigger value="teacherManage">讲师管理</TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              协会公告
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              专项任务
            </TabsTrigger>
            <TabsTrigger value="mall">商城与兑换</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>待处理事项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm text-muted-foreground">讲师认证申请</div>
                    <Badge>{pendingApplications} 待审核</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm text-muted-foreground">专项任务总数</div>
                    <Badge variant="secondary">{taskCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm text-muted-foreground">匹配池讲师</div>
                    <Badge variant="secondary">{teachersInPool}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle>公告与公示栏</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-lg bg-muted/50 p-4">
                    协会公告支持发布“校内可见”或“同步全站公示栏”。同步内容将展示在社区页公示栏中。
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teacherReview" className="mt-6">
            <VolunteerTeacherReviewTab schoolId={schoolId} reviewerName={user.name} />
          </TabsContent>

          <TabsContent value="teacherManage" className="mt-6">
            <VolunteerTeacherManagementTab schoolId={schoolId} />
          </TabsContent>

          <TabsContent value="announcements" className="mt-6">
            <AnnouncementManagementTab
              adminId={user.id}
              adminName={user.name}
              schoolId={schoolId}
              createdByRole="university_association_admin"
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TaskManagementTab schoolId={schoolId} />
          </TabsContent>

          <TabsContent value="mall" className="mt-6">
            <AssociationMallRuleTab schoolId={schoolId} adminName={user.name} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
