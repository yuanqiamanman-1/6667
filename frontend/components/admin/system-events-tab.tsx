'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import { getSystemEvents, nowIso, setSystemEvents, uid, type SystemEvent, type SystemEventGroup, type SystemEventStatus } from '@/lib/client-store'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

function levelBadge(level: SystemEvent['level']) {
  if (level === 'critical') return <Badge variant="destructive">紧急</Badge>
  if (level === 'warning') return <Badge variant="secondary">告警</Badge>
  return <Badge variant="outline">日常</Badge>
}

function statusBadge(status: SystemEventStatus) {
  if (status === 'closed') return <Badge className="bg-green-500/10 text-green-600">已关闭</Badge>
  if (status === 'ack') return <Badge variant="secondary">已确认</Badge>
  return <Badge variant="outline">待处理</Badge>
}

export default function SystemEventsTab(props: { operatorName: string }) {
  const [tab, setTab] = useState<SystemEventGroup>('urgent')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const current = getSystemEvents()
    if (current.length > 0) return
    const seed: SystemEvent[] = [
      {
        id: uid('evt'),
        group: 'urgent',
        title: '紧急：系统异常错误率升高',
        detail: 'API 5xx 错误率在 5 分钟内超过阈值，请检查发布与依赖状态。',
        level: 'critical',
        status: 'open',
        createdAt: nowIso(),
      },
      {
        id: uid('evt'),
        group: 'urgent',
        title: '告警：疑似站外引流聚集',
        detail: '社区出现高频外链/二维码内容，已触发自动折叠与限流，建议人工复核。',
        level: 'warning',
        status: 'open',
        createdAt: nowIso(),
      },
      {
        id: uid('evt'),
        group: 'daily',
        title: '日常：匹配请求峰值',
        detail: '晚间 19:00-21:00 匹配请求上升，建议扩大讲师供给池曝光。',
        level: 'info',
        status: 'ack',
        createdAt: nowIso(),
        handledBy: props.operatorName,
        handledAt: nowIso(),
      },
    ]
    setSystemEvents(seed)
    setVersion(v => v + 1)
  }, [props.operatorName])

  const events = useMemo(() => {
    const items = getSystemEvents().filter(e => e.group === tab)
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [tab, version])

  const handleUpdate = (id: string, nextStatus: SystemEventStatus) => {
    const current = getSystemEvents()
    setSystemEvents(
      current.map(e =>
        e.id === id
          ? {
              ...e,
              status: nextStatus,
              handledBy: props.operatorName,
              handledAt: nowIso(),
            }
          : e,
      ),
    )
    setVersion(v => v + 1)
  }

  const urgentOpen = getSystemEvents().filter(e => e.group === 'urgent' && e.status === 'open').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">实时活动</h3>
          <p className="text-sm text-muted-foreground">按“日常/紧急”分组展示，紧急为红色告警</p>
        </div>
        <Badge variant="destructive" className="h-8 px-3">
          紧急待处理 {urgentOpen}
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as SystemEventGroup)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:inline-grid lg:w-auto">
          <TabsTrigger value="daily" className="gap-2">
            <Clock className="h-4 w-4" />
            日常
          </TabsTrigger>
          <TabsTrigger value="urgent" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            紧急
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>日常动态</CardTitle>
              <CardDescription>运营观测与日常提示</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  暂无事件
                </div>
              ) : (
                events.map(e => (
                  <div key={e.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-foreground">{e.title}</div>
                          {levelBadge(e.level)}
                          {statusBadge(e.status)}
                        </div>
                        <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{e.detail}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{formatTime(e.createdAt)}</div>
                      </div>
                      {e.status !== 'closed' && (
                        <div className="flex shrink-0 gap-2">
                          {e.status === 'open' && (
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleUpdate(e.id, 'ack')}>
                              确认
                            </Button>
                          )}
                          <Button size="sm" onClick={() => handleUpdate(e.id, 'closed')}>
                            关闭
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>紧急告警</CardTitle>
              <CardDescription>系统故障/攻击/重大异常</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  暂无告警
                </div>
              ) : (
                events.map(e => (
                  <div key={e.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-foreground">{e.title}</div>
                          {e.level === 'critical' ? <Badge variant="destructive">红色紧急</Badge> : <Badge variant="secondary">告警</Badge>}
                          {statusBadge(e.status)}
                        </div>
                        <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{e.detail}</div>
                        <div className="mt-2 text-xs text-muted-foreground">{formatTime(e.createdAt)}</div>
                      </div>
                      {e.status !== 'closed' && (
                        <div className="flex shrink-0 gap-2">
                          {e.status === 'open' && (
                            <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleUpdate(e.id, 'ack')}>
                              确认
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => handleUpdate(e.id, 'closed')}>
                            关闭
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div className="rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
                紧急告警建议联动：公告广播（系统通知）/风控策略临时升级/回滚发布（后续接入）。
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

