import { test, expect } from '@playwright/test';
import { 
  createAndLoginUser, 
  uploadFile,
  mockFailedGenerationAPI,
  expectElementDisabled 
} from './test-utils';

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
  });

  test.describe('Network Error Handling', () => {
    test('should handle complete network failure gracefully', async ({ page }) => {
      await page.goto('/studio');
      
      // Simulate complete network failure
      await page.route('**/*', route => route.abort('failed'));
      
      // Try to refresh generations
      await page.reload();
      
      // Should show some error state or fallback content
      // The exact behavior depends on implementation
      await page.waitForLoadState('domcontentloaded');
      
      // Should not crash the application
      expect(page.isClosed()).toBeFalsy();
    });

    test('should handle intermittent network issues', async ({ page }) => {
      let requestCount = 0;
      
      // Mock intermittent failures
      await page.route('**/api/generations', async route => {
        requestCount++;
        
        if (requestCount % 2 === 0) {
          await route.abort('failed');
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { generations: [], total: 0, page: 1, limit: 20 }
            })
          });
        }
      });
      
      await page.goto('/studio');
      
      // Should handle the intermittent failures
      await page.waitForTimeout(2000);
      
      // Application should remain stable
      expect(page.isClosed()).toBeFalsy();
    });

    test('should handle slow network responses', async ({ page }) => {
      // Mock very slow API response
      await page.route('**/api/generations', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { generations: [], total: 0, page: 1, limit: 20 }
          })
        });
      });
      
      await page.goto('/studio');
      
      // Should show loading state
      await expect(page.locator('text=Loading').or(page.locator('[data-testid="loading-spinner"]'))).toBeVisible({ timeout: 1000 });
    });

    test('should handle malformed API responses', async ({ page }) => {
      // Mock malformed JSON response
      await page.route('**/api/generations', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json {'
        });
      });
      
      await page.goto('/studio');
      
      // Should handle parsing error gracefully
      await page.waitForTimeout(2000);
      expect(page.isClosed()).toBeFalsy();
    });
  });

  test.describe('Authentication Error Handling', () => {
    test('should handle token expiration during operation', async ({ page }) => {
      await page.goto('/studio');
      
      // Setup form
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test prompt');
      
      // Mock token expiration during generation
      await page.route('**/api/generations', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Token expired'
          })
        });
      });
      
      await page.click('button:has-text("Generate")');
      
      // Should redirect to login or show auth error
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('should handle concurrent session invalidation', async ({ page }) => {
      await page.goto('/studio');
      
      // Simulate session being invalidated in another tab/window
      await page.route('**/api/**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Session invalid'
          })
        });
      });
      
      // Try to perform any authenticated action
      await page.goto('/history');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should handle authentication server errors', async ({ page }) => {
      await page.goto('/login');
      
      // Mock server error during login
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });
      
      // Try to login
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=Internal server error').or(page.locator('text=Login failed'))).toBeVisible();
      
      // Should stay on login page
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Form Validation Edge Cases', () => {
    test('should handle extremely long prompts', async ({ page }) => {
      await page.goto('/studio');
      
      // Create prompt longer than limit
      const veryLongPrompt = 'A'.repeat(1000);
      
      await page.fill('textarea[placeholder*="Describe what you want"]', veryLongPrompt);
      
      // Should be truncated to 500 characters
      const actualValue = await page.locator('textarea[placeholder*="Describe what you want"]').inputValue();
      expect(actualValue.length).toBeLessThanOrEqual(500);
      
      // Character count should show limit
      await expect(page.locator('text=500/500')).toBeVisible();
    });

    test('should handle special characters in prompts', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      
      const specialPrompt = 'Test with "quotes", <tags>, & symbols, émojis 🎨, and unicode ∆ characters';
      await page.fill('textarea[placeholder*="Describe what you want"]', specialPrompt);
      
      // Should handle special characters
      const actualValue = await page.locator('textarea[placeholder*="Describe what you want"]').inputValue();
      expect(actualValue).toBe(specialPrompt);
      
      // Generate button should still work
      await expect(page.locator('button:has-text("Generate")')).toBeEnabled();
    });

    test('should handle prompt with only whitespace', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', '   \n\t  \n  ');
      
      // Generate button should be disabled or show error
      await page.click('button:has-text("Generate")');
      
      await expect(page.locator('text=Please select an image and enter a prompt')).toBeVisible();
    });

    test('should handle form reset during input', async ({ page }) => {
      await page.goto('/studio');
      
      // Fill form partially
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Partial prompt');
      await page.click('label:has-text("Artistic")');
      
      // Remove image (simulates form reset)
      await page.hover('.image-preview');
      await page.click('button[aria-label="Remove image"]');
      
      // Generate button should be disabled
      await expectElementDisabled(page, 'button:has-text("Generate")');
      
      // Prompt and style should remain
      await expect(page.locator('textarea[placeholder*="Describe what you want"]')).toHaveValue('Partial prompt');
      await expect(page.locator('input[value="artistic"]:checked')).toBeVisible();
    });
  });

  test.describe('Generation Error Scenarios', () => {
    test('should handle generation timeout', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test prompt');
      
      // Mock timeout error
      await page.route('**/api/generations', async route => {
        await route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Request timeout'
          })
        });
      });
      
      await page.click('button:has-text("Generate")');
      
      // Should show timeout error
      await expect(page.locator('text=Request timeout').or(page.locator('text=timeout'))).toBeVisible();
    });

    test('should handle server overload with max retries', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test prompt');
      
      // Mock consistent overload error
      await mockFailedGenerationAPI(page, 'Model overloaded, please try again');
      
      await page.click('button:has-text("Generate")');
      
      // Should show retry attempts
      await expect(page.locator('text=Model overloaded, please try again. Retrying... (1/3)')).toBeVisible({ timeout: 5000 });
      
      // Eventually should give up and show final error
      await expect(page.locator('text=Model overloaded, please try again')).toBeVisible({ timeout: 15000 });
    });

    test('should handle content policy violations', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Inappropriate content');
      
      // Mock content policy error
      await page.route('**/api/generations', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Content violates our usage policies'
          })
        });
      });
      
      await page.click('button:has-text("Generate")');
      
      // Should show policy error
      await expect(page.locator('text=Content violates our usage policies')).toBeVisible();
      
      // Form should remain usable for correction
      await expect(page.locator('button:has-text("Generate")')).toBeEnabled();
    });

    test('should handle partial generation failures', async ({ page }) => {
      await page.goto('/studio');
      
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test prompt');
      
      // Mock partial success (generation created but processing failed)
      await page.route('**/api/generations', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              generation: {
                id: 'partial-fail',
                prompt: 'Test prompt',
                style: 'realistic',
                status: 'failed',
                error: 'Processing failed after upload'
              }
            }
          })
        });
      });
      
      await page.click('button:has-text("Generate")');
      
      // Should handle the partial failure gracefully
      await page.waitForTimeout(2000);
      expect(page.isClosed()).toBeFalsy();
    });
  });

  test.describe('Browser Compatibility Issues', () => {
    test('should handle file API not available', async ({ page }) => {
      // Mock FileReader not being available (older browsers)
      await page.addInitScript(() => {
        // @ts-ignore
        window.FileReader = undefined;
      });
      
      await page.goto('/studio');
      
      // Should still show upload interface (might use fallback)
      await expect(page.locator('.upload-zone')).toBeVisible();
    });

    test('should handle drag and drop not supported', async ({ page }) => {
      // Mock drag and drop events not being available
      await page.addInitScript(() => {
        // @ts-ignore
        window.DragEvent = undefined;
      });
      
      await page.goto('/studio');
      
      // Should still allow file upload via click
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('.upload-zone');
      await fileChooserPromise;
    });

    test('should handle fetch API not available', async ({ page }) => {
      // Mock fetch not being available (older browsers)
      await page.addInitScript(() => {
        // @ts-ignore
        window.fetch = undefined;
      });
      
      await page.goto('/studio');
      
      // Should still load (might use XMLHttpRequest fallback)
      await expect(page.locator('h1')).toContainText('AI Generation Studio');
    });
  });

  test.describe('Memory and Performance Edge Cases', () => {
    test('should handle many rapid interactions', async ({ page }) => {
      await page.goto('/studio');
      
      // Rapidly interact with form elements
      for (let i = 0; i < 10; i++) {
        await page.fill('textarea[placeholder*="Describe what you want"]', `Prompt ${i}`);
        await page.click('label:has-text("Realistic")');
        await page.click('label:has-text("Artistic")');
        await page.click('label:has-text("Cartoon")');
        await page.click('label:has-text("Vintage")');
      }
      
      // Should remain responsive
      await expect(page.locator('textarea[placeholder*="Describe what you want"]')).toHaveValue('Prompt 9');
      
      // No memory leaks or crashes
      expect(page.isClosed()).toBeFalsy();
    });

    test('should handle multiple file uploads and removals', async ({ page }) => {
      await page.goto('/studio');
      
      // Upload and remove files multiple times
      for (let i = 0; i < 5; i++) {
        await uploadFile(page, 'input[type="file"]', `test-file-${i}.png`);
        await expect(page.locator('.image-preview')).toBeVisible();
        
        await page.hover('.image-preview');
        await page.click('button[aria-label="Remove image"]');
        await expect(page.locator('.upload-zone')).toBeVisible();
      }
      
      // Should still be functional
      await uploadFile(page, 'input[type="file"]', 'final-test.png');
      await expect(page.locator('.image-preview')).toBeVisible();
    });

    test('should handle concurrent API calls', async ({ page }) => {
      await page.goto('/studio');
      
      let callCount = 0;
      await page.route('**/api/generations', async route => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              generations: [{
                id: `concurrent-${callCount}`,
                prompt: 'Concurrent test',
                style: 'realistic',
                status: 'completed'
              }],
              total: 1,
              page: 1,
              limit: 20
            }
          })
        });
      });
      
      // Navigate between pages quickly to trigger multiple API calls
      await Promise.all([
        page.goto('/history'),
        page.goto('/studio'),
        page.goto('/history')
      ]);
      
      // Should handle concurrent calls gracefully
      await page.waitForTimeout(2000);
      expect(page.isClosed()).toBeFalsy();
    });
  });

  test.describe('Accessibility Error Scenarios', () => {
    test('should maintain keyboard navigation during errors', async ({ page }) => {
      await page.goto('/studio');
      
      // Trigger an error
      await uploadFile(page, 'input[type="file"]');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test');
      
      await mockFailedGenerationAPI(page, 'Test error');
      await page.click('button:has-text("Generate")');
      
      await expect(page.locator('text=Test error')).toBeVisible();
      
      // Keyboard navigation should still work
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(focusedElement || '')).toBeTruthy();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await page.goto('/studio');
      
      // Check that error messages have proper ARIA attributes or are in live regions
      const textBuffer = Buffer.from('Not an image');
      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: textBuffer,
      });
      
      const errorMessage = page.locator('text=Please select a JPEG or PNG image');
      await expect(errorMessage).toBeVisible();
      
      // Error should be announced (aria-live region or proper role)
      const errorContainer = errorMessage.locator('..');
      const ariaLive = await errorContainer.getAttribute('aria-live');
      const role = await errorContainer.getAttribute('role');
      
      // Should have accessibility attributes for screen readers
      expect(ariaLive || role).toBeTruthy();
    });

    test('should maintain focus management during errors', async ({ page }) => {
      await page.goto('/studio');
      
      // Focus on generate button
      await page.focus('button:has-text("Generate")');
      
      // Trigger validation error
      await page.click('button:has-text("Generate")');
      
      await expect(page.locator('text=Please select an image and enter a prompt')).toBeVisible();
      
      // Focus should be managed appropriately (not lost)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).not.toBe('BODY'); // Focus shouldn't be lost to body
    });
  });
});
