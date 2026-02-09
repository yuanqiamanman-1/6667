'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function VolunteerTeacherManagementTab(props: { schoolId: string }) {
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    setVersion(v => v + 1)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setVersion(v => v + 1), 8000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!props.schoolId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setLoading(true)
    apiClient
      .get<any[]>(`/association/teachers?school_id=${encodeURIComponent(props.schoolId)}`, token)
      .then((raw) => setItems(Array.isArray(raw) ? raw : []))
      .catch((e) => {
        console.error(e)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [props.schoolId, version])

  const list = useMemo(() => {
    return [...items].sort((a, b) => new Date(String(b.updated_at ?? '')).getTime() - new Date(String(a.updated_at ?? '')).getTime())
  }, [items])

  const handleTogglePool = async (userId: string, inPool: boolean) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    await apiClient.post(`/association/teachers/${userId}/pool`, { in_pool: inPool }, token)
    setItems(prev => prev.map(i => (i.user_id === userId ? { ...i, in_pool: inPool } : i)))
    window.dispatchEvent(new Event('teacher-pool-updated'))
  }

  const handleRemoveFromPool = async (userId: string) => {
    if (!confirm('确定要将该讲师从匹配池下架吗？')) return
    await handleTogglePool(userId, false)
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>讲师管理</span>
            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => setVersion(v => v + 1)}>
              刷新
            </Button>
          </CardTitle>
          <CardDescription>仅展示已通过讲师认证的真实讲师，可上下架匹配池</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无讲师
            </div>
          ) : (
            list.map((t: any) => (
              <div key={String(t.user_id)} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-foreground">{t.user?.full_name || t.user?.username || '讲师'}</div>
                      <Badge variant="outline">{t.in_pool ? '在匹配池' : '已下架'}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">标签：{Array.isArray(t.tags) && t.tags.length ? t.tags.join('、') : '—'}</div>
                    <div className="mt-1 text-sm text-muted-foreground">时间：{Array.isArray(t.time_slots) && t.time_slots.length ? t.time_slots.join('、') : '—'}</div>
                    <div className="mt-2 text-xs text-muted-foreground">更新时间：{formatTime(String(t.updated_at ?? ''))}</div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">在池</span>
                      <Switch checked={Boolean(t.in_pool)} onCheckedChange={(checked) => handleTogglePool(String(t.user_id), checked)} />
                    </div>
                    <Button variant="outline" size="icon" className="bg-transparent" onClick={() => handleRemoveFromPool(String(t.user_id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
