import path from 'path'
import { test, expect } from '@playwright/test'
import { apiCreateUniversityAdminForOrg, apiCreateUniversityOrg, apiDeleteUserByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('认证弹窗内高校检索下拉可滚动', async ({ page, request }) => {
  test.setTimeout(120_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')
  const u = `e2e_scroll_${Date.now()}`
  await apiSignupUser(request, u, 'E2E滚动')
  const adminUsers: string[] = []

  const filePath = path.join(__dirname, 'fixtures', 'dummy.txt')

  try {
    for (let i = 0; i < 18; i++) {
      const sid = `e2e_scroll_uni_${Date.now()}_${i}`
      const org = await apiCreateUniversityOrg(request, superToken, `E2E滚动高校_${sid}`, sid)
      const admin = `e2e_uni_admin_${Date.now()}_${i}`
      adminUsers.push(admin)
      await apiCreateUniversityAdminForOrg(request, superToken, String(org.id), admin)
    }

    await uiLogin(page, u, '123456')
    await page.goto('/verify')
    await page.getByTestId('open-universityStudent').click()
    const uniDialog = page.getByRole('dialog', { name: '高校学生认证' })
    await expect(uniDialog).toBeVisible()
    await uniDialog.getByRole('combobox').click()

    const list = page.locator('[cmdk-list]').first()
    await expect(list).toBeVisible()
    await list.hover()
    const meta = await list.evaluate((el: any) => ({ scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }))
    expect(meta.scrollHeight).toBeGreaterThan(meta.clientHeight)
    await page.mouse.wheel(0, 800)
    const after = await list.evaluate((el: any) => el.scrollTop)
    expect(after).toBeGreaterThan(meta.scrollTop)

    await uniDialog.locator('input[type="file"]').first().setInputFiles(filePath)
  } finally {
    await apiDeleteUserByUsername(request, superToken, u)
    for (const admin of adminUsers) {
      await apiDeleteUserByUsername(request, superToken, admin)
    }
  }
})
