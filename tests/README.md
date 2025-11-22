# Test Suite

This directory contains all tests for the application.

## Structure

```
tests/
├── backend/          # Backend API tests (Vitest + Supertest)
├── frontend/
│   └── e2e/         # End-to-end tests (Playwright)
├── fixtures/        # Test data fixtures
└── helpers/         # Test utilities and helpers
```

## Running Tests

### All Tests
```bash
npm test              # Run all frontend unit tests
```

### Backend Tests
```bash
npm run test:backend           # Run backend API tests once
npm run test:backend:watch     # Run backend tests in watch mode
```

### Frontend E2E Tests
```bash
npm run test:e2e              # Run E2E tests headless
npm run test:ui:headed        # Run E2E tests with browser UI
npm run test:ui:debug         # Run E2E tests in debug mode
```

### Frontend Unit Tests
```bash
npm test                      # Run unit tests once
npm run test:watch            # Run unit tests in watch mode
npm run test:ui                # Run unit tests with UI
```

## Test Data Isolation

Backend tests use a separate test data file (`backend/data/test/tasks.json`) to avoid affecting development data. The test data file is automatically managed by test utilities.

## Test Helpers

### `tests/helpers/test-server.ts`
Creates a test Express server instance for API testing.

### `tests/helpers/test-utils.ts`
Utilities for managing test data:
- `setupTestData()` - Initialize test data
- `cleanupTestData()` - Clear test data
- `getTestDataFile()` - Get test data file path

### `tests/fixtures/test-data.ts`
Reusable test data fixtures and factory functions.

## Writing Tests

### Backend API Tests
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../helpers/test-server.js';
import { setupTestData, cleanupTestData } from '../helpers/test-utils.js';

describe('API Endpoint', () => {
  let app: ReturnType<typeof createTestServer>;
  
  beforeEach(() => {
    setupTestData([]);
    app = createTestServer();
  });

  afterEach(() => {
    cleanupTestData();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/endpoint')
      .expect(200);
    
    expect(response.body).toEqual({});
  });
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('element')).toBeVisible();
});
```

## Data Test IDs

All interactive UI elements have `data-testid` attributes for reliable E2E testing:

- `task-input` - Task input field
- `task-add-button` - Add task button
- `task-{id}` - Task list item
- `task-toggle-{id}` - Toggle task completion
- `task-delete-{id}` - Delete task button
- `active-tasks-section` - Active tasks section
- `completed-tasks-section` - Completed tasks section
- `active-tasks-count` - Active tasks counter
- `completed-tasks-count` - Completed tasks counter
- `active-tasks-toggle` - Collapse/expand active tasks
- `completed-tasks-toggle` - Collapse/expand completed tasks

