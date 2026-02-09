'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Star,
  Clock,
  MessageCircle,
  Award,
  GraduationCap,
  Heart,
  Filter,
  SlidersHorizontal
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/user-context'
import { COMMUNICATION_METHOD_LABELS, SUBJECT_LABELS, TIME_OPTION_LABELS, toLabel } from '@/lib/match-labels'
import { apiClient } from '@/lib/api-client'

export default function MatchResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoggedIn, isLoading } = useUser()
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null)
  const [matchRequest, setMatchRequest] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [offerStatusByTeacher, setOfferStatusByTeacher] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const id = searchParams.get('id') || localStorage.getItem('currentMatchRequestId')
    if (!id) return
    setLoading(true)
    Promise.all([
      apiClient.get<any>(`/match/requests/${encodeURIComponent(id)}`, token),
      apiClient.get<any[]>(`/match/requests/${encodeURIComponent(id)}/candidates`, token),
    ])
      .then(([req, list]) => {
        setMatchRequest(req)
        setCandidates(Array.isArray(list) ? list : [])
      })
      .catch((e) => {
        console.error(e)
        setMatchRequest(null)
        setCandidates([])
      })
      .finally(() => setLoading(false))
  }, [isLoading, isLoggedIn, router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pt-16">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        </main>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/match/help" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回修改
            </Link>
            <h1 className="text-3xl font-bold text-foreground">匹配结果</h1>
            <p className="mt-2 text-muted-foreground">
              根据你的需求，我们为你找到了 <span className="font-semibold text-primary">{candidates.length}</span> 位合适的志愿者
            </p>
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <SlidersHorizontal className="h-4 w-4" />
            筛选
          </Button>
        </div>

        {/* Match Summary */}
        {matchRequest ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 p-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">学科需求：</span>
                {(() => {
                  try {
                    const v = JSON.parse(String(matchRequest.tags ?? '[]'))
                    return Array.isArray(v) ? v : []
                  } catch {
                    return []
                  }
                })().map((tag: string) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">沟通方式：</span>
                <Badge variant="secondary">{toLabel(matchRequest.channel, COMMUNICATION_METHOD_LABELS)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">时间：</span>
                <Badge variant="secondary">{toLabel(matchRequest.time_mode, TIME_OPTION_LABELS)}</Badge>
              </div>
            </div>
            {matchRequest.note && (
              <p className="mt-4 text-sm text-muted-foreground">
                问题描述：{matchRequest.note}
              </p>
            )}
          </motion.div>
        ) : null}

        {/* Volunteer List */}
        {loading ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            暂无可用志愿者
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {candidates.map((volunteer, index) => (
              <AnimatedCard key={String(volunteer.user_id || index)} delay={index * 100}>
                <Card
                  className={`group cursor-pointer border-2 transition-all duration-500 hover:shadow-xl ${
                    selectedVolunteer === String(volunteer.user_id)
                      ? 'border-primary shadow-lg shadow-primary/10'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVolunteer(String(volunteer.user_id))}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                            <AvatarImage src="/illustrations/avatar-teacher.jpg" alt={volunteer.full_name || volunteer.username || '志愿讲师'} />
                            <AvatarFallback className="bg-primary text-white">
                              {(volunteer.full_name || volunteer.username || '讲').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            {volunteer.full_name || volunteer.username || '志愿讲师'}
                            <Badge variant="outline">
                              {volunteer.in_pool ? '在匹配池' : '已下架'}
                            </Badge>
                          </CardTitle>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <GraduationCap className="h-4 w-4" />
                            {volunteer.school_display_name
                              ? `来自：${String(volunteer.school_display_name)}`
                              : (volunteer.school_id ? `来自：${String(volunteer.school_id)}` : '来自：未知高校')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(volunteer.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="bg-muted/50">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      可用时间：{(volunteer.time_slots || []).length ? (volunteer.time_slots || []).join('、') : '—'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      推荐理由：{volunteer.explain ? String(volunteer.explain) : '—'}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        className="w-full gap-2"
                        disabled={offerStatusByTeacher[String(volunteer.user_id)] === 'pending' || !matchRequest?.id}
                        onClick={async () => {
                          const token = localStorage.getItem('token') || undefined
                          if (!token) {
                            router.push('/login')
                            return
                          }
                          if (!matchRequest?.id) return
                          const teacherKey = String(volunteer.user_id)
                          setOfferStatusByTeacher(prev => ({ ...prev, [teacherKey]: 'pending' }))
                          try {
                            await apiClient.post<any>(
                              `/match/requests/${encodeURIComponent(String(matchRequest.id))}/offers?teacher_id=${encodeURIComponent(teacherKey)}`,
                              {},
                              token,
                            )
                          } catch (e) {
                            console.error(e)
                            setOfferStatusByTeacher((prev) => {
                              const next = { ...prev }
                              delete next[teacherKey]
                              return next
                            })
                          }
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {offerStatusByTeacher[String(volunteer.user_id)] === 'pending' ? '已求助（待响应）' : '求助'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}
