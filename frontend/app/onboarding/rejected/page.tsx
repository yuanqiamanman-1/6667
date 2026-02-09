'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUser } from '@/lib/user-context'
import { useRouter } from 'next/navigation'

export default function OnboardingRejectedPage() {
  const { logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="container flex h-screen w-full items-center justify-center py-10">
      <Card className="mx-auto max-w-md border-red-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">申请未通过</CardTitle>
          <CardDescription>
            很抱歉，您的组织入驻申请未能通过审核。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            请联系志愿者协会总会获取详细反馈，或重新提交申请。
          </p>
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
            状态：已拒绝 (Rejected)
          </div>
          <Button variant="default" onClick={handleLogout}>
            退出并重新登录
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
