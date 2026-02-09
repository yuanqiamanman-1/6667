'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/user-context'
import { useRouter } from 'next/navigation'

export default function OnboardingPendingPage() {
  const { logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="container flex h-screen w-full items-center justify-center py-10">
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">申请审核中</CardTitle>
          <CardDescription>
            您的组织入驻申请已提交，志愿者协会总会正在审核中。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            审核通常需要 1-3 个工作日。审核通过后，您将收到邮件通知，并可使用此账号登录管理后台。
          </p>
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            状态：等待审核 (Pending)
          </div>
          <Button variant="outline" onClick={handleLogout}>
            退出登录
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
