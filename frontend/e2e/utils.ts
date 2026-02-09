import { expect } from '@playwright/test'

export const apiBase = process.env.E2E_API_BASE || 'http://127.0.0.1:8000/api/v1'

export async function apiLogin(request: any, username: string, password: string) {
  const res = await request.post(`${apiBase}/auth/login/access-token`, { form: { username, password } })
  expect(res.ok()).toBeTruthy()
  const data = await res.json()
  return data.access_token as string
}

export async function apiSignupUser(request: any, username: string, fullName: string) {
  const res = await request.post(`${apiBase}/auth/signup`, {
    data: {
      username,
      email: `${username}@ex.com`,
      password: '123456',
      full_name: fullName,
      account_type: 'user',
      role: 'general_student',
      profile: JSON.stringify({ verification: { student: 'none', teacher: 'none', aid: 'none', generalBasic: 'none' } }),
    },
  })
  expect(res.ok()).toBeTruthy()
}

export async function apiSignupOrgApplicant(request: any, username: string) {
  const res = await request.post(`${apiBase}/auth/signup`, {
    data: {
      username,
      email: `${username}@ex.com`,
      password: '123456',
      full_name: '申请联系人',
      account_type: 'org_admin_applicant',
      org_type: 'university_association',
      school_name: '测试大学',
      association_name: '测试大学志愿者协会',
      org_name: '测试大学志愿者协会',
      contact_phone: '13800000000',
    },
  })
  expect(res.ok()).toBeTruthy()
}

export async function apiDeleteUserByUsername(request: any, superToken: string, username: string) {
  try {
    const res = await request.get(`${apiBase}/admin/users`, { headers: { Authorization: `Bearer ${superToken}` } })
    if (!res.ok()) return
    const list = await res.json()
    if (!Array.isArray(list)) return
    const u = list.find((x: any) => x && x.username === username)
    if (!u?.id) return
    await request.delete(`${apiBase}/admin/users/${u.id}?hard=true`, { headers: { Authorization: `Bearer ${superToken}` } })
  } catch {
    return
  }
}

export async function apiGetUserIdByUsername(request: any, superToken: string, username: string) {
  const res = await request.get(`${apiBase}/admin/users`, { headers: { Authorization: `Bearer ${superToken}` } })
  expect(res.ok()).toBeTruthy()
  const list = await res.json()
  expect(Array.isArray(list)).toBeTruthy()
  const u = (list as any[]).find((x) => x && x.username === username)
  expect(u?.id).toBeTruthy()
  return String(u.id)
}

export async function apiCreateUniversityOrg(request: any, superToken: string, displayName: string, schoolId: string) {
  const res = await request.post(`${apiBase}/core/orgs`, {
    headers: { Authorization: `Bearer ${superToken}` },
    data: { type: 'university', display_name: displayName, school_id: schoolId, certified: true },
  })
  expect(res.ok()).toBeTruthy()
  return await res.json()
}

export async function apiPurgeOrphanUniversities(request: any, superToken: string, dryRun: boolean) {
  const res = await request.post(`${apiBase}/admin/universities/purge-orphans?dry_run=${dryRun ? 'true' : 'false'}`, {
    headers: { Authorization: `Bearer ${superToken}` },
    data: {},
  })
  expect(res.ok()).toBeTruthy()
  return await res.json()
}

export async function apiCreateUniversityAdminForOrg(
  request: any,
  superToken: string,
  orgId: string,
  username: string,
) {
  const res = await request.post(`${apiBase}/admin/org-admins`, {
    headers: { Authorization: `Bearer ${superToken}` },
    data: {
      username,
      password: '123456',
      email: `${username}@ex.com`,
      full_name: username,
      role_code: 'university_admin',
      organization_id: orgId,
    },
  })
  expect(res.ok()).toBeTruthy()
  return await res.json()
}

export async function apiCreateAnnouncement(
  request: any,
  token: string,
  payload: {
    title: string
    content: string
    scope: 'public' | 'campus' | 'aid'
    audience: string
    school_id?: string
    organization_id?: string
    pinned?: boolean
    version?: string
  },
) {
  const res = await request.post(`${apiBase}/core/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
    data: payload,
  })
  expect(res.ok()).toBeTruthy()
  return await res.json()
}

export async function uiLogin(page: any, username: string, password: string) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.getByPlaceholder('请输入用户名').fill(username)
  await page.getByPlaceholder('请输入密码').fill(password)
  await page.locator('button[type="submit"]').click()
  await page.waitForFunction(() => Boolean(localStorage.getItem('token')))
  await page.waitForURL((url: any) => {
    try {
      const pathname = typeof url?.pathname === 'string' ? url.pathname : ''
      return pathname && !pathname.startsWith('/login')
    } catch {
      return false
    }
  })
}
