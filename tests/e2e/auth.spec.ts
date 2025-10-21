import { test, expect } from '@playwright/test';

// Generate unique test data for each run
const generateTestUser = () => ({
  email: `test-${Date.now()}@example.com`,
  password: 'testPassword123!',
});

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to login page from home', async ({ page }) => {
    // Click login link in navigation
    await page.click('a[href="/login"]');
    
    // Should be on login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('text=Sign in to continue your AI journey')).toBeVisible();
  });

  test('should navigate to signup page from login', async ({ page }) => {
    await page.goto('/login');
    
    // Click "Create account" link
    await page.click('a[href="/signup"]:has-text("Create account")');
    
    // Should be on signup page
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Join AI Studio');
  });

  test('should successfully sign up a new user', async ({ page }) => {
    const testUser = generateTestUser();
    
    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Should redirect to studio after successful signup
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('h1')).toContainText('AI Generation Studio');
    
    // Should show user is logged in (check for logout button in nav)
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should show validation errors for invalid signup data', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit with empty fields
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Should show validation message (HTML5 validation or custom)
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required');
    
    // Fill with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123'); // Too short
    await page.fill('input[name="confirmPassword"]', '456'); // Doesn't match
    
    await page.click('button[type="submit"]');
    
    // Should show password length validation
    await expect(page.locator('text=Password must be at least')).toBeVisible();
    
    // Should show password mismatch validation
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // First, create a user
    const testUser = generateTestUser();
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Wait for redirect to studio
    await expect(page).toHaveURL('/studio');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
    
    // Now login with same credentials
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Should redirect to studio
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try login with non-existent user
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Sign in")');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials').or(page.locator('text=Login failed'))).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL('/login');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('button[aria-label*="password"]').first();
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click toggle to hide password again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should logout successfully', async ({ page }) => {
    // Create and login user
    const testUser = generateTestUser();
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Should be logged in
    await expect(page).toHaveURL('/studio');
    
    // Logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Should not show logout button
    await expect(page.locator('button:has-text("Logout")')).not.toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access studio without being logged in
    await page.goto('/studio');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should persist login state across page refreshes', async ({ page }) => {
    // Create and login user
    const testUser = generateTestUser();
    
    await page.goto('/signup');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]:has-text("Create account")');
    
    // Should be logged in
    await expect(page).toHaveURL('/studio');
    
    // Refresh the page
    await page.reload();
    
    // Should still be logged in
    await expect(page).toHaveURL('/studio');
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });
});
