import { test, expect } from '@playwright/test'
import { apiBase, apiLogin, uiLogin } from './utils'

test('校内社区发帖可见且高校帖子治理可隐藏/删除', async ({ page, request }) => {
  test.setTimeout(120_000)
  const content = `E2E校内帖子_${Date.now()}`
  const uniAdminToken = await apiLogin(request, 'pku_admin', '123456')

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/campus/community')
  await expect(page.getByPlaceholder('分享校内学习方法、资源或想法...')).toBeVisible()
  await page.getByPlaceholder('分享校内学习方法、资源或想法...').fill(content)
  await page.getByRole('button', { name: '发布' }).click()
  await expect(page.getByText(content).first()).toBeVisible({ timeout: 20000 })

  await uiLogin(page, 'pku_admin', '123456')
  await page.goto('/university/dashboard?tab=posts')
  const postRow = page.locator('div.rounded-lg.border.border-border.p-4').filter({ hasText: content }).first()
  await expect(postRow).toBeVisible()
  await postRow.getByRole('button', { name: '隐藏' }).click()

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/campus/community')
  await expect(page.getByText(content)).toHaveCount(0)

  const res = await request.get(`${apiBase}/content/campus/PKU/posts/admin?limit=200&include_hidden=true`, {
    headers: { Authorization: `Bearer ${uniAdminToken}` },
  })
  expect(res.ok()).toBeTruthy()
  const list = await res.json()
  const found = Array.isArray(list) ? list.find((p: any) => String(p.content || '') === content) : null
  if (found?.id) {
    const del = await request.delete(`${apiBase}/content/campus/PKU/posts/${encodeURIComponent(String(found.id))}`, {
      headers: { Authorization: `Bearer ${uniAdminToken}` },
    })
    expect(del.ok()).toBeTruthy()
  }
})
