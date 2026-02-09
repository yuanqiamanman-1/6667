'use client'

import { useEffect, useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { apiClient } from '@/lib/api-client'

interface CommunityPost {
  id: string
  author_id: string
  author_name: string | null
  content: string
  tags: string
  likes_count: number
  comments_count: number
  created_at: string
  hidden?: boolean
}

export function CommunityModerationTab() {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; content: string } | null>(null)
  const [hideTarget, setHideTarget] = useState<{ id: string; content: string; hidden: boolean } | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  const loadPosts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || undefined
      
      // 只加载公共社区帖子，HQ管理员可以看到隐藏的内容
      const publicData = await apiClient.get<any[]>('/content/community/posts?skip=0&limit=1000&show_hidden=true', token)
      const publicMapped = Array.isArray(publicData) ? publicData.map(p => ({
        id: String(p.id),
        author_id: String(p.author_id || ''),
        author_name: p.author?.full_name || p.author?.username || null,
        content: String(p.content || ''),
        tags: String(p.tags || '[]'),
        likes_count: Number(p.likes_count || 0),
        comments_count: Number(p.comments_count || 0),
        created_at: String(p.created_at || ''),
        hidden: Boolean(p.hidden),
      })) : []

      setPosts(publicMapped)
    } catch (error) {
      console.error('[Community Moderation] 加载失败:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.delete(`/content/community/posts/${id}`, token)
      await loadPosts()
      setDeleteTarget(null)
    } catch (error) {
      console.error('[Community Moderation] 删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const handleToggleHidden = async (id: string, hidden: boolean) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.post(`/content/community/posts/${id}/toggle-hidden`, { hidden }, token)
      await loadPosts()
      setHideTarget(null)
    } catch (error) {
      console.error('[Community Moderation] 修改可见性失败:', error)
      alert('操作失败，请稍后重试')
    }
  }

  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem('token') || undefined
      
      // 批量删除所有帖子
      await Promise.all(posts.map(p => apiClient.delete(`/content/community/posts/${p.id}`, token)))
      await loadPosts()
      setDeleteAllConfirm(false)
    } catch (error) {
      console.error('[Community Moderation] 批量删除失败:', error)
      alert('批量删除失败，请稍后重试')
    }
  }

  const filteredPosts = posts.filter(
    p =>
      p.content.includes(searchQuery) ||
      (p.author_name && p.author_name.includes(searchQuery))
  )

  const formatTime = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString('zh-CN')
  }

  const parseTags = (tags: string): string[] => {
    try {
      const parsed = JSON.parse(tags)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                公共社区管理
              </CardTitle>
              <CardDescription>管理公共社区的帖子，支持删除、隐藏等操作</CardDescription>
            </div>
            {posts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1"
                onClick={() => setDeleteAllConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                一键删除所有
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="搜索内容、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Badge variant="outline">共 {posts.length} 个帖子</Badge>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {searchQuery ? '未找到匹配的帖子' : '暂无帖子'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => (
                <div key={post.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{post.author_name || '匿名用户'}</div>
                        <Badge variant={post.hidden ? 'outline' : 'secondary'}>
                          {post.hidden ? '已隐藏' : '可见'}
                        </Badge>
                        {parseTags(post.tags).map((tag) => (
                          <Badge key={tag} variant="outline" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{post.content}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>点赞：{post.likes_count}</span>
                        <span>评论：{post.comments_count}</span>
                        <span>{formatTime(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() =>
                          setHideTarget({
                            id: post.id,
                            content: post.content.substring(0, 20) + '...',
                            hidden: !post.hidden,
                          })
                        }
                      >
                        {post.hidden ? '恢复' : '隐藏'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteTarget({ id: post.id, content: post.content.substring(0, 20) + '...' })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除单个帖子确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除帖子</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要删除该帖子吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 隐藏/显示确认 */}
      <AlertDialog open={!!hideTarget} onOpenChange={(open) => !open && setHideTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确认{hideTarget?.hidden ? '隐藏' : '恢复'}帖子
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要{hideTarget?.hidden ? '隐藏' : '恢复'}该帖子吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => hideTarget && handleToggleHidden(hideTarget.id, hideTarget.hidden)}
            >
              确认{hideTarget?.hidden ? '隐藏' : '恢复'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 一键全部删除确认 */}
      <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除所有 {posts.length} 条帖子，不可撤销。确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除所有
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
