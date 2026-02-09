'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Shield, School, Users, Trash2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useUser } from '@/lib/user-context'

export function AdminManagementTab() {
  const { user } = useUser()
  const [admins, setAdmins] = useState<any[]>([])
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'association_hq' | 'university_admin' | 'university_association_admin' | 'aid_school_admin'>('all')
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    role_code: 'university_admin' as 'superadmin' | 'university_admin' | 'university_association_admin' | 'association_hq' | 'aid_school_admin',
    org_type: 'university',
    org_display_name: '',
    school_id: '',
    avatar: '/avatars/avatar-06.jpg',
  })

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token')
      const data = await apiClient.get<any[]>('/admin/org-admins', token!)
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch admins', error)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      alert('请填写完整信息')
      return
    }

    try {
      const payload = {
        username: newAdmin.email.split('@')[0],
        email: newAdmin.email,
        password: newAdmin.password,
        full_name: newAdmin.name,
        role_code: newAdmin.role_code,
        org_type: newAdmin.role_code === 'superadmin' ? undefined : newAdmin.org_type,
        org_display_name: newAdmin.org_display_name || (newAdmin.role_code === 'superadmin' ? undefined : newAdmin.school_id),
        school_id: newAdmin.school_id, // e.g., '北京大学'
      }

      const token = localStorage.getItem('token')
      await apiClient.post('/admin/org-admins', payload, token!)
      
      alert('管理员账号创建成功')
      setIsDialogOpen(false)
      fetchAdmins()
      
      // Reset form
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        role_code: 'university_admin',
        org_type: 'university',
        org_display_name: '',
        school_id: '',
        avatar: '/avatars/avatar-06.jpg',
      })
    } catch (error: any) {
      console.error(error)
      alert(error.message || '创建失败')
    }
  }

  const handleDeleteAdmin = async (id: string, label: string) => {
    try {
      const token = localStorage.getItem('token') || undefined
      setDeleting(true)
      await apiClient.delete(`/admin/org-admins/${id}?hard=true`, token)
      await fetchAdmins()
    } catch (error: any) {
      console.error(error)
      alert(error.message || '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const getRoleBadge = (roleCode: string) => {
    const roleMap: any = {
      superadmin: { label: '超级管理员', variant: 'default', icon: Shield },
      association_hq: { label: '协会总号', variant: 'default', icon: Shield },
      university_admin: { label: '学校管理员', variant: 'secondary', icon: School },
      university_association_admin: { label: '协会管理员', variant: 'outline', icon: Users },
      aid_school_admin: { label: '援助学校管理员', variant: 'outline', icon: School },
    }
    const r = roleMap[roleCode] || { label: roleCode, variant: 'outline', icon: Users }
    const Icon = r.icon
    return (
      <Badge variant={r.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {r.label}
      </Badge>
    )
  }

  const visibleAdmins = useMemo(() => {
    const q = search.trim().toLowerCase()
    return admins
      .filter((a) => {
        if (roleFilter === 'all') return true
        return Array.isArray(a.admin_roles) && a.admin_roles.some((r: any) => r.role_code === roleFilter)
      })
      .filter((a) => {
        if (!q) return true
        const text = [a.username, a.full_name, a.email]
          .concat((a.admin_roles || []).map((r: any) => r.role_code))
          .concat((a.admin_roles || []).map((r: any) => r.organization?.display_name))
          .concat((a.admin_roles || []).map((r: any) => r.organization?.school_id))
          .concat((a.admin_roles || []).map((r: any) => r.organization?.aid_school_id))
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return text.includes(q)
      })
  }, [admins, roleFilter, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">管理员账号管理</h3>
          <p className="text-sm text-muted-foreground">
            创建和管理平台管理员账号
          </p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索管理员/高校..." className="w-56" />
          <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="superadmin">超级管理员</SelectItem>
              <SelectItem value="association_hq">协会总号</SelectItem>
              <SelectItem value="university_admin">学校管理员</SelectItem>
              <SelectItem value="university_association_admin">协会管理员</SelectItem>
              <SelectItem value="aid_school_admin">援助学校管理员</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              创建管理员
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>创建新管理员账号</DialogTitle>
              <DialogDescription>
                创建超级管理员、学校管理员或协会管理员账号
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">姓名 *</Label>
                <Input
                  id="admin-name"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="如：张三"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">邮箱 *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">初始密码 *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="至少6位"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-role">角色类型 *</Label>
                <Select value={newAdmin.role_code} onValueChange={(value: any) => setNewAdmin({ ...newAdmin, role_code: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">超级管理员</SelectItem>
                    <SelectItem value="association_hq">协会总号</SelectItem>
                    <SelectItem value="university_admin">学校管理员</SelectItem>
                    <SelectItem value="university_association_admin">协会管理员</SelectItem>
                    <SelectItem value="aid_school_admin">援助学校管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newAdmin.role_code !== 'superadmin' && newAdmin.role_code !== 'association_hq' && (
                <>
                    <div className="space-y-2">
                    <Label htmlFor="org-type">组织类型</Label>
                    <Select value={newAdmin.org_type} onValueChange={(value: any) => setNewAdmin({ ...newAdmin, org_type: value })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="university">高校</SelectItem>
                            <SelectItem value="university_association">高校志愿者协会</SelectItem>
                            <SelectItem value="aid_school">受援学校</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="org-name">组织名称 *</Label>
                    <Input
                        id="org-name"
                        value={newAdmin.org_display_name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, org_display_name: e.target.value })}
                        placeholder="如：北京大学志愿者协会"
                    />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="school-id">学校标识 (School ID)</Label>
                    <Input
                        id="school-id"
                        value={newAdmin.school_id}
                        onChange={(e) => setNewAdmin({ ...newAdmin, school_id: e.target.value })}
                        placeholder="如：北京大学"
                    />
                    </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateAdmin} className="flex-1">创建账号</Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent">取消</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除管理员账号</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该账号将彻底消失且无法登录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async () => {
                if (!deleteTarget) return
                const target = deleteTarget
                setDeleteTarget(null)
                await handleDeleteAdmin(target.id, target.label)
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleAdmins.map((admin) => (
          <Card key={admin.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {admin.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{admin.full_name}</CardTitle>
                    <CardDescription>{admin.email}</CardDescription>
                  </div>
                </div>
                {admin.username !== 'superadmin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: admin.id, label: admin.full_name || admin.username })}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {admin.admin_roles?.map((role: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    {getRoleBadge(role.role_code)}
                    <span className="text-xs text-muted-foreground">
                        {role.organization?.display_name || role.organization_id || 'N/A'}
                        {(role.organization?.school_id || role.organization?.aid_school_id) ? ` · ${role.organization?.school_id || role.organization?.aid_school_id}` : ''}
                    </span>
                  </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AdminManagementTab
