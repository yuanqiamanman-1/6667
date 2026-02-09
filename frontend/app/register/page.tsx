'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Loader2, Building2, GraduationCap, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [accountType, setAccountType] = useState<'user' | 'org_admin'>('user')
  
  const [formData, setFormData] = useState({
    // Common
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    
    // User specific
    role: 'general_student' as const,
    school: '',
    grade: '',
    bio: '',
    avatar: '/avatars/avatar-01.jpg',
    
    // Org Admin specific
    orgType: 'university', // university, university_association, aid_school
    orgName: '',
    schoolName: '',
    associationName: '',
    contactPhone: '',
  })
  
  const avatarOptions = [
    '/avatars/avatar-01.jpg',
    '/avatars/avatar-02.jpg',
    '/avatars/avatar-03.jpg',
    '/avatars/avatar-04.jpg',
    '/avatars/avatar-05.jpg',
    '/avatars/avatar-06.jpg',
    '/avatars/avatar-07.jpg',
    '/avatars/avatar-08.jpg',
    '/avatars/avatar-09.jpg',
    '/avatars/avatar-10.jpg',
    '/avatars/avatar-11.jpg',
    '/avatars/avatar-12.jpg',
  ]

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert("密码不一致")
      return
    }

    setIsLoading(true)
    try {
      const payload: any = {
        username: formData.username || formData.email.split('@')[0], // Fallback username
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
      }

      if (accountType === 'org_admin') {
        payload.account_type = 'org_admin_applicant'
        payload.org_type = formData.orgType
        payload.school_name = formData.schoolName
        payload.association_name = formData.orgType === 'university_association' ? formData.associationName : undefined
        payload.org_name = formData.orgType === 'university_association' ? formData.associationName : formData.schoolName
        payload.contact_phone = formData.contactPhone
      } else {
        payload.account_type = 'user'
        payload.role = formData.role
        payload.profile = JSON.stringify({
          avatar: formData.avatar,
          school: formData.school,
          grade: formData.grade,
          bio: formData.bio,
          stats: { helpCount: 0, answerCount: 0, postCount: 0, rating: 5.0 }
        })
      }

      await apiClient.post('/auth/signup', payload)
      
      setIsLoading(false)
      
      if (accountType === 'org_admin') {
        router.push('/onboarding/pending')
      } else {
        // Auto login or redirect to login? For now redirect to login for simplicity or login page
        router.push('/login')
      }
    } catch (error: any) {
      console.error(error)
      alert(error.message || "注册失败")
      setIsLoading(false)
    }
  }

  const steps = [
    { num: 1, title: '选择类型' },
    { num: 2, title: '基本信息' },
    { num: 3, title: '详细资料' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-secondary/10">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <Card className="border-2 shadow-xl">
            <CardHeader className="space-y-1">
              <div className="mb-4 flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                    <Image src="/logo.png" alt="云助学" fill className="object-cover" />
                  </div>
                  <span className="text-lg font-bold text-primary">云助学</span>
                </Link>
              </div>
              <CardTitle className="text-2xl">创建账号</CardTitle>
              <CardDescription>
                加入云助学，开启你的公益教育之旅
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Progress Steps */}
              <div className="mb-8 flex items-center justify-between">
                {steps.map((s, index) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all',
                          step >= s.num
                            ? 'border-primary bg-primary text-white'
                            : 'border-border text-muted-foreground'
                        )}
                      >
                        {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                      </div>
                      <span className={cn(
                        'mt-2 text-xs',
                        step >= s.num ? 'text-primary font-medium' : 'text-muted-foreground'
                      )}>
                        {s.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          'mx-4 h-0.5 w-16 transition-all',
                          step > s.num ? 'bg-primary' : 'bg-border'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Account Type & Role Selection */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <Label className="text-base">我想...</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAccountType('user')}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50',
                          accountType === 'user' && 'border-primary bg-primary/5'
                        )}
                      >
                        <GraduationCap className="h-8 w-8 text-primary" />
                        <span className="font-semibold">个人注册</span>
                        <span className="text-xs text-muted-foreground">普通用户</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setAccountType('org_admin')}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/50',
                          accountType === 'org_admin' && 'border-primary bg-primary/5'
                        )}
                      >
                        <Building2 className="h-8 w-8 text-primary" />
                        <span className="font-semibold">组织入驻</span>
                        <span className="text-xs text-muted-foreground">高校/协会/受援学校</span>
                      </button>
                    </div>

                    {accountType === 'user' && (
                      <div className="space-y-3 pt-4">
                        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                          个人注册仅创建普通用户账号。若希望进行高校学生认证或志愿讲师认证，请注册后前往“认证中心”提交材料并等待审核通过。
                        </div>
                      </div>
                    )}

                    {accountType === 'org_admin' && (
                      <div className="space-y-4 pt-4">
                         <Label>组织类型</Label>
                         <Select 
                           value={formData.orgType} 
                           onValueChange={(val) => setFormData({...formData, orgType: val})}
                         >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="university">高校 (University)</SelectItem>
                                <SelectItem value="university_association">高校志愿者协会</SelectItem>
                                <SelectItem value="aid_school">受援学校</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleNext} className="w-full gap-2">
                    下一步
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Basic Info */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名 (登录账号)</Label>
                    <Input
                      id="username"
                      placeholder="设置唯一的用户名"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">
                       {accountType === 'org_admin' ? '联系人姓名' : '真实姓名'}
                    </Label>
                    <Input
                      id="name"
                      placeholder="请输入姓名"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="请设置密码（至少6位）"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="请再次输入密码"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      上一步
                    </Button>
                    <Button onClick={handleNext} className="flex-1 gap-2">
                      下一步
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Detailed Info */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {accountType === 'user' ? (
                    <>
                        <div className="space-y-2">
                            <Label>选择头像</Label>
                            <div className="grid grid-cols-6 gap-3">
                            {avatarOptions.map((avatar) => (
                                <button
                                key={avatar}
                                type="button"
                                onClick={() => setFormData({ ...formData, avatar })}
                                className={cn(
                                    'relative aspect-square overflow-hidden rounded-full border-2 transition-all hover:scale-110',
                                    formData.avatar === avatar
                                    ? 'border-primary ring-2 ring-primary/30'
                                    : 'border-border hover:border-primary/50'
                                )}
                                >
                                <Image src={avatar || "/placeholder.svg"} alt="头像" fill className="object-cover" />
                                </button>
                            ))}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="school">
                            {formData.role === 'general_student' ? '所在学校' : '所在高校'}
                            </Label>
                            <Input
                            id="school"
                            placeholder={formData.role === 'general_student' ? '如：云南省昭通市第一中学' : '如：北京大学'}
                            value={formData.school}
                            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="grade">
                            {formData.role === 'general_student' ? '年级' : '专业/年级'}
                            </Label>
                            <Input
                            id="grade"
                            placeholder={formData.role === 'general_student' ? '如：高二' : '如：数学系研二'}
                            value={formData.grade}
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="bio">个人简介</Label>
                            <Textarea
                            id="bio"
                            placeholder={formData.role === 'general_student' 
                                ? '介绍一下自己，让志愿者老师更了解你...' 
                                : '介绍一下自己的专长和教学经验...'}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows={4}
                            />
                        </div>
                    </>
                  ) : (
                    <>
                        {formData.orgType === 'university_association' ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="schoolName">高校名称</Label>
                              <Input
                                id="schoolName"
                                placeholder="如：北京大学"
                                value={formData.schoolName}
                                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="associationName">协会名称</Label>
                              <Input
                                id="associationName"
                                placeholder="如：志愿者协会"
                                value={formData.associationName}
                                onChange={(e) => setFormData({ ...formData, associationName: e.target.value })}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="schoolName">{formData.orgType === 'university' ? '高校名称' : '学校名称'}</Label>
                            <Input
                              id="schoolName"
                              placeholder={formData.orgType === 'university' ? '如：北京大学' : '如：云南省昭通市第一中学'}
                              value={formData.schoolName}
                              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">联系电话</Label>
                            <Input
                            id="contactPhone"
                            placeholder="请输入联系电话"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            />
                        </div>
                         <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                             提交后，您的申请将由志愿者协会总会审核。审核期间无法使用管理功能。
                         </div>
                    </>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      上一步
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          注册中...
                        </>
                      ) : (
                        accountType === 'org_admin' ? '提交入驻申请' : '完成注册'
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">已有账号？</span>
                <Link href="/login" className="ml-1 font-medium text-primary hover:underline">
                  立即登录
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
  )
}
