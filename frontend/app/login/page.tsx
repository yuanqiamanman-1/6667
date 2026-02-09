'use client'

import React from "react"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

// 演示账号数据 (仅用于登录页快速填单)
const MOCK_USERS: any = {
  student1: {
    name: '李明',
    school: '云南省昭通市第一中学',
    role: 'general_student',
    avatar: '/illustrations/avatar-student1.jpg',
  },
  student_pku: {
    name: '北大赵同学',
    school: '北京大学',
    role: 'university_student',
    avatar: '/avatars/avatar-03.jpg',
  },
  guest: {
    name: '游客',
    school: '',
    role: 'guest',
    avatar: '/illustrations/avatar-guest.jpg',
  },
  teacher_pku: {
    name: '北大陈老师',
    school: '北京大学',
    role: 'volunteer_teacher',
    avatar: '/illustrations/avatar-teacher1.jpg',
  },
  superadmin: {
    name: '超级管理员',
    role: 'superadmin',
    avatar: '/avatars/avatar-09.jpg',
  },
  associationHq1: {
    name: '志愿者协会总号',
    role: 'association_hq',
    avatar: '/avatars/avatar-09.jpg',
  },
  pku_admin: {
    name: '北京大学校级管理',
    role: 'university_admin',
    avatar: '/avatars/avatar-07.jpg',
  },
  pku_assoc_admin: {
    name: '北京大学志愿者协会',
    role: 'university_association_admin',
    avatar: '/avatars/avatar-08.jpg',
  },
  zt1z_admin: {
    name: '昭通一中专项援助管理',
    role: 'aid_school_admin',
    avatar: '/avatars/avatar-06.jpg',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useUser()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  })

  const routeAfterLogin = async () => {
    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    const me: any = await apiClient.get('/auth/me', token)

    if (me?.onboarding_status === 'pending') return router.push('/onboarding/pending')
    if (me?.onboarding_status === 'rejected') return router.push('/onboarding/rejected')

    const roleCodes: string[] = Array.isArray(me?.admin_roles)
      ? me.admin_roles.map((r: any) => r.role_code).filter(Boolean)
      : []

    if (me?.is_superuser) return router.push('/admin')
    if (roleCodes.includes('association_hq')) return router.push('/hq/dashboard')
    if (roleCodes.includes('university_association_admin')) return router.push('/association/dashboard')
    if (roleCodes.includes('university_admin')) return router.push('/university/dashboard')
    if (roleCodes.includes('aid_school_admin')) return router.push('/aid-school/dashboard')

    if (me?.capabilities?.can_access_campus) return router.push('/campus')
    return router.push('/home')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const success = await login(formData.userId, formData.password)
    if (success) {
      try {
        await routeAfterLogin()
      } catch (err: any) {
        console.error(err)
        router.push('/home')
      }
    } else {
      setError('用户名或密码错误')
    }
  }

  // 快速登录（演示用）
  const quickLogin = async (userId: string) => {
    setFormData({ userId, password: '123456' })
    const success = await login(userId, '123456')
    if (success) {
      try {
        await routeAfterLogin()
      } catch (err: any) {
        console.error(err)
        router.push('/home')
      }
    } else {
      setError('用户名或密码错误')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-secondary/10">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2">
          {/* Left - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden flex-col justify-center lg:flex"
          >
            <Link href="/" className="mb-8 flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                <Image src="/logo.png" alt="云助学" fill className="object-cover" />
              </div>
              <span className="text-2xl font-bold text-primary">云助学</span>
            </Link>
            
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              欢迎回来
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              登录你的账号，继续云助学之旅
            </p>
            
            <div className="relative aspect-square max-w-md overflow-hidden rounded-3xl">
              <Image
                src="/illustrations/login.jpg"
                alt="登录"
                fill
                className="object-cover"
              />
            </div>
          </motion.div>

          {/* Right - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center"
          >
            <Card className="w-full max-w-md border-2 shadow-xl">
              <CardHeader className="space-y-1">
                <div className="mb-4 flex items-center gap-2 lg:hidden">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                      <Image src="/logo.png" alt="云助学" fill className="object-cover" />
                    </div>
                    <span className="text-lg font-bold text-primary">云助学</span>
                  </Link>
                </div>
                <CardTitle className="text-2xl">登录账号</CardTitle>
                <CardDescription>
                  输入你的账号信息，或选择快速登录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">用户名</Label>
                    <Input
                      id="userId"
                      placeholder="请输入用户名"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登录中...
                      </>
                    ) : (
                      '登录'
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      或快速登录演示账号
                    </span>
                  </div>
                </div>

                {/* Quick Login Options */}
                <div className="space-y-3">
                  <p className="text-center text-xs text-muted-foreground">
                    密码均为: 123456
                  </p>
                  <div className="grid gap-2">
                    {/* 学生账号 */}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 bg-transparent p-3"
                      onClick={() => quickLogin('student1')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={MOCK_USERS.student1.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.student1.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.student1.name}</div>
                        <div className="text-xs text-muted-foreground">
                          普通学生 · {MOCK_USERS.student1.school} · 已认证
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 bg-transparent p-3"
                      onClick={() => quickLogin('student_pku')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={MOCK_USERS.student_pku.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.student_pku.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.student_pku.name}</div>
                        <div className="text-xs text-muted-foreground">
                          高校学生 · {MOCK_USERS.student_pku.school} · 已认证
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 bg-transparent p-3"
                      onClick={() => router.push('/')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={MOCK_USERS.guest.avatar || "/placeholder.svg"}
                          alt="游客浏览"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">游客浏览</div>
                        <div className="text-xs text-muted-foreground">
                          只浏览不登录也可访问公共内容
                        </div>
                      </div>
                    </Button>
                    
                    {/* 讲师账号 */}
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-primary/30 bg-transparent p-3"
                      onClick={() => quickLogin('teacher_pku')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary/30">
                        <Image
                          src={MOCK_USERS.teacher_pku.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.teacher_pku.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.teacher_pku.name}</div>
                        <div className="text-xs text-muted-foreground">
                          志愿讲师 · {MOCK_USERS.teacher_pku.school} · 已认证
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-primary/30 bg-transparent p-3"
                      onClick={() => quickLogin('teacher_pku')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary/30">
                        <Image
                          src={MOCK_USERS.teacher_pku.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.teacher_pku.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.teacher_pku.name}</div>
                        <div className="text-xs text-muted-foreground">
                          志愿讲师 · {MOCK_USERS.teacher_pku.school} · 已认证
                        </div>
                      </div>
                    </Button>
                    
                    {/* 管理员账号 */}
                    <div className="my-3 border-t border-dashed" />
                    <p className="text-center text-xs font-medium text-muted-foreground">
                      管理员账号
                    </p>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-amber-500/30 bg-amber-50/50 p-3"
                      onClick={() => quickLogin('superadmin')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-amber-500/50">
                        <Image
                          src={MOCK_USERS.superadmin.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.superadmin.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-amber-900">{MOCK_USERS.superadmin.name}</div>
                        <div className="text-xs text-amber-700">
                          平台超级管理员
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-secondary/50 bg-secondary/10 p-3"
                      onClick={() => quickLogin('associationHq1')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-secondary/50">
                        <Image
                          src={MOCK_USERS.associationHq1.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.associationHq1.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.associationHq1.name}</div>
                        <div className="text-xs text-muted-foreground">
                          协会总号 · 高校协会治理
                        </div>
                      </div>
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-secondary/50 bg-secondary/10 p-3"
                      onClick={() => quickLogin('pku_admin')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-secondary/50">
                        <Image
                          src={MOCK_USERS.pku_admin.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.pku_admin.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.pku_admin.name}</div>
                        <div className="text-xs text-muted-foreground">
                          高校账号 · 校级共学社区
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-secondary/50 bg-secondary/10 p-3"
                      onClick={() => quickLogin('pku_assoc_admin')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-secondary/50">
                        <Image
                          src={MOCK_USERS.pku_assoc_admin.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.pku_assoc_admin.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.pku_assoc_admin.name}</div>
                        <div className="text-xs text-muted-foreground">
                          高校志愿者协会 · 讲师审核与任务
                        </div>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 border-secondary/50 bg-secondary/10 p-3"
                      onClick={() => quickLogin('zt1z_admin')}
                      disabled={isLoading}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-secondary/50">
                        <Image
                          src={MOCK_USERS.zt1z_admin.avatar || "/placeholder.svg"}
                          alt={MOCK_USERS.zt1z_admin.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{MOCK_USERS.zt1z_admin.name}</div>
                        <div className="text-xs text-muted-foreground">
                          专项援助学校管理 · 批次认证
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm">
                  <span className="text-muted-foreground">还没有账号？</span>
                  <Link href="/register" className="ml-1 font-medium text-primary hover:underline">
                    立即注册
                  </Link>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="h-4 w-4" />
                    返回首页
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
