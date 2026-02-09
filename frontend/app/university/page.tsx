'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Search,
  Users,
  MessageCircle,
  Calendar,
  MapPin,
  TrendingUp,
  ChevronRight,
  Building2,
  BookOpen,
  Award,
  Star
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiClient } from '@/lib/api-client'

export default function UniversityPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiClient
      .get<any[]>('/core/orgs?type=university&certified=true&require_admin=true')
      .then((raw) => setItems(Array.isArray(raw) ? raw : []))
      .catch((e) => {
        console.error(e)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredUniversities = useMemo(() => {
    const kw = searchQuery.trim().toLowerCase()
    const base = items
      .map((o) => ({
        id: String(o.id ?? ''),
        name: String(o.display_name ?? '高校'),
        schoolId: String(o.school_id ?? ''),
        logo: '/illustrations/university.jpg',
        featured: true,
      }))
      .filter((x) => Boolean(x.id && x.schoolId))
    const list = kw ? base.filter((u) => (u.name + ' ' + u.schoolId).toLowerCase().includes(kw)) : base
    if (activeTab === 'featured') return list.filter((u) => u.featured)
    return list
  }, [activeTab, items, searchQuery])

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">参与高校</h1>
          <p className="text-muted-foreground">
            全国各地优秀高校的志愿者团队正在这里为山区教育贡献力量
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索学校名称或城市..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">全部高校</TabsTrigger>
            <TabsTrigger value="featured">推荐高校</TabsTrigger>
            <TabsTrigger value="ranking">志愿者排行</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* University Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : filteredUniversities.length === 0 ? (
            <div className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              暂无高校
            </div>
          ) : filteredUniversities.map((university) => (
              <motion.div
                key={university.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="group h-full border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                          <Image
                            src={university.logo || "/placeholder.svg"}
                            alt={university.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg group-hover:text-primary">
                            {university.name}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {university.schoolId}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">已开通</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="mt-1 font-semibold">—</div>
                        <div className="text-xs text-muted-foreground">志愿者</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div className="mt-1 font-semibold">—</div>
                        <div className="text-xs text-muted-foreground">话题</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4" />
                        </div>
                        <div className="mt-1 font-semibold">—</div>
                        <div className="text-xs text-muted-foreground">评分</div>
                      </div>
                    </div>

                    <Button asChild className="w-full gap-2 bg-transparent" variant="outline">
                      <Link href={`/campus?school_id=${encodeURIComponent(String(university.schoolId))}`}>
                        进入高校板块
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>

        {!loading && filteredUniversities.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">没有找到相关高校</p>
          </div>
        )}
      </main>
    </div>
  )
}
