'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { TagItem } from '@/lib/client-store'

const TAG_CATEGORIES = ['学习', '学科', '考试', '能力', '心理', '公益', '其他']

export default function TagDictionaryTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tagsVersion, setTagsVersion] = useState(0)
  const [newTag, setNewTag] = useState({ name: '', category: TAG_CATEGORIES[0], enabled: true })
  const [keyword, setKeyword] = useState('')
  const [tags, setTags] = useState<TagItem[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined
    setIsFetching(true)
    apiClient.get<any[]>('/core/tags/admin', token).then((raw) => {
      if (!Array.isArray(raw)) {
        setTags([])
        return
      }
      setTags(
        raw.map((t: any) => ({
          id: String(t.id ?? ''),
          name: String(t.name ?? ''),
          category: String(t.category ?? ''),
          enabled: Boolean(t.enabled),
          createdAt: String(t.created_at ?? ''),
        })).filter((t: TagItem) => Boolean(t.id && t.name)),
      )
    }).catch((e) => console.error(e)).finally(() => setIsFetching(false))
  }, [tagsVersion])

  const visibleTags = useMemo(() => {
    const q = keyword.trim()
    const filtered = q ? tags.filter(t => t.name.includes(q) || t.category.includes(q)) : tags
    return [...filtered].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
      if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh-CN')
      return a.name.localeCompare(b.name, 'zh-CN')
    })
  }, [keyword, tags])

  const handleCreate = async () => {
    const name = newTag.name.trim()
    if (!name) {
      alert('请输入标签名称')
      return
    }
    if (tags.some(t => t.name === name)) {
      alert('标签已存在')
      return
    }

    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.post('/core/tags', { name, category: newTag.category, enabled: newTag.enabled }, token)
      setTagsVersion(v => v + 1)
      setIsDialogOpen(false)
      setNewTag({ name: '', category: TAG_CATEGORIES[0], enabled: true })
    } catch (e) {
      console.error(e)
      alert('创建失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.put(`/core/tags/${id}`, { enabled }, token)
      setTagsVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.delete(`/core/tags/${id}`, token)
      setTagsVersion(v => v + 1)
    } catch (e) {
      console.error(e)
      alert('删除失败')
    } finally {
      setDeleteTagId(null)
    }
  }

  const enabledCount = tags.filter(t => t.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">标签字典</h3>
          <p className="text-sm text-muted-foreground">统一管理问答/社区可用标签，支持启用与停用</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="h-8 px-3">
            已启用 {enabledCount} / {tags.length}
          </Badge>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新增标签
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新增标签</DialogTitle>
                <DialogDescription>标签将用于问答提问与社区内容分类</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>标签名称 *</Label>
                  <Input value={newTag.name} onChange={(e) => setNewTag({ ...newTag, name: e.target.value })} placeholder="如：高考加油" />
                </div>

                <div className="space-y-2">
                  <Label>所属分类</Label>
                  <Select value={newTag.category} onValueChange={(v) => setNewTag({ ...newTag, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAG_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">启用</div>
                    <div className="text-xs text-muted-foreground">启用后将对用户可见</div>
                  </div>
                  <Switch checked={newTag.enabled} onCheckedChange={(checked) => setNewTag({ ...newTag, enabled: checked })} />
                </div>

                <Button className="w-full" onClick={handleCreate}>
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              标签列表
            </CardTitle>
            <Badge variant="outline" className="h-7 px-3">
              共 {visibleTags.length} 个
            </Badge>
          </div>
          <CardDescription>支持关键字搜索（名称/分类）</CardDescription>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索标签..." />
        </CardHeader>
        <CardContent>
          {isFetching ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : visibleTags.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无标签
            </div>
          ) : (
            <div className="space-y-2">
              {visibleTags.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium text-foreground">{t.name}</div>
                      <Badge variant="secondary" className="h-6 px-2 text-xs">{t.category}</Badge>
                      {!t.enabled && <Badge variant="outline" className="h-6 px-2 text-xs">已停用</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      创建时间：{new Date(t.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">启用</span>
                      <Switch checked={t.enabled} onCheckedChange={(checked) => handleToggle(t.id, checked)} />
                    </div>
                    <Button variant="outline" size="icon" className="bg-transparent text-destructive hover:bg-destructive/10" onClick={() => setDeleteTagId(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除标签确认对话框 */}
      <AlertDialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要删除该标签吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTagId && handleDelete(deleteTagId)}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
