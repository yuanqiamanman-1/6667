'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Trash2, Shield, School, Users } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import UniversityOrphanCleanup from '@/components/admin/university-orphan-cleanup'

type AdminRoleOut = {
  role_code: string
  organization_id?: string | null
  organization?: {
    id: string
    type: string
    display_name?: string | null
    school_id?: string | null
    aid_school_id?: string | null
  } | null
}

type UserAccount = {
  id: string
  username: string
  full_name?: string | null
  email?: string | null
  role: string
  is_active: boolean
  is_superuser: boolean
  onboarding_status: string
  school_id?: string | null
  organization_id?: string | null
  admin_roles: AdminRoleOut[]
}

function roleBadge(roleCode: string) {
  const map: Record<string, { label: string; icon: any; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    superadmin: { label: '超级管理员', icon: Shield, variant: 'default' },
    association_hq: { label: '协会总号', icon: Shield, variant: 'secondary' },
    university_admin: { label: '高校账号', icon: School, variant: 'outline' },
    university_association_admin: { label: '高校协会账号', icon: Users, variant: 'outline' },
    aid_school_admin: { label: '援助学校账号', icon: School, variant: 'outline' },
  }
  const r = map[roleCode] || { label: roleCode, icon: Users, variant: 'outline' as const }
  const Icon = r.icon
  return (
    <Badge variant={r.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {r.label}
    </Badge>
  )
}

function managedLabel(u: UserAccount) {
  const role = u.admin_roles.find(r => r.organization?.type === 'university')?.organization
    ?? u.admin_roles.find(r => r.organization?.type === 'university_association')?.organization
    ?? u.admin_roles.find(r => r.organization?.type === 'aid_school')?.organization
  if (!role) return null
  const sid = role.school_id || role.aid_school_id
  return `${role.display_name || role.id}${sid ? ` · ${sid}` : ''}`
}

export default function AccountManagementTab() {
  const [tab, setTab] = useState<'all' | 'governance' | 'users'>('all')
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    const token = localStorage.getItem('token') || undefined
    setLoading(true)
    try {
      const data = await apiClient.get<UserAccount[]>('/admin/users', token)
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter(u => {
        if (tab === 'governance') return u.is_superuser || u.admin_roles.length > 0
        if (tab === 'users') return !u.is_superuser && u.admin_roles.length === 0 && u.is_active
        return true
      })
      .filter(u => {
        if (!q) return true
        const hay = [
          u.username,
          u.full_name,
          u.email,
          u.role,
          u.school_id,
          managedLabel(u),
          ...u.admin_roles.map(r => r.role_code),
          ...u.admin_roles.map(r => r.organization?.display_name),
          ...u.admin_roles.map(r => r.organization?.school_id),
          ...u.admin_roles.map(r => r.organization?.aid_school_id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
  }, [items, query, tab])

  const handleDelete = async (u: UserAccount) => {
    const token = localStorage.getItem('token') || undefined
    try {
      setDeleting(true)
      await apiClient.delete(`/admin/users/${u.id}?hard=true`, token)
      setItems(prev => prev.filter(x => x.id !== u.id))
    } catch (e: any) {
      console.error(e)
      alert(e?.message || '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <UniversityOrphanCleanup />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">账户管理</h3>
          <p className="text-sm text-muted-foreground">管理所有账户并支持删除（停用）</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索用户名/邮箱/学校/角色..." className="w-full sm:w-80" />
          <Button variant="outline" className="bg-transparent" onClick={fetchUsers}>刷新</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:inline-grid lg:w-auto">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="governance">治理账号</TabsTrigger>
          <TabsTrigger value="users">普通用户</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>账户列表</CardTitle>
              <CardDescription>{loading ? '加载中...' : `共 ${filtered.length} 条`}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  暂无数据
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filtered.map(u => (
                    <Card key={u.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder.svg" />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {(u.full_name || u.username || '?').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="truncate font-medium">{u.full_name || u.username}</div>
                                {u.is_superuser && roleBadge('superadmin')}
                                {!u.is_superuser && u.admin_roles.map((r, idx) => (
                                  <span key={`${u.id}-${idx}`}>{roleBadge(r.role_code)}</span>
                                ))}
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">{u.email || '-'}</div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">用户身份：{u.role}</div>
                              {managedLabel(u) && <div className="mt-1 truncate text-xs text-muted-foreground">管理域：{managedLabel(u)}</div>}
                            </div>
                          </div>
                          {!u.is_superuser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}
                              aria-label={`删除 ${u.username}`}
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除账号</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该账号将彻底消失且无法登录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting || deleteTarget?.is_superuser}
              onClick={async () => {
                if (!deleteTarget) return
                const target = deleteTarget
                setDeleteTarget(null)
                await handleDelete(target)
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
