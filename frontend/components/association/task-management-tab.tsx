'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, ClipboardList, Plus, Sparkles } from 'lucide-react'
import { getAssociationTasks, nowIso, setAssociationTasks, uid, type AssociationTask, type TaskType } from '@/lib/client-store'

export default function TaskManagementTab(props: { schoolId: string }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    type: 'urgent' as TaskType,
    volunteerHoursGranted: 2,
  })

  useEffect(() => {
    setVersion(v => v + 1)
  }, [])

  const tasks = useMemo(() => {
    const items = getAssociationTasks(props.schoolId)
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [props.schoolId, version])

  const handleCreate = () => {
    const title = draft.title.trim()
    const description = draft.description.trim()
    if (!title || !description) {
      alert('请填写标题与说明')
      return
    }

    const task: AssociationTask = {
      id: uid('task'),
      title,
      description,
      type: draft.type,
      schoolId: props.schoolId,
      createdAt: nowIso(),
      volunteerHoursGranted: draft.volunteerHoursGranted,
    }

    const current = getAssociationTasks(props.schoolId)
    setAssociationTasks(props.schoolId, [task, ...current])
    setVersion(v => v + 1)
    setIsDialogOpen(false)
    setDraft({ title: '', description: '', type: 'urgent', volunteerHoursGranted: 2 })
  }

  const getTypeBadge = (type: TaskType) => {
    if (type === 'urgent') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          紧急任务
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Sparkles className="h-3 w-3" />
        专项任务
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">专项任务管理</h3>
          <p className="text-sm text-muted-foreground">发布紧急任务与专项任务，用于志愿者活动与时长记录</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              新建任务
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>新建任务</DialogTitle>
              <DialogDescription>任务会在协会管理端与相关页面展示（原型）</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>任务类型</Label>
                  <Select value={draft.type} onValueChange={(v: TaskType) => setDraft({ ...draft, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">紧急任务</SelectItem>
                      <SelectItem value="special">专项任务</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>完成奖励（志愿时长）</Label>
                  <Input
                    type="number"
                    min={0}
                    value={draft.volunteerHoursGranted}
                    onChange={(e) => setDraft({ ...draft, volunteerHoursGranted: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>标题 *</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="如：紧急答疑支持（数学）" />
              </div>

              <div className="space-y-2">
                <Label>说明 *</Label>
                <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-32" placeholder="写清目标、截止时间、参与方式等" />
              </div>

              <Button className="w-full" onClick={handleCreate}>发布任务</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            任务列表
          </CardTitle>
          <CardDescription>共 {tasks.length} 条</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无任务
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{t.title}</div>
                        {getTypeBadge(t.type)}
                        <Badge variant="outline" className="h-6 px-2 text-xs">
                          +{t.volunteerHoursGranted ?? 0} 小时
                        </Badge>
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t.description}</div>
                      <div className="mt-3 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
