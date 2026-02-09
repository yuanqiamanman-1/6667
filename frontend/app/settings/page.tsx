'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User,
  Bell,
  Shield,
  Eye,
  Globe,
  Smartphone,
  Volume2,
  Moon,
  Save,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/lib/user-context'

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useUser()
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      newMessage: true,
      matchUpdate: true,
      systemNews: false,
    },
    privacy: {
      showOnline: true,
      showProfile: true,
      allowSearch: true,
    },
    preferences: {
      darkMode: false,
      language: 'zh-CN',
      soundEffects: true,
    },
  })

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) {
    return null
  }

  const handleToggle = (category: string, key: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: !prev[category as keyof typeof prev][key as never],
      },
    }))
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          返回个人中心
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-foreground">设置</h1>
          <p className="mt-2 text-muted-foreground">管理你的账户设置和偏好</p>
        </motion.div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="account">账户信息</TabsTrigger>
            <TabsTrigger value="notifications">通知</TabsTrigger>
            <TabsTrigger value="privacy">隐私</TabsTrigger>
            <TabsTrigger value="preferences">偏好</TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本信息
                </CardTitle>
                <CardDescription>更新你的个人资料信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">昵称</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" defaultValue={user.email} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input id="phone" type="tel" defaultValue={user.phone || ''} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="school">学校</Label>
                  <Input id="school" defaultValue={user.school || ''} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea id="bio" defaultValue={user.bio || ''} className="min-h-[100px]" />
                </div>
                <Button className="gap-2">
                  <Save className="h-4 w-4" />
                  保存更改
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  安全设置
                </CardTitle>
                <CardDescription>管理你的账户安全</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  修改密码
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  绑定手机号
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  绑定邮箱
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  通知方式
                </CardTitle>
                <CardDescription>选择接收通知的方式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notif" className="font-medium">邮箱通知</Label>
                    <p className="text-sm text-muted-foreground">通过邮箱接收重要通知</p>
                  </div>
                  <Switch 
                    id="email-notif"
                    checked={settings.notifications.email}
                    onCheckedChange={() => handleToggle('notifications', 'email')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notif" className="font-medium">推送通知</Label>
                    <p className="text-sm text-muted-foreground">接收浏览器推送通知</p>
                  </div>
                  <Switch 
                    id="push-notif"
                    checked={settings.notifications.push}
                    onCheckedChange={() => handleToggle('notifications', 'push')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notif" className="font-medium">短信通知</Label>
                    <p className="text-sm text-muted-foreground">通过短信接收紧急通知</p>
                  </div>
                  <Switch 
                    id="sms-notif"
                    checked={settings.notifications.sms}
                    onCheckedChange={() => handleToggle('notifications', 'sms')}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>通知内容</CardTitle>
                <CardDescription>选择要接收的通知类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-message">新消息通知</Label>
                  <Switch 
                    id="new-message"
                    checked={settings.notifications.newMessage}
                    onCheckedChange={() => handleToggle('notifications', 'newMessage')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="match-update">匹配更新</Label>
                  <Switch 
                    id="match-update"
                    checked={settings.notifications.matchUpdate}
                    onCheckedChange={() => handleToggle('notifications', 'matchUpdate')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-news">系统公告</Label>
                  <Switch 
                    id="system-news"
                    checked={settings.notifications.systemNews}
                    onCheckedChange={() => handleToggle('notifications', 'systemNews')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  隐私控制
                </CardTitle>
                <CardDescription>管理谁可以看到你的信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-online" className="font-medium">显示在线状态</Label>
                    <p className="text-sm text-muted-foreground">让其他用户看到你是否在线</p>
                  </div>
                  <Switch 
                    id="show-online"
                    checked={settings.privacy.showOnline}
                    onCheckedChange={() => handleToggle('privacy', 'showOnline')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-profile" className="font-medium">公开个人资料</Label>
                    <p className="text-sm text-muted-foreground">允许所有人查看你的个人资料</p>
                  </div>
                  <Switch 
                    id="show-profile"
                    checked={settings.privacy.showProfile}
                    onCheckedChange={() => handleToggle('privacy', 'showProfile')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="allow-search" className="font-medium">允许被搜索</Label>
                    <p className="text-sm text-muted-foreground">其他用户可以通过搜索找到你</p>
                  </div>
                  <Switch 
                    id="allow-search"
                    checked={settings.privacy.allowSearch}
                    onCheckedChange={() => handleToggle('privacy', 'allowSearch')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preference Settings */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  偏好设置
                </CardTitle>
                <CardDescription>自定义你的使用体验</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="dark-mode" className="font-medium">深色模式</Label>
                      <p className="text-sm text-muted-foreground">使用深色主题保护眼睛</p>
                    </div>
                  </div>
                  <Switch 
                    id="dark-mode"
                    checked={settings.preferences.darkMode}
                    onCheckedChange={() => handleToggle('preferences', 'darkMode')}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="language" className="font-medium">语言</Label>
                      <p className="text-sm text-muted-foreground">选择界面语言</p>
                    </div>
                  </div>
                  <select className="rounded-md border px-3 py-2 text-sm">
                    <option>简体中文</option>
                    <option>English</option>
                  </select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="sound" className="font-medium">声音效果</Label>
                      <p className="text-sm text-muted-foreground">启用消息提示音</p>
                    </div>
                  </div>
                  <Switch 
                    id="sound"
                    checked={settings.preferences.soundEffects}
                    onCheckedChange={() => handleToggle('preferences', 'soundEffects')}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
