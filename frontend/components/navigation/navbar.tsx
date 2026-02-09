'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, Users, MessageCircle, Heart, BookOpen, 
  GraduationCap, Mail, User, Menu, LogOut, Settings, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '@/lib/constants'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useUser, canAccessTeacherFeatures } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

const iconMap = {
  Home, Users, MessageCircle, Heart, BookOpen, 
  GraduationCap, Mail, User
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoggedIn, logout } = useUser()
  const isTeacher = canAccessTeacherFeatures(user)
  const adminRoleCodes = user?.admin_roles?.map(r => r.role_code) ?? []
  const isAdmin = Boolean(user?.capabilities?.can_access_admin_panel)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadConversations, setUnreadConversations] = useState(0)

  const totalUnread = useMemo(() => {
    return Math.max(0, unreadNotifications) + Math.max(0, unreadConversations)
  }, [unreadConversations, unreadNotifications])

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadNotifications(0)
      setUnreadConversations(0)
      return
    }
    const token = localStorage.getItem('token') || undefined
    if (!token) return

    let cancelled = false
    const load = async () => {
      try {
        const [n, c] = await Promise.all([
          apiClient.get<{ unread_count: number }>('/notifications/unread-count', token),
          apiClient.get<{ unread_conversations_count: number }>('/conversations/unread-count', token),
        ])
        if (cancelled) return
        setUnreadNotifications(Number(n?.unread_count ?? 0))
        setUnreadConversations(Number(c?.unread_conversations_count ?? 0))
      } catch (e) {
        if (cancelled) return
        console.error(e)
      }
    }

    load()
    const t = window.setInterval(load, 10_000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [isLoggedIn])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  // 根据用户角色调整导航项
  const canAccessCampus = Boolean(user?.capabilities?.can_access_campus || user?.capabilities?.can_audit_cross_campus)

  const navItems = NAV_ITEMS
    .filter(item => {
      if (item.href === '/campus') return canAccessCampus
      return true
    })
    .map(item => {
    if (item.href === '/') {
      return { ...item, href: '/home' }
    }
    return item
  })

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={isLoggedIn ? '/home' : '/'} className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="云助学" 
            width={40} 
            height={40}
            className="h-10 w-auto"
          />
          <span className="text-xl font-bold text-primary">云助学</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap]
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const showMessageBadge = item.href === '/messages' && totalUnread > 0
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className="relative gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {showMessageBadge && (
                    <Badge variant="destructive" className="ml-1 px-2 py-0.5 text-xs">
                      {totalUnread}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 -z-10 rounded-md bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* User Menu / Auth Buttons */}
        <div className="flex items-center gap-3">
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 p-1 pr-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isAdmin ? (
                        <Badge variant="default" className="h-4 px-1 text-xs">管理员</Badge>
                      ) : isTeacher ? (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">讲师</Badge>
                      ) : (
                        <Badge variant="outline" className="h-4 px-1 text-xs">学生</Badge>
                      )}
                      <span>Lv.{user.level}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    个人中心
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/verify" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    身份认证
                  </Link>
                </DropdownMenuItem>
                {isAdmin && !adminRoleCodes.includes('association_hq') && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      超级管理员控制台
                    </Link>
                  </DropdownMenuItem>
                )}
                {adminRoleCodes.includes('association_hq') && (
                  <DropdownMenuItem asChild>
                    <Link href="/hq/dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      协会总号控制台
                    </Link>
                  </DropdownMenuItem>
                )}
                {adminRoleCodes.includes('university_admin') && (
                  <DropdownMenuItem asChild>
                    <Link href="/university/dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      高校账号控制台
                    </Link>
                  </DropdownMenuItem>
                )}
                {adminRoleCodes.includes('university_association_admin') && (
                  <DropdownMenuItem asChild>
                    <Link href="/association/dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      高校志愿者协会控制台
                    </Link>
                  </DropdownMenuItem>
                )}
                {adminRoleCodes.includes('aid_school_admin') && (
                  <DropdownMenuItem asChild>
                    <Link href="/aid-school/dashboard" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      专项援助学校管理端
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    设置
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden text-primary md:inline-flex">登录</Button>
              </Link>
              <Link href="/register">
                <Button className="shadow-lg shadow-primary/20">注册</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              {isLoggedIn && user && (
                <div className="mb-6 flex items-center gap-3 border-b pb-6">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isAdmin ? '管理员' : isTeacher ? '讲师' : '学生'} · Lv.{user.level}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap]
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  const showMessageBadge = item.href === '/messages' && totalUnread > 0
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className="w-full justify-start gap-2"
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        {showMessageBadge && (
                          <Badge variant="destructive" className="ml-auto px-2 py-0.5 text-xs">
                            {totalUnread}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  )
                })}
                
                {isLoggedIn ? (
                  <>
                    <div className="my-2 border-t" />
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="h-4 w-4" />
                        个人中心
                      </Button>
                    </Link>
                    {isAdmin && !adminRoleCodes.includes('association_hq') && (
                      <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          超级管理员控制台
                        </Button>
                      </Link>
                    )}
                    {adminRoleCodes.includes('association_hq') && (
                      <Link href="/hq/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          协会总号控制台
                        </Button>
                      </Link>
                    )}
                    {adminRoleCodes.includes('university_admin') && (
                      <Link href="/university/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          高校账号控制台
                        </Button>
                      </Link>
                    )}
                    {adminRoleCodes.includes('university_association_admin') && (
                      <Link href="/association/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          高校志愿者协会控制台
                        </Button>
                      </Link>
                    )}
                    {adminRoleCodes.includes('aid_school_admin') && (
                      <Link href="/aid-school/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <Shield className="h-4 w-4" />
                          专项援助学校管理端
                        </Button>
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-2 text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t" />
                    <Link href="/login">
                      <Button variant="outline" className="w-full bg-transparent">登录</Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full">注册</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
