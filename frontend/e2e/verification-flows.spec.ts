import path from 'path'
import { test, expect } from '@playwright/test'
import { apiDeleteUserByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('高校学生认证 -> 讲师认证（同校）审核链路可跑通', async ({ page, request }) => {
  test.setTimeout(120_000)
  const u = `e2e_u_${Date.now()}`
  const superToken = await apiLogin(request, 'superadmin', '123456')
  const fullName = `E2E学生_${u}`
  await apiSignupUser(request, u, fullName)

  const filePath = path.join(__dirname, 'fixtures', 'dummy.txt')

  try {
    await uiLogin(page, u, '123456')
    await page.goto('/verify')
    await expect(page.getByText('认证中心')).toBeVisible()

    await page.getByTestId('open-universityStudent').click()
    const uniDialog = page.getByRole('dialog', { name: '高校学生认证' })
    await expect(uniDialog).toBeVisible()
    await uniDialog.getByRole('combobox').click()
    await page.getByPlaceholder('搜索高校...').fill('北京大学')
    await page.getByRole('option', { name: /北京大学/ }).click()
    await uniDialog.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(uniDialog.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await uniDialog.getByRole('button', { name: '确认提交' }).click()
    await expect(uniDialog).toBeHidden({ timeout: 20000 })
    await expect(page.getByTestId('open-universityStudent')).toContainText('审核中', { timeout: 20000 })

    await uiLogin(page, 'pku_admin', '123456')
    await page.goto('/university/dashboard')
    await page.getByRole('tab', { name: '学生认证' }).click()
    await expect(page.getByText(fullName).first()).toBeVisible()
    const uniCard = page
      .locator('div.rounded-lg.border.border-border.p-4')
      .filter({ hasText: fullName })
      .filter({ hasText: '提交时间' })
      .first()
    await uniCard.getByRole('button', { name: '查看用户' }).click()
    const userDialog1 = page.getByRole('dialog')
    await expect(userDialog1.getByText('用户信息')).toBeVisible()
    await expect(userDialog1.getByText(`用户名：${u}`)).toBeVisible({ timeout: 20000 })
    await page.keyboard.press('Escape')
    await uniCard.getByRole('button', { name: '通过' }).click()

    await uiLogin(page, u, '123456')
    await page.goto('/verify')
    await expect(page.getByText('认证中心')).toBeVisible()
    await page.getByTestId('open-volunteerTeacher').click()
    const teacherDialog = page.getByRole('dialog', { name: '志愿者讲师认证' })
    await expect(page.getByText(/已锁定本校：/)).toBeVisible()
    await teacherDialog.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(teacherDialog.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await teacherDialog.getByRole('button', { name: '确认提交' }).click()
    await expect(teacherDialog).toBeHidden({ timeout: 20000 })
    await expect(page.getByTestId('open-volunteerTeacher')).toContainText('审核中', { timeout: 20000 })

    await uiLogin(page, 'pku_assoc_admin', '123456')
    await page.goto('/association/dashboard')
    await expect(page.getByText('高校志愿者协会控制台')).toBeVisible({ timeout: 20000 })
    await page.locator('[role="tablist"]').getByText('讲师审核').click()
    await expect(page.getByText(fullName).first()).toBeVisible()
    const assocCard = page
      .locator('div.rounded-lg.border.border-border.p-4')
      .filter({ hasText: fullName })
      .filter({ hasText: '提交时间' })
      .first()
    await assocCard.getByRole('button', { name: '查看用户' }).click()
    const userDialog2 = page.getByRole('dialog')
    await expect(userDialog2.getByText('用户信息')).toBeVisible()
    await expect(userDialog2.getByText(`用户名：${u}`)).toBeVisible({ timeout: 20000 })
    await page.keyboard.press('Escape')
    await assocCard.getByRole('button', { name: '通过' }).click()
  } finally {
    await apiDeleteUserByUsername(request, superToken, u)
  }
})
