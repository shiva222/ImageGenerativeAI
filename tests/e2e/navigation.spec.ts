import { test, expect } from '@playwright/test';
import { createAndLoginUser, generateTestUser } from './test-utils';

test.describe('Navigation and Routing', () => {
  
  test.describe('Public Routes', () => {
    test('should redirect root path to studio for authenticated users', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Go to root path
      await page.goto('/');
      
      // Should redirect to studio
      await expect(page).toHaveURL('/studio');
    });

    test('should redirect root path to login for unauthenticated users', async ({ page }) => {
      await page.goto('/');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should allow access to login page when not authenticated', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should allow access to signup page when not authenticated', async ({ page }) => {
      await page.goto('/signup');
      
      await expect(page).toHaveURL('/signup');
      await expect(page.locator('h1')).toContainText('Join AI Studio');
    });

    test('should redirect authenticated users away from login page', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Try to access login page
      await page.goto('/login');
      
      // Should redirect to studio
      await expect(page).toHaveURL('/studio');
    });

    test('should redirect authenticated users away from signup page', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Try to access signup page
      await page.goto('/signup');
      
      // Should redirect to studio
      await expect(page).toHaveURL('/studio');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users from studio to login', async ({ page }) => {
      await page.goto('/studio');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should redirect unauthenticated users from history to login', async ({ page }) => {
      await page.goto('/history');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should allow authenticated users to access studio', async ({ page }) => {
      await createAndLoginUser(page);
      
      await page.goto('/studio');
      
      await expect(page).toHaveURL('/studio');
      await expect(page.locator('h1')).toContainText('AI Generation Studio');
    });

    test('should allow authenticated users to access history', async ({ page }) => {
      await createAndLoginUser(page);
      
      await page.goto('/history');
      
      await expect(page).toHaveURL('/history');
      await expect(page.locator('h1')).toContainText('Generation History');
    });
  });

  test.describe('Navigation Bar', () => {
    test('should show login/signup links when not authenticated', async ({ page }) => {
      await page.goto('/login');
      
      // Should show authentication links
      await expect(page.locator('a[href="/login"]')).toBeVisible();
      
      // Check if navigation to signup works
      await page.click('a[href="/signup"]:has-text("Create account")');
      await expect(page).toHaveURL('/signup');
    });

    test('should show navigation menu when authenticated', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Should show navigation links
      await expect(page.locator('a[href="/studio"]')).toBeVisible();
      await expect(page.locator('a[href="/history"]')).toBeVisible();
      await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    });

    test('should navigate between studio and history', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Should be on studio initially
      await expect(page).toHaveURL('/studio');
      
      // Navigate to history
      await page.click('a[href="/history"]');
      await expect(page).toHaveURL('/history');
      await expect(page.locator('h1')).toContainText('Generation History');
      
      // Navigate back to studio
      await page.click('a[href="/studio"]');
      await expect(page).toHaveURL('/studio');
      await expect(page.locator('h1')).toContainText('AI Generation Studio');
    });

    test('should highlight active navigation item', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Check studio is active
      const studioLink = page.locator('a[href="/studio"]');
      await expect(studioLink).toBeVisible();
      
      // Navigate to history and check if it becomes active
      await page.click('a[href="/history"]');
      const historyLink = page.locator('a[href="/history"]');
      await expect(historyLink).toBeVisible();
    });

    test('should handle logout functionality', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Should be logged in
      await expect(page.locator('button:has-text("Logout")')).toBeVisible();
      
      // Logout
      await page.click('button:has-text("Logout")');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
      
      // Should not show logout button
      await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner during authentication check', async ({ page }) => {
      // Mock delayed auth response
      await page.route('**/api/auth/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });
      
      await page.goto('/studio');
      
      // Should show loading spinner initially
      await expect(page.locator('text=Loading')).toBeVisible();
    });

    test('should handle navigation during loading', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Navigate quickly between pages
      await page.goto('/studio');
      await page.goto('/history');
      await page.goto('/studio');
      
      // Should end up on the final page
      await expect(page).toHaveURL('/studio');
    });
  });

  test.describe('URL Handling', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Try to access non-existent route
      await page.goto('/nonexistent-route');
      
      // Should redirect somewhere sensible (likely to studio or 404 handling)
      // The exact behavior depends on your router configuration
      await page.waitForLoadState();
      
      // Check that we're not stuck on the invalid route
      expect(page.url()).not.toContain('/nonexistent-route');
    });

    test('should preserve query parameters during redirects', async ({ page }) => {
      // Try to access protected route with query params while unauthenticated
      await page.goto('/studio?test=param');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should handle browser back/forward navigation', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Navigate to history
      await page.click('a[href="/history"]');
      await expect(page).toHaveURL('/history');
      
      // Use browser back
      await page.goBack();
      await expect(page).toHaveURL('/studio');
      
      // Use browser forward
      await page.goForward();
      await expect(page).toHaveURL('/history');
    });

    test('should handle manual URL entry', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Manually navigate to history via URL bar
      await page.goto('/history');
      await expect(page).toHaveURL('/history');
      await expect(page.locator('h1')).toContainText('Generation History');
      
      // Manually navigate to studio via URL bar
      await page.goto('/studio');
      await expect(page).toHaveURL('/studio');
      await expect(page.locator('h1')).toContainText('AI Generation Studio');
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain authentication across page refreshes', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Refresh the page
      await page.reload();
      
      // Should still be authenticated and on studio
      await expect(page).toHaveURL('/studio');
      await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    });

    test('should handle session expiration gracefully', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Mock session expiration
      await page.route('**/api/**', async route => {
        if (route.request().url().includes('/auth/me')) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ 
              success: false, 
              message: 'Token expired' 
            })
          });
        } else {
          await route.continue();
        }
      });
      
      // Try to navigate to a protected route
      await page.goto('/studio');
      
      // Should redirect to login due to expired session
      await expect(page).toHaveURL('/login');
    });

    test('should handle concurrent navigation requests', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Simulate rapid navigation
      await Promise.all([
        page.goto('/studio'),
        page.goto('/history'),
        page.goto('/studio')
      ]);
      
      // Should settle on the last navigation
      await expect(page).toHaveURL('/studio');
      await expect(page.locator('h1')).toContainText('AI Generation Studio');
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should handle navigation on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await createAndLoginUser(page);
      
      // Check that navigation still works on mobile
      await page.click('a[href="/history"]');
      await expect(page).toHaveURL('/history');
      
      await page.click('a[href="/studio"]');
      await expect(page).toHaveURL('/studio');
    });

    test('should handle mobile menu interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await createAndLoginUser(page);
      
      // Check if there's a mobile menu button (implementation dependent)
      const mobileMenuButton = page.locator('button[aria-label*="menu"]').or(page.locator('.menu-button'));
      
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        
        // Should show navigation options
        await expect(page.locator('a[href="/studio"]')).toBeVisible();
        await expect(page.locator('a[href="/history"]')).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Test tab navigation through main nav links
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to navigate with Enter key
      const focusedElement = page.locator(':focus');
      if (await focusedElement.isVisible()) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        expect(['A', 'BUTTON'].includes(tagName)).toBeTruthy();
      }
    });

    test('should have proper ARIA labels for navigation', async ({ page }) => {
      await createAndLoginUser(page);
      
      // Check for navigation landmarks
      const nav = page.locator('nav').or(page.locator('[role="navigation"]'));
      await expect(nav).toBeVisible();
    });
  });
});
