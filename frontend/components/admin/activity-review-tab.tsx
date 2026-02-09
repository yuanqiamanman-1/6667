'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  MapPin,
  Users,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const PENDING_ACTIVITIES = [
  {
    id: 1,
    title: '暑期云助学志愿者招募',
    type: 'volunteer',
    organizer: '北京大学',
    organizerId: 'school1',
    submittedAt: new Date('2024-01-22'),
    startDate: new Date('2024-07-01'),
    endDate: new Date('2024-08-31'),
    location: '线上',
    participants: 100,
    description: '招募暑期志愿者，为偏远地区学生提供在线辅导...',
    status: 'pending'
  },
  {
    id: 2,
    title: '志愿者培训workshop',
    type: 'training',
    organizer: '清华大学',
    organizerId: 'school2',
    submittedAt: new Date('2024-01-21'),
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-02-10'),
    location: '清华大学主楼',
    participants: 50,
    description: '面向新志愿者的培训活动，讲解教学技巧和平台使用...',
    status: 'pending'
  },
]

export function ActivityReviewTab() {
  const [activities, setActivities] = useState(PENDING_ACTIVITIES)
  const [filter, setFilter] = useState('all')

  const handleApprove = (id: number) => {
    setActivities(activities.map(a => 
      a.id === id ? { ...a, status: 'approved' } : a
    ))
    alert('活动已通过审核')
  }

  const handleReject = (id: number) => {
    const reason = prompt('请输入拒绝理由：')
    if (reason) {
      setActivities(activities.map(a => 
        a.id === id ? { ...a, status: 'rejected', rejectReason: reason } : a
      ))
      alert('活动已拒绝')
    }
  }

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true
    return a.status === filter
  })

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: '待审核', variant: 'secondary' as const },
      approved: { label: '已通过', variant: 'default' as const },
      rejected: { label: '已拒绝', variant: 'destructive' as const },
    }
    const s = statusMap[status as keyof typeof statusMap]
    return <Badge variant={s.variant}>{s.label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      volunteer: '志愿者招募',
      training: '培训活动',
      competition: '知识竞赛',
      sharing: '经验分享会',
      other: '其他'
    }
    return typeMap[type] || type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">活动审核</h3>
          <p className="text-sm text-muted-foreground">
            审核各高校和协会提交的活动申请
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter !== 'all' ? 'bg-transparent' : ''}
          >
            全部 ({activities.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={filter !== 'pending' ? 'bg-transparent' : ''}
          >
            待审核 ({activities.filter(a => a.status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('approved')}
            className={filter !== 'approved' ? 'bg-transparent' : ''}
          >
            已通过
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">暂无活动需要审核</p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity.id} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{activity.title}</CardTitle>
                      {getStatusBadge(activity.status)}
                    </div>
                    <CardDescription>
                      由 {activity.organizer} 提交于 {format(activity.submittedAt, 'PPP', { locale: zhCN })}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{getTypeLabel(activity.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(activity.startDate, 'PPP', { locale: zhCN })} - {format(activity.endDate, 'PPP', { locale: zhCN })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{activity.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>预计 {activity.participants} 人参与</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{activity.status === 'pending' ? '待审核' : '已处理'}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    活动描述
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>

                {activity.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(activity.id)}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      通过审核
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(activity.id)}
                      className="flex-1 gap-2 bg-transparent"
                    >
                      <XCircle className="h-4 w-4" />
                      拒绝
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityReviewTab
