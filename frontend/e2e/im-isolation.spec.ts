import { test, expect } from '@playwright/test'
import { apiBase, apiDeleteUserByUsername, apiGetUserIdByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('私聊会话与权限隔离可跑通', async ({ page, request }) => {
  test.setTimeout(120_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')

  const a = `e2e_im_a_${Date.now()}`
  const b = `e2e_im_b_${Date.now()}`
  const c = `e2e_im_c_${Date.now()}`
  await apiSignupUser(request, a, 'E2E聊天A')
  await apiSignupUser(request, b, 'E2E聊天B')
  await apiSignupUser(request, c, 'E2E聊天C')

  try {
    const bId = await apiGetUserIdByUsername(request, superToken, b)
    const tokenA = await apiLogin(request, a, '123456')
    const tokenC = await apiLogin(request, c, '123456')

    const convRes = await request.post(`${apiBase}/conversations`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { peer_user_id: bId },
    })
    expect(convRes.ok()).toBeTruthy()
    const conv = await convRes.json()
    const convId = String(conv.id)

    const sendRes = await request.post(`${apiBase}/conversations/${encodeURIComponent(convId)}/messages`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { content: 'hello from api' },
    })
    expect(sendRes.ok()).toBeTruthy()

    const forbid = await request.get(`${apiBase}/conversations/${encodeURIComponent(convId)}/messages`, {
      headers: { Authorization: `Bearer ${tokenC}` },
    })
    expect(forbid.status()).toBe(403)

    await uiLogin(page, a, '123456')
    await page.goto('/messages')
    await expect(page.getByText('E2E聊天B').first()).toBeVisible()
    await page.getByText('E2E聊天B').first().click()
    await expect(page.getByText('私聊')).toBeVisible()
    await page.getByPlaceholder('输入消息...').fill('hello from ui')
    await page.keyboard.press('Enter')
    await expect(page.getByText('hello from ui')).toBeVisible({ timeout: 20000 })
  } finally {
    await apiDeleteUserByUsername(request, superToken, a)
    await apiDeleteUserByUsername(request, superToken, b)
    await apiDeleteUserByUsername(request, superToken, c)
  }
})

