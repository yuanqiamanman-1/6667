'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type Item = {
  id: string
  applicantName: string
  applicantAvatar?: string
  evidences: Array<{ id?: string; name: string }>
  tags: string[]
  timeSlots: string[]
  note?: string
  status: ReviewStatus
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectedReason?: string
}

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

function statusMeta(s: ReviewStatus) {
  if (s === 'approved') return { label: '已通过', icon: CheckCircle2, variant: 'secondary' as const }
  if (s === 'rejected') return { label: '已驳回', icon: XCircle, variant: 'destructive' as const }
  return { label: '待审核', icon: Clock, variant: 'outline' as const }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export default function VolunteerTeacherReviewTab(props: { schoolId: string; reviewerName: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState(0)
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({})
  const [applicantOpen, setApplicantOpen] = useState(false)
  const [applicantLoading, setApplicantLoading] = useState(false)
  const [applicant, setApplicant] = useState<any | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setLoading(true)
    apiClient
      .get<any[]>(`/association/verifications/requests?type=volunteer_teacher&school_id=${encodeURIComponent(props.schoolId)}`, token)
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : []
        const mapped: Item[] = list.map((r: any) => {
          const evidence = (() => {
            try {
              const v = JSON.parse(String(r.evidence_refs ?? '[]'))
              if (Array.isArray(v) && v[0] && typeof v[0] === 'object') {
                const first = v[0] as any
                const file = first.file
                const fileObj = file && typeof file === 'object' ? file : null
                return {
                  evidences: fileObj
                    ? [{ id: fileObj.id ? String(fileObj.id) : undefined, name: String(fileObj.name ?? '材料') }]
                    : (typeof file === 'string' ? [{ name: String(file) }] : []),
                  tags: Array.isArray(first.tags) ? first.tags.map(String) : [],
                  timeSlots: Array.isArray(first.timeSlots) ? first.timeSlots.map(String) : [],
                }
              }
              if (Array.isArray(v)) {
                return {
                  evidences: v
                    .map((x: any) => {
                      if (typeof x === 'string') return { name: x }
                      if (x && typeof x === 'object') {
                        const id = x.id ? String(x.id) : undefined
                        const name = x.name ? String(x.name) : (x.url ? String(x.url) : '材料')
                        return { id, name }
                      }
                      return null
                    })
                    .filter(Boolean),
                  tags: [],
                  timeSlots: [],
                }
              }
              return { evidences: [], tags: [], timeSlots: [] }
            } catch {
              return { evidences: [], tags: [], timeSlots: [] }
            }
          })()
          return {
            id: String(r.id ?? ''),
            applicantName: String(r.applicant_name ?? ''),
            applicantAvatar: '/placeholder.svg',
            evidences: evidence.evidences as any,
            tags: evidence.tags,
            timeSlots: evidence.timeSlots,
            note: r.note ? String(r.note) : undefined,
            status: String(r.status ?? 'pending') as ReviewStatus,
            createdAt: String(r.created_at ?? ''),
            reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
            reviewedBy: r.reviewed_by ? String(r.reviewed_by) : undefined,
            rejectedReason: r.rejected_reason ? String(r.rejected_reason) : undefined,
          }
        })
        setItems(mapped)
      })
      .catch((e) => {
        console.error(e)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [props.schoolId, version])

  const list = useMemo(() => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [items])

  const handleApprove = async (id: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    await apiClient.post(`/association/verifications/requests/${id}/review`, { status: 'approved' }, token)
    setVersion(v => v + 1)
  }

  const handleReject = async (id: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const reason = (rejectReasonById[id] ?? '').trim() || '材料不完整，请补充证明'
    await apiClient.post(`/association/verifications/requests/${id}/review`, { status: 'rejected', rejected_reason: reason }, token)
    setVersion(v => v + 1)
  }

  const openApplicant = async (requestId: string) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setApplicantOpen(true)
    setApplicantLoading(true)
    try {
      const u = await apiClient.get<any>(`/association/verifications/requests/${requestId}/applicant`, token)
      setApplicant(u)
    } catch (e) {
      console.error(e)
      setApplicant(null)
    } finally {
      setApplicantLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>志愿者讲师认证审核</CardTitle>
          <CardDescription>审核本校讲师申请材料，决定是否进入匹配池</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              暂无申请
            </div>
          ) : (
            list.map(item => {
              const meta = statusMeta(item.status)
              const Icon = meta.icon
              return (
                <div key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.applicantAvatar || '/placeholder.svg'} />
                        <AvatarFallback className="bg-primary/10 text-primary">{item.applicantName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-foreground">{item.applicantName}</div>
                          <Badge variant={meta.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">提交时间：{formatTime(item.createdAt)}</div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          材料：
                          {item.evidences.length === 0 ? '无' : (
                            <span className="ml-1">
                              {item.evidences.map((e, idx) => (
                                <span key={`${item.id}-${idx}`}>
                                  {idx > 0 ? '、' : null}
                                  {e.id ? (
                                    <a className="underline" href={`${API_BASE_URL}/files/${e.id}`} target="_blank" rel="noreferrer">
                                      {e.name}
                                    </a>
                                  ) : (
                                    e.name
                                  )}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.tags.map(t => (
                            <Badge key={t} variant="secondary" className="font-normal">
                              #{t}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">可用时间：{item.timeSlots.join('、') || '-'}</div>

                        {item.status === 'rejected' && item.rejectedReason && (
                          <div className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            驳回原因：{item.rejectedReason}
                          </div>
                        )}
                        {item.status === 'approved' && item.reviewedAt && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                            审核通过：{item.reviewedBy ?? '-'} · {formatTime(item.reviewedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <div className="w-full max-w-xs space-y-2">
                        <Button variant="outline" className="w-full bg-transparent" onClick={() => openApplicant(item.id)}>
                          查看用户
                        </Button>
                        <Textarea
                          value={rejectReasonById[item.id] ?? ''}
                          onChange={(e) => setRejectReasonById(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="驳回原因（可选）"
                          className="min-h-20"
                        />
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => handleApprove(item.id)}>
                            通过
                          </Button>
                          <Button variant="destructive" className="flex-1" onClick={() => handleReject(item.id)}>
                            驳回
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={applicantOpen} onOpenChange={setApplicantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户信息</DialogTitle>
          </DialogHeader>
          {applicantLoading ? (
            <div className="text-sm text-muted-foreground">加载中...</div>
          ) : applicant ? (
            <div className="space-y-2 text-sm">
              <div>用户名：{applicant.username || '-'}</div>
              <div>姓名：{applicant.full_name || '-'}</div>
              <div>邮箱：{applicant.email || '-'}</div>
              <div>角色：{applicant.role || '-'}</div>
              <div>school_id：{applicant.school_id || '-'}</div>
              <div>入驻状态：{applicant.onboarding_status || '-'}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">无法获取用户信息</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
