import { test, expect } from '@playwright/test'
import { apiBase, apiDeleteUserByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('超级管理员账户管理可删除账号', async ({ page, request }) => {
  const u = `e2e_del_${Date.now()}`
  const superToken = await apiLogin(request, 'superadmin', '123456')
  await apiSignupUser(request, u, '待删除用户')

  try {
    await uiLogin(page, 'superadmin', '123456')
    await page.goto('/admin')
    await expect(page.getByText('超级管理员控制台')).toBeVisible()
    await page.getByRole('tab', { name: '账户' }).click()
    await page.getByPlaceholder('搜索用户名/邮箱/学校/角色...').fill(u)
    await expect(page.getByText(u).first()).toBeVisible()
    await page.getByRole('button', { name: `删除 ${u}` }).click()
    await page.getByRole('button', { name: '确认删除' }).click()
    await expect(page.getByText(u)).toHaveCount(0)

    const res = await request.post(`${apiBase}/auth/login/access-token`, { form: { username: u, password: '123456' } })
    expect(res.ok()).toBeFalsy()
  } finally {
    await apiDeleteUserByUsername(request, superToken, u)
  }
})
