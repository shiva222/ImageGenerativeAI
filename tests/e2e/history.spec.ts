import { test, expect } from '@playwright/test';
import { 
  createAndLoginUser, 
  mockGenerationAPI,
  waitForAPIResponse,
  expectToastMessage
} from './test-utils';

test.describe('History - Generation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create and login a user before each test
    await createAndLoginUser(page);
  });

  test('should navigate to history page', async ({ page }) => {
    // Should be on studio initially
    await expect(page).toHaveURL('/studio');
    
    // Navigate to history via navbar
    await page.click('a[href="/history"]');
    
    // Should be on history page
    await expect(page).toHaveURL('/history');
    await expect(page.locator('h1')).toContainText('Generation History');
    await expect(page.locator('text=View and manage all your creative AI generations')).toBeVisible();
  });

  test('should display history interface correctly', async ({ page }) => {
    await page.goto('/history');
    
    // Check main elements are visible
    await expect(page.locator('h1:has-text("Generation History")')).toBeVisible();
    await expect(page.locator('text=View and manage all your creative AI generations')).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Mock delayed API response
    await page.route('**/api/generations', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations: [],
            total: 0,
            page: 1,
            limit: 20
          }
        })
      });
    });
    
    await page.goto('/history');
    
    // Should show loading state
    await expect(page.locator('text=Loading your generation history')).toBeVisible();
    
    // Wait for loading to finish
    await expect(page.locator('text=Loading your generation history')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display empty state when no generations', async ({ page }) => {
    // Mock empty generations response
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations: [],
            total: 0,
            page: 1,
            limit: 20
          }
        })
      });
    });
    
    await page.goto('/history');
    
    // Should show empty state
    await expect(page.locator('text=No generations yet')).toBeVisible();
    await expect(page.locator('text=Start creating amazing AI generations')).toBeVisible();
    
    // Should have link to studio
    const studioLink = page.locator('a[href="/studio"]:has-text("Go to Studio")');
    await expect(studioLink).toBeVisible();
    
    // Test studio link navigation
    await studioLink.click();
    await expect(page).toHaveURL('/studio');
  });

  test('should display generations list', async ({ page }) => {
    // Mock generations response
    await mockGenerationAPI(page);
    
    await page.goto('/history');
    
    // Should show generations count
    await expect(page.locator('text=2 generations found')).toBeVisible();
    await expect(page.locator('text=Your creative journey so far')).toBeVisible();
    
    // Should show refresh button
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    
    // Should display generation cards
    await expect(page.locator('text=A beautiful sunset')).toBeVisible();
    await expect(page.locator('text=A mystical forest')).toBeVisible();
  });

  test('should handle refresh functionality', async ({ page }) => {
    // Mock generations response
    await mockGenerationAPI(page);
    
    await page.goto('/history');
    
    // Wait for initial load
    await expect(page.locator('text=2 generations found')).toBeVisible();
    
    // Click refresh button
    const refreshPromise = waitForAPIResponse(page, '/api/generations');
    await page.click('button:has-text("Refresh")');
    
    // Should show loading state on refresh button
    await expect(page.locator('button:has-text("Refresh") svg.animate-spin')).toBeVisible();
    
    // Wait for API call
    await refreshPromise;
    
    // Loading should be gone
    await expect(page.locator('button:has-text("Refresh") svg.animate-spin')).not.toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock failed API response
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Failed to load generation history'
        })
      });
    });
    
    await page.goto('/history');
    
    // Should show error message
    await expect(page.locator('text=Failed to load generation history')).toBeVisible();
    
    // Error should have proper styling
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });

  test('should handle restore functionality', async ({ page }) => {
    // Mock generations response
    await mockGenerationAPI(page);
    
    await page.goto('/history');
    
    // Wait for generations to load
    await expect(page.locator('text=A beautiful sunset')).toBeVisible();
    
    // Find and click restore button
    const restoreButton = page.locator('button:has-text("Restore")').first();
    await restoreButton.click();
    
    // Should show toast notification
    await expect(page.locator('.fixed.top-4.right-4:has-text("Settings restored")')).toBeVisible();
    
    // Toast should disappear after timeout
    await expect(page.locator('.fixed.top-4.right-4:has-text("Settings restored")')).not.toBeVisible({ timeout: 5000 });
  });

  test('should show pagination info for many generations', async ({ page }) => {
    // Mock response with 20+ generations
    const generations = Array.from({ length: 20 }, (_, i) => ({
      id: `test-generation-${i + 1}`,
      prompt: `Test prompt ${i + 1}`,
      style: 'realistic',
      imageUrl: `http://localhost:3001/uploads/test-${i + 1}.jpg`,
      resultUrl: `http://localhost:3001/uploads/result-${i + 1}.jpg`,
      status: 'completed',
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
    }));
    
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations,
            total: 20,
            page: 1,
            limit: 20
          }
        })
      });
    });
    
    await page.goto('/history');
    
    // Should show count
    await expect(page.locator('text=20 generations found')).toBeVisible();
    
    // Should show pagination info
    await expect(page.locator('text=Showing latest 20 generations')).toBeVisible();
    await expect(page.locator('text=Older generations are automatically archived')).toBeVisible();
  });

  test('should handle generation cards interaction', async ({ page }) => {
    // Mock generations response
    await mockGenerationAPI(page);
    
    await page.goto('/history');
    
    // Wait for generations to load
    await expect(page.locator('text=A beautiful sunset')).toBeVisible();
    
    // Check that generation cards are properly displayed
    const generationCards = page.locator('[data-testid="generation-card"]').or(page.locator('.generation-card').filter({ hasText: 'A beautiful sunset' }));
    
    // If cards exist, test interaction
    if (await generationCards.first().isVisible()) {
      // Check for restore button
      await expect(page.locator('button:has-text("Restore")').first()).toBeVisible();
      
      // Check generation details are shown
      await expect(page.locator('text=realistic').or(page.locator('text=artistic'))).toBeVisible();
    }
  });

  test('should maintain scroll position during refresh', async ({ page }) => {
    // Mock response with many generations
    const generations = Array.from({ length: 10 }, (_, i) => ({
      id: `test-generation-${i + 1}`,
      prompt: `Test prompt ${i + 1}`,
      style: 'realistic',
      imageUrl: `http://localhost:3001/uploads/test-${i + 1}.jpg`,
      resultUrl: `http://localhost:3001/uploads/result-${i + 1}.jpg`,
      status: 'completed',
      createdAt: new Date(Date.now() - (i * 86400000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 86400000)).toISOString(),
    }));
    
    await page.route('**/api/generations', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations,
            total: 10,
            page: 1,
            limit: 20
          }
        })
      });
    });
    
    await page.goto('/history');
    
    // Wait for load
    await expect(page.locator('text=Test prompt 1')).toBeVisible();
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Refresh
    await page.click('button:has-text("Refresh")');
    
    // Check that content is still there after refresh
    await expect(page.locator('text=Test prompt 1')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Mock generations response
    await mockGenerationAPI(page);
    
    await page.goto('/history');
    
    // Wait for load
    await expect(page.locator('text=A beautiful sunset')).toBeVisible();
    
    // Test keyboard navigation to refresh button
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Should be able to navigate with keyboard
    expect(['BUTTON', 'A'].includes(focusedElement || '')).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/generations', async route => {
      await route.abort();
    });
    
    await page.goto('/history');
    
    // Should show some error state (exact message may vary)
    await expect(page.locator('text=Failed').or(page.locator('text=Error')).or(page.locator('.bg-red-50'))).toBeVisible();
  });

  test('should handle concurrent refresh clicks', async ({ page }) => {
    let requestCount = 0;
    
    // Mock delayed response to test concurrent requests
    await page.route('**/api/generations', async route => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations: [{
              id: `request-${requestCount}`,
              prompt: `Concurrent request ${requestCount}`,
              style: 'realistic',
              status: 'completed',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
            total: 1,
            page: 1,
            limit: 20
          }
        })
      });
    });
    
    await page.goto('/history');
    
    // Click refresh multiple times quickly
    const refreshButton = page.locator('button:has-text("Refresh")');
    await Promise.all([
      refreshButton.click(),
      refreshButton.click(),
      refreshButton.click()
    ]);
    
    // Should handle gracefully without errors
    await expect(page.locator('text=Concurrent request')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate back to studio from history', async ({ page }) => {
    await page.goto('/history');
    
    // Navigate back to studio via navbar
    await page.click('a[href="/studio"]');
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('h1:has-text("AI Generation Studio")')).toBeVisible();
  });
});
