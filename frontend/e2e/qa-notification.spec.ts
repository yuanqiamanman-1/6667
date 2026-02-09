import { test, expect } from '@playwright/test'
import { apiBase, apiLogin, uiLogin } from './utils'

test.describe('问答互动通知', () => {
  test('回答问题后提问者收到通知，采纳后回答者收到通知', async ({ page, request }) => {
    test.setTimeout(180_000)

    // 1. 用户 A (student_pku) 发布问题
    const userAToken = await apiLogin(request, 'student_pku', '123456')
    const suffix = String(Date.now())
    const questionTitle = `E2E测试问题_${suffix}`

    // 发布问题
    const createQRes = await request.post(`${apiBase}/content/qa/questions`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: {
        subject: '数学',
        title: questionTitle,
        content: '这是一道测试问题的内容，请帮忙解答。',
        tags: JSON.stringify(['学习方法']),
        reward_points: 10,
      },
    })
    expect(createQRes.ok()).toBeTruthy()
    const question = await createQRes.json()
    const questionId = question.id
    console.log('[E2E] 创建问题成功:', questionId)

    // 2. 用户 B (teacher_pku) 回答问题
    const userBToken = await apiLogin(request, 'teacher_pku', '123456')
    const answerContent = `E2E测试回答_${suffix}`

    const createARes = await request.post(`${apiBase}/content/qa/questions/${questionId}/answers`, {
      headers: { Authorization: `Bearer ${userBToken}` },
      data: { content: answerContent },
    })
    expect(createARes.ok()).toBeTruthy()
    const answer = await createARes.json()
    const answerId = answer.id
    console.log('[E2E] 创建回答成功:', answerId)

    // 3. 验证用户 A 收到 question_answered 通知
    await page.waitForTimeout(1000)
    const notifARes = await request.get(`${apiBase}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    })
    expect(notifARes.ok()).toBeTruthy()
    const notifA = await notifARes.json()
    const foundA = notifA.find(
      (n: any) => n.type === 'question_answered' && n.payload?.question_id === questionId
    )
    expect(foundA).toBeTruthy()
    console.log('[E2E] 用户 A 收到 question_answered 通知:', foundA?.id)

    // 4. 用户 A 采纳用户 B 的回答
    const acceptRes = await request.post(`${apiBase}/content/qa/questions/${questionId}/accept?answer_id=${answerId}`, {
      headers: { Authorization: `Bearer ${userAToken}` },
      data: {},
    })
    expect(acceptRes.ok()).toBeTruthy()
    console.log('[E2E] 采纳回答成功')

    // 5. 验证用户 B 收到 answer_accepted 通知
    await page.waitForTimeout(1000)
    const notifBRes = await request.get(`${apiBase}/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    })
    expect(notifBRes.ok()).toBeTruthy()
    const notifB = await notifBRes.json()
    const foundB = notifB.find(
      (n: any) => n.type === 'answer_accepted' && n.payload?.question_id === questionId
    )
    expect(foundB).toBeTruthy()
    console.log('[E2E] 用户 B 收到 answer_accepted 通知:', foundB?.id)

    // 6. UI 验证：用户 A 登录后在消息页面看到通知
    await uiLogin(page, 'student_pku', '123456')
    await page.goto('/messages')
    await page.getByRole('tab', { name: /通知/ }).click()
    await expect(page.getByText('问题有新回答').first()).toBeVisible({ timeout: 15_000 })
    console.log('[E2E] UI 验证用户 A 看到通知成功')
  })
})
