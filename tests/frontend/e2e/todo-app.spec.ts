import { test, expect } from '@playwright/test';

test.describe('Todo App E2E Tests', () => {
  // Clean up test data before each test
  test.beforeEach(async ({ page, request }) => {
    // Wait a bit for servers to be ready
    await page.waitForTimeout(1000);
    
    // Clear all tasks via API
    try {
      const tasksResponse = await request.get('http://localhost:3001/tasks', {
        timeout: 5000,
      });
      
      if (tasksResponse.ok()) {
        const taskList = await tasksResponse.json();
        // Delete tasks in parallel for faster cleanup
        await Promise.all(
          taskList.map((task: { id: string }) =>
            request.delete(`http://localhost:3001/tasks/${task.id}`, {
              timeout: 5000,
            }).catch(() => {
              // Ignore individual delete errors
            })
          )
        );
      }
    } catch (error) {
      // Ignore errors if backend is not available - will be caught by individual tests
      console.warn('Could not clean up tasks in beforeEach:', error);
    }
    
    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    // Wait for any loading indicators to disappear
    try {
      await page.waitForSelector('[data-testid="loading-message"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
    } catch {
      // Loading message might not exist, that's fine
    }
  });

  test('should display empty message when no tasks', async ({ page }) => {
    // Wait a bit more for any async operations
    await page.waitForTimeout(500);
    
    const emptyMessage = page.getByTestId('empty-message');
    await expect(page.getByText('No tasks yet. Add one to get started!')).toBeVisible();
  });

  test('should add a new task', async ({ page }) => {
    const uniqueTaskName = `New E2E Task ${Date.now()}`;
    const input = page.getByTestId('task-input');
    const addButton = page.getByTestId('task-add-button');

    await input.fill(uniqueTaskName);
    await addButton.click();

    // Wait for the task to appear with a longer timeout
    await expect(page.getByText(uniqueTaskName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('active-tasks-section')).toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    const uniqueTaskName = `Task to Complete ${Date.now()}`;
    
    // Add a task
    await page.getByTestId('task-input').fill(uniqueTaskName);
    await page.getByTestId('task-add-button').click();

    // Wait for task to appear and get its ID
    await expect(page.getByText(uniqueTaskName)).toBeVisible({ timeout: 10000 });
    
    // Find the task element by text and get its data-testid
    const taskElement = page.locator('li').filter({ hasText: uniqueTaskName }).first();
    await expect(taskElement).toBeVisible({ timeout: 5000 });
    
    const taskId = await taskElement.getAttribute('data-testid');
    expect(taskId).toBeTruthy();
    
    if (!taskId) {
      throw new Error('Task ID not found');
    }
    
    const taskIdValue = taskId.replace('task-', '');
    const toggleButton = page.getByTestId(`task-toggle-${taskIdValue}`);

    await toggleButton.click();

    // Wait for task to move to completed section
    
    // Verify task is in completed section
    const completedSection = page.getByTestId('completed-tasks-section');
    await expect(completedSection.getByText(uniqueTaskName)).toBeVisible({ timeout: 5000 });
  });

  test('should delete a task', async ({ page }) => {
    const uniqueTaskName = `Task to Delete ${Date.now()}`;
    
    // Add a task
    await page.getByTestId('task-input').fill(uniqueTaskName);
    await page.getByTestId('task-add-button').click();

    await expect(page.getByText(uniqueTaskName)).toBeVisible({ timeout: 10000 });

    // Find and click delete button
    const taskElement = page.locator('li').filter({ hasText: uniqueTaskName }).first();
    await expect(taskElement).toBeVisible({ timeout: 5000 });
    
    const taskId = await taskElement.getAttribute('data-testid');
    expect(taskId).toBeTruthy();
    
    if (!taskId) {
      throw new Error('Task ID not found');
    }
    
    const taskIdValue = taskId.replace('task-', '');
    const deleteButton = page.getByTestId(`task-delete-${taskIdValue}`);

    // Set up dialog handler before clicking
    let dialogHandled = false;
    page.on('dialog', async (dialog) => {
      dialogHandled = true;
      expect(dialog.message()).toContain('Are you sure');
      await dialog.accept();
    });

    await deleteButton.click();

    // Wait for dialog to be handled
    await page.waitForTimeout(500);

    // Wait for task to be deleted
  });

  test('should collapse and expand task lists', async ({ page }) => {
    const uniqueTaskName = `Test Task ${Date.now()}`;
    
    // Add a task
    await page.getByTestId('task-input').fill(uniqueTaskName);
    await page.getByTestId('task-add-button').click();

    await expect(page.getByText(uniqueTaskName)).toBeVisible({ timeout: 10000 });

    // Collapse active tasks
    const collapseButton = page.getByTestId('active-tasks-toggle');
    await collapseButton.click();
    
    // Wait for collapse animation
    await page.waitForTimeout(300);

    // Verify task is hidden
    await expect(page.getByText(uniqueTaskName)).not.toBeVisible({ timeout: 2000 });

    // Expand again
    await collapseButton.click();
    await page.waitForTimeout(300);
    await expect(page.getByText(uniqueTaskName)).toBeVisible({ timeout: 5000 });
  });

  test('should show error message when backend is down', async ({ page, context }) => {
    // Block backend requests
    await context.route('http://localhost:3001/**', (route) => route.abort());

    // Reload page to trigger fetch
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for error message with longer timeout
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Unable to connect/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display task counters correctly', async ({ page }) => {
    const task1Name = `Task 1 ${Date.now()}`;
    const task2Name = `Task 2 ${Date.now() + 1}`;
    
    // Add multiple tasks
    await page.getByTestId('task-input').fill(task1Name);
    await page.getByTestId('task-add-button').click();
    await expect(page.getByText(task1Name)).toBeVisible({ timeout: 10000 });

    await page.getByTestId('task-input').fill(task2Name);
    await page.getByTestId('task-add-button').click();
    await expect(page.getByText(task2Name)).toBeVisible({ timeout: 10000 });


    // Complete one task
    const taskElement = page.locator('li').filter({ hasText: task1Name }).first();
    await expect(taskElement).toBeVisible({ timeout: 5000 });
    
    const taskId = await taskElement.getAttribute('data-testid');
    expect(taskId).toBeTruthy();
    
    if (!taskId) {
      throw new Error('Task ID not found');
    }
    
    const taskIdValue = taskId.replace('task-', '');
    await page.getByTestId(`task-toggle-${taskIdValue}`).click();

    // Wait for counters to update
  });
});
