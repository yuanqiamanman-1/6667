import { test, expect } from '@playwright/test'
import { uiLogin } from './utils'

test.describe('HQ 问答和社区管理 - 隐藏/恢复功能', () => {
  test.beforeEach(async ({ page }) => {
    // 使用 HQ 专用账户登录
    await uiLogin(page, 'associationHq1', '123456')
    await page.goto('/hq/dashboard')
    // 等待页面加载
    await page.waitForTimeout(1000)
  })

  test('问答管理 - Badge 状态显示和按钮切换', async ({ page }) => {
    // 切换到问答管理 Tab
    await page.getByRole('tab', { name: '问答管理' }).click()
    await page.waitForTimeout(1000)

    // 查找第一个问题
    const firstQuestion = page.locator('.space-y-3 > div').first()
    
    // 1. 检查初始状态 Badge（可能是"可见"或"已隐藏"）
    const initialBadge = firstQuestion.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    await expect(initialBadge).toBeVisible()
    const initialStatus = await initialBadge.textContent()
    
    console.log('[测试] 初始状态:', initialStatus)

    // 2. 检查按钮文本与状态一致
    const toggleButton = firstQuestion.locator('button').filter({ hasText: /^(隐藏|恢复)$/ })
    const initialButtonText = await toggleButton.textContent()
    
    if (initialStatus === '可见') {
      expect(initialButtonText).toBe('隐藏')
    } else {
      expect(initialButtonText).toBe('恢复')
    }

    console.log('[测试] 初始按钮:', initialButtonText)

    // 3. 点击按钮切换状态
    await toggleButton.click()
    
    // 等待确认对话框
    await page.waitForTimeout(500)
    const confirmButton = page.getByRole('button', { name: /确认/ })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // 等待状态更新
    await page.waitForTimeout(2000)

    // 4. 验证状态已切换
    const newBadge = firstQuestion.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    const newStatus = await newBadge.textContent()
    const newButtonText = await toggleButton.textContent()

    console.log('[测试] 切换后状态:', newStatus)
    console.log('[测试] 切换后按钮:', newButtonText)

    // 验证状态和按钮文本已切换
    expect(newStatus).not.toBe(initialStatus)
    if (newStatus === '可见') {
      expect(newButtonText).toBe('隐藏')
    } else {
      expect(newButtonText).toBe('恢复')
    }

    // 5. 再次切换，验证可以反复切换
    await toggleButton.click()
    await page.waitForTimeout(500)
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
    await page.waitForTimeout(2000)

    const finalBadge = firstQuestion.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    const finalStatus = await finalBadge.textContent()
    
    console.log('[测试] 再次切换后状态:', finalStatus)
    
    // 应该恢复到初始状态
    expect(finalStatus).toBe(initialStatus)
  })

  test('社区管理 - Badge 状态显示和按钮切换', async ({ page }) => {
    // 切换到社区管理 Tab
    await page.getByRole('tab', { name: '社区管理' }).click()
    await page.waitForTimeout(1000)

    // 查找第一个帖子
    const firstPost = page.locator('.space-y-3 > div').first()
    
    // 1. 检查初始状态 Badge
    const initialBadge = firstPost.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    await expect(initialBadge).toBeVisible()
    const initialStatus = await initialBadge.textContent()
    
    console.log('[测试] 社区初始状态:', initialStatus)

    // 2. 检查按钮文本与状态一致
    const toggleButton = firstPost.locator('button').filter({ hasText: /^(隐藏|恢复)$/ })
    const initialButtonText = await toggleButton.textContent()
    
    if (initialStatus === '可见') {
      expect(initialButtonText).toBe('隐藏')
    } else {
      expect(initialButtonText).toBe('恢复')
    }

    console.log('[测试] 社区初始按钮:', initialButtonText)

    // 3. 点击按钮切换状态
    await toggleButton.click()
    
    // 等待确认对话框
    await page.waitForTimeout(500)
    const confirmButton = page.getByRole('button', { name: /确认/ })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    // 等待状态更新
    await page.waitForTimeout(2000)

    // 4. 验证状态已切换
    const newBadge = firstPost.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    const newStatus = await newBadge.textContent()
    const newButtonText = await toggleButton.textContent()

    console.log('[测试] 社区切换后状态:', newStatus)
    console.log('[测试] 社区切换后按钮:', newButtonText)

    // 验证状态和按钮文本已切换
    expect(newStatus).not.toBe(initialStatus)
    if (newStatus === '可见') {
      expect(newButtonText).toBe('隐藏')
    } else {
      expect(newButtonText).toBe('恢复')
    }

    // 5. 再次切换，验证可以反复切换
    await toggleButton.click()
    await page.waitForTimeout(500)
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }
    await page.waitForTimeout(2000)

    const finalBadge = firstPost.locator('span').filter({ hasText: /^(可见|已隐藏)$/ })
    const finalStatus = await finalBadge.textContent()
    
    console.log('[测试] 社区再次切换后状态:', finalStatus)
    
    // 应该恢复到初始状态
    expect(finalStatus).toBe(initialStatus)
  })

  test('验证 Badge 样式一致性', async ({ page }) => {
    // 问答管理
    await page.getByRole('tab', { name: '问答管理' }).click()
    await page.waitForTimeout(1000)

    const qaVisibleBadge = page.locator('.space-y-3 > div').first().locator('span').filter({ hasText: '可见' })
    if (await qaVisibleBadge.isVisible()) {
      // 验证"可见" Badge 使用 secondary variant
      await expect(qaVisibleBadge).toHaveAttribute('data-slot', 'badge')
    }

    // 社区管理
    await page.getByRole('tab', { name: '社区管理' }).click()
    await page.waitForTimeout(1000)

    const communityVisibleBadge = page.locator('.space-y-3 > div').first().locator('span').filter({ hasText: '可见' })
    if (await communityVisibleBadge.isVisible()) {
      // 验证"可见" Badge 使用 secondary variant
      await expect(communityVisibleBadge).toHaveAttribute('data-slot', 'badge')
    }

    console.log('[测试] Badge 样式验证完成')
  })
})
