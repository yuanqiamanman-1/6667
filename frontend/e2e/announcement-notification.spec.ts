import { test, expect } from '@playwright/test'
import { apiBase, apiLogin, uiLogin } from './utils'

test.describe('公告发布通知', () => {
  test('发布校园公告后目标用户收到通知', async ({ page, request }) => {
    test.setTimeout(180_000)

    const suffix = String(Date.now())
    const announcementTitle = `E2E校园公告_${suffix}`
    const announcementContent = `E2E校园公告内容_${suffix}`

    // 1. 高校管理员 (pku_admin) 发布校园公告
    const adminToken = await apiLogin(request, 'pku_admin', '123456')

    const createRes = await request.post(`${apiBase}/core/announcements`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: announcementTitle,
        content: announcementContent,
        scope: 'campus',
        audience: 'campus_all',
        school_id: 'PKU',
        pinned: false,
        version: '1.0',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const announcement = await createRes.json()
    console.log('[E2E] 创建公告成功:', announcement.id)

    // 2. 验证同校用户 (student_pku) 收到 announcement_published 通知
    await page.waitForTimeout(1000)
    const userToken = await apiLogin(request, 'student_pku', '123456')
    const notifRes = await request.get(`${apiBase}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    expect(notifRes.ok()).toBeTruthy()
    const notifs = await notifRes.json()
    const found = notifs.find(
      (n: any) => n.type === 'announcement_published' && n.payload?.title === announcementTitle
    )
    expect(found).toBeTruthy()
    console.log('[E2E] 用户收到 announcement_published 通知:', found?.id)

    // 3. UI 验证：用户在消息页面看到公告通知
    await uiLogin(page, 'student_pku', '123456')
    await page.goto('/messages')
    await page.getByRole('tab', { name: /通知/ }).click()
    await expect(page.getByText('新公告').first()).toBeVisible({ timeout: 15_000 })
    console.log('[E2E] UI 验证用户看到公告通知成功')
  })
})
