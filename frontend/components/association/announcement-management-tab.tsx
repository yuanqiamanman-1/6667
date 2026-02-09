'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { Megaphone, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

type AnnouncementScope = 'public' | 'campus' | 'aid'

type AnnouncementItem = {
  id: string
  title: string
  content: string
  scope: AnnouncementScope
  audience: string
  school_id?: string | null
  pinned: boolean
  created_at: string
  created_by?: string
}

export default function AnnouncementManagementTab(props: {
  adminId: string
  adminName: string
  schoolId: string
  createdByRole?: string
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [draft, setDraft] = useState({
    title: '',
    content: '',
    scope: 'public' as AnnouncementScope,
    pinned: false,
  })
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<AnnouncementItem[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || undefined
      if (!token) {
        setList([])
        return
      }
      const [publicList, campusList] = await Promise.all([
        apiClient.get<AnnouncementItem[]>(`/core/announcements?scope=public`, token),
        apiClient.get<AnnouncementItem[]>(`/core/announcements?scope=campus&school_id=${encodeURIComponent(props.schoolId)}`, token),
      ])
      const merged = [...(Array.isArray(publicList) ? publicList : []), ...(Array.isArray(campusList) ? campusList : [])]
      const own = merged.filter((a) => String(a.created_by || '') === props.adminId)
      setList(
        [...own].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
          return new Date(String(b.created_at || '')).getTime() - new Date(String(a.created_at || '')).getTime()
        }),
      )
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
    if (!title || !content) {
      alert('请填写标题与内容')
      return
    }

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
          scope: draft.scope,
          audience: draft.scope === 'public' ? 'public_all' : 'association_teachers_only',
          school_id: draft.scope === 'campus' ? props.schoolId : undefined,
          pinned: draft.pinned,
          version: '1.0',
        },
        token,
      )
      setVersion(v => v + 1)
      setIsDialogOpen(false)
      setDraft({ title: '', content: '', scope: 'public', pinned: false })
      await load()
    } catch (e) {
      console.error(e)
      alert('发布失败，请稍后重试')
    }
  }

  const handleTogglePinned = async (id: string, pinned: boolean) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    try {
      await apiClient.patch<any>(`/core/announcements/${encodeURIComponent(id)}`, { pinned }, token)
      setVersion(v => v + 1)
      await load()
    } catch (e) {
      console.error(e)
      alert('更新失败，请稍后重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">协会公告</h3>
          <p className="text-sm text-muted-foreground">默认仅本校已认证讲师可见，可选同步全站公示栏</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              发布公告
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>发布公告</DialogTitle>
              <DialogDescription>公告会展示在社区公示栏与相关页面</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>标题 *</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="如：协会招募 / 培训安排" />
              </div>
              <div className="space-y-2">
                <Label>内容 *</Label>
                <Textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="min-h-32" placeholder="支持换行，建议写清时间与参与方式" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>范围</Label>
                  <Select
                    value={draft.scope}
                    onValueChange={(v: AnnouncementScope) =>
                      setDraft({
                        ...draft,
                        scope: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">全站公示</SelectItem>
                      <SelectItem value="campus">校内可见</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>置顶</Label>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="text-sm text-muted-foreground">置顶后会优先展示</div>
                    <Switch checked={draft.pinned} onCheckedChange={(checked) => setDraft({ ...draft, pinned: checked })} />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={handleCreate}>
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
            已发布公告
          </CardTitle>
          <CardDescription>共 {list.length} 条</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无公告
            </div>
          ) : (
            <div className="space-y-3">
              {list.map(a => (
                <div key={a.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium text-foreground">{a.title}</div>
                        <Badge variant="outline" className="h-6 px-2 text-xs">
                          {a.scope === 'public'
                            ? '全站'
                            : '校内（讲师）'}
                        </Badge>
                        {a.pinned && <Badge className="h-6 px-2 text-xs">置顶</Badge>}
                      </div>
                      <div className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                        {a.content}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {new Date(String(a.created_at || '')).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">置顶</span>
                      <Switch checked={a.pinned} onCheckedChange={(checked) => handleTogglePinned(a.id, checked)} />
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
