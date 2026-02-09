'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api-client'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type EvidenceItem = { id?: string; name: string }
type VerificationRequest = {
  id: string
  applicantName: string
  applicantSchool?: string
  evidences: EvidenceItem[]
  note?: string
  status: ReviewStatus
  createdAt: string
  rejectedReason?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

function formatTime(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('zh-CN')
}

export default function BasicVerificationReviewTab(props: { operatorName: string }) {
  const [version, setVersion] = useState(0)
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({})
  const [items, setItems] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [applicantOpen, setApplicantOpen] = useState(false)
  const [applicantLoading, setApplicantLoading] = useState(false)
  const [applicant, setApplicant] = useState<any | null>(null)

  useEffect(() => {
    setVersion(v => v + 1)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    setLoading(true)
    apiClient
      .get<any[]>('/association/verifications/requests?type=general_basic', token)
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : []
        const mapped: VerificationRequest[] = list
          .map((r: any) => {
            const evidences = (() => {
              try {
                const v = JSON.parse(String(r.evidence_refs ?? '[]'))
                if (!Array.isArray(v)) return []
                return v
                  .map((x: any): EvidenceItem | null => {
                    if (typeof x === 'string') return { name: x }
                    if (x && typeof x === 'object') {
                      const id = x.id ? String(x.id) : undefined
                      const name = x.name ? String(x.name) : (x.file ? String(x.file) : (x.url ? String(x.url) : '材料'))
                      return { id, name }
                    }
                    return null
                  })
                  .filter(Boolean) as EvidenceItem[]
              } catch {
                return []
              }
            })()
            return {
              id: String(r.id ?? ''),
              applicantName: String(r.applicant_name ?? ''),
              applicantSchool: r.target_school_id ? String(r.target_school_id) : undefined,
              evidences,
              note: r.note ? String(r.note) : undefined,
              status: String(r.status ?? 'pending') as ReviewStatus,
              createdAt: String(r.created_at ?? ''),
              rejectedReason: r.rejected_reason ? String(r.rejected_reason) : undefined,
            }
          })
          .filter(r => Boolean(r.id))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setItems(mapped)
      })
      .catch((e) => {
        console.error(e)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [version])

  const list = useMemo(() => items, [items])

  const pending = list.filter(r => r.status === 'pending').length

  const updateRequest = async (id: string, status: ReviewStatus) => {
    const token = localStorage.getItem('token') || undefined
    if (!token) return
    const rejected_reason = status === 'rejected' ? (rejectReasonById[id]?.trim() || '材料不清晰，请补充上传') : undefined
    await apiClient.post(`/association/verifications/requests/${id}/review`, { status, rejected_reason }, token)
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">普通用户基础认证（过渡期）</h3>
          <p className="text-sm text-muted-foreground">仅用于早期兜底审核，成熟后移交入驻学校/专项援助学校</p>
        </div>
        <Badge variant="secondary" className="h-8 px-3">
          待审核 {pending}
        </Badge>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>认证申请列表</CardTitle>
          <CardDescription>申请类型：普通用户基础认证</CardDescription>
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
            list.map(r => (
              <div key={r.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-foreground">{r.applicantName}</div>
                      <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'}>
                        {r.status === 'pending' ? '待审核' : r.status === 'approved' ? '已通过' : '已驳回'}
                      </Badge>
                      {r.applicantSchool && <Badge variant="outline">{r.applicantSchool}</Badge>}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      材料：
                      {r.evidences.length === 0 ? '—' : (
                        <span className="ml-1">
                          {r.evidences.map((e, idx) => (
                            <span key={`${r.id}-${idx}`}>
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
                    {r.note && <div className="mt-2 text-sm text-muted-foreground">说明：{r.note}</div>}
                    <div className="mt-2 text-xs text-muted-foreground">提交时间：{formatTime(r.createdAt)}</div>
                    {r.rejectedReason && <div className="mt-2 text-xs text-destructive">驳回原因：{r.rejectedReason}</div>}
                  </div>

                  {r.status === 'pending' && (
                    <div className="w-full max-w-xs space-y-2">
                      <Button variant="outline" className="w-full bg-transparent" onClick={() => openApplicant(r.id)}>
                        查看用户
                      </Button>
                      <Input
                        value={rejectReasonById[r.id] ?? ''}
                        onChange={(e) => setRejectReasonById(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="驳回原因（可选）"
                      />
                      <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => updateRequest(r.id, 'approved')}>
                          通过
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={() => updateRequest(r.id, 'rejected')}>
                          驳回
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
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
