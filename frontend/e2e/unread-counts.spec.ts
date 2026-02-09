import { test, expect } from '@playwright/test'
import { apiBase, apiDeleteUserByUsername, apiGetUserIdByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('未读角标：会话未读按未读会话计数且进入会话后清零', async ({ page, request }) => {
  test.setTimeout(120_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')
  const student = `e2e_unread_s_${Date.now()}`
  await apiSignupUser(request, student, `E2E未读_${student}`)

  try {
    const studentToken = await apiLogin(request, student, '123456')
    const teacherToken = await apiLogin(request, 'teacher_pku', '123456')
    const teacherId = await apiGetUserIdByUsername(request, superToken, 'teacher_pku')

    const convRes = await request.post(`${apiBase}/conversations`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: { peer_user_id: teacherId },
    })
    expect(convRes.ok()).toBeTruthy()
    const conv = await convRes.json()
    const conversationId = String(conv.id)
    expect(conversationId).toBeTruthy()

    const msgRes = await request.post(`${apiBase}/conversations/${encodeURIComponent(conversationId)}/messages`, {
      headers: { Authorization: `Bearer ${teacherToken}` },
      data: { content: 'E2E未读消息' },
    })
    expect(msgRes.ok()).toBeTruthy()

    await uiLogin(page, student, '123456')
    await page.goto('/home')
    const homeMsgBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first()
    await expect(homeMsgBtn).toContainText('消息')
    await expect(homeMsgBtn).toContainText('1', { timeout: 20000 })
    await page.goto('/messages')
    await expect(page.getByRole('tab', { name: /会话/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /会话/ })).toContainText('1')

    await page.getByRole('tab', { name: /通知/ }).click()
    await expect(page.getByRole('tab', { name: /未读/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /已读/ })).toBeVisible()

    await page.getByRole('tab', { name: /会话/ }).click()
    await page.getByText('E2E未读消息').first().click()
    await expect(page).toHaveURL(new RegExp(`/chat/${conversationId}`))

    await page.goto('/messages')
    await expect(page.getByRole('tab', { name: /会话/ })).not.toContainText('1')
  } finally {
    await apiDeleteUserByUsername(request, superToken, student)
  }
})
