'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Gift, ShoppingBag } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useUser } from '@/lib/user-context'
import { appendUserPointTxn, appendUserRedemption, getUserPoints, getUserRedemptions, nowIso, setUserPoints, uid } from '@/lib/client-store'

type MallItem = {
  id: string
  name: string
  description: string
  cost: number
  category: string
}

const MALL_ITEMS: MallItem[] = [
  { id: 'cert_basic', name: '公益助学电子证书', description: '兑换后可在个人中心展示', cost: 200, category: '证书' },
  { id: 'badge_star', name: '纪念徽章（线上）', description: '专属徽章与称号展示', cost: 300, category: '徽章' },
  { id: 'gift_stationery', name: '公益学习用品小礼包', description: '面向活动奖品的兑换占位', cost: 500, category: '实物' },
  { id: 'theme_profile', name: '个人主页装扮主题', description: '解锁更多样式与装扮', cost: 400, category: '权益' },
]

export default function PointsMallPage() {
  const router = useRouter()
  const { user, isLoggedIn, updateUser } = useUser()

  const [activeTab, setActiveTab] = useState('items')
  const [selectedItem, setSelectedItem] = useState<MallItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  const points = useMemo(() => {
    if (!user) return 0
    return getUserPoints(user.id, user.points)
  }, [user])

  const redemptions = useMemo(() => {
    if (!user) return []
    return getUserRedemptions(user.id)
  }, [user])

  if (!isLoggedIn || !user) return null

  const canRedeem = (item: MallItem) => points >= item.cost

  const openRedeem = (item: MallItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleRedeem = () => {
    if (!selectedItem) return
    if (!canRedeem(selectedItem)) return

    const nextPoints = points - selectedItem.cost
    setUserPoints(user.id, nextPoints)
    updateUser({ points: nextPoints })

    appendUserPointTxn(user.id, {
      id: uid('ptx'),
      type: 'redeem',
      title: `兑换：${selectedItem.name}`,
      points: -selectedItem.cost,
      createdAt: nowIso(),
      meta: { itemId: selectedItem.id },
    })

    appendUserRedemption(user.id, {
      id: uid('redeem'),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      pointsCost: selectedItem.cost,
      createdAt: nowIso(),
    })

    setActiveTab('history')
    setDialogOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/profile/points" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回积分中心
            </Link>
            <h1 className="text-3xl font-bold text-foreground">积分商城</h1>
            <p className="mt-2 text-muted-foreground">兑换公益向奖励与平台权益</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="h-8 px-3 text-sm">
              当前积分：{points}
            </Badge>
            <Link href="/profile/points">
              <Button variant="outline" className="gap-2 bg-transparent">
                <ShoppingBag className="h-4 w-4" />
                积分明细
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="items" className="gap-2">
              <Gift className="h-4 w-4" />
              兑换商品
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              兑换记录
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {MALL_ITEMS.map(item => (
                <Card key={item.id} className="border-2 transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-1">{item.name}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">{item.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {item.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        需要 <span className="font-semibold text-foreground">{item.cost}</span> 积分
                      </div>
                      <Button
                        onClick={() => openRedeem(item)}
                        disabled={!canRedeem(item)}
                      >
                        {canRedeem(item) ? '兑换' : '积分不足'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>兑换记录</CardTitle>
              </CardHeader>
              <CardContent>
                {redemptions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">暂无兑换记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {redemptions.map(r => (
                      <div key={r.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{r.itemName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(r.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div className="shrink-0 text-right font-semibold text-foreground">
                          -{r.pointsCost}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认兑换</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItem
                  ? `确定使用 ${selectedItem.cost} 积分兑换“${selectedItem.name}”吗？`
                  : '确定兑换吗？'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRedeem}
                disabled={!selectedItem || (selectedItem ? !canRedeem(selectedItem) : true)}
              >
                确认兑换
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
