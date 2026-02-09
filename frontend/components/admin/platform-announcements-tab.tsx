'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
import { Megaphone, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: 'public' | 'campus' | 'aid'
  audience: string
  pinned: boolean
  created_at: string
}

export default function PlatformAnnouncementsTab(props: { operatorName: string }) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [draft, setDraft] = useState({ title: '', content: '', pinned: false })
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<AnnouncementItem[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || undefined
      const raw = await apiClient.get<AnnouncementItem[]>(`/core/announcements?scope=public`, token)
      setList(Array.isArray(raw) ? raw : [])
    } catch (e) {
      console.error(e)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    const title = draft.title.trim()
    const content = draft.content.trim()
    if (!title || !content) return
    const token = localStorage.getItem('token') || undefined
    if (!token) {
      alert('请先登录')
      return
    }
    try {
      await apiClient.post<any>(
        `/core/announcements`,
        {
          title,
          content,
          scope: 'public',
          audience: 'public_all',
          pinned: draft.pinned,
          version: '1.0',
        },
        token,
      )
      setDraft({ title: '', content: '', pinned: false })
      setOpen(false)
      await load()
      setVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('发布失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">全站公告</h3>
          <p className="text-sm text-muted-foreground">发布后展示在社区公示栏（全站可见）</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              发布公告
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>发布全站公告</DialogTitle>
              <DialogDescription>建议用于规则变更、公示信息与系统通知</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>标题 *</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>内容 *</Label>
                <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="min-h-32" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">置顶</div>
                  <div className="text-xs text-muted-foreground">置顶公告在公示栏优先展示</div>
                </div>
                <Switch checked={draft.pinned} onCheckedChange={(checked) => setDraft({ ...draft, pinned: checked })} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!draft.title.trim() || !draft.content.trim()}>
                发布
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            公告列表
          </CardTitle>
          <CardDescription>共 {list.length} 条</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无公告
            </div>
          ) : (
            list.map(a => (
              <div key={a.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 font-medium text-foreground">{a.pinned ? '【置顶】' : ''}{a.title}</div>
                  <Badge variant="outline">全站</Badge>
                </div>
                <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{a.content}</div>
                <div className="mt-2 text-xs text-muted-foreground">{formatTime(String(a.created_at || ''))}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
