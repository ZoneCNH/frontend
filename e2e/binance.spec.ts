import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('loads dashboard as home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Binance Dashboard')
  })

  test('module switcher shows active modules', async ({ page }) => {
    await page.goto('/')
    const switcher = page.locator('nav[aria-label="Module switcher"]')
    await expect(switcher).toBeVisible()
  })

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()
    const links = sidebar.locator('a')
    expect(await links.count()).toBeGreaterThanOrEqual(5)
    await links.nth(2).click()
    await expect(page.locator('h1')).toContainText('System Health')
  })
})

test.describe('Dashboard', () => {
  test('shows KPI cards', async ({ page }) => {
    await page.goto('/binance')
    await expect(page.locator('text=Events (total)')).toBeVisible()
    await expect(page.locator('text=Streams Active')).toBeVisible()
  })

  test('shows SLO status', async ({ page }) => {
    await page.goto('/binance')
    await expect(page.locator('text=SLO Status').first()).toBeVisible()
  })

  test('product line filter has All button', async ({ page }) => {
    await page.goto('/binance')
    await expect(page.locator('text=All').first()).toBeVisible()
  })
})

test.describe('Market Data Explorer', () => {
  test('shows ⌘K search', async ({ page }) => {
    await page.goto('/binance/market')
    await expect(page.locator('text=⌘K')).toBeVisible()
  })

  test('shows 6 event type tabs', async ({ page }) => {
    await page.goto('/binance/market')
    for (const tab of ['Bars', 'Ticks', 'Depth', 'Trades', 'Funding', 'Mark Price']) {
      await expect(page.getByRole('button', { name: tab })).toBeVisible()
    }
  })

  test('empty state when no symbol selected', async ({ page }) => {
    await page.goto('/binance/market')
    await expect(page.locator('text=Select a symbol')).toBeVisible()
  })
})

test.describe('Health Page', () => {
  test('shows process cards', async ({ page }) => {
    await page.goto('/binance/health')
    await expect(page.locator('text=binance-server')).toBeVisible()
    await expect(page.locator('text=binance-client')).toBeVisible()
  })

  test('shows stream and infra sections', async ({ page }) => {
    await page.goto('/binance/health')
    await expect(page.locator('text=Stream Status')).toBeVisible()
    await expect(page.locator('text=Infrastructure')).toBeVisible()
  })
})

test.describe('Alerts Page', () => {
  test('shows alert rules', async ({ page }) => {
    await page.goto('/binance/alerts')
    await expect(page.locator('text=Alert Rules')).toBeVisible()
  })

  test('has filter buttons', async ({ page }) => {
    await page.goto('/binance/alerts')
    await expect(page.getByRole('button', { name: 'active' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'resolved' })).toBeVisible()
  })
})

test.describe('Admin Page', () => {
  test('shows Deadletter and Configuration tabs', async ({ page }) => {
    await page.goto('/binance/admin')
    await expect(page.getByRole('button', { name: 'Deadletter' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Configuration' })).toBeVisible()
  })

  test('empty deadletter queue message', async ({ page }) => {
    await page.goto('/binance/admin')
    await expect(page.locator('text=Deadletter Queue Empty')).toBeVisible()
  })

  test('config tab shows Client/Server/Security sections', async ({ page }) => {
    await page.goto('/binance/admin')
    await page.getByRole('button', { name: 'Configuration' }).click()
    await expect(page.locator('text=Client').first()).toBeVisible()
    await expect(page.locator('text=Server').first()).toBeVisible()
    await expect(page.locator('text=Security').first()).toBeVisible()
  })
})
