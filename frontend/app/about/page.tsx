'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Video, 
  MessageCircle, 
  Award,
  Clock,
  CheckCircle2,
  Heart,
  BookOpen
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge className="mb-6 bg-secondary/20 text-secondary-foreground">
              关于云助学
            </Badge>
            
            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-foreground md:text-6xl">
              用知识点亮希望
              <br />
              让教育触手可及
            </h1>
            
            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              云助学是一个连接山区学生与大学生志愿者的在线教育平台，
              通过一对一匹配、实时沟通，让优质教育资源惠及每一个孩子。
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/register">
                  立即加入
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-transparent">
                <Link href="/university">
                  了解更多
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { value: '10,000+', label: '注册学生', icon: Users },
              { value: '5,000+', label: '志愿者讲师', icon: Heart },
              { value: '50,000+', label: '服务时长（小时）', icon: Clock },
              { value: '95%', label: '满意度', icon: Award },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="border-2 text-center">
                  <CardContent className="pt-6">
                    <stat.icon className="mx-auto mb-4 h-12 w-12 text-primary" />
                    <div className="mb-2 text-3xl font-bold text-primary">{stat.value}</div>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">平台特色</h2>
            <p className="text-lg text-muted-foreground">
              专为山区教育设计的在线辅导平台
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: '精准匹配',
                description: '根据学科需求和时间安排，智能匹配最合适的志愿者讲师'
              },
              {
                icon: Video,
                title: '多种沟通方式',
                description: '支持文字、语音、视频等多种交流方式，灵活选择'
              },
              {
                icon: Shield,
                title: '安全可靠',
                description: '实名认证，信息加密，保护每一位用户的隐私安全'
              },
              {
                icon: BookOpen,
                title: '丰富资源',
                description: '海量学习资料免费下载，名师讲解视频随时观看'
              },
              {
                icon: Users,
                title: '社区互动',
                description: '问答广场实时交流，学习经验分享，共同进步'
              },
              {
                icon: Award,
                title: '激励机制',
                description: '积分奖励体系，成就徽章认证，让学习更有动力'
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <feature.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">我们的使命</h2>
              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                教育是改变命运的钥匙，但山区的孩子们往往因为地理位置和资源限制，
                无法获得与城市学生同等的教育机会。云助学致力于打破这一壁垒，
                通过互联网技术连接全国各地的大学生志愿者，为山区学生提供免费的在线辅导服务。
                <br /><br />
                我们相信，每个孩子都应该拥有追求梦想的权利。让我们携手并进，
                用知识的力量点亮希望，让优质教育资源惠及每一个角落。
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/register">
                    立即加入
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              让改变从今天开始
            </h2>
            <p className="mb-8 text-lg opacity-90">
              无论你是需要帮助的学生，还是想要奉献的志愿者，云助学都欢迎你
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/match/help">
                  我需要帮助
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white/10">
                <Link href="/register">
                  我想当志愿者
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
