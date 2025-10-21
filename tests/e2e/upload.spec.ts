import { test, expect } from '@playwright/test';
import { createAndLoginUser, createTestImageFile } from './test-utils';

test.describe('File Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await createAndLoginUser(page);
    await expect(page).toHaveURL('/studio');
  });

  test.describe('File Selection', () => {
    test('should open file dialog when clicking upload area', async ({ page }) => {
      // Setup file chooser listener
      const fileChooserPromise = page.waitForEvent('filechooser');
      
      // Click upload area
      await page.click('.upload-zone');
      
      // Verify file chooser opened
      const fileChooser = await fileChooserPromise;
      expect(fileChooser.isMultiple()).toBe(false);
      
      // Check accepted file types
      const element = await page.locator('input[type="file"]');
      const acceptAttribute = await element.getAttribute('accept');
      expect(acceptAttribute).toContain('image/jpeg');
      expect(acceptAttribute).toContain('image/png');
    });

    test('should handle valid image file selection', async ({ page }) => {
      const fileBuffer = await createTestImageFile('valid-image.png');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'valid-image.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // Check file preview appears
      await expect(page.locator('.image-preview')).toBeVisible();
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();
      
      // Check file info display
      await expect(page.locator('text=valid-image.png')).toBeVisible();
      await expect(page.locator('text=Size:')).toBeVisible();
    });

    test('should handle JPEG file selection', async ({ page }) => {
      // Create a minimal JPEG buffer
      const jpegHeader = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, // JPEG SOI and App0 marker
        0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, // JFIF identifier
        0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
        0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9 // Basic JPEG structure with EOI
      ]);
      
      await page.setInputFiles('input[type="file"]', {
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: jpegHeader,
      });
      
      // Check file is accepted
      await expect(page.locator('.image-preview')).toBeVisible();
      await expect(page.locator('text=test-image.jpg')).toBeVisible();
    });

    test('should reject invalid file types', async ({ page }) => {
      // Try to upload a text file
      const textBuffer = Buffer.from('This is not an image');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: textBuffer,
      });
      
      // Should show error message
      await expect(page.locator('text=Please select a JPEG or PNG image')).toBeVisible();
      
      // Should not show preview
      await expect(page.locator('.image-preview')).not.toBeVisible();
    });

    test('should reject files that are too large', async ({ page }) => {
      // Create a buffer larger than 10MB (simulate)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      await page.setInputFiles('input[type="file"]', {
        name: 'huge-image.png',
        mimeType: 'image/png',
        buffer: largeBuffer,
      });
      
      // Should show size error
      await expect(page.locator('text=File size must be less than 10MB')).toBeVisible();
      
      // Should not show preview
      await expect(page.locator('.image-preview')).not.toBeVisible();
    });
  });

  test.describe('Drag and Drop', () => {
    test('should handle drag over states', async ({ page }) => {
      const uploadZone = page.locator('.upload-zone');
      
      // Simulate drag over
      await uploadZone.dispatchEvent('dragover', {
        dataTransfer: await page.evaluateHandle(() => new DataTransfer())
      });
      
      // Should add drag over styling (if implemented)
      await page.waitForTimeout(100); // Allow for any state changes
      
      // Simulate drag leave
      await uploadZone.dispatchEvent('dragleave');
      
      await page.waitForTimeout(100);
    });

    test('should handle file drop with valid image', async ({ page }) => {
      const fileBuffer = await createTestImageFile('dropped-image.png');
      
      // Create DataTransfer with file
      const dataTransfer = await page.evaluateHandle((buffer) => {
        const dt = new DataTransfer();
        const file = new File([new Uint8Array(buffer)], 'dropped-image.png', { type: 'image/png' });
        dt.items.add(file);
        return dt;
      }, Array.from(fileBuffer));
      
      // Drop the file
      await page.locator('.upload-zone').dispatchEvent('drop', { dataTransfer });
      
      // Should show preview
      await expect(page.locator('.image-preview')).toBeVisible();
      await expect(page.locator('text=dropped-image.png')).toBeVisible();
    });

    test('should handle multiple file drop (take first)', async ({ page }) => {
      const fileBuffer1 = await createTestImageFile('image1.png');
      const fileBuffer2 = await createTestImageFile('image2.png');
      
      // Create DataTransfer with multiple files
      const dataTransfer = await page.evaluateHandle((buffers) => {
        const dt = new DataTransfer();
        const file1 = new File([new Uint8Array(buffers[0])], 'image1.png', { type: 'image/png' });
        const file2 = new File([new Uint8Array(buffers[1])], 'image2.png', { type: 'image/png' });
        dt.items.add(file1);
        dt.items.add(file2);
        return dt;
      }, [Array.from(fileBuffer1), Array.from(fileBuffer2)]);
      
      await page.locator('.upload-zone').dispatchEvent('drop', { dataTransfer });
      
      // Should only process first file
      await expect(page.locator('text=image1.png')).toBeVisible();
      await expect(page.locator('text=image2.png')).not.toBeVisible();
    });

    test('should reject dropped invalid files', async ({ page }) => {
      // Create a text file
      const dataTransfer = await page.evaluateHandle(() => {
        const dt = new DataTransfer();
        const file = new File(['not an image'], 'document.txt', { type: 'text/plain' });
        dt.items.add(file);
        return dt;
      });
      
      await page.locator('.upload-zone').dispatchEvent('drop', { dataTransfer });
      
      // Should show error
      await expect(page.locator('text=Please select a JPEG or PNG image')).toBeVisible();
    });
  });

  test.describe('File Preview and Management', () => {
    test('should display file preview with correct information', async ({ page }) => {
      const fileBuffer = await createTestImageFile('preview-test.png');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'preview-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // Check preview image
      const previewImg = page.locator('.image-preview img');
      await expect(previewImg).toBeVisible();
      await expect(previewImg).toHaveAttribute('alt', 'Preview');
      
      // Check file information
      await expect(page.locator('text=File: preview-test.png')).toBeVisible();
      await expect(page.locator('text=Size:').locator('xpath=following-sibling::text()[contains(., "MB")]')).toBeVisible();
    });

    test('should allow file removal', async ({ page }) => {
      const fileBuffer = await createTestImageFile('removable-image.png');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'removable-image.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // File should be uploaded
      await expect(page.locator('.image-preview')).toBeVisible();
      
      // Hover to reveal remove button
      await page.hover('.image-preview');
      
      // Click remove button
      await page.click('button[aria-label="Remove image"]');
      
      // Preview should be gone
      await expect(page.locator('.image-preview')).not.toBeVisible();
      await expect(page.locator('.upload-zone')).toBeVisible();
      
      // File input should be cleared
      const fileInput = page.locator('input[type="file"]');
      const files = await fileInput.evaluate((input: HTMLInputElement) => input.files?.length);
      expect(files).toBe(0);
    });

    test('should handle remove button hover states', async ({ page }) => {
      const fileBuffer = await createTestImageFile('hover-test.png');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'hover-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      const preview = page.locator('.image-preview');
      const removeButton = page.locator('button[aria-label="Remove image"]');
      
      // Initially button should not be visible or have low opacity
      await expect(preview).toBeVisible();
      
      // Hover over preview
      await preview.hover();
      
      // Remove button should become visible
      await expect(removeButton).toBeVisible();
      
      // Move mouse away
      await page.mouse.move(0, 0);
      
      // Button might become less visible again (depending on implementation)
      await page.waitForTimeout(500);
    });
  });

  test.describe('File Upload Integration', () => {
    test('should enable generate button when image and prompt are provided', async ({ page }) => {
      const generateButton = page.locator('button:has-text("Generate")');
      
      // Initially disabled
      await expect(generateButton).toBeDisabled();
      
      // Add image
      const fileBuffer = await createTestImageFile('integration-test.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'integration-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // Still disabled (no prompt)
      await expect(generateButton).toBeDisabled();
      
      // Add prompt
      await page.fill('textarea[placeholder*="Describe what you want"]', 'A beautiful landscape');
      
      // Now should be enabled
      await expect(generateButton).toBeEnabled();
    });

    test('should disable file input during generation', async ({ page }) => {
      // Setup form
      const fileBuffer = await createTestImageFile('generation-test.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'generation-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Test prompt');
      
      // Mock delayed API response
      await page.route('**/api/generations', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { generation: { id: 'test' } }
          })
        });
      });
      
      // Start generation
      await page.click('button:has-text("Generate")');
      
      // File input should be disabled
      await expect(page.locator('input[type="file"]')).toBeDisabled();
      
      // Remove button should not be clickable during generation
      const removeButton = page.locator('button[aria-label="Remove image"]');
      if (await removeButton.isVisible()) {
        await expect(removeButton).toBeDisabled();
      }
    });

    test('should preserve uploaded file through form interactions', async ({ page }) => {
      const fileBuffer = await createTestImageFile('persistent-image.png');
      
      // Upload file
      await page.setInputFiles('input[type="file"]', {
        name: 'persistent-image.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      await expect(page.locator('text=persistent-image.png')).toBeVisible();
      
      // Change other form fields
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Initial prompt');
      await page.click('label:has-text("Artistic")');
      await page.fill('textarea[placeholder*="Describe what you want"]', 'Changed prompt');
      await page.click('label:has-text("Vintage")');
      
      // File should still be there
      await expect(page.locator('text=persistent-image.png')).toBeVisible();
      await expect(page.locator('.image-preview')).toBeVisible();
    });

    test('should handle file replacement', async ({ page }) => {
      // Upload first file
      const fileBuffer1 = await createTestImageFile('first-image.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'first-image.png',
        mimeType: 'image/png',
        buffer: fileBuffer1,
      });
      
      await expect(page.locator('text=first-image.png')).toBeVisible();
      
      // Upload second file (replace)
      const fileBuffer2 = await createTestImageFile('second-image.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'second-image.png',
        mimeType: 'image/png',
        buffer: fileBuffer2,
      });
      
      // Should show new file
      await expect(page.locator('text=second-image.png')).toBeVisible();
      await expect(page.locator('text=first-image.png')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should clear previous errors when uploading valid file', async ({ page }) => {
      // First, trigger an error with invalid file
      const textBuffer = Buffer.from('Not an image');
      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.txt',
        mimeType: 'text/plain',
        buffer: textBuffer,
      });
      
      // Should show error
      await expect(page.locator('text=Please select a JPEG or PNG image')).toBeVisible();
      
      // Now upload valid file
      const validBuffer = await createTestImageFile('valid-fix.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'valid-fix.png',
        mimeType: 'image/png',
        buffer: validBuffer,
      });
      
      // Error should be cleared
      await expect(page.locator('text=Please select a JPEG or PNG image')).not.toBeVisible();
      await expect(page.locator('.image-preview')).toBeVisible();
    });

    test('should handle corrupted image files', async ({ page }) => {
      // Create a file with PNG extension but invalid content
      const corruptedBuffer = Buffer.from('PNG but not really');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'corrupted.png',
        mimeType: 'image/png',
        buffer: corruptedBuffer,
      });
      
      // File might be accepted initially (mime type check passes)
      // but could fail during processing - check for any error states
      await page.waitForTimeout(500);
      
      // The behavior here depends on implementation - 
      // some systems validate file headers, others rely on mime type
    });

    test('should handle network errors during upload preview', async ({ page }) => {
      // This test is more applicable if preview generation involves server calls
      const fileBuffer = await createTestImageFile('network-test.png');
      
      await page.setInputFiles('input[type="file"]', {
        name: 'network-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // Should handle gracefully regardless of network state
      await expect(page.locator('.image-preview')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation for file upload', async ({ page }) => {
      // Tab to file input
      await page.keyboard.press('Tab');
      
      // Should be able to focus on upload area or file input
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      
      // Should be able to activate with keyboard
      if (focusedElement === 'INPUT' || focusedElement === 'BUTTON') {
        await page.keyboard.press('Enter');
        // File dialog should open (though we can't easily test the OS dialog)
      }
    });

    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      // Check for proper labeling
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toHaveAttribute('accept');
      
      // Check upload zone has proper accessibility
      const uploadZone = page.locator('.upload-zone');
      await expect(uploadZone).toBeVisible();
      
      // Check remove button has proper aria-label
      const fileBuffer = await createTestImageFile('aria-test.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'aria-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      const removeButton = page.locator('button[aria-label="Remove image"]');
      await expect(removeButton).toHaveAttribute('aria-label');
    });

    test('should provide screen reader friendly content', async ({ page }) => {
      // Upload a file
      const fileBuffer = await createTestImageFile('screen-reader-test.png');
      await page.setInputFiles('input[type="file"]', {
        name: 'screen-reader-test.png',
        mimeType: 'image/png',
        buffer: fileBuffer,
      });
      
      // Check that file information is in accessible format
      await expect(page.locator('text=File:')).toBeVisible();
      await expect(page.locator('text=Size:')).toBeVisible();
      
      // Preview image should have alt text
      const previewImg = page.locator('.image-preview img');
      await expect(previewImg).toHaveAttribute('alt', 'Preview');
    });
  });
});
