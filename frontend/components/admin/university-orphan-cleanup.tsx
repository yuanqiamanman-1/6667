'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'

type PurgeResult = {
  dry_run: boolean
  school_ids: string[]
  deleted: number
}

export default function UniversityOrphanCleanup() {
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<PurgeResult | null>(null)

  const token = useMemo(() => (typeof window === 'undefined' ? undefined : (localStorage.getItem('token') || undefined)), [])

  const fetchPreview = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await apiClient.post<PurgeResult>('/admin/universities/purge-orphans?dry_run=true', {}, token)
      setPreview(res)
    } catch (e) {
      console.error(e)
      setPreview(null)
      alert('预览失败')
    } finally {
      setLoading(false)
    }
  }

  const runCleanup = async () => {
    if (!token) return
    if (!preview) await fetchPreview()
    const count = preview?.school_ids?.length ?? 0
    if (!confirm(`将删除 ${count} 个无高校管理员的高校板块（含校内数据与组织记录）。确认继续？`)) return
    setRunning(true)
    try {
      const res = await apiClient.post<PurgeResult>('/admin/universities/purge-orphans?dry_run=false', {}, token)
      setPreview(res)
      alert(`已删除：${res.deleted} 个高校板块`)
    } catch (e) {
      console.error(e)
      alert('执行失败')
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => {
    fetchPreview()
  }, [])

  const count = preview?.school_ids?.length ?? 0

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>高校板块清理</span>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-transparent" onClick={fetchPreview} disabled={loading || running}>
              刷新预览
            </Button>
            <Button variant="destructive" onClick={runCleanup} disabled={loading || running || count === 0}>
              一键清理
            </Button>
          </div>
        </CardTitle>
        <CardDescription>删除“无高校管理员（university_admin）”的高校板块：界面移除并回收数据库记录</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {loading ? '加载中...' : `待清理高校：${count} 个`}
        </div>
        {count === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            当前没有可清理的高校板块
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {preview?.school_ids?.slice(0, 50).map((sid) => (
              <Badge key={sid} variant="secondary">{sid}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

