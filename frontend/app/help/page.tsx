'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Search,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Shield,
  Award,
  Heart,
  ChevronRight,
  Mail,
  Phone
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { AnimatedCard } from '@/components/animated/animated-card'
import { StaggerContainer, StaggerItem } from '@/components/animated/stagger-container'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const HELP_CATEGORIES = [
  {
    icon: BookOpen,
    title: '新手入门',
    description: '了解云助学平台的基础知识',
    articles: 5,
  },
  {
    icon: MessageCircle,
    title: '匹配与咨询',
    description: '如何找到合适的志愿者',
    articles: 8,
  },
  {
    icon: Shield,
    title: '安全与隐私',
    description: '保护你的个人信息',
    articles: 6,
  },
  {
    icon: Award,
    title: '积分与等级',
    description: '了解积分系统运作方式',
    articles: 4,
  },
]

const FAQ_ITEMS = [
  {
    question: '什么是云助学？',
    answer: '云助学是一个连接资源匮乏地区学生与优秀大学生志愿者的公益教育平台。我们通过智能匹配算法，为需要帮助的学生提供免费的在线辅导服务。',
  },
  {
    question: '如何申请云助学帮助？',
    answer: '在发起匹配时，勾选“申请云助学帮助”选项，并填写相关信息。我们会优先为来自资源匮乏地区的学生匹配志愿者，并提供额外的学习资源支持。',
  },
  {
    question: '志愿者需要什么资格？',
    answer: '志愿者需要是在校大学生或已毕业的校友，通过学生认证后即可成为志愿者。我们鼓励各学科的同学参与，分享知识，传递温暖。',
  },
  {
    question: '辅导服务是否收费？',
    answer: '云助学平台上的所有辅导服务完全免费。这是一个公益项目，旨在帮助更多需要帮助的学生获得优质的教育资源。',
  },
  {
    question: '如何成为认证志愿者？',
    answer: '注册账号后，进入"身份认证"页面，上传学生证或在校证明，通过审核后即可成为认证志愿者。认证志愿者会获得更多曝光机会和特殊徽章。',
  },
  {
    question: '积分有什么用？',
    answer: '积分可以用来兑换学习资料、提升等级、解锁特殊功能。学生通过完成咨询、参与社区获得积分；志愿者通过帮助学生获得积分。',
  },
  {
    question: '如果遇到不合适的志愿者怎么办？',
    answer: '你可以随时结束当前会话，重新发起匹配。同时可以通过举报功能向我们反馈问题。我们会认真处理每一个反馈，维护平台的良好氛围。',
  },
  {
    question: '平台如何保障安全？',
    answer: '我们采用实名认证、内容监控、举报机制等多重措施保障平台安全。所有对话记录会被加密存储，仅用于服务质量改进和争议解决。',
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <HelpCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground">帮助中心</h1>
          <p className="text-lg text-muted-foreground">
            我们随时为你提供帮助和支持
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mb-16 max-w-2xl"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索你的问题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 text-base"
            />
          </div>
        </motion.div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-foreground">帮助分类</h2>
          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HELP_CATEGORIES.map((category, index) => (
              <StaggerItem key={category.title}>
                <AnimatedCard delay={index * 100}>
                  <Card className="group cursor-pointer border-2 transition-all duration-500 hover:border-primary hover:shadow-lg">
                    <CardHeader>
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white">
                        <category.icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription className="text-base">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{category.articles} 篇文章</span>
                        <ChevronRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-bold text-foreground">常见问题</h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mx-auto max-w-3xl"
          >
            <Card className="border-2">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-base font-medium hover:text-primary">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto max-w-3xl"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">还有其他问题？</CardTitle>
              <CardDescription className="text-base">
                我们的团队随时准备为你提供帮助
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-2">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold">发送邮件</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      support@yunzhijiao.com
                    </p>
                    <Button variant="outline" className="bg-transparent">联系我们</Button>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary-foreground">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-semibold">在线客服</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      工作日 9:00 - 18:00
                    </p>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                      开始对话
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
