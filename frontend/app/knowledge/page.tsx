'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  Search,
  Upload,
  FileText,
  Video,
  BookOpen,
  Download,
  Eye,
  Heart,
  Star
} from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ResourcePreview } from '@/components/knowledge/resource-preview'

const CATEGORIES = [
  { id: 'all', name: '全部', icon: BookOpen },
  { id: 'math', name: '数学', icon: FileText },
  { id: 'physics', name: '物理', icon: FileText },
  { id: 'chemistry', name: '化学', icon: FileText },
  { id: 'biology', name: '生物', icon: FileText },
  { id: 'english', name: '英语', icon: FileText },
  { id: 'chinese', name: '语文', icon: FileText },
]

const RESOURCES = [
  {
    id: 1,
    title: '高考数学必考知识点汇总',
    description: '涵盖高考数学所有核心知识点，包括函数、数列、立体几何等',
    type: 'document',
    format: 'PDF',
    category: 'math',
    subject: '数学',
    author: '张老师',
    university: '北京大学',
    downloads: 1234,
    views: 5678,
    likes: 456,
    rating: 4.9,
    createdAt: '3天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
    content: '第一章：函数与导数\n\n1.1 函数的基本概念\n函数是高考数学的核心内容，理解函数的定义域、值域以及单调性是解题的关键。\n\n1.2 导数的应用\n导数可以用来研究函数的单调性、极值和最值问题。掌握导数的几何意义对于解决实际应用题非常重要。\n\n第二章：数列\n\n2.1 等差数列与等比数列\n熟练掌握通项公式和求和公式是解决数列问题的基础。\n\n2.2 数列的综合应用\n数列常与函数、不等式结合考查，需要灵活运用各种方法。',
  },
  {
    id: 2,
    title: '物理力学专题视频讲解',
    description: '详细讲解牛顿运动定律、动量守恒等重要力学知识',
    type: 'video',
    format: 'MP4',
    category: 'physics',
    subject: '物理',
    author: '李教授',
    university: '清华大学',
    downloads: 892,
    views: 3456,
    likes: 234,
    rating: 4.8,
    createdAt: '1周前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    coverImage: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 3,
    title: '化学方程式配平技巧',
    description: '掌握氧化还原反应配平的各种方法和技巧',
    type: 'document',
    format: 'PDF',
    category: 'chemistry',
    subject: '化学',
    author: '王老师',
    university: '复旦大学',
    downloads: 567,
    views: 2345,
    likes: 189,
    rating: 4.7,
    createdAt: '5天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
    content: '化学方程式配平方法总结\n\n一、观察法配平\n对于简单的化学方程式，可以通过观察各元素原子个数来配平。这是最基础也是最常用的方法。\n\n二、最小公倍数法\n找出方程式两边某一元素原子个数的最小公倍数，然后推算其他化学式的系数。\n\n三、奇偶配平法\n当方程式中某元素多次出现，且两边原子总数一奇一偶时使用。\n\n四、氧化还原反应配平\n根据得失电子守恒原理进行配平，这是氧化还原反应配平的核心方法。',
  },
  {
    id: 4,
    title: '生物细胞结构完整讲解',
    description: '从细胞膜到细胞核，全面解析细胞的结构与功能',
    type: 'video',
    format: 'MP4',
    category: 'biology',
    subject: '生物',
    author: '赵教授',
    university: '浙江大学',
    downloads: 445,
    views: 1890,
    likes: 167,
    rating: 4.6,
    createdAt: '2天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
    videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    coverImage: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 5,
    title: '英语语法大全',
    description: '系统讲解英语16种时态和各类从句用法',
    type: 'document',
    format: 'PDF',
    category: 'english',
    subject: '英语',
    author: '刘老师',
    university: '上海外国语大学',
    downloads: 789,
    views: 3210,
    likes: 298,
    rating: 4.8,
    createdAt: '1周前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
    content: 'Chapter 1: English Tenses\n\n1.1 Present Simple Tense\nThe present simple is used for habits, facts, and general truths.\nExample: I study English every day.\n\n1.2 Present Continuous Tense\nUsed for actions happening now or temporary situations.\nExample: I am studying English right now.\n\n1.3 Present Perfect Tense\nConnects past actions to the present.\nExample: I have studied English for five years.\n\nChapter 2: Clauses\n\n2.1 Noun Clauses\nFunction as nouns in sentences.\nExample: What he said surprised me.\n\n2.2 Adjective Clauses\nModify nouns or pronouns.\nExample: The book that I bought is interesting.',
  },
  {
    id: 6,
    title: '古诗词鉴赏技巧',
    description: '掌握古诗词的意象、修辞和情感表达方法',
    type: 'document',
    format: 'PDF',
    category: 'chinese',
    subject: '语文',
    author: '陈老师',
    university: '北京师范大学',
    downloads: 623,
    views: 2567,
    likes: 234,
    rating: 4.7,
    createdAt: '4天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 7,
    title: '数学导数应用专题',
    description: '深入讲解导数在函数单调性、极值问题中的应用',
    type: 'video',
    format: 'MP4',
    category: 'math',
    subject: '数学',
    author: '孙教授',
    university: '南京大学',
    downloads: 891,
    views: 4123,
    likes: 356,
    rating: 4.9,
    createdAt: '6天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 8,
    title: '物理电磁学基础',
    description: '电场、磁场和电磁感应的完整知识体系',
    type: 'document',
    format: 'PDF',
    category: 'physics',
    subject: '物理',
    author: '周老师',
    university: '中国科学技术大学',
    downloads: 712,
    views: 2890,
    likes: 267,
    rating: 4.8,
    createdAt: '3天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 9,
    title: '有机化学反应机理',
    description: '详解常见有机反应的机理和反应条件',
    type: 'video',
    format: 'MP4',
    category: 'chemistry',
    subject: '化学',
    author: '吴教授',
    university: '南开大学',
    downloads: 534,
    views: 2156,
    likes: 189,
    rating: 4.7,
    createdAt: '1周前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 10,
    title: '生物遗传学专题',
    description: '孟德尔遗传定律和现代遗传学基础知识',
    type: 'document',
    format: 'PDF',
    category: 'biology',
    subject: '生物',
    author: '郑老师',
    university: '武汉大学',
    downloads: 456,
    views: 1987,
    likes: 145,
    rating: 4.6,
    createdAt: '5天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 11,
    title: '英语写作技巧提升',
    description: '议论文、记叙文、应用文的写作方法和高分模板',
    type: 'video',
    format: 'MP4',
    category: 'english',
    subject: '英语',
    author: '林老师',
    university: '北京外国语大学',
    downloads: 678,
    views: 3045,
    likes: 287,
    rating: 4.8,
    createdAt: '2天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
  {
    id: 12,
    title: '现代文阅读理解方法',
    description: '掌握现代文阅读的答题技巧和思维方法',
    type: 'document',
    format: 'PDF',
    category: 'chinese',
    subject: '语文',
    author: '黄老师',
    university: '华东师范大学',
    downloads: 567,
    views: 2345,
    likes: 198,
    rating: 4.7,
    createdAt: '4天前',
    thumbnail: '/illustrations/icon-knowledge.jpg',
  },
]

const getTypeIcon = (type: string) => {
  return type === 'video' ? Video : FileText
}

export default function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [previewResource, setPreviewResource] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const handlePreview = (resource: any) => {
    setPreviewResource(resource)
    setShowPreview(true)
  }
  
  const handleDownload = (resourceId: number) => {
    alert('下载功能已触发，实际项目中这里会下载文件')
  }

  const filteredResources = RESOURCES.filter(resource => {
    const matchCategory = activeCategory === 'all' || resource.category === activeCategory
    const matchSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = activeType === 'all' || 
      (activeType === 'documents' && resource.type === 'document') ||
      (activeType === 'videos' && resource.type === 'video')
    return matchCategory && matchSearch && matchType
  })
  
  return (
    <div className="min-h-screen bg-white pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold">知识库</h1>
          <p className="text-lg text-muted-foreground">
            优质学习资料，助力学业进步
          </p>
        </div>

        {/* Search and Upload */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索资料..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            上传资料
          </Button>
        </div>

        {/* Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category.id)}
              className="gap-2"
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </Button>
          ))}
        </div>

        <div className="space-y-6">
          <div>
            {/* Tabs */}
            <Tabs value={activeType} onValueChange={setActiveType} className="mb-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="all" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  全部
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="h-4 w-4" />
                  文档
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2">
                  <Video className="h-4 w-4" />
                  视频
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Resource Grid */}
            {filteredResources.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">暂无资源</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredResources.map((resource) => {
                  const TypeIcon = getTypeIcon(resource.type)
                  return (
                    <Card key={resource.id} className="group overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
                      <div className="relative h-40 overflow-hidden bg-muted/30">
                        <Image
                          src={resource.thumbnail || "/placeholder.svg"}
                          alt={resource.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3">
                          <Badge className="bg-white/90 text-foreground shadow">
                            <TypeIcon className="mr-1 h-3 w-3" />
                            {resource.format}
                          </Badge>
                        </div>
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {resource.rating}
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className="mb-2 bg-muted/50">
                              {resource.subject}
                            </Badge>
                            <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
                              {resource.title}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4 line-clamp-2">
                          {resource.description}
                        </CardDescription>
                        
                        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {resource.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {resource.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              {resource.likes}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4 text-sm text-muted-foreground">
                          <p>{resource.author} · {resource.university}</p>
                          <p>{resource.createdAt}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2 bg-transparent"
                            onClick={() => handlePreview(resource)}
                          >
                            <Eye className="h-4 w-4" />
                            预览
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 gap-2"
                            onClick={() => handleDownload(resource.id)}
                          >
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Load More */}
            {filteredResources.length > 0 && (
              <div className="mt-8 text-center">
                <Button variant="outline" size="lg">
                  加载更多资源
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <ResourcePreview
        resource={previewResource}
        open={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload}
      />
    </div>
  )
}
