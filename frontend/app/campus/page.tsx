'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'
import { getActiveCampusSchoolId, setActiveCampusSchoolId } from '@/lib/client-store'
import { apiClient } from '@/lib/api-client'

export default function CampusEntryPage() {
  const router = useRouter()
  const { user, isLoggedIn, isLoading } = useUser()
  const isVolunteerTeacher = canAccessTeacherFeatures(user)
  const isAuditUser = Boolean(user?.capabilities?.can_audit_cross_campus)
  
  const [auditSchoolId, setAuditSchoolId] = useState('')
  const [auditSearch, setAuditSearch] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    // If not audit user and no school, go verify
    if (!isAuditUser && !user?.school) {
      router.push('/verify')
      return
    }
    
    if (!isAuditUser && !user?.capabilities?.can_access_campus) router.push('/home')
  }, [isAuditUser, isLoading, isLoggedIn, router, user])

  useEffect(() => {
    if (!isAuditUser) return
    const current = getActiveCampusSchoolId()
    if (current) setAuditSchoolId(current)
  }, [isAuditUser])

  const associationEligible = useMemo(() => {
    if (!user) return false
    if (isAuditUser) return true
    if (user.capabilities?.can_manage_university) return true
    if (user.capabilities?.can_manage_association) return true
    if (user.capabilities?.can_access_association) return true
    if (isVolunteerTeacher) return true
    return false
  }, [isAuditUser, isVolunteerTeacher, user])

  const [boardData, setBoardData] = useState<any[]>([])

  useEffect(() => {
    if (isAuditUser) {
        const token = localStorage.getItem('token') || undefined
        apiClient.get('/core/orgs/board', token).then((data: any) => {
          if (Array.isArray(data)) setBoardData(data)
        }).catch(err => console.error(err))
    }
  }, [isAuditUser])

  const universityItems = useMemo(
    () =>
      boardData.map(o => ({
          value: o.school_id,
          label: o.display_name || o.school_id,
          description: `Uni: ${o.university_org_status}, Assoc: ${o.association_org_status}`,
          keywords: [o.school_id],
          key: o.school_id, 
        })),
    [boardData],
  )

  const filteredUniversityItems = useMemo(() => {
    const q = auditSearch.trim().toLowerCase()
    if (!q) return universityItems
    return universityItems.filter(u => u.label.toLowerCase().includes(q) || u.value.toLowerCase().includes(q))
  }, [auditSearch, universityItems])

  const effectiveSchoolId = isAuditUser ? (auditSchoolId || getActiveCampusSchoolId() || '') : (user?.school ?? '')

  if (isLoading || !isLoggedIn || !user) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">高校板块</h1>
          <p className="mt-2 text-muted-foreground">
            {isAuditUser
              ? effectiveSchoolId
                ? `审计模式：当前查看高校：${effectiveSchoolId}`
                : '审计模式：请选择要进入的已认证高校板块'
              : user.school
                ? `当前高校：${user.school}`
                : '请先完成高校学生认证'}
          </p>
        </div>

        {isAuditUser && !effectiveSchoolId && (
          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle>高校目录（跨校审计）</CardTitle>
              <CardDescription>保留搜索功能，并以高校卡片形式排布；进入后为审计只读模式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">已认证高校</Badge>
                <Input
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="搜索高校名称..."
                />
                <Combobox
                  items={universityItems}
                  value={auditSchoolId}
                  onChange={(v) => setAuditSchoolId(v)}
                  placeholder="搜索并选择高校..."
                  searchPlaceholder="搜索高校..."
                />
              </div>
              <Button
                className="w-full"
                disabled={!auditSchoolId}
                onClick={() => {
                  setActiveCampusSchoolId(auditSchoolId)
                  router.push('/campus')
                }}
              >
                进入该高校板块
              </Button>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUniversityItems.map(uni => (
                  <Card key={uni.key} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{uni.label}</CardTitle>
                      <CardDescription>校级共学社区 · 志愿者协会板块</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">已认证</Badge>
                        <Badge variant="outline">可审计进入</Badge>
                      </div>
                      <div className="grid gap-2">
                        <Button
                          onClick={() => {
                            setActiveCampusSchoolId(uni.value)
                            router.push('/campus/community')
                          }}
                        >
                          进入校级共学社区
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-transparent"
                          onClick={() => {
                            setActiveCampusSchoolId(uni.value)
                            router.push('/campus/association')
                          }}
                        >
                          进入志愿者协会板块
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isAuditUser && effectiveSchoolId && (
          <Card className="mb-8 border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">
                    审计模式：当前高校 <span className="font-medium text-foreground">{effectiveSchoolId}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">只读查看高校板块内容，不可发布与变更数据</div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Combobox
                    items={universityItems}
                    value={auditSchoolId || effectiveSchoolId}
                    onChange={(v) => {
                      setAuditSchoolId(v)
                      setActiveCampusSchoolId(v)
                      router.push('/campus')
                    }}
                    placeholder="切换高校..."
                    searchPlaceholder="搜索高校..."
                    className="w-[260px]"
                  />
                  <Button variant="outline" className="bg-transparent" onClick={() => {
                    if (auditSchoolId || effectiveSchoolId) setActiveCampusSchoolId(auditSchoolId || effectiveSchoolId)
                    router.push('/campus/community')
                  }}>
                    进入校级共学社区
                  </Button>
                  <Button variant="outline" className="bg-transparent" onClick={() => {
                    if (auditSchoolId || effectiveSchoolId) setActiveCampusSchoolId(auditSchoolId || effectiveSchoolId)
                    router.push('/campus/association')
                  }}>
                    进入志愿者协会板块
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => {
                      setAuditSchoolId('')
                      setActiveCampusSchoolId(null)
                      router.push('/campus')
                    }}
                  >
                    退出审计
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuditUser && <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                校级共学社区
              </CardTitle>
              <CardDescription>本校学生的知识分享与交流空间</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">校内信息流</Badge>
                <Badge variant="secondary">校内话题</Badge>
                <Badge variant="secondary">校内资源专区</Badge>
                <Badge variant="secondary">校内群组</Badge>
              </div>
              {isAuditUser ? (
                <Button 
                  className="w-full gap-2" 
                  disabled={!effectiveSchoolId}
                  onClick={() => {
                    if (effectiveSchoolId) setActiveCampusSchoolId(effectiveSchoolId)
                    router.push('/campus/community')
                  }}
                >
                  <Building2 className="h-4 w-4" />
                  进入校级共学社区
                </Button>
              ) : (
                <Link href="/campus/community">
                  <Button className="w-full gap-2">
                    <Building2 className="h-4 w-4" />
                    进入校级共学社区
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                志愿者协会板块
              </CardTitle>
              <CardDescription>讲师审核、专项任务、公告与校内兑换机制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {associationEligible ? (
                  <Badge className="gap-1 bg-green-500/10 text-green-600">
                    <ShieldCheck className="h-3 w-3" />
                    已具备进入权限
                  </Badge>
                ) : (
                  <Badge variant="outline">需通过协会认证/讲师认证</Badge>
                )}
                <Badge variant="secondary">专项任务</Badge>
                <Badge variant="secondary">校内协会商城</Badge>
                <Badge variant="secondary">讲师管理</Badge>
              </div>

              {associationEligible ? (
                isAuditUser ? (
                  <Button 
                    className="w-full gap-2" 
                    disabled={!effectiveSchoolId}
                    onClick={() => {
                      if (effectiveSchoolId) setActiveCampusSchoolId(effectiveSchoolId)
                      router.push('/campus/association')
                    }}
                  >
                    <Users className="h-4 w-4" />
                    进入志愿者协会板块
                  </Button>
                ) : (
                  <Link href="/campus/association">
                    <Button className="w-full gap-2">
                      <Users className="h-4 w-4" />
                      进入志愿者协会板块
                    </Button>
                  </Link>
                )
              ) : (
                <Link href="/verify">
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <ShieldCheck className="h-4 w-4" />
                    前往认证中心申请
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>}
      </main>
    </div>
  )
}
