import { test, expect } from '@playwright/test'
import { uiLogin } from './utils'

test('公共社区：发帖后可见且可进入楼层评论', async ({ page }) => {
  test.setTimeout(120_000)
  const content = `E2E公共社区帖子_${Date.now()}`
  const comment = `E2E评论_${Date.now()}`

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/community')
  await expect(page.getByPlaceholder('分享你的学习心得、经验或想法...')).toBeVisible()
  await page.getByPlaceholder('分享你的学习心得、经验或想法...').fill(content)
  await page.getByRole('button', { name: '发布' }).click()
  await expect(page.getByText(content).first()).toBeVisible({ timeout: 20000 })

  const card = page.locator('[data-slot="card"]').filter({ hasText: content }).first()
  await card.locator('a[href^=\"/community/posts/\"]').first().click()
  await expect(page.getByText('楼层评论')).toBeVisible()

  await page.getByPlaceholder('写下你的评论...').fill(comment)
  await page.getByRole('button', { name: /发送/ }).click()
  await expect(page.getByText(comment).first()).toBeVisible({ timeout: 20000 })
})

test('校内共学社区：发帖后可见且可进入楼层评论', async ({ page }) => {
  test.setTimeout(120_000)
  const content = `E2E校内帖子_${Date.now()}`
  const comment = `E2E校内评论_${Date.now()}`

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/campus/community')
  await expect(page.getByPlaceholder('分享校内学习方法、资源或想法...')).toBeVisible()
  await page.getByPlaceholder('分享校内学习方法、资源或想法...').fill(content)
  await page.getByRole('button', { name: '发布' }).click()
  await expect(page.getByText(content).first()).toBeVisible({ timeout: 20000 })

  const card = page.locator('[data-slot="card"]').filter({ hasText: content }).first()
  await card.locator('a[href^=\"/campus/community/posts/\"]').first().click()
  await expect(page.getByText('楼层评论')).toBeVisible()

  await page.getByPlaceholder('写下你的评论...').fill(comment)
  await page.getByRole('button', { name: /发送/ }).click()
  await expect(page.getByText(comment).first()).toBeVisible({ timeout: 20000 })
})
