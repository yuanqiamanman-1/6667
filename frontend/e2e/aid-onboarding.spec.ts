import path from 'path'
import { test, expect } from '@playwright/test'
import { apiDeleteUserByUsername, apiLogin, apiSignupOrgApplicant, apiSignupUser, uiLogin } from './utils'

test('专项援助认证与入驻审核链路可跑通', async ({ page, request }) => {
  const aidUser = `e2e_aid_${Date.now()}`
  const superToken = await apiLogin(request, 'superadmin', '123456')
  await apiSignupUser(request, aidUser, 'E2E受援学生')

  const filePath = path.join(__dirname, 'fixtures', 'dummy.txt')

  const applicant = `e2e_org_${Date.now()}`
  await apiSignupOrgApplicant(request, applicant)

  try {
    await uiLogin(page, aidUser, '123456')
    await page.goto('/verify')
    await expect(page.getByText('认证中心')).toBeVisible()
    await page.getByTestId('open-specialAid').click()
    const aidDialog = page.getByRole('dialog', { name: '专项援助学生认证' })
    await expect(aidDialog).toBeVisible()
    await aidDialog.getByRole('combobox').click()
    await page.getByPlaceholder('搜索专项援助学校...').fill('昭通')
    await page.getByRole('option', { name: /昭通市第一中学/ }).click()
    await aidDialog.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(aidDialog.getByText('上传中...')).toBeVisible()
    await expect(aidDialog.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await aidDialog.getByRole('button', { name: '确认提交' }).click()
    await expect(aidDialog).toBeHidden({ timeout: 20000 })

    await uiLogin(page, 'zt1z_admin', '123456')
    await page.goto('/aid-school/dashboard')
    await page.getByRole('tab', { name: '认证审核' }).click()
    await expect(page.getByText('E2E受援学生').first()).toBeVisible()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: 'E2E受援学生' }).first().getByRole('button', { name: '通过' }).click()

    await page.getByRole('tab', { name: '学生管理' }).click()
    await page.getByPlaceholder('搜索用户名/邮箱/姓名...').fill(aidUser)
    await expect(page.getByText(aidUser).first()).toBeVisible()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: aidUser }).first().getByRole('button', { name: '撤销认证' }).click()
    const revokeDialog = page.getByRole('alertdialog')
    await expect(revokeDialog).toBeVisible()
    await revokeDialog.getByRole('button', { name: '确认撤销' }).click()
    await expect(page.getByText(aidUser)).toHaveCount(0)

    await uiLogin(page, aidUser, '123456')
    await page.goto('/verify')
    await expect(page.getByText('认证中心')).toBeVisible()

    await uiLogin(page, 'associationHq1', '123456')
    await page.goto('/hq/dashboard')
    await page.getByRole('tab', { name: '入驻审核' }).click()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: '测试大学志愿者协会' }).first().getByRole('button', { name: '申请人' }).click()
    await expect(page.getByText('用户信息')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: '测试大学志愿者协会' }).first().getByRole('button', { name: '通过' }).click()
  } finally {
    await apiDeleteUserByUsername(request, superToken, aidUser)
    await apiDeleteUserByUsername(request, superToken, applicant)
  }
})
