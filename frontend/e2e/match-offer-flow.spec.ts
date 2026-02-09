import path from 'path'
import { test, expect } from '@playwright/test'
import { apiBase, apiDeleteUserByUsername, apiLogin, apiSignupUser, uiLogin } from './utils'

test('匹配求助-讲师响应-会话建立闭环可跑通', async ({ page, request }) => {
  test.setTimeout(150_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')
  const student = `e2e_mos_s_${Date.now()}`
  const teacher = `e2e_mos_t_${Date.now()}`
  await apiSignupUser(request, student, 'E2E求助学生')
  await apiSignupUser(request, teacher, 'E2E求助讲师')

  const filePath = path.join(__dirname, 'fixtures', 'dummy.txt')

  try {
    await uiLogin(page, student, '123456')
    await page.goto('/verify')
    await page.getByTestId('open-universityStudent').click()
    const uniDialog1 = page.getByRole('dialog', { name: '高校学生认证' })
    await uniDialog1.getByRole('combobox').click()
    await page.getByPlaceholder('搜索高校...').fill('北京大学')
    await page.getByRole('option', { name: /北京大学/ }).click()
    await uniDialog1.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(uniDialog1.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await uniDialog1.getByRole('button', { name: '确认提交' }).click()
    await expect(uniDialog1).toBeHidden({ timeout: 20000 })
    await expect(page.getByTestId('open-universityStudent')).toContainText('审核中', { timeout: 20000 })

    await uiLogin(page, teacher, '123456')
    await page.goto('/verify')
    await page.getByTestId('open-universityStudent').click()
    const uniDialog2 = page.getByRole('dialog', { name: '高校学生认证' })
    await uniDialog2.getByRole('combobox').click()
    await page.getByPlaceholder('搜索高校...').fill('北京大学')
    await page.getByRole('option', { name: /北京大学/ }).click()
    await uniDialog2.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(uniDialog2.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await uniDialog2.getByRole('button', { name: '确认提交' }).click()
    await expect(uniDialog2).toBeHidden({ timeout: 20000 })
    await expect(page.getByTestId('open-universityStudent')).toContainText('审核中', { timeout: 20000 })

    await uiLogin(page, 'pku_admin', '123456')
    await page.goto('/university/dashboard')
    await page.getByRole('tab', { name: '学生认证' }).click()
    await expect(page.getByText('E2E求助学生').first()).toBeVisible()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: 'E2E求助学生' }).first().getByRole('button', { name: '通过' }).click()
    await expect(page.getByText('E2E求助讲师').first()).toBeVisible()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: 'E2E求助讲师' }).first().getByRole('button', { name: '通过' }).click()

    await uiLogin(page, teacher, '123456')
    await page.goto('/verify')
    await page.getByTestId('open-volunteerTeacher').click()
    const teacherDialog = page.getByRole('dialog', { name: '志愿者讲师认证' })
    await teacherDialog.locator('input[type="file"]').first().setInputFiles(filePath)
    await expect(teacherDialog.getByText('已上传：dummy.txt')).toBeVisible({ timeout: 20000 })
    await teacherDialog.getByRole('button', { name: '确认提交' }).click()
    await expect(teacherDialog).toBeHidden({ timeout: 20000 })
    await expect(page.getByTestId('open-volunteerTeacher')).toContainText('审核中', { timeout: 20000 })

    await uiLogin(page, 'pku_assoc_admin', '123456')
    await page.goto('/association/dashboard')
    await page.locator('[role="tablist"]').getByText('讲师审核').click()
    await expect(page.getByText('E2E求助讲师').first()).toBeVisible()
    await page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: 'E2E求助讲师' }).first().getByRole('button', { name: '通过' }).click()

    const studentToken = await apiLogin(request, student, '123456')
    const createRes = await request.post(`${apiBase}/match/requests`, {
      headers: { Authorization: `Bearer ${studentToken}` },
      data: {
        tags: JSON.stringify(['数学']),
        channel: 'text',
        time_mode: 'now',
        time_slots: null,
        note: '我需要有人帮我讲解一道数学题。',
      },
    })
    expect(createRes.ok()).toBeTruthy()
    const created = await createRes.json()
    const requestId = String(created.id)

    await uiLogin(page, student, '123456')
    await page.goto(`/match/results?id=${encodeURIComponent(requestId)}`)
    await expect(page.getByText('匹配结果')).toBeVisible()
    const teacherCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'E2E求助讲师' })
      .first()
    await expect(teacherCard).toBeVisible()
    await teacherCard.getByRole('button', { name: '求助' }).first().click()

    await uiLogin(page, teacher, '123456')
    await page.goto('/home')
    await expect(page.getByText('待响应的求助')).toBeVisible()
    await expect(page.getByText('E2E求助学生')).toBeVisible({ timeout: 20000 })
    await page.getByRole('button', { name: '接受' }).first().click()
    await expect(page).toHaveURL(/\/chat\//i, { timeout: 20000 })

    await uiLogin(page, student, '123456')
    await page.goto('/messages')
    await page.getByRole('tab', { name: '通知' }).click()
    await expect(page.getByText('求助已被接受').first()).toBeVisible({ timeout: 20000 })
    await page.getByRole('link', { name: '进入会话' }).first().click()
    await expect(page).toHaveURL(/\/chat\//i, { timeout: 20000 })
    await expect(page.getByText('我已接受你的求助')).toBeVisible({ timeout: 20000 })
  } finally {
    await apiDeleteUserByUsername(request, superToken, student)
    await apiDeleteUserByUsername(request, superToken, teacher)
  }
})
