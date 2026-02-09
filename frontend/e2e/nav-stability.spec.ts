import { test, expect } from '@playwright/test'
import { uiLogin } from './utils'

test('公共社区：多次切换页面后帖子仍可见', async ({ page }) => {
  test.setTimeout(120_000)
  const content = `E2E稳定性帖子_${Date.now()}`

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/community')
  await page.getByPlaceholder('分享你的学习心得、经验或想法...').fill(content)
  await page.getByRole('button', { name: '发布' }).click()
  await expect(page.getByText(content).first()).toBeVisible({ timeout: 20_000 })

  await page.getByRole('button', { name: '问答' }).click()
  await expect(page).toHaveURL(/\/qa/)

  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '社区' }).click()
    await expect(page).toHaveURL(/\/community/)
    await expect(page.getByText(content).first()).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: '问答' }).click()
    await expect(page).toHaveURL(/\/qa/)
  }
})

test('校内共学社区：多次进入后帖子不消失', async ({ page }) => {
  test.setTimeout(120_000)
  const content = `E2E校内稳定性_${Date.now()}`

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/campus/community')
  await page.getByPlaceholder('分享校内学习方法、资源或想法...').fill(content)
  await page.getByRole('button', { name: '发布' }).click()
  await expect(page.getByText(content).first()).toBeVisible({ timeout: 20_000 })

  for (let i = 0; i < 3; i++) {
    await page.goto('/campus')
    await page.getByRole('button', { name: '进入校级共学社区' }).first().click()
    await expect(page).toHaveURL(/\/campus\/community/)
    await expect(page.getByText(content).first()).toBeVisible({ timeout: 20_000 })
  }
})

