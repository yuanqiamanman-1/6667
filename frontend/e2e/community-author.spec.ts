import { test, expect } from '@playwright/test'
import { apiBase, apiDeleteUserByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('社区发帖作者可区分且不使用假数据', async ({ page, request }) => {
  test.setTimeout(120_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')

  const a = `e2e_comm_a_${Date.now()}`
  const b = `e2e_comm_b_${Date.now()}`
  await apiSignupUser(request, a, '社区A')
  await apiSignupUser(request, b, '社区B')

  try {
    const tokenA = await apiLogin(request, a, '123456')
    const tokenB = await apiLogin(request, b, '123456')
    const contentA = `A发帖_${Date.now()}`
    const contentB = `B发帖_${Date.now()}`

    const postA = await request.post(`${apiBase}/content/community/posts`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: { content: contentA, tags: '[]' },
    })
    expect(postA.ok()).toBeTruthy()

    const postB = await request.post(`${apiBase}/content/community/posts`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { content: contentB, tags: '[]' },
    })
    expect(postB.ok()).toBeTruthy()

    await uiLogin(page, a, '123456')
    await page.goto('/community')
    await expect(page.getByText('社区A').first()).toBeVisible()
    await expect(page.getByText('社区B').first()).toBeVisible()
    await expect(page.getByText(contentA).first()).toBeVisible()
    await expect(page.getByText(contentB).first()).toBeVisible()
  } finally {
    await apiDeleteUserByUsername(request, superToken, a)
    await apiDeleteUserByUsername(request, superToken, b)
  }
})

