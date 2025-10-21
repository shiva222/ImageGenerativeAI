# Testing Documentation

This document provides comprehensive information about the testing setup and requirements for the AI Generation Studio project.

## 🧪 Testing Overview

Our testing strategy covers three main areas:
- **Backend Testing** (Jest + Supertest)
- **Frontend Testing** (React Testing Library + Vitest)
- **End-to-End Testing** (Playwright)

## 📊 Coverage Requirements

- **Minimum Coverage**: 70% for lines, functions, branches, and statements
- **Target Coverage**: 80%+ for production code
- Coverage reports are generated automatically in CI/CD
- Coverage artifacts are uploaded and available for download

## 🎯 Test Categories

### Backend Tests (Jest + Supertest)

**Location**: `backend/tests/`

**Coverage**:
- ✅ Authentication routes (signup, login, logout)
- ✅ Generation routes (create, list, get by ID)
- ✅ Input validation and error handling
- ✅ Authorization and access control
- ✅ Simulated processing and retry logic
- ✅ Database operations and data integrity
- ✅ Consistent error response structures
- ✅ HTTP status code validation
- ✅ Model overload simulation and handling

**Key Test Files**:
- `auth.test.ts` - Authentication flows and validation
- `generations.test.ts` - Generation lifecycle and error handling

**Running Backend Tests**:
```bash
cd backend
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### Frontend Tests (React Testing Library)

**Location**: `frontend/src/components/__tests__/`

**Coverage**:
- ✅ Component rendering and props
- ✅ User interactions and event handling
- ✅ Form validation and submission
- ✅ Loading states and error handling
- ✅ Generate flow (loading → success → history updates)
- ✅ Error and retry handling (up to 3 attempts)
- ✅ AbortController functionality for cancellation
- ✅ File upload and preview
- ✅ Style selection and prompt input
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Authentication context integration

**Key Test Files**:
- `LoginForm.test.tsx` - Login form functionality
- `SignupForm.test.tsx` - Signup form and validation
- `Studio.test.tsx` - Main generation interface
- `GenerationCard.test.tsx` - Generation display component
- `History.test.tsx` - History page functionality
- `AuthContext.test.tsx` - Authentication state management

**Running Frontend Tests**:
```bash
cd frontend
npm test                    # Run tests
npm run test:ui            # Interactive UI mode
npm run test:coverage      # With coverage report
```

### End-to-End Tests (Playwright)

**Location**: `tests/e2e/`

**Coverage**:
- ✅ Full user journey (signup → upload → generate → history → restore)
- ✅ Authentication flows and session persistence
- ✅ File upload and validation
- ✅ Generation process and status updates
- ✅ History filtering and management
- ✅ Error handling and recovery
- ✅ Mobile viewport compatibility
- ✅ Cross-browser compatibility
- ✅ Navigation and routing
- ✅ State persistence across page refreshes

**Key Test Files**:
- `auth.spec.ts` - Authentication workflows
- `studio.spec.ts` - Generation studio functionality
- `history.spec.ts` - History page operations
- `upload.spec.ts` - File upload scenarios
- `navigation.spec.ts` - Navigation and routing
- `error-handling.spec.ts` - Error scenarios
- `full-journey.spec.ts` - Complete user workflows

**Running E2E Tests**:
```bash
# From project root
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # Interactive UI mode
npx playwright test --headed  # With browser UI
npx playwright show-report   # View last results
```

## 🚀 CI/CD Integration

### GitHub Actions Workflow

**Location**: `.github/workflows/ci.yml`

**Pipeline Steps**:
1. **Backend Testing** - Runs Jest tests with coverage
2. **Frontend Testing** - Runs Vitest tests with coverage
3. **E2E Testing** - Runs Playwright tests with browsers
4. **Coverage Reporting** - Merges and uploads coverage
5. **Security Scanning** - Vulnerability detection
6. **Build & Deploy** - Production builds (main branch)

**Artifacts Generated**:
- Backend coverage reports (`backend-coverage`)
- Frontend coverage reports (`frontend-coverage`)
- Combined coverage report (`coverage-report`)
- E2E test results (`playwright-report`)
- E2E test videos (`playwright-videos`)
- Build artifacts (`build-artifacts`)

### Coverage Thresholds

```json
{
  "branches": 70,
  "functions": 70,
  "lines": 70,
  "statements": 70
}
```

### Test Environment Setup

**Required Environment Variables**:
```env
NODE_ENV=test
JWT_SECRET=test-secret-key
DB_PATH=:memory:  # For backend tests
```

**Test Database**:
- Uses SQLite in-memory database for isolation
- Fresh database for each test suite
- Automatic cleanup after tests

## 📁 Test Structure

```
aiProject/
├── backend/
│   ├── tests/
│   │   ├── setup.ts           # Test configuration
│   │   ├── auth.test.ts       # Auth endpoint tests
│   │   └── generations.test.ts # Generation endpoint tests
│   └── jest.config.js         # Jest configuration
├── frontend/
│   ├── src/
│   │   ├── test/
│   │   │   ├── setup.ts       # Test setup & utilities
│   │   │   └── utils.tsx      # Test helpers & mocks
│   │   └── components/
│   │       └── __tests__/     # Component tests
│   └── vite.config.ts         # Vitest configuration
├── tests/
│   ├── e2e/                   # Playwright tests
│   │   ├── auth.spec.ts
│   │   ├── studio.spec.ts
│   │   ├── history.spec.ts
│   │   ├── upload.spec.ts
│   │   ├── navigation.spec.ts
│   │   ├── error-handling.spec.ts
│   │   ├── full-journey.spec.ts
│   │   └── test-utils.ts
│   └── fixtures/              # Test assets
│       ├── test-image.jpg
│       └── test-document.txt
└── playwright.config.ts       # Playwright configuration
```

## 🎯 Test Scenarios Covered

### Authentication Flows
- ✅ Successful signup with valid data
- ✅ Signup validation (email format, password length, confirmation)
- ✅ Duplicate email handling
- ✅ Successful login with valid credentials
- ✅ Login validation and error handling
- ✅ Session persistence and token management
- ✅ Logout functionality
- ✅ Protected route access control

### Generation Workflows
- ✅ File upload validation (type, size)
- ✅ Prompt validation (required, length limits)
- ✅ Style selection functionality
- ✅ Generation creation and processing
- ✅ Success and failure scenarios
- ✅ Retry logic for overload errors (up to 3 attempts)
- ✅ Cancellation with AbortController
- ✅ Status updates and progress tracking
- ✅ Result display and history updates

### History Management
- ✅ Generation listing and pagination
- ✅ Status filtering (all, completed, failed, processing)
- ✅ Generation details display
- ✅ Restore functionality
- ✅ Refresh and reload capabilities
- ✅ Empty state handling
- ✅ Error recovery

### Error Handling
- ✅ Network errors and timeouts
- ✅ Server errors and overload scenarios
- ✅ Validation errors and user feedback
- ✅ Authentication failures
- ✅ File upload errors
- ✅ Graceful degradation

### Accessibility
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Color contrast and visual design
- ✅ Form validation announcements
- ✅ Loading state announcements

## 📈 Running All Tests

### Quick Commands

```bash
# Install all dependencies
npm run install:all

# Run all tests (backend + frontend)
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Development mode with watch
npm run test:backend:watch  # Backend watch mode
npm run test:frontend       # Frontend watch mode (default)
```

### Individual Test Commands

```bash
# Backend only
cd backend && npm test

# Frontend only
cd frontend && npm test

# E2E only
npm run test:e2e

# Specific test file
cd backend && npm test -- auth.test.ts
cd frontend && npm test -- LoginForm.test.tsx
npx playwright test auth.spec.ts
```

## 🔍 Debugging Tests

### Backend Debugging
```bash
cd backend
npm run test:watch  # Watch mode for development
npm test -- --verbose  # Detailed output
```

### Frontend Debugging
```bash
cd frontend
npm run test:ui  # Interactive UI mode
npm test -- --reporter=verbose  # Detailed output
```

### E2E Debugging
```bash
npx playwright test --headed  # Run with browser UI
npx playwright test --debug   # Debug mode
npx playwright show-report    # View test results
```

## 📋 Test Checklist

Before submitting code, ensure:

- [ ] All backend tests pass (`npm run test:backend`)
- [ ] All frontend tests pass (`npm run test:frontend`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Coverage thresholds are met (70%+)
- [ ] New features have corresponding tests
- [ ] Tests are documented and maintainable
- [ ] No flaky or intermittent failures
- [ ] Error scenarios are covered
- [ ] Accessibility requirements are tested

## 🛠 Maintenance

### Adding New Tests

1. **Backend**: Add test files in `backend/tests/`
2. **Frontend**: Add test files in `frontend/src/components/__tests__/`
3. **E2E**: Add test files in `tests/e2e/`

### Test Utilities

- Use shared test utilities from `frontend/src/test/utils.tsx`
- Mock API responses consistently
- Use proper cleanup in test teardown
- Follow existing naming conventions

### Coverage Goals

- Maintain minimum 70% coverage across all metrics
- Aim for 80%+ coverage on critical paths
- Focus on testing business logic and user interactions
- Don't test implementation details, test behavior

## 🔗 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
