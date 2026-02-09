'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MessageCircle, Send } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUser } from '@/lib/user-context'
import { apiClient, ApiError } from '@/lib/api-client'

function formatTime(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function CommunityPostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = String((params as any)?.id ?? '')
  const { user, isLoggedIn } = useUser()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tags = useMemo(() => {
    try {
      const v = JSON.parse(String(post?.tags ?? '[]'))
      return Array.isArray(v) ? v : []
    } catch {
      return []
    }
  }, [post?.tags])

  const load = async () => {
    if (!postId) return
    setLoading(true)
    try {
      const [p, list] = await Promise.all([
        apiClient.get<any>(`/content/community/posts/${encodeURIComponent(postId)}`),
        apiClient.get<any[]>(`/content/community/posts/${encodeURIComponent(postId)}/comments?skip=0&limit=200`),
      ])
      setPost(p)
      setComments(Array.isArray(list) ? list : [])
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) console.error(e)
      setPost(null)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [postId])

  const canSubmit = useMemo(() => input.trim().length >= 2 && isLoggedIn, [input, isLoggedIn])

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    const token = localStorage.getItem('token') || undefined
    if (!token) {
      router.push('/login')
      return
    }
    const content = input.trim()
    setSubmitting(true)
    try {
      const created = await apiClient.post<any>(
        `/content/community/posts/${encodeURIComponent(postId)}/comments`,
        { content },
        token,
      )
      setInput('')
      setComments((prev) => [...prev, created])
      setPost((prev: any) => (prev ? { ...prev, comments_count: Number(prev.comments_count ?? 0) + 1 } : prev))
    } catch (e) {
      console.error(e)
      alert('评论失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            返回社区
          </Link>
          <div className="text-sm text-muted-foreground">帖子详情</div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : !post ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            帖子不存在或已删除
          </div>
        ) : (
          <>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {String(post?.author?.full_name || post?.author?.username || '？').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {String(post?.author?.full_name || post?.author?.username || '匿名用户')}
                      </CardTitle>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatTime(String(post.created_at || ''))}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {Number(post.comments_count ?? 0)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-line text-foreground">{String(post.content || '')}</div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t: string) => (
                      <Badge key={t} variant="secondary">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 border-2">
              <CardHeader>
                <CardTitle className="text-base">楼层评论</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    暂无评论
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c, idx) => (
                      <div key={String(c.id || idx)} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 text-sm font-medium text-foreground">
                            {String(c?.author?.full_name || c?.author?.username || '用户')}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">#{idx + 1}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatTime(String(c.created_at || ''))}</div>
                        </div>
                        <div className="mt-2 whitespace-pre-line text-sm text-foreground">{String(c.content || '')}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isLoggedIn ? '写下你的评论...' : '登录后可评论'}
                    disabled={!isLoggedIn || submitting}
                  />
                  <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="gap-2">
                    <Send className="h-4 w-4" />
                    {submitting ? '发送中' : '发送'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
