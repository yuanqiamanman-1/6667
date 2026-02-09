'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingBag, Wallet } from 'lucide-react'
import { Navbar } from '@/components/navigation/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/lib/user-context'
import { getUserPoints, getUserPointTxns } from '@/lib/client-store'

export default function PointsPage() {
  const router = useRouter()
  const { user, isLoggedIn } = useUser()

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
    }
  }, [isLoggedIn, router])

  const points = useMemo(() => {
    if (!user) return 0
    return getUserPoints(user.id, user.points)
  }, [user])

  const txns = useMemo(() => {
    if (!user) return []
    return getUserPointTxns(user.id)
  }, [user])

  if (!isLoggedIn || !user) return null

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/profile" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              返回个人中心
            </Link>
            <h1 className="text-3xl font-bold text-foreground">我的积分</h1>
            <p className="mt-2 text-muted-foreground">查看积分明细并前往积分商城兑换</p>
          </div>
          <Link href="/profile/points/mall">
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              积分商城
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                积分余额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-4xl font-bold text-primary">{points}</div>
                  <div className="mt-2 text-sm text-muted-foreground">当前可用积分</div>
                </div>
                <Badge variant="secondary" className="h-7 px-3">
                  Lv.{user.level}
                </Badge>
              </div>
              <div className="mt-6 grid gap-3">
                <Link href="/qa">
                  <Button variant="outline" className="w-full bg-transparent">
                    去问答赚积分
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline" className="w-full bg-transparent">
                    去社区参与互动
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>积分明细</CardTitle>
            </CardHeader>
            <CardContent>
              {txns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无积分记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {txns.map(txn => (
                    <div key={txn.id} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{txn.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(txn.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className={`shrink-0 text-right font-semibold ${txn.points >= 0 ? 'text-green-600' : 'text-foreground'}`}>
                        {txn.points >= 0 ? `+${txn.points}` : txn.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
