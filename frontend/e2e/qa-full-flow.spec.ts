import { test, expect } from '@playwright/test'
import { apiBase, apiLogin, uiLogin } from './utils'

test.describe('问答完整流程', () => {
  test('发布问题 → 在广场显示 → 点击进入详情 → 提交回答 → 采纳答案', async ({ page, request }) => {
    test.setTimeout(180_000)

    const suffix = String(Date.now())
    const questionTitle = `E2E完整测试_${suffix}`
    const questionContent = `这是E2E完整流程测试的问题内容_${suffix}`

    // 1. 用户 A (student_pku) 通过 API 发布问题
    const userAToken = await apiLogin(request, 'student_pku', '123456')
    const createQRes = await request.post(`${apiBase}/content/qa/questions`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: {
        subject: '物理',
        title: questionTitle,
        content: questionContent,
        tags: JSON.stringify(['学习方法']),
        reward_points: 10,
      },
    })
    expect(createQRes.ok()).toBeTruthy()
    const question = await createQRes.json()
    const questionId = question.id
    console.log('[E2E] 创建的问题 ID:', questionId)

    // 2. UI: 用户 A 登录后在广场验证问题显示
    await uiLogin(page, 'student_pku', '123456')
    await page.goto('/qa')
    await page.waitForTimeout(2000)
    await expect(page.getByText(questionTitle).first()).toBeVisible({ timeout: 10_000 })
    console.log('[E2E] 问题在广场显示成功')

    // 3. UI: 点击问题进入详情页
    await page.getByText(questionTitle).first().click()
    await expect(page.getByRole('heading', { name: questionTitle })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(questionContent)).toBeVisible()
    console.log('[E2E] 问题详情页加载成功')

    // 4. 用户 B (teacher_pku) 通过 API 提交回答
    const userBToken = await apiLogin(request, 'teacher_pku', '123456')
    const answerContent = `这是用户 B 的回答_${suffix}`
    const createARes = await request.post(`${apiBase}/content/qa/questions/${questionId}/answers`, {
      headers: { Authorization: `Bearer ${userBToken}` },
      data: { content: answerContent },
    })
    expect(createARes.ok()).toBeTruthy()
    const answer = await createARes.json()
    const answerId = answer.id
    console.log('[E2E] 回答提交成功:', answerId)

    // 5. UI: 刷新页面验证回答显示
    await page.reload()
    await page.waitForTimeout(1000)
    await expect(page.getByText(answerContent)).toBeVisible({ timeout: 10_000 })
    console.log('[E2E] 回答在页面显示成功')

    // 6. 用户 A 通过 API 采纳回答
    const acceptRes = await request.post(`${apiBase}/content/qa/questions/${questionId}/accept?answer_id=${answerId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: {},
    })
    expect(acceptRes.ok()).toBeTruthy()
    console.log('[E2E] 采纳回答成功')

    // 7. 验证通知
    await page.waitForTimeout(1000)
    const notifARes = await request.get(`${apiBase}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    })
    const notifA = await notifARes.json()
    const foundA = notifA.find(
      (n: any) => n.type === 'question_answered' && n.payload?.question_id === questionId
    )
    expect(foundA).toBeTruthy()
    console.log('[E2E] 用户 A 收到回答通知')

    const notifBRes = await request.get(`${apiBase}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    })
    const notifB = await notifBRes.json()
    const foundB = notifB.find(
      (n: any) => n.type === 'answer_accepted' && n.payload?.question_id === questionId
    )
    expect(foundB).toBeTruthy()
    console.log('[E2E] 用户 B 收到采纳通知')

    console.log('[E2E] ✅ 问答完整流程测试通过')
  })
})
