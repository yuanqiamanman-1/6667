'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, HeartHandshake, GraduationCap, Building2, Shield, Users, BookOpen, MessageCircle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DURATIONS } from '@/lib/constants'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Landing Navbar - 简化版 */}
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl">
              <Image src="/logo.png" alt="云助学" fill className="object-cover" />
            </div>
            <span className="text-xl font-bold text-primary">云助学</span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#about" className="text-sm text-muted-foreground transition-colors hover:text-primary">关于我们</Link>
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-primary">平台功能</Link>
            <Link href="#safety" className="text-sm text-muted-foreground transition-colors hover:text-primary">安全保障</Link>
            <Link href="#partners" className="text-sm text-muted-foreground transition-colors hover:text-primary">合作高校</Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-primary">登录</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20">立即加入</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-secondary/10" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DURATIONS.slow / 1000, ease: [0.4, 0, 0.2, 1] }}
            >
              <Badge className="mb-6 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30">
                公益教育 · 温暖连接
              </Badge>
              
              <h1 className="mb-6 text-balance text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                让知识的云
                <br />
                <span className="text-primary">穿越千里</span>
                <br />
                滋润每一片土地
              </h1>
              
              <p className="mb-8 text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
                连接资源匮乏地区的学生与全国优秀志愿者，
                打造温暖的公益教育社交平台。
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                    进入平台
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#about">
                  <Button size="lg" variant="outline" className="gap-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white">
                    <Play className="h-4 w-4" />
                    了解更多
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 flex flex-wrap gap-8">
                {[
                  { value: '10,000+', label: '活跃志愿者' },
                  { value: '50,000+', label: '帮助学生' },
                  { value: '500+', label: '合作高校' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  >
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: DURATIONS.slow / 1000, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl shadow-primary/10">
                <Image
                  src="/illustrations/hero.jpg"
                  alt="云助学"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-1/4 rounded-2xl bg-white p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">已匹配成功</div>
                    <div className="text-xs text-muted-foreground">128,000+ 次</div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 bottom-1/4 rounded-2xl bg-white p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">好评率</div>
                    <div className="text-xs text-muted-foreground">99.2%</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Decorative */}
        <div className="absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* About Section */}
      <section id="about" className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="mb-4">关于云助学</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              让每个孩子都能享受优质教育
            </h2>
            <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
              云助学是一个连接资源匮乏地区学生与全国优秀大学生志愿者的公益平台，
              通过智能匹配和在线辅导，打破地域限制，让知识自由流动。
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: HeartHandshake,
                title: '我要求助',
                description: '资源匮乏地区的学生可以发起求助，平台将为你匹配最适合的志愿者老师。',
                href: '/register',
                color: 'primary',
              },
              {
                icon: GraduationCap,
                title: '成为志愿者',
                description: '全国各高校的优秀学生可以注册成为志愿者，用知识传递温暖和希望。',
                href: '/register',
                color: 'accent',
              },
              {
                icon: Building2,
                title: '高校入驻',
                description: '高校可以整体入驻平台，建立专属交流空间，组织志愿服务活动。',
                href: '/register',
                color: 'secondary',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group h-full border-2 transition-all duration-500 hover:border-primary hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={item.href}>
                      <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
                        了解更多
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="mb-4">平台功能</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              全方位支持学习与成长
            </h2>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, title: '智能匹配', desc: '根据学科、时间、偏好精准匹配', image: '/illustrations/icon-matching.jpg' },
              { icon: MessageCircle, title: '实时问答', desc: '快速获得学习问题解答', image: '/illustrations/icon-qa.jpg' },
              { icon: HeartHandshake, title: '社区交流', desc: '分享经验，互相鼓励', image: '/illustrations/icon-community.jpg' },
              { icon: BookOpen, title: '知识库', desc: '海量学习资源随时查阅', image: '/illustrations/icon-knowledge.jpg' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="text-center">
                    <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-2xl bg-muted/50">
                      <Image src={feature.image || "/placeholder.svg"} alt={feature.title} fill className="object-cover" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section id="safety" className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4">安全保障</Badge>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                全方位保护每一位用户
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                平台建立了完善的安全机制，从身份认证到内容审核，全面保障用户的使用安全。
              </p>
              
              <div className="space-y-4">
                {[
                  { title: '实名认证', desc: '所有用户需通过学生证/工作证认证' },
                  { title: '高校审核', desc: '志愿者需经过所属高校资质审核' },
                  { title: '内容监管', desc: 'AI+人工双重内容审核机制' },
                  { title: '举报机制', desc: '一键举报，24小时内响应处理' },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative aspect-square overflow-hidden rounded-3xl">
                <Image src="/illustrations/safety.jpg" alt="安全保障" fill className="object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <Badge className="mb-4">合作高校</Badge>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              携手全国知名高校
            </h2>
            <p className="text-lg text-muted-foreground">
              已有500+高校入驻平台，共同推动公益教育事业
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {['北京大学', '清华大学', '复旦大学', '浙江大学', '南京大学', '中山大学', '武汉大学', '四川大学'].map((uni) => (
              <div key={uni} className="text-lg font-semibold text-muted-foreground">
                {uni}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-accent py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">
              一起让教育更公平
            </h2>
            <p className="mb-8 text-lg opacity-90">
              加入云助学，用知识的力量改变世界
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2 shadow-xl">
                  立即注册
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="gap-2 border-white bg-transparent text-white hover:bg-white hover:text-primary">
                  登录账号
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                  <Image src="/logo.png" alt="云助学" fill className="object-cover" />
                </div>
                <span className="font-bold text-primary">云助学</span>
              </div>
              <p className="text-sm text-muted-foreground">
                让知识无界，让温暖相连
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">快速链接</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Link href="/about" className="hover:text-primary">关于我们</Link></div>
                <div><Link href="/login" className="hover:text-primary">登录</Link></div>
                <div><Link href="/register" className="hover:text-primary">注册</Link></div>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">帮助中心</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div><Link href="#" className="hover:text-primary">使用指南</Link></div>
                <div><Link href="#" className="hover:text-primary">常见问题</Link></div>
                <div><Link href="#" className="hover:text-primary">联系客服</Link></div>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">关注我们</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>微信公众号：云助学平台</div>
                <div>微博：@云助学官方</div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 云助学 · 让知识无界 · 让温暖相连</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
