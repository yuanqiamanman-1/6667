'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Paperclip, Smile, ImageDownIcon as ImageIconIcon, Mic, CheckCheck } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const conversationId = String((params as any).id ?? '')
  const { user, isLoggedIn, isLoading } = useUser()
  const [peer, setPeer] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) router.push('/login')
  }, [isLoading, isLoggedIn, router])

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (isLoading || !isLoggedIn) return
    if (!conversationId) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setLoadingMessages(true)
    Promise.all([
      apiClient.get<any[]>('/conversations', token),
      apiClient.get<any[]>(`/conversations/${encodeURIComponent(conversationId)}/messages?page_size=200`, token),
      apiClient.post(`/conversations/${encodeURIComponent(conversationId)}/read`, {}, token).catch(() => null),
    ])
      .then(([convs, msgs]) => {
        if (Array.isArray(convs)) {
          const found = convs.find((c) => String(c?.id ?? '') === conversationId)
          setPeer(found?.peer_user ?? null)
        } else {
          setPeer(null)
        }
        setMessages(Array.isArray(msgs) ? msgs : [])
      })
      .catch((e) => {
        console.error(e)
        setPeer(null)
        setMessages([])
      })
      .finally(() => setLoadingMessages(false))
  }, [conversationId, isLoading, isLoggedIn])

  const canSend = useMemo(() => inputValue.trim().length > 0, [inputValue])

  if (isLoading || !isLoggedIn || !user) {
    return null
  }

  const handleSend = async () => {
    if (!canSend) return
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const content = inputValue.trim()
    setInputValue('')
    try {
      const created = await apiClient.post<any>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { content }, token)
      setMessages(prev => [...prev, created])
    } catch (e) {
      console.error(e)
      alert('发送失败')
    }
  }

  const peerName = String(peer?.full_name || peer?.username || '会话')

  return (
    <div className="flex h-screen flex-col bg-muted/20 pt-16">
      <Navbar />
      <header className="border-b border-border bg-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/messages">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow">
                <AvatarImage src="/illustrations/avatar-teacher.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {peerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{peerName}</span>
                  <Badge variant="outline" className="text-xs">私聊</Badge>
                </div>
                <div className="text-xs text-muted-foreground">会话 ID：{conversationId}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="container mx-auto max-w-3xl space-y-4">
          {loadingMessages && messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无消息
            </div>
          ) : (
            messages.map((message) => {
              const isMe = String(message?.sender?.id ?? '') === String(user.id)
              return (
                <motion.div
                  key={String(message.id)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/illustrations/avatar-teacher.jpg" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {peerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isMe ? 'bg-primary text-white' : 'bg-white text-foreground shadow-sm'
                        }`}
                      >
                        <p className="leading-relaxed">{String(message.content ?? '')}</p>
                      </div>
                      <div className={`mt-1 flex items-center gap-1 text-xs text-muted-foreground ${isMe ? 'justify-end' : ''}`}>
                        <span>{formatTime(String(message.created_at ?? ''))}</span>
                        {isMe && <CheckCheck className="h-3 w-3 text-primary" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      <div className="border-t border-border bg-white px-4 py-4">
        <div className="container mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <ImageIconIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入消息..."
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            {canSend ? (
              <Button onClick={handleSend} size="icon" className="h-9 w-9">
                <Send className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
