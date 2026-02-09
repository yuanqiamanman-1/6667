'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Award, Hash, HelpCircle } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import { getTags, getUserPoints, nowIso, setUserPoints, setQaQuestions, getQaQuestions, uid, appendUserPointTxn } from '@/lib/client-store'

const SUBJECTS = ['数学', '物理', '化学', '生物', '英语', '语文', '历史', '地理', '政治', '编程']

export default function AskQuestionPage() {
  const router = useRouter()
  const { user, isLoggedIn, updateUser } = useUser()

  const [subject, setSubject] = useState<string>('数学')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [reward, setReward] = useState<number>(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  const [availableTags, setAvailableTags] = useState<string[]>(['学习方法', '解题技巧', '语法', '写作', '竞赛', '升学', '心理陪伴', '志愿活动'])

  useEffect(() => {
    getTags().then(tags => {
      const names = tags.filter(t => t.enabled).map(t => t.name)
      if (names.length > 0) {
        setAvailableTags(names)
      }
    }).catch(e => {
      console.error('[QA Ask] 加载标签失败:', e)
      // 保持 fallback 标签
    })
  }, [])

  const points = useMemo(() => {
    if (!user) return 0
    return getUserPoints(user.id, user.points)
  }, [user])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag)
      if (prev.length >= 3) return prev
      return [...prev, tag]
    })
  }

  const canSubmit = title.trim().length >= 5 && content.trim().length >= 10 && selectedTags.length > 0 && reward >= 0

  const handleSubmit = async () => {
    if (!user) return
    if (!canSubmit) return
    if (reward > points) return
    if (submitting) return

    setSubmitting(true)
    const createdAt = nowIso()

    try {
      const token = localStorage.getItem('token') || undefined
      if (!token) {
        alert('请先登录')
        setSubmitting(false)
        return
      }

      // 调用后端 API 创建问题
      const created = await apiClient.post<any>(
        `/content/qa/questions`,
        {
          subject,
          title: title.trim(),
          content: content.trim(),
          tags: JSON.stringify(selectedTags),
          reward_points: reward,
        },
        token
      )

      const questionId = created?.id || uid('q')

      // 本地积分扣减（待后端完善后可移除）
      if (reward > 0) {
        const nextPoints = points - reward
        setUserPoints(user.id, nextPoints)
        updateUser({ points: nextPoints })

        appendUserPointTxn(user.id, {
          id: uid('ptx'),
          type: 'reward_out',
          title: `发布悬赏提问：${title.trim()}`,
          points: -reward,
          createdAt,
          meta: { questionId },
        })
      }

      router.push(`/qa/${questionId}`)
    } catch (e: any) {
      console.error(e)
      alert('发布失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isLoggedIn || !user) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/qa" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回问答广场
            </Link>
            <h1 className="text-3xl font-bold text-foreground">提问</h1>
            <p className="mt-2 text-muted-foreground">描述清晰、标签准确，更容易获得高质量回答</p>
          </div>
          <Badge variant="secondary" className="h-8 px-3">
            当前积分：{points}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>问题信息</CardTitle>
              <CardDescription>标题不少于 5 个字，描述不少于 10 个字</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">学科</div>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">悬赏积分</div>
                    <div className="text-xs text-muted-foreground">可为 0</div>
                  </div>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={reward}
                      onChange={(e) => setReward(Number(e.target.value || 0))}
                      type="number"
                      min={0}
                      className="pl-9"
                    />
                  </div>
                  {reward > points && (
                    <div className="text-xs text-destructive">积分不足，无法发布该悬赏</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">标题</div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="用一句话概括你的问题"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">描述</div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="补充背景、已尝试的方法、希望得到的回答形式等"
                  className="min-h-[160px] resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {content.length} 字
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-foreground">标签</div>
                  <div className="text-xs text-muted-foreground">最多 3 个</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const selected = selectedTags.includes(tag)
                    return (
                      <Button
                        key={tag}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        size="sm"
                        className={selected ? '' : 'bg-transparent'}
                        onClick={() => toggleTag(tag)}
                      >
                        <Hash className="mr-1 h-3 w-3" />
                        {tag}
                      </Button>
                    )
                  })}
                </div>
                {selectedTags.length === 0 && (
                  <div className="text-xs text-muted-foreground">请至少选择 1 个标签</div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push('/qa')}>
                  取消
                </Button>
                <Button className="flex-1" disabled={!canSubmit || reward > points} onClick={handleSubmit}>
                  发布提问
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                提问小贴士
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>写清楚你卡住的点：题目、条件、你尝试过的方法。</div>
              <div>标签越准确，越容易被匹配到合适的答主/志愿者讲师。</div>
              <div>悬赏积分会在发布时扣除，最佳答案采纳后自动结算给答主。</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
