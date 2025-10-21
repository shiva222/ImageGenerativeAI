import { Page, expect } from '@playwright/test';

// Generate unique test data for each run
export const generateTestUser = () => ({
  email: `test-${Date.now()}@example.com`,
  password: 'testPassword123!',
});

// Helper to create a test user and login
export async function createAndLoginUser(page: Page) {
  const testUser = generateTestUser();
  
  await page.goto('/signup');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.fill('input[name="confirmPassword"]', testUser.password);
  await page.click('button[type="submit"]:has-text("Create account")');
  
  // Wait for redirect to studio
  await expect(page).toHaveURL('/studio');
  
  return testUser;
}

// Helper to create a test image file
export async function createTestImageFile(fileName: string = 'test-image.png'): Promise<Uint8Array> {
  // Create a simple 100x100 PNG image buffer for testing
  // This is a minimal PNG with a white pixel
  const pngHeader = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x64, // Width: 100
    0x00, 0x00, 0x00, 0x64, // Height: 100
    0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0xFF, 0x80, 0x9D, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // IEND CRC
  ]);
  
  return pngHeader;
}

// Helper to upload a file to a file input
export async function uploadFile(page: Page, inputSelector: string, fileName: string = 'test-image.png') {
  const fileBuffer = await createTestImageFile(fileName);
  
  await page.setInputFiles(inputSelector, {
    name: fileName,
    mimeType: 'image/png',
    buffer: fileBuffer,
  });
}

// Helper to wait for API calls to complete
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(response => 
    (typeof urlPattern === 'string' ? response.url().includes(urlPattern) : urlPattern.test(response.url())) &&
    response.status() < 400
  );
}

// Helper to mock successful generation API response
export async function mockGenerationAPI(page: Page) {
  await page.route('**/api/generations', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generation: {
              id: 'test-generation-id',
              prompt: 'Test prompt',
              style: 'realistic',
              imageUrl: 'http://localhost:3001/uploads/test-image.jpg',
              resultUrl: 'http://localhost:3001/uploads/result-image.jpg',
              status: 'completed',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            generations: [
              {
                id: 'test-generation-1',
                prompt: 'A beautiful sunset',
                style: 'realistic',
                imageUrl: 'http://localhost:3001/uploads/test-1.jpg',
                resultUrl: 'http://localhost:3001/uploads/result-1.jpg',
                status: 'completed',
                createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
              },
              {
                id: 'test-generation-2',
                prompt: 'A mystical forest',
                style: 'artistic',
                imageUrl: 'http://localhost:3001/uploads/test-2.jpg',
                resultUrl: 'http://localhost:3001/uploads/result-2.jpg',
                status: 'completed',
                createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                updatedAt: new Date(Date.now() - 172800000).toISOString(),
              }
            ],
            total: 2,
            page: 1,
            limit: 20
          }
        })
      });
    }
  });
}

// Helper to mock failed generation API response
export async function mockFailedGenerationAPI(page: Page, errorMessage: string = 'Generation failed') {
  await page.route('**/api/generations', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: errorMessage
        })
      });
    }
  });
}

// Helper to check if element is visible and enabled
export async function expectElementEnabled(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toBeEnabled();
}

// Helper to check if element is visible but disabled
export async function expectElementDisabled(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toBeDisabled();
}

// Helper to wait for loading to finish
export async function waitForLoadingToFinish(page: Page) {
  await page.waitForFunction(() => {
    const loadingSpinners = document.querySelectorAll('[data-testid="loading-spinner"]');
    return loadingSpinners.length === 0;
  });
}

// Helper to check for toast notifications
export async function expectToastMessage(page: Page, message: string) {
  const toast = page.locator('.fixed.top-4.right-4', { hasText: message });
  await expect(toast).toBeVisible();
  
  // Wait for toast to disappear
  await expect(toast).not.toBeVisible({ timeout: 5000 });
}
