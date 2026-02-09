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

interface QaQuestion {
  id: string
  author_id: string
  author_name: string | null
  subject: string
  title: string
  content: string
  tags: string
  reward_points: number
  views: number
  answers_count: number
  solved: boolean
  accepted_answer_id: string | null
  created_at: string
  hidden?: boolean
}

export function QaModerationTab() {
  const [questions, setQuestions] = useState<QaQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [hideTarget, setHideTarget] = useState<{ id: string; title: string; hidden: boolean } | null>(null)
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || undefined
      const data = await apiClient.get<QaQuestion[]>('/content/qa/questions?limit=1000&show_hidden=true', token)
      setQuestions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('[QA Moderation] 加载失败:', error)
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.delete(`/content/qa/questions/${id}`, token)
      await loadQuestions()
      setDeleteTarget(null)
    } catch (error) {
      console.error('[QA Moderation] 删除失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const handleToggleHidden = async (id: string, hidden: boolean) => {
    try {
      const token = localStorage.getItem('token') || undefined
      await apiClient.post(`/content/qa/questions/${id}/toggle-hidden`, { hidden }, token)
      await loadQuestions()
      setHideTarget(null)
    } catch (error) {
      console.error('[QA Moderation] 修改可见性失败:', error)
      alert('操作失败，请稍后重试')
    }
  }

  const handleDeleteAll = async () => {
    try {
      const token = localStorage.getItem('token') || undefined
      // 批量删除所有问题
      await Promise.all(questions.map(q => apiClient.delete(`/content/qa/questions/${q.id}`, token)))
      await loadQuestions()
      setDeleteAllConfirm(false)
    } catch (error) {
      console.error('[QA Moderation] 批量删除失败:', error)
      alert('批量删除失败，请稍后重试')
    }
  }

  const filteredQuestions = questions.filter(
    q =>
      q.title.includes(searchQuery) ||
      q.content.includes(searchQuery) ||
      (q.author_name && q.author_name.includes(searchQuery))
  )

  const formatTime = (value: string) => {
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return value
    return parsed.toLocaleString('zh-CN')
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                问答广场管理
              </CardTitle>
              <CardDescription>管理问答广场的提问和回答，支持删除、隐藏等操作</CardDescription>
            </div>
            {questions.length > 0 && (
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
              placeholder="搜索标题、内容、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Badge variant="outline">共 {questions.length} 个问题</Badge>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {searchQuery ? '未找到匹配的问题' : '暂无问题'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div key={question.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{question.title}</div>
                        <Badge variant="outline">{question.subject}</Badge>
                        {question.solved && (
                          <Badge className="bg-green-500/10 text-green-600">已解决</Badge>
                        )}
                        <Badge variant={question.hidden ? 'outline' : 'secondary'}>
                          {question.hidden ? '已隐藏' : '可见'}
                        </Badge>
                        {question.reward_points > 0 && (
                          <Badge variant="secondary">{question.reward_points} 积分</Badge>
                        )}
                      </div>
                      <div className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{question.content}</div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>作者：{question.author_name || '匿名用户'}</span>
                        <span>浏览：{question.views}</span>
                        <span>回答：{question.answers_count}</span>
                        <span>{formatTime(question.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                        onClick={() =>
                          setHideTarget({
                            id: question.id,
                            title: question.title,
                            hidden: !question.hidden,
                          })
                        }
                      >
                        {question.hidden ? '恢复' : '隐藏'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 bg-transparent text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteTarget({ id: question.id, title: question.title })
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

      {/* 删除单个问题确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除问题</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要删除该问题吗？
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
            <AlertDialogTitle>确认{hideTarget?.hidden ? '隐藏' : '恢复'}问题</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。确定要{hideTarget?.hidden ? '隐藏' : '恢复'}该问题吗？
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
              此操作将删除所有 {questions.length} 个问题，不可撤销。确定要继续吗？
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
