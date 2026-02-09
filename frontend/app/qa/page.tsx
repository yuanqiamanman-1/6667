'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { 
  Search,
  Plus,
  Clock,
  Eye,
  MessageCircle,
  Award,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MOCK_QUESTIONS } from '@/lib/mock-data'
import { getQaQuestions } from '@/lib/client-store'
import { apiClient } from '@/lib/api-client'

const SUBJECTS = ['全部', '数学', '物理', '化学', '生物', '英语', '语文', '历史', '编程']

export default function QAPage() {
  const [activeSubject, setActiveSubject] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('latest')
  const [remoteQuestions, setRemoteQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 从后端加载问题
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token') || undefined
        const questions = await apiClient.get<any[]>('/content/qa/questions?limit=100', token)
        setRemoteQuestions(Array.isArray(questions) ? questions : [])
      } catch (e) {
        console.error('[QA] 加载问题失败:', e)
        setRemoteQuestions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const localQuestions = useMemo(() => {
    const stored = getQaQuestions()
    return stored.map(q => ({
      id: q.id,
      title: q.title,
      content: q.content,
      subject: q.subject ?? '数学',
      reward: q.reward,
      tags: q.tags,
      createdAt: q.createdAt,
      views: q.views ?? 0,
      answers: q.answers ?? 0,
      solved: Boolean(q.solved),
      author: {
        name: q.authorName ?? '匿名用户',
        avatar: q.authorAvatar,
        level: 1,
      },
    }))
  }, [])

  const backendQuestions = useMemo(() => {
    return remoteQuestions.map(q => ({
      id: String(q.id),
      title: q.title,
      content: q.content,
      subject: q.subject ?? '数学',
      reward: q.reward_points ?? 0,
      tags: (() => {
        try {
          const v = JSON.parse(String(q.tags ?? '[]'))
          return Array.isArray(v) ? v : []
        } catch {
          return []
        }
      })(),
      createdAt: q.created_at,
      views: q.views ?? 0,
      answers: q.answers_count ?? 0,
      solved: Boolean(q.solved),
      author: {
        name: q.author_name ?? '匿名用户',
        avatar: undefined,
        level: 1,
      },
    }))
  }, [remoteQuestions])

  const allQuestions = useMemo(() => {
    return [...backendQuestions, ...localQuestions, ...MOCK_QUESTIONS]
  }, [backendQuestions, localQuestions])

  // 多重筛选逻辑
  let filteredQuestions = allQuestions.filter(q => {
    const matchSubject = activeSubject === '全部' || q.subject === activeSubject
    const matchSearch = searchQuery === '' || 
      q.title.includes(searchQuery) || 
      q.content.includes(searchQuery) ||
      q.tags.some(tag => tag.includes(searchQuery))
    return matchSubject && matchSearch
  })

  // 根据tab排序
  filteredQuestions = [...filteredQuestions].sort((a, b) => {
    if (activeTab === 'latest') {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      console.log(`[QA Sort] ${a.title}: ${a.createdAt} (${timeA}) vs ${b.title}: ${b.createdAt} (${timeB})`)
      return timeB - timeA
    } else if (activeTab === 'hot') {
      return b.views - a.views
    } else if (activeTab === 'reward') {
      return b.reward - a.reward
    } else if (activeTab === 'unsolved') {
      return a.solved === b.solved ? 0 : a.solved ? 1 : -1
    }
    return 0
  })

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">问答广场</h1>
            <p className="mt-2 text-muted-foreground">
              提出问题，获得解答；分享知识，赢取积分
            </p>
          </div>
          <Link href="/qa/ask">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              提问
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索问题..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SUBJECTS.map((subject) => (
              <Button
                key={subject}
                variant={activeSubject === subject ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSubject(subject)}
                className={activeSubject !== subject ? 'bg-transparent' : ''}
              >
                {subject}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="latest" className="gap-2">
              <Clock className="h-4 w-4" />
              最新
            </TabsTrigger>
            <TabsTrigger value="hot" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              热门
            </TabsTrigger>
            <TabsTrigger value="reward" className="gap-2">
              <Award className="h-4 w-4" />
              高悬赏
            </TabsTrigger>
            <TabsTrigger value="unsolved" className="gap-2">
              <Sparkles className="h-4 w-4" />
              待解答
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Question List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">暂无相关问题</p>
            </div>
          ) : (
            filteredQuestions.map((question) => (
              <Link key={question.id} href={`/qa/${question.id}`}>
                <Card className="group border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-muted/50">
                            {question.subject}
                          </Badge>
                          {question.solved && (
                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              已解决
                            </Badge>
                          )}
                          {question.reward > 0 && (
                            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
                              <Award className="mr-1 h-3 w-3" />
                              {question.reward} 积分
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl transition-colors group-hover:text-primary">
                          {question.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 text-base">
                          {question.content}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {question.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={question.author?.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(question.author?.name || '?').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {question.author?.name || '匿名用户'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {question.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {question.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {question.answers}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredQuestions.length > 0 && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="bg-transparent">
              加载更多问题
            </Button>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  )
}
