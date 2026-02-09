'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  ArrowLeft,
  MessageCircle, 
  Mic, 
  Video,
  Clock,
  CalendarDays,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useUser } from '@/lib/user-context'
import { apiClient } from '@/lib/api-client'

const SUBJECTS = [
  { id: 'math', label: '数学', category: '理科' },
  { id: 'physics', label: '物理', category: '理科' },
  { id: 'chemistry', label: '化学', category: '理科' },
  { id: 'biology', label: '生物', category: '理科' },
  { id: 'chinese', label: '语文', category: '文科' },
  { id: 'english', label: '英语', category: '文科' },
  { id: 'history', label: '历史', category: '文科' },
  { id: 'geography', label: '地理', category: '文科' },
  { id: 'politics', label: '政治', category: '文科' },
  { id: 'programming', label: '编程', category: '技能' },
  { id: 'art', label: '美术', category: '技能' },
  { id: 'music', label: '音乐', category: '技能' },
]

const COMMUNICATION_METHODS = [
  { id: 'text', label: '文字交流', icon: MessageCircle, desc: '通过文字消息沟通' },
  { id: 'voice', label: '语音通话', icon: Mic, desc: '实时语音交流' },
  { id: 'video', label: '视频辅导', icon: Video, desc: '面对面在线教学' },
]

const TIME_OPTIONS = [
  { id: 'now', label: '立即开始', icon: Clock, desc: '寻找当前在线的志愿者' },
  { id: 'schedule', label: '预约时间', icon: CalendarDays, desc: '选择一个合适的时间段' },
]

export default function MatchHelpPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useUser()
  const [step, setStep] = useState(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [communicationMethod, setCommunicationMethod] = useState('')
  const [timeOption, setTimeOption] = useState('')
  const [isCloudSupport, setIsCloudSupport] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalSteps = 4

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) {
    return null
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    )
  }

  const canProceed = () => {
    switch (step) {
      case 1: return selectedSubjects.length > 0
      case 2: return description.trim().length > 10
      case 3: return communicationMethod !== ''
      case 4: return timeOption !== ''
      default: return false
    }
  }

  const groupedSubjects = SUBJECTS.reduce((acc, subject) => {
    if (!acc[subject.category]) acc[subject.category] = []
    acc[subject.category].push(subject)
    return acc
  }, {} as Record<string, typeof SUBJECTS>)

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mx-auto mb-12 max-w-3xl">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">步骤 {step} / {totalSteps}</span>
            <span className="text-sm font-medium text-primary">
              {step === 1 && '选择学科'}
              {step === 2 && '描述问题'}
              {step === 3 && '选择方式'}
              {step === 4 && '选择时间'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Subjects */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">选择需要帮助的学科</CardTitle>
                    <CardDescription className="text-base">
                      可以选择多个学科，我们会为你匹配最合适的志愿者
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(groupedSubjects).map(([category, subjects]) => (
                      <div key={category}>
                        <h3 className="mb-3 font-medium text-muted-foreground">{category}</h3>
                        <div className="flex flex-wrap gap-3">
                          {subjects.map((subject) => {
                            const isSelected = selectedSubjects.includes(subject.id)
                            return (
                              <motion.button
                                key={subject.id}
                                onClick={() => handleSubjectToggle(subject.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`rounded-xl border-2 px-4 py-2 font-medium transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-border bg-white text-foreground hover:border-primary/50'
                                }`}
                              >
                                {subject.label}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Cloud Support Option */}
                    <div className="rounded-xl border-2 border-secondary/50 bg-secondary/10 p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="cloud-support"
                          checked={isCloudSupport}
                          onCheckedChange={(checked) => setIsCloudSupport(checked as boolean)}
                          className="mt-1"
                        />
                        <div>
                          <Label htmlFor="cloud-support" className="cursor-pointer font-medium text-foreground">
                            申请云助学帮助
                          </Label>
                          <p className="mt-1 text-sm text-muted-foreground">
                            如果你来自资源匮乏地区，可以申请云助学专项帮助，获得更多支持
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Describe Problem */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">描述你的问题</CardTitle>
                    <CardDescription className="text-base">
                      详细描述你遇到的问题，帮助志愿者更好地理解和准备
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {selectedSubjects.map(id => {
                        const subject = SUBJECTS.find(s => s.id === id)
                        return (
                          <Badge key={id} variant="secondary">
                            {subject?.label}
                          </Badge>
                        )
                      })}
                    </div>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="例如：我在学习二次函数图像变换时遇到了困难，特别是关于平移和对称变换的理解..."
                      className="min-h-[200px] resize-none text-base"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      已输入 {description.length} 字符（建议至少 10 字）
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Communication Method */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">选择沟通方式</CardTitle>
                    <CardDescription className="text-base">
                      选择你偏好的交流方式
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={communicationMethod} onValueChange={setCommunicationMethod}>
                      <div className="grid gap-4 md:grid-cols-3">
                        {COMMUNICATION_METHODS.map((method) => {
                          const isSelected = communicationMethod === method.id
                          return (
                            <motion.div
                              key={method.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Label
                                htmlFor={method.id}
                                className={`flex cursor-pointer flex-col items-center rounded-xl border-2 p-6 text-center transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${
                                  isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <method.icon className="h-7 w-7" />
                                </div>
                                <span className="font-medium text-foreground">{method.label}</span>
                                <span className="mt-1 text-sm text-muted-foreground">{method.desc}</span>
                              </Label>
                            </motion.div>
                          )
                        })}
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Time Selection */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-2xl">选择时间</CardTitle>
                    <CardDescription className="text-base">
                      选择你希望开始的时间
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={timeOption} onValueChange={setTimeOption}>
                      <div className="grid gap-4 md:grid-cols-2">
                        {TIME_OPTIONS.map((option) => {
                          const isSelected = timeOption === option.id
                          return (
                            <motion.div
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Label
                                htmlFor={option.id}
                                className={`flex cursor-pointer flex-col items-center rounded-xl border-2 p-8 text-center transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl ${
                                  isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                  <option.icon className="h-8 w-8" />
                                </div>
                                <span className="text-lg font-medium text-foreground">{option.label}</span>
                                <span className="mt-1 text-sm text-muted-foreground">{option.desc}</span>
                              </Label>
                            </motion.div>
                          )
                        })}
                      </div>
                    </RadioGroup>

                    {/* Summary */}
                    <div className="mt-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                        <Sparkles className="h-5 w-5 text-primary" />
                        求助摘要
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">学科</span>
                          <span className="font-medium">
                            {selectedSubjects.map(id => SUBJECTS.find(s => s.id === id)?.label).join('、')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">沟通方式</span>
                          <span className="font-medium">
                            {COMMUNICATION_METHODS.find(m => m.id === communicationMethod)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">云助学</span>
                          <span className="font-medium">{isCloudSupport ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(prev => prev - 1)}
              disabled={step === 1}
              className="gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              上一步
            </Button>

            {step < totalSteps ? (
              <Button
                onClick={() => setStep(prev => prev + 1)}
                disabled={!canProceed()}
                className="gap-2"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (!canProceed()) return
                  const token = localStorage.getItem('token') || undefined
                  if (!token) {
                    router.push('/login')
                    return
                  }
                  const tags = selectedSubjects
                    .map(id => SUBJECTS.find(s => s.id === id)?.label || id)
                    .filter(Boolean)
                  const payload = {
                    tags: JSON.stringify(tags),
                    channel: communicationMethod,
                    time_mode: timeOption,
                    time_slots: timeOption === 'schedule' ? JSON.stringify([]) : null,
                    note: description || undefined,
                  }
                  setSubmitting(true)
                  try {
                    const created = await apiClient.post<any>('/match/requests', payload, token)
                    localStorage.setItem('currentMatchRequestId', String(created.id))
                    router.push(`/match/results?id=${encodeURIComponent(String(created.id))}`)
                  } catch (e) {
                    console.error(e)
                    alert('匹配请求提交失败')
                  } finally {
                    setSubmitting(false)
                  }
                }}
                disabled={!canProceed() || submitting}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? '提交中...' : '开始匹配'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
