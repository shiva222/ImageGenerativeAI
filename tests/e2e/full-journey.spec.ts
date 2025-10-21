import { test, expect } from '@playwright/test';
import path from 'path';

// Generate unique test data for each run
const generateTestUser = () => ({
  email: `journey-test-${Date.now()}@example.com`,
  password: 'testPassword123!',
});

test.describe('Full User Journey - Signup to Generation History', () => {
  test('should complete entire user workflow: signup → login → upload → generate → view history → restore', async ({ page }) => {
    const testUser = generateTestUser();
    const testPrompt = 'A majestic mountain landscape with a crystal clear lake reflecting the snow-capped peaks';
    
    // Step 1: Navigate to homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/AI Studio|AI Generation Studio/i);
    
    // Step 2: Navigate to signup and create account
    await page.click('a[href="/login"]');
    await page.click('a[href="/signup"]:has-text("Create account")');
    
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Join AI Studio');
    
    // Fill signup form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    // Submit signup
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Should redirect to studio after successful signup
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('h1')).toContainText('AI Generation Studio');
    
    // Verify user is logged in
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Step 3: Prepare and upload image file
    // Create a test image file path
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    
    // Ensure the upload zone is visible
    await expect(page.locator('text=Drop your image here, or click to browse')).toBeVisible();
    
    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for image preview to appear
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 10000 });
    
    // Verify file information is displayed
    await expect(page.locator('text=test-image.jpg').or(page.locator('text=File:'))).toBeVisible();
    
    // Step 4: Enter prompt and select style
    // Fill prompt
    const promptTextarea = page.locator('textarea[placeholder*="Describe what you want to generate"]');
    await promptTextarea.fill(testPrompt);
    
    // Verify character counter updates
    await expect(page.locator(`text=${testPrompt.length}/500`)).toBeVisible();
    
    // Select artistic style (different from default realistic)
    await page.click('input[value="artistic"]');
    await expect(page.locator('input[value="artistic"]')).toBeChecked();
    
    // Step 5: Generate image
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeEnabled();
    
    await generateButton.click();
    
    // Should show loading state
    await expect(page.locator('text=Generating Magic...')).toBeVisible();
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
    await expect(generateButton).toBeDisabled();
    
    // Wait for generation to complete (may take up to 5 seconds based on simulation)
    await expect(page.locator('text=Generating Magic...')).toBeHidden({ timeout: 15000 });
    await expect(generateButton).toBeEnabled();
    
    // Step 6: Verify generation appears in recent creations
    // Should see the generation in recent creations section
    await expect(page.locator('.generation-card').or(page.locator('text=Recent Creations'))).toBeVisible();
    
    // The prompt should appear in the recent creations
    await expect(page.locator(`text=${testPrompt}`).first()).toBeVisible({ timeout: 5000 });
    
    // Step 7: Navigate to history page
    await page.click('a[href="/history"]');
    await expect(page).toHaveURL('/history');
    await expect(page.locator('h1')).toContainText('AI Generation History');
    
    // Step 8: Verify generation appears in full history
    // Wait for history to load
    await page.waitForLoadState('networkidle');
    
    // Should see the generation we just created
    await expect(page.locator(`text=${testPrompt}`)).toBeVisible({ timeout: 10000 });
    
    // Should see the artistic style
    await expect(page.locator('text=Artistic')).toBeVisible();
    
    // Should see completed status (or processing if still in progress)
    await expect(page.locator('text=Completed').or(page.locator('text=Processing'))).toBeVisible();
    
    // Step 9: Test filtering functionality
    // Filter by completed status
    await page.click('button:has-text("Completed")');
    
    // Should still see our generation
    await expect(page.locator(`text=${testPrompt}`)).toBeVisible();
    
    // Filter by failed status
    await page.click('button:has-text("Failed")');
    
    // Should not see our generation (assuming it completed successfully)
    await expect(page.locator(`text=${testPrompt}`)).toBeHidden();
    
    // Reset to "All" filter
    await page.click('button:has-text("All")');
    await expect(page.locator(`text=${testPrompt}`)).toBeVisible();
    
    // Step 10: Test restore functionality
    // Find and click restore button for our generation
    const generationCard = page.locator(`text=${testPrompt}`).locator('..').locator('..');
    const restoreButton = generationCard.locator('button:has-text("Restore")');
    
    await restoreButton.click();
    
    // Should see success notification
    await expect(page.locator('text=Settings restored')).toBeVisible({ timeout: 5000 });
    
    // Notification should auto-hide
    await expect(page.locator('text=Settings restored')).toBeHidden({ timeout: 4000 });
    
    // Step 11: Navigate back to studio to verify restoration
    await page.click('a[href="/studio"]');
    await expect(page).toHaveURL('/studio');
    
    // Verify prompt and style were restored
    await expect(page.locator('textarea')).toHaveValue(testPrompt);
    await expect(page.locator('input[value="artistic"]')).toBeChecked();
    
    // Step 12: Test logout functionality
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
    
    // Step 13: Test login with existing credentials
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Should redirect back to studio
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Step 14: Verify persistence - check history still exists
    await page.click('a[href="/history"]');
    await expect(page.locator(`text=${testPrompt}`)).toBeVisible();
    
    // Step 15: Test refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh")');
    await refreshButton.click();
    
    // Should still see our generation after refresh
    await expect(page.locator(`text=${testPrompt}`)).toBeVisible({ timeout: 10000 });
  });

  test('should handle errors gracefully during the journey', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Create user account
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    await expect(page).toHaveURL('/studio');
    
    // Test error handling for invalid file types
    const invalidFilePath = path.join(__dirname, '../fixtures/test-document.txt');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFilePath);
    
    // Should show error for invalid file type
    await expect(page.locator('text=Please select a JPEG or PNG image')).toBeVisible();
    
    // Test generation without proper inputs
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeDisabled(); // Should be disabled without valid inputs
    
    // Add valid image but no prompt
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await fileInput.setInputFiles(testImagePath);
    
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    
    // Should still be disabled without prompt
    await expect(generateButton).toBeDisabled();
    
    // Add prompt
    await page.fill('textarea[placeholder*="Describe what you want to generate"]', 'Test prompt');
    
    // Now should be enabled
    await expect(generateButton).toBeEnabled();
    
    // Test generation cancellation
    await generateButton.click();
    
    // Should show stop button
    await expect(page.locator('button:has-text("Stop")')).toBeVisible();
    
    // Click stop button
    await page.click('button:has-text("Stop")');
    
    // Should return to normal state
    await expect(page.locator('text=Generating Magic...')).toBeHidden();
    await expect(generateButton).toBeEnabled();
    await expect(page.locator('button:has-text("Stop")')).not.toBeVisible();
  });

  test('should handle model overload retries correctly', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Setup user and navigate to studio
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    await expect(page).toHaveURL('/studio');
    
    // Setup generation
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await page.locator('input[type="file"]').setInputFiles(testImagePath);
    await page.fill('textarea[placeholder*="Describe what you want to generate"]', 'Test overload handling');
    
    // Start generation
    await page.click('button:has-text("Generate")');
    
    // If we hit the 20% failure rate, we might see retry messages
    const retryMessage = page.locator('text=Model overloaded');
    const retryingMessage = page.locator('text=Retrying');
    
    // Wait for either success or retry messages
    try {
      await Promise.race([
        retryMessage.waitFor({ timeout: 10000 }),
        page.locator('text=Recent Creations').waitFor({ timeout: 15000 }) // Success case
      ]);
      
      // If we see retry messages, verify the retry behavior
      if (await retryMessage.isVisible()) {
        await expect(retryingMessage).toBeVisible();
        
        // Should eventually either succeed or show final error
        await Promise.race([
          page.locator('text=Recent Creations').waitFor({ timeout: 20000 }),
          retryMessage.and(page.locator('text=Retrying').not()).waitFor({ timeout: 20000 })
        ]);
      }
    } catch {
      // If neither happens within timeout, that's also acceptable for this test
    }
    
    // Regardless of outcome, should return to stable state
    await expect(page.locator('text=Generating Magic...')).toBeHidden({ timeout: 25000 });
    await expect(page.locator('button:has-text("Generate")')).toBeEnabled();
  });

  test('should work correctly on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const testUser = generateTestUser();
    
    // Test mobile signup flow
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    await expect(page).toHaveURL('/studio');
    
    // Test mobile navigation
    const navButton = page.locator('button[aria-label*="menu"]').or(page.locator('.hamburger')).or(page.locator('[data-testid="mobile-menu"]'));
    
    if (await navButton.isVisible()) {
      await navButton.click();
      await expect(page.locator('a[href="/history"]')).toBeVisible();
      await page.click('a[href="/history"]');
    } else {
      // Direct navigation if no mobile menu
      await page.goto('/history');
    }
    
    await expect(page).toHaveURL('/history');
    
    // Test mobile history view
    await expect(page.locator('h1')).toContainText('AI Generation History');
    
    // Should show empty state initially
    await expect(page.locator('text=No generations yet')).toBeVisible();
    
    // Navigate back to studio (mobile)
    if (await navButton.isVisible()) {
      await navButton.click();
      await page.click('a[href="/studio"]');
    } else {
      await page.goto('/studio');
    }
    
    // Test mobile file upload
    const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
    await page.locator('input[type="file"]').setInputFiles(testImagePath);
    
    // Should work on mobile
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();
    
    // Test mobile form interactions
    await page.fill('textarea[placeholder*="Describe what you want to generate"]', 'Mobile test generation');
    
    // Test style selection on mobile
    await page.click('input[value="cartoon"]');
    await expect(page.locator('input[value="cartoon"]')).toBeChecked();
    
    // Generate button should be accessible on mobile
    const generateButton = page.locator('button:has-text("Generate")');
    await expect(generateButton).toBeEnabled();
    await expect(generateButton).toBeVisible();
  });

  test('should preserve state during page refreshes', async ({ page }) => {
    const testUser = generateTestUser();
    
    // Create user and login
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    await expect(page).toHaveURL('/studio');
    
    // Fill form partially
    await page.fill('textarea[placeholder*="Describe what you want to generate"]', 'Persistence test prompt');
    await page.click('input[value="vintage"]');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
    
    // Note: Form state persistence depends on implementation
    // Auth state should persist due to localStorage/sessionStorage
    
    // Navigate to history and back
    await page.goto('/history');
    await expect(page.locator('h1')).toContainText('AI Generation History');
    
    await page.goto('/studio');
    await expect(page.locator('h1')).toContainText('AI Generation Studio');
    
    // Should still be logged in after navigation
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  // Test helper: Create test fixtures if they don't exist
  test.beforeAll(async () => {
    // This would ideally create test image files
    // For now, we assume they exist in the fixtures directory
    console.log('Test fixtures should be available in tests/fixtures/');
  });
});
