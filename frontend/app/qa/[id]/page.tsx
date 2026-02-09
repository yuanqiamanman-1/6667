'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Eye,
  MessageCircle,
  Award,
  CheckCircle2,
  Heart,
  Share2,
  ThumbsUp,
  Send,
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { MOCK_QUESTIONS } from '@/lib/mock-data'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'
import {
  appendUserPointTxn,
  getQaAnswers,
  getQaQuestions,
  getUserPoints,
  nowIso,
  setQaAnswers,
  setQaQuestions,
  setUserPoints,
  uid,
} from '@/lib/client-store'

type DisplayQuestion = {
  id: string
  subject: string
  title: string
  content: string
  tags: string[]
  reward: number
  createdAt: string
  views: number
  answers: number
  solved: boolean
  author: {
    id?: string
    name: string
    avatar?: string
    level?: number
  }
  acceptedAnswerId?: string
}

type DisplayAnswer = {
  id: string
  questionId: string
  author: {
    id?: string
    name: string
    avatar?: string
  }
  content: string
  likes: number
  createdAt: string
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function QuestionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const questionId = params.id as string
  const { user, isLoggedIn, updateUser } = useUser()

  const [newAnswer, setNewAnswer] = useState('')
  const [liked, setLiked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [remoteQuestion, setRemoteQuestion] = useState<any>(null)
  const [remoteAnswers, setRemoteAnswers] = useState<any[]>([])
  const [remoteLoading, setRemoteLoading] = useState(true)

  // 尝试从后端加载问题和回答
  useEffect(() => {
    const load = async () => {
      setRemoteLoading(true)
      try {
        const token = localStorage.getItem('token') || undefined
        const questions = await apiClient.get<any[]>(`/content/qa/questions?limit=100`, token)
        const found = (questions || []).find((q: any) => String(q.id) === questionId)
        if (found) {
          setRemoteQuestion(found)
          // 加载回答
          const answers = await apiClient.get<any[]>(`/content/qa/questions/${encodeURIComponent(questionId)}/answers`, token)
          setRemoteAnswers(Array.isArray(answers) ? answers : [])
        }
      } catch (e) {
        console.error('[QA] load error:', e)
      } finally {
        setRemoteLoading(false)
      }
    }
    load()
  }, [questionId])

  const localQuestions = useMemo(() => getQaQuestions(), [])

  const question = useMemo<DisplayQuestion | null>(() => {
    // 优先使用后端数据
    if (remoteQuestion) {
      return {
        id: String(remoteQuestion.id),
        subject: remoteQuestion.subject ?? '数学',
        title: remoteQuestion.title,
        content: remoteQuestion.content,
        tags: (() => {
          try {
            const v = JSON.parse(String(remoteQuestion.tags ?? '[]'))
            return Array.isArray(v) ? v : []
          } catch {
            return []
          }
        })(),
        reward: remoteQuestion.reward_points ?? 0,
        createdAt: remoteQuestion.created_at,
        views: remoteQuestion.views ?? 0,
        answers: remoteQuestion.answers_count ?? 0,
        solved: Boolean(remoteQuestion.solved),
        acceptedAnswerId: remoteQuestion.accepted_answer_id,
        author: {
          id: remoteQuestion.author_id,
          name: remoteQuestion.author_name || '匿名用户',
          avatar: undefined,
          level: 1,
        },
      }
    }

    const local = localQuestions.find(q => q.id === questionId)
    if (local) {
      return {
        id: local.id,
        subject: local.subject ?? '数学',
        title: local.title,
        content: local.content,
        tags: local.tags,
        reward: local.reward,
        createdAt: local.createdAt,
        views: local.views ?? 0,
        answers: local.answers ?? 0,
        solved: Boolean(local.solved),
        acceptedAnswerId: local.acceptedAnswerId,
        author: {
          id: local.authorId,
          name: local.authorName ?? '匿名用户',
          avatar: local.authorAvatar,
          level: 1,
        },
      }
    }

    const numericId = Number.parseInt(questionId, 10)
    if (Number.isNaN(numericId)) return null

    const q = MOCK_QUESTIONS.find(m => m.id === numericId)
    if (!q) return null

    return {
      id: String(q.id),
      subject: q.subject,
      title: q.title,
      content: q.content,
      tags: q.tags,
      reward: q.reward,
      createdAt: q.createdAt,
      views: q.views,
      answers: q.answers,
      solved: Boolean(q.solved),
      author: {
        name: q.author?.name || '匿名用户',
        avatar: q.author?.avatar,
        level: q.author?.level,
      },
    }
  }, [remoteQuestion, localQuestions, questionId])

  const isRemoteQuestion = Boolean(remoteQuestion)
  const isLocalQuestion = useMemo(() => {
    return !isRemoteQuestion && Boolean(localQuestions.find(q => q.id === questionId))
  }, [isRemoteQuestion, localQuestions, questionId])

  useEffect(() => {
    if (!isLocalQuestion) return
    const current = getQaQuestions()
    const next = current.map(q => (q.id === questionId ? { ...q, views: (q.views ?? 0) + 1 } : q))
    setQaQuestions(next)
  }, [isLocalQuestion, questionId])

  const initialAnswers = useMemo<DisplayAnswer[]>(() => {
    if (!question) return []

    // 优先使用后端回答
    if (isRemoteQuestion) {
      return remoteAnswers.map(a => ({
        id: String(a.id),
        questionId: String(a.question_id),
        author: { id: a.author_id, name: a.author_name || '匿名用户', avatar: undefined },
        content: a.content,
        likes: a.likes_count ?? 0,
        createdAt: a.created_at,
      }))
    }

    if (isLocalQuestion) {
      return getQaAnswers(question.id).map(a => ({
        id: a.id,
        questionId: a.questionId,
        author: { id: a.authorId, name: a.authorName, avatar: a.authorAvatar },
        content: a.content,
        likes: a.likes,
        createdAt: a.createdAt,
      }))
    }

    return [
      {
        id: 'mock_a1',
        questionId: question.id,
        author: { name: '张老师', avatar: '/avatars/avatar-06.jpg' },
        content: '这个问题很好！我建议你可以这样理解...',
        likes: 15,
        createdAt: '1小时前',
      },
      {
        id: 'mock_a2',
        questionId: question.id,
        author: { name: '李同学', avatar: '/avatars/avatar-03.jpg' },
        content: '我也遇到过类似的问题，后来发现...',
        likes: 8,
        createdAt: '3小时前',
      },
    ]
  }, [isRemoteQuestion, remoteAnswers, isLocalQuestion, question])

  const [answers, setAnswers] = useState<DisplayAnswer[]>(initialAnswers)

  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const related = useMemo(() => {
    if (!question) return []
    const local = getQaQuestions().map(q => ({
      id: q.id,
      subject: q.subject ?? '数学',
      title: q.title,
      createdAt: q.createdAt,
      answers: q.answers ?? 0,
    }))

    const base = MOCK_QUESTIONS.map(q => ({
      id: String(q.id),
      subject: q.subject,
      title: q.title,
      createdAt: q.createdAt,
      answers: q.answers,
    }))

    return [...local, ...base]
      .filter(q => q.id !== question.id && q.subject === question.subject)
      .slice(0, 3)
  }, [question])

  const isAsker = useMemo(() => {
    if (!question || !user) return false
    return (isRemoteQuestion && question.author.id === user.id) ||
      (isLocalQuestion && question.author.id === user.id)
  }, [question, user, isRemoteQuestion, isLocalQuestion])

  const acceptedAnswerId = useMemo(() => {
    if (isRemoteQuestion) return remoteQuestion?.accepted_answer_id
    if (isLocalQuestion) return getQaQuestions().find(q => q.id === questionId)?.acceptedAnswerId
    return undefined
  }, [isRemoteQuestion, isLocalQuestion, remoteQuestion, questionId])

  if (remoteLoading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">问题不存在</h1>
          <Link href="/qa">
            <Button className="mt-4">返回问答广场</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleLikeAnswer = (answerId: string) => {
    setAnswers(prev => {
      const next = prev.map(a => (a.id === answerId ? { ...a, likes: a.likes + 1 } : a))

      if (isLocalQuestion) {
        const stored = getQaAnswers(question.id)
        const updated = stored.map(a => (a.id === answerId ? { ...a, likes: a.likes + 1 } : a))
        setQaAnswers(question.id, updated)
      }

      return next
    })
  }

  const handleSubmitAnswer = async () => {
    if (!isLoggedIn || !user) {
      router.push('/login')
      return
    }

    const text = newAnswer.trim()
    if (text.length < 5) return
    if (submitting) return

    const createdAt = nowIso()

    // 后端问题：调用后端 API
    if (isRemoteQuestion) {
      setSubmitting(true)
      try {
        const token = localStorage.getItem('token') || undefined
        if (!token) {
          alert('请先登录')
          return
        }
        const created = await apiClient.post<any>(
          `/content/qa/questions/${encodeURIComponent(question.id)}/answers`,
          { content: text },
          token
        )
        // 刷新回答列表
        const answers = await apiClient.get<any[]>(`/content/qa/questions/${encodeURIComponent(questionId)}/answers`, token)
        setRemoteAnswers(Array.isArray(answers) ? answers : [])
        setNewAnswer('')
      } catch (e: any) {
        console.error(e)
        alert('提交失败，请稍后重试')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!isLocalQuestion) {
      setAnswers(prev => [
        {
          id: uid('mock_write'),
          questionId: question.id,
          author: { id: user.id, name: user.name, avatar: user.avatar },
          content: text,
          likes: 0,
          createdAt: '刚刚',
        },
        ...prev,
      ])
      setNewAnswer('')
      return
    }

    const answerId = uid('ans')

    setAnswers(prev => [
      {
        id: answerId,
        questionId: question.id,
        author: { id: user.id, name: user.name, avatar: user.avatar },
        content: text,
        likes: 0,
        createdAt,
      },
      ...prev,
    ])
    setNewAnswer('')

    const storedAnswers = getQaAnswers(question.id)
    setQaAnswers(question.id, [
      {
        id: answerId,
        questionId: question.id,
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content: text,
        likes: 0,
        createdAt,
      },
      ...storedAnswers,
    ])

    const currentQuestions = getQaQuestions()
    const nextQuestions = currentQuestions.map(q => (q.id === question.id ? { ...q, answers: (q.answers ?? 0) + 1 } : q))
    setQaQuestions(nextQuestions)
  }

  const handleAccept = async (answerId: string) => {
    if (!isAsker) return
    if (accepting) return

    // 后端问题：调用后端 API
    if (isRemoteQuestion) {
      if (remoteQuestion?.accepted_answer_id) return
      setAccepting(true)
      try {
        const token = localStorage.getItem('token') || undefined
        if (!token) {
          alert('请先登录')
          return
        }
        await apiClient.post(
          `/content/qa/questions/${encodeURIComponent(question.id)}/accept?answer_id=${encodeURIComponent(answerId)}`,
          {},
          token
        )
        // 刷新问题数据
        const questions = await apiClient.get<any[]>(`/content/qa/questions?limit=100`, token)
        const found = (questions || []).find((q: any) => String(q.id) === questionId)
        if (found) setRemoteQuestion(found)
        alert('采纳成功！')
      } catch (e: any) {
        console.error(e)
        alert('采纳失败，请稍后重试')
      } finally {
        setAccepting(false)
      }
      return
    }

    // 本地问题逻辑
    const currentQuestions = getQaQuestions()
    const target = currentQuestions.find(q => q.id === question.id)
    if (!target) return
    if (target.acceptedAnswerId) return

    const selected = answers.find(a => a.id === answerId)
    if (!selected?.author.id) return

    setQaQuestions(currentQuestions.map(q => (q.id === question.id ? { ...q, solved: true, acceptedAnswerId: answerId } : q)))

    if (target.reward > 0) {
      const answererId = selected.author.id
      const currentPoints = getUserPoints(answererId, 0)
      const nextPoints = currentPoints + target.reward
      setUserPoints(answererId, nextPoints)

      appendUserPointTxn(answererId, {
        id: uid('ptx'),
        type: 'reward_in',
        title: `最佳答案奖励：${question.title}`,
        points: target.reward,
        createdAt: nowIso(),
        meta: { questionId: question.id },
      })

      if (user && user.id === answererId) {
        updateUser({ points: nextPoints })
      }
    }

    router.refresh()
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Link href="/qa">
          <Button variant="ghost" className="mb-6 gap-2 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
            返回问答广场
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-muted/50">
                      {question.subject}
                    </Badge>
                    {question.solved && (
                      <Badge className="bg-green-500/10 text-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        已解决
                      </Badge>
                    )}
                    {question.reward > 0 && (
                      <Badge className="bg-amber-500/10 text-amber-600">
                        <Award className="mr-1 h-3 w-3" />
                        {question.reward} 积分
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLiked(!liked)}
                      className={liked ? 'text-red-500' : ''}
                    >
                      <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h1 className="text-2xl font-bold leading-relaxed lg:text-3xl">{question.title}</h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={question.author.avatar || '/placeholder.svg'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {question.author.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{question.author.name}</span>
                  </div>
                  <span>{formatTime(question.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {question.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {isLocalQuestion ? answers.length : question.answers}
                  </span>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <p className="text-base leading-relaxed text-foreground">{question.content}</p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {question.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <h2 className="text-xl font-bold">{answers.length} 个回答</h2>
              </CardHeader>

              <CardContent className="space-y-6">
                {answers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">暂无回答</p>
                  </div>
                ) : (
                  answers.map((answer, index) => (
                    <div key={answer.id}>
                      {index > 0 && <Separator className="my-6" />}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={answer.author.avatar || '/placeholder.svg'} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {answer.author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{answer.author.name}</span>
                                {acceptedAnswerId === answer.id && (
                                  <Badge className="bg-green-500/10 text-green-600">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    最佳答案
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">{formatTime(answer.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isAsker && !acceptedAnswerId && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-transparent"
                                onClick={() => handleAccept(answer.id)}
                              >
                                设为最佳答案
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleLikeAnswer(answer.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {answer.likes}
                            </Button>
                          </div>
                        </div>

                        <p className="leading-relaxed text-muted-foreground">{answer.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <h2 className="text-xl font-bold">写下你的回答</h2>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="分享你的知识，帮助他人解决问题..."
                  className="min-h-32 resize-none"
                />
                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-muted-foreground">{newAnswer.length} / 500</span>
                  <Button className="gap-2" onClick={handleSubmitAnswer} disabled={newAnswer.trim().length < 5 || submitting}>
                    <Send className="h-4 w-4" />
                    {submitting ? '提交中...' : '提交回答'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <h3 className="font-bold">提问者</h3>
              </CardHeader>
              <CardContent className="text-center">
                <Avatar className="mx-auto h-16 w-16">
                  <AvatarImage src={question.author.avatar || '/placeholder.svg'} />
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {question.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h4 className="mt-3 font-medium">{question.author.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  等级 {question.author.level || 1}
                </p>
                <Button className="mt-4 w-full bg-transparent" variant="outline">
                  关注
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <h3 className="font-bold">相关问题</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {related.map((q) => (
                  <Link key={q.id} href={`/qa/${q.id}`}>
                    <div className="rounded-lg border p-3 transition-all hover:border-primary/50 hover:bg-muted/50">
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed">{q.title}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {q.answers}
                        </span>
                        <span>{formatTime(q.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
