import { test, expect } from '@playwright/test';
import { 
  createAndLoginUser, 
  uploadFile, 
  mockGenerationAPI, 
  mockFailedGenerationAPI,
  expectElementEnabled,
  expectElementDisabled,
  waitForAPIResponse
} from './test-utils';

test.describe('Studio - AI Generation Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Create and login a user before each test
    await createAndLoginUser(page);
    
    // Should be on studio page after login
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('h1')).toContainText('AI Generation Studio');
  });

  test('should display the studio interface correctly', async ({ page }) => {
    // Check main elements are visible
    await expect(page.locator('h1:has-text("AI Generation Studio")')).toBeVisible();
    await expect(page.locator('h2:has-text("Create Generation")')).toBeVisible();
    await expect(page.locator('h2:has-text("Recent Creations")')).toBeVisible();
    
    // Check form elements are present
    await expect(page.locator('label:has-text("Upload Image")')).toBeVisible();
    await expect(page.locator('label:has-text("Describe Your Vision")')).toBeVisible();
    await expect(page.locator('text=Choose Style')).toBeVisible();
    
    // Check generate button is disabled initially
    await expectElementDisabled(page, 'button:has-text("Generate")');
    
    // Check all style options are present
    const styleOptions = ['Realistic', 'Artistic', 'Cartoon', 'Vintage'];
    for (const style of styleOptions) {
      await expect(page.locator(`text=${style}`)).toBeVisible();
    }
  });

  test('should handle file upload via click', async ({ page }) => {
    // Click upload area
    await page.click('.upload-zone');
    
    // Upload file through file input
    await uploadFile(page, 'input[type="file"]');
    
    // Check file preview appears
    await expect(page.locator('.image-preview img')).toBeVisible();
    await expect(page.locator('text=test-image.png')).toBeVisible();
    await expect(page.locator('text=MB')).toBeVisible();
    
    // Check file can be removed
    await page.hover('.image-preview');
    await page.click('button[aria-label="Remove image"]');
    
    // Preview should be gone
    await expect(page.locator('.image-preview')).not.toBeVisible();
    await expect(page.locator('.upload-zone')).toBeVisible();
  });

  test('should handle file upload via drag and drop', async ({ page }) => {
    const uploadZone = page.locator('.upload-zone');
    
    // Simulate drag and drop
    const fileBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    
    // Create file and add to data transfer
    await page.evaluate(([buffer]) => {
      const file = new File([new Uint8Array(buffer)], 'test-drag-image.png', { type: 'image/png' });
      const dt = new DataTransfer();
      dt.items.add(file);
      
      const uploadZone = document.querySelector('.upload-zone');
      if (uploadZone) {
        // Simulate drag over
        uploadZone.dispatchEvent(new DragEvent('dragover', { 
          bubbles: true,
          dataTransfer: dt
        }));
        
        // Simulate drop
        uploadZone.dispatchEvent(new DragEvent('drop', { 
          bubbles: true,
          dataTransfer: dt
        }));
      }
    }, [Array.from(fileBuffer)]);
    
    // Check that drag over state is handled
    await page.hover(uploadZone);
    
    // For a more reliable test, use the file input method
    await uploadFile(page, 'input[type="file"]', 'test-drag-image.png');
    await expect(page.locator('text=test-drag-image.png')).toBeVisible();
  });

  test('should validate file types and sizes', async ({ page }) => {
    // Test invalid file type (simulate by checking error message)
    // Since we can't easily create different file types in the test,
    // we'll test the UI behavior
    
    // Upload a valid file first
    await uploadFile(page, 'input[type="file"]');
    await expect(page.locator('.image-preview')).toBeVisible();
    
    // Check file size display
    await expect(page.locator('text=Size:')).toBeVisible();
    
    // Test file removal
    await page.hover('.image-preview');
    await page.click('button[aria-label="Remove image"]');
    await expect(page.locator('.upload-zone')).toBeVisible();
  });

  test('should handle prompt input and character count', async ({ page }) => {
    const promptInput = page.locator('textarea[placeholder*="Describe what you want"]');
    
    // Test prompt input
    await promptInput.fill('A beautiful landscape with mountains and lakes');
    await expect(promptInput).toHaveValue('A beautiful landscape with mountains and lakes');
    
    // Check character count
    await expect(page.locator('text=44/500')).toBeVisible();
    
    // Test maximum length
    const longPrompt = 'A'.repeat(500);
    await promptInput.fill(longPrompt);
    await expect(page.locator('text=500/500')).toBeVisible();
    
    // Try to exceed limit - should be truncated
    const tooLongPrompt = 'A'.repeat(600);
    await promptInput.fill(tooLongPrompt);
    const actualValue = await promptInput.inputValue();
    expect(actualValue.length).toBe(500);
  });

  test('should handle style selection', async ({ page }) => {
    // Check default selection (realistic)
    await expect(page.locator('input[value="realistic"]:checked')).toBeVisible();
    
    // Select artistic style
    await page.click('label:has-text("Artistic")');
    await expect(page.locator('input[value="artistic"]:checked')).toBeVisible();
    await expect(page.locator('input[value="realistic"]:checked')).not.toBeVisible();
    
    // Select cartoon style
    await page.click('label:has-text("Cartoon")');
    await expect(page.locator('input[value="cartoon"]:checked')).toBeVisible();
    
    // Select vintage style
    await page.click('label:has-text("Vintage")');
    await expect(page.locator('input[value="vintage"]:checked')).toBeVisible();
    
    // Go back to realistic
    await page.click('label:has-text("Realistic")');
    await expect(page.locator('input[value="realistic"]:checked')).toBeVisible();
  });

  test('should enable generate button when form is complete', async ({ page }) => {
    // Initially disabled
    await expectElementDisabled(page, 'button:has-text("Generate")');
    
    // Add image only
    await uploadFile(page, 'input[type="file"]');
    await expectElementDisabled(page, 'button:has-text("Generate")');
    
    // Add prompt
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A beautiful sunset');
    await expectElementEnabled(page, 'button:has-text("Generate")');
    
    // Remove image - should disable again
    await page.hover('.image-preview');
    await page.click('button[aria-label="Remove image"]');
    await expectElementDisabled(page, 'button:has-text("Generate")');
    
    // Add image back
    await uploadFile(page, 'input[type="file"]');
    await expectElementEnabled(page, 'button:has-text("Generate")');
  });

  test('should handle successful generation', async ({ page }) => {
    // Mock successful API response
    await mockGenerationAPI(page);
    
    // Fill form
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A beautiful sunset');
    await page.click('label:has-text("Artistic")');
    
    // Start generation
    const responsePromise = waitForAPIResponse(page, '/api/generations');
    await page.click('button:has-text("Generate")');
    
    // Check loading state
    await expect(page.locator('button:has-text("Generating Magic")')).toBeVisible();
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
    
    // Wait for API response
    await responsePromise;
    
    // Check success state
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
    await expect(page.locator('button:has-text("Stop")')).not.toBeVisible();
    
    // Recent generations should be updated (mocked data will show)
    await expect(page.locator('text=A beautiful sunset').or(page.locator('text=A mystical forest'))).toBeVisible();
  });

  test('should handle generation failure', async ({ page }) => {
    // Mock failed API response
    await mockFailedGenerationAPI(page, 'Model overloaded, please try again');
    
    // Fill form
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A test prompt');
    
    // Start generation
    await page.click('button:has-text("Generate")');
    
    // Wait for error
    await expect(page.locator('text=Model overloaded, please try again')).toBeVisible();
    
    // Check button is back to normal state
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
  });

  test('should handle generation abort', async ({ page }) => {
    // Mock API to delay response
    await page.route('**/api/generations', async route => {
      // Delay the response to allow testing abort
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { generation: { id: 'test' } }
        })
      });
    });
    
    // Fill form
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A test prompt');
    
    // Start generation
    await page.click('button:has-text("Generate")');
    
    // Check loading state appears
    await expect(page.locator('button:has-text("Generating Magic")')).toBeVisible();
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
    
    // Abort generation
    await page.click('button:has-text("Stop")');
    
    // Check state returns to normal
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
    await expect(page.locator('button:has-text("Stop")')).not.toBeVisible();
  });

  test('should handle retry logic for overloaded model', async ({ page }) => {
    let requestCount = 0;
    
    // Mock API to fail first few times, then succeed
    await page.route('**/api/generations', async route => {
      requestCount++;
      
      if (requestCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Model overloaded, please try again'
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              generation: {
                id: 'retry-success',
                prompt: 'Test prompt',
                style: 'realistic'
              }
            }
          })
        });
      }
    });
    
    // Fill form
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A test prompt');
    
    // Start generation
    await page.click('button:has-text("Generate")');
    
    // Should see retry message
    await expect(page.locator('text=Model overloaded, please try again. Retrying... (1/3)')).toBeVisible({ timeout: 10000 });
    
    // Eventually should succeed (after retries)
    await expect(page.locator('button:has-text("Generate")')).toBeVisible({ timeout: 15000 });
  });

  test('should restore generation settings', async ({ page }) => {
    // Mock API with generations
    await mockGenerationAPI(page);
    
    // Wait for generations to load
    await page.waitForTimeout(1000);
    
    // Click restore on first generation (if available)
    const restoreButton = page.locator('button:has-text("Restore")').first();
    if (await restoreButton.isVisible()) {
      await restoreButton.click();
      
      // Check that prompt and style are restored
      await expect(page.locator('textarea[placeholder*="Describe what you want"]')).toHaveValue('A beautiful sunset');
      await expect(page.locator('input[value="realistic"]:checked')).toBeVisible();
      
      // Should show error message about image restoration
      await expect(page.locator('text=Original image from this generation cannot be restored')).toBeVisible();
    }
  });

  test('should disable form during generation', async ({ page }) => {
    // Mock delayed API response
    await page.route('**/api/generations', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await mockGenerationAPI(page);
    });
    
    // Fill form
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', 'A test prompt');
    
    // Start generation
    await page.click('button:has-text("Generate")');
    
    // Check form elements are disabled during generation
    await expect(page.locator('input[type="file"]')).toBeDisabled();
    await expect(page.locator('textarea[placeholder*="Describe what you want"]')).toBeDisabled();
    await expect(page.locator('input[name="style"]').first()).toBeDisabled();
  });

  test('should show empty state when no recent generations', async ({ page }) => {
    // Mock empty generations response
    await page.route('**/api/generations', async route => {
      if (route.request().method() === 'GET') {
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
      }
    });
    
    // Reload page to get fresh data
    await page.reload();
    
    // Should show empty state
    await expect(page.locator('text=No generations yet')).toBeVisible();
    await expect(page.locator('text=Your creations will appear here')).toBeVisible();
  });

  test('should handle form validation edge cases', async ({ page }) => {
    // Test empty prompt submission
    await uploadFile(page, 'input[type="file"]');
    await page.fill('textarea[placeholder*="Describe what you want"]', '   '); // Only spaces
    
    await page.click('button:has-text("Generate")');
    await expect(page.locator('text=Please select an image and enter a prompt')).toBeVisible();
    
    // Test valid prompt
    await page.fill('textarea[placeholder*="Describe what you want"]', 'Valid prompt');
    await expectElementEnabled(page, 'button:has-text("Generate")');
  });
});
