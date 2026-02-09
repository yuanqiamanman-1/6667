import { test, expect } from '@playwright/test'
import { apiBase, apiCreateAnnouncement, apiLogin, uiLogin } from './utils'

test('公告/公示栏：后端发布后在社区与校内页可见', async ({ page, request }) => {
  test.setTimeout(120_000)

  const hqToken = await apiLogin(request, 'associationHq1', '123456')
  const suffix = String(Date.now())

  const publicTitle = `E2E全站公告_${suffix}`
  const publicContent = `E2E全站公告内容_${suffix}`
  await apiCreateAnnouncement(request, hqToken, {
    title: publicTitle,
    content: publicContent,
    scope: 'public',
    audience: 'public_all',
    pinned: true,
    version: '1.0',
  })

  const campusTitle = `E2E校内公告_${suffix}`
  const campusContent = `E2E校内公告内容_${suffix}`
  await apiCreateAnnouncement(request, hqToken, {
    title: campusTitle,
    content: campusContent,
    scope: 'campus',
    audience: 'campus_all',
    school_id: 'PKU',
    pinned: true,
    version: '1.0',
  })

  await uiLogin(page, 'student_pku', '123456')

  await page.goto('/community')
  await expect(page.getByText('公示栏')).toBeVisible()
  await expect(page.getByText(publicTitle).first()).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: publicTitle }).click()
  await expect(page.getByText(publicContent)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: '关闭' }).click()

  await page.goto('/campus/community')
  await expect(page.getByText('本校公告')).toBeVisible()
  await expect(page.getByText(campusTitle).first()).toBeVisible({ timeout: 20_000 })
})

test('校内话题：后端创建后在校内社区可见', async ({ page, request }) => {
  test.setTimeout(120_000)

  const adminToken = await apiLogin(request, 'pku_admin', '123456')
  const name = `E2E话题_${Date.now()}`
  const res = await request.post(`${apiBase}/content/campus/PKU/topics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { name, enabled: true },
  })
  expect(res.ok()).toBeTruthy()

  await uiLogin(page, 'student_pku', '123456')
  await page.goto('/campus/community')
  await expect(page.getByRole('button', { name: `#${name}` })).toBeVisible({ timeout: 20_000 })
})
