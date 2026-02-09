import { test, expect } from '@playwright/test'
import { apiCreateUniversityOrg, apiLogin, apiPurgeOrphanUniversities, apiBase } from './utils'

test('无高校管理员的高校板块可被清理并从目录移除', async ({ request }) => {
  test.setTimeout(120_000)
  const superToken = await apiLogin(request, 'superadmin', '123456')

  const schoolId = `e2e_orphan_${Date.now()}`
  await apiCreateUniversityOrg(request, superToken, `E2E孤儿高校_${Date.now()}`, schoolId)

  const preview = await apiPurgeOrphanUniversities(request, superToken, true)
  expect(Array.isArray(preview.school_ids)).toBeTruthy()
  expect(preview.school_ids).toContain(schoolId)

  const run = await apiPurgeOrphanUniversities(request, superToken, false)
  expect(run.school_ids).toContain(schoolId)

  const orgs = await request.get(`${apiBase}/core/orgs?type=university&certified=true&require_admin=true`)
  expect(orgs.ok()).toBeTruthy()
  const list = await orgs.json()
  expect(Array.isArray(list)).toBeTruthy()
  expect((list as any[]).some((o) => String(o.school_id) === schoolId)).toBeFalsy()
})

