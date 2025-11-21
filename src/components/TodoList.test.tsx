import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  fetchTasks: vi.fn(),
  createTask: vi.fn(),
  toggleTask: vi.fn(),
  deleteTask: vi.fn(),
  ApiError: class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  },
}));

describe('TodoList', () => {
  let mockTasks: any[] = [];
  
  beforeEach(() => {
    localStorage.clear();
    window.confirm = vi.fn(() => true);
    mockTasks = [];
    
    vi.mocked(api.fetchTasks).mockImplementation(async () => {
      // Return tasks sorted by newest first (like the backend)
      return [...mockTasks].sort((a, b) => b.createdAtMs - a.createdAtMs);
    });
    
    vi.mocked(api.createTask).mockImplementation(async (title: string) => {
      const newTask = {
        id: crypto.randomUUID(),
        title: title.trim(),
        completed: false,
        createdAtMs: Date.now(),
      };
      mockTasks.unshift(newTask); // Add to beginning (newest first)
      return newTask;
    });
    
    vi.mocked(api.toggleTask).mockImplementation(async (id: string) => {
      const task = mockTasks.find((t) => t.id === id);
      if (task) {
        task.completed = !task.completed;
        // Update createdAtMs to make it newest when toggled (moves to top)
        task.createdAtMs = Date.now();
        return { ...task };
      }
      throw new api.ApiError('Task not found', 404);
    });
    
    vi.mocked(api.deleteTask).mockImplementation(async (id: string) => {
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTasks.splice(index, 1);
      }
    });
  });
  
  it('renders the todo list heading', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Todo List')).toBeInTheDocument();
    });
  });

  it('shows empty message when no tasks', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });
  });

  it('renders the todo list container', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByTestId('todo-list')).toBeInTheDocument();
    });
  });

  it('adds a new task when form is submitted', async () => {
    const user = userEvent.setup();
    const mockTask = {
      id: 'test-id-1',
      title: 'First Task',
      completed: false,
      createdAtMs: Date.now(),
    };
    vi.mocked(api.createTask).mockResolvedValueOnce(mockTask);
    
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
    });
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Task');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('First Task')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('empty-message')).not.toBeInTheDocument();
  });

  it('adds multiple tasks and new tasks appear on top', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Task');
    await user.click(button);
    
    await user.type(input, 'Second Task');
    await user.click(button);
    
    const taskList = screen.getByTestId('task-list');
    const taskItems = taskList.querySelectorAll('li[data-testid^="task-"]');
    expect(taskItems).toHaveLength(2);
    expect(taskItems[0]).toHaveTextContent('Second Task');
    expect(taskItems[1]).toHaveTextContent('First Task');
  });

  it('creates tasks with correct properties', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Test Task');
    await user.click(button);
    
    const taskElement = screen.getByText('Test Task');
    expect(taskElement).toBeInTheDocument();
    const taskId = taskElement.closest('li')?.getAttribute('data-testid');
    expect(taskId).toMatch(/^task-[a-f0-9-]+$/);
  });

  it('moves task to completed list when radio button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Task to Complete');
    await user.click(button);
    
    expect(screen.getByText('Task to Complete')).toBeInTheDocument();
    expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    
    const taskId = screen.getByText('Task to Complete').closest('li')?.getAttribute('data-testid')?.replace('task-', '');
    const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
    
    await user.click(toggleButton);
    
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
    const completedList = screen.getByTestId('completed-task-list');
    expect(completedList).toHaveTextContent('Task to Complete');
    expect(screen.queryByTestId('active-tasks-section')).not.toBeInTheDocument();
  });

  it('moves task back to active list when radio button is clicked on completed task', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Task to Toggle');
    await user.click(button);
    
    const taskElement = screen.getByText('Task to Toggle').closest('li');
    const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
    
    await user.click(toggleButton);
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    expect(screen.queryByTestId('active-tasks-section')).not.toBeInTheDocument();
    
    const completedTaskElement = screen.getByText('Task to Toggle').closest('li');
    const completedTaskId = completedTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const completedToggleButton = screen.getByTestId(`task-toggle-${completedTaskId}`);
    await user.click(completedToggleButton);
    
    expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('active-tasks-section')).toBeInTheDocument();
    const activeList = screen.getByTestId('task-list');
    expect(activeList).toHaveTextContent('Task to Toggle');
  });

  it('moves completed task to top of active list when toggled', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Active');
    await user.click(button);
    
    await user.type(input, 'Second Active');
    await user.click(button);
    
    // Verify initial order: Second Active should be first (newest on top)
    const initialActiveList = screen.getByTestId('task-list');
    const initialItems = initialActiveList.querySelectorAll('li[data-testid^="task-"]');
    expect(initialItems[0]).toHaveTextContent('Second Active');
    expect(initialItems[1]).toHaveTextContent('First Active');
    
    // Complete First Active
    const firstTaskElement = screen.getByText('First Active').closest('li');
    const firstTaskId = firstTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const firstToggle = screen.getByTestId(`task-toggle-${firstTaskId}`);
    await user.click(firstToggle);
    
    // Verify First Active is in completed list
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    
    // Uncomplete First Active - it should move to top of active list
    const completedFirstTaskElement = screen.getByText('First Active').closest('li');
    const completedFirstTaskId = completedFirstTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const completedToggle = screen.getByTestId(`task-toggle-${completedFirstTaskId}`);
    await user.click(completedToggle);
    
    // Wait for tasks to reload after toggle
    await waitFor(() => {
      const activeList = screen.getByTestId('task-list');
      const taskItems = activeList.querySelectorAll('li[data-testid^="task-"]');
      expect(taskItems).toHaveLength(2);
    });
    
    // Verify First Active is now at the top of active list (newest first after toggle)
    const activeList = screen.getByTestId('task-list');
    const taskItems = activeList.querySelectorAll('li[data-testid^="task-"]');
    expect(taskItems[0]).toHaveTextContent('First Active');
    expect(taskItems[1]).toHaveTextContent('Second Active');
  });

  it('moves active task to top of completed list when toggled', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Task');
    await user.click(button);
    
    await user.type(input, 'Second Task');
    await user.click(button);
    
    const firstTaskId = screen.getByText('First Task').closest('li')?.getAttribute('data-testid')?.replace('task-', '');
    const secondTaskId = screen.getByText('Second Task').closest('li')?.getAttribute('data-testid')?.replace('task-', '');
    
    const secondToggle = screen.getByTestId(`task-toggle-${secondTaskId}`);
    await user.click(secondToggle);
    
    const firstToggle = screen.getByTestId(`task-toggle-${firstTaskId}`);
    await user.click(firstToggle);
    
    // Wait for tasks to reload after toggle
    await waitFor(() => {
      const completedList = screen.getByTestId('completed-task-list');
      expect(completedList).toBeInTheDocument();
    });
    
    const completedList = screen.getByTestId('completed-task-list');
    const taskItems = completedList.querySelectorAll('li[data-testid^="task-"]');
    expect(taskItems[0]).toHaveTextContent('First Task');
    expect(taskItems[1]).toHaveTextContent('Second Task');
  });

  it('deletes an active task when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Task to Delete');
    await user.click(button);
    
    expect(screen.getByText('Task to Delete')).toBeInTheDocument();
    
    const taskElement = screen.getByText('Task to Delete').closest('li');
    const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
    
    await user.click(deleteButton);
    
    expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
  });

  it('deletes a completed task when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Task to Complete and Delete');
    await user.click(button);
    
    const taskElement = screen.getByText('Task to Complete and Delete').closest('li');
    const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
    await user.click(toggleButton);
    
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    expect(screen.getByText('Task to Complete and Delete')).toBeInTheDocument();
    
    const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
    await user.click(deleteButton);
    
    expect(screen.queryByText('Task to Complete and Delete')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
  });

  it('deletes only the selected task and keeps others', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Task');
    await user.click(button);
    
    await user.type(input, 'Second Task');
    await user.click(button);
    
    await user.type(input, 'Third Task');
    await user.click(button);
    
    const secondTaskElement = screen.getByText('Second Task').closest('li');
    const secondTaskId = secondTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const deleteButton = screen.getByTestId(`task-delete-${secondTaskId}`);
    
    await user.click(deleteButton);
    
    expect(screen.queryByText('Second Task')).not.toBeInTheDocument();
    expect(screen.getByText('First Task')).toBeInTheDocument();
    expect(screen.getByText('Third Task')).toBeInTheDocument();
    
    const activeList = screen.getByTestId('task-list');
    const taskItems = activeList.querySelectorAll('li[data-testid^="task-"]');
    expect(taskItems).toHaveLength(2);
  });

  it('can delete tasks from both active and completed lists', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Active Task');
    await user.click(button);
    
    await user.type(input, 'Completed Task');
    await user.click(button);
    
    const completedTaskElement = screen.getByText('Completed Task').closest('li');
    const completedTaskId = completedTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const completedToggle = screen.getByTestId(`task-toggle-${completedTaskId}`);
    await user.click(completedToggle);
    
    expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    expect(screen.getByTestId('active-tasks-section')).toBeInTheDocument();
    
    const activeTaskElement = screen.getByText('Active Task').closest('li');
    const activeTaskId = activeTaskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const activeDeleteButton = screen.getByTestId(`task-delete-${activeTaskId}`);
    await user.click(activeDeleteButton);
    
    expect(screen.queryByText('Active Task')).not.toBeInTheDocument();
    expect(screen.getByText('Completed Task')).toBeInTheDocument();
    expect(screen.queryByTestId('active-tasks-section')).not.toBeInTheDocument();
    
    const completedDeleteButton = screen.getByTestId(`task-delete-${completedTaskId}`);
    await user.click(completedDeleteButton);
    
    expect(screen.queryByText('Completed Task')).not.toBeInTheDocument();
    expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
  });

  it('does not delete task when user cancels confirmation', async () => {
    const user = userEvent.setup();
    window.confirm = vi.fn(() => false);
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'Task to Keep');
    await user.click(button);
    
    expect(screen.getByText('Task to Keep')).toBeInTheDocument();
    
    const taskElement = screen.getByText('Task to Keep').closest('li');
    const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
    const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
    
    await user.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Task to Keep"?');
    expect(screen.getByText('Task to Keep')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-message')).not.toBeInTheDocument();
  });

  describe('API error handling', () => {
    it('shows error message when API is down on load', async () => {
      vi.mocked(api.fetchTasks).mockRejectedValueOnce(
        new api.ApiError('Unable to connect to server. Please check if the backend is running.')
      );
      
      render(<TodoList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(/Unable to connect to server/i)).toBeInTheDocument();
      });
    });

    it('shows error message when creating task fails', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createTask).mockRejectedValueOnce(
        new api.ApiError('Failed to create task')
      );
      
      render(<TodoList />);
      await waitFor(() => {
        expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
      });
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Test Task');
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to create task')).toBeInTheDocument();
      });
    });

    it('shows error message when toggling task fails', async () => {
      const user = userEvent.setup();
      const mockTask = {
        id: 'test-id-1',
        title: 'Test Task',
        completed: false,
        createdAtMs: Date.now(),
      };
      vi.mocked(api.fetchTasks).mockResolvedValueOnce([mockTask]);
      vi.mocked(api.toggleTask).mockRejectedValueOnce(
        new api.ApiError('Failed to toggle task')
      );
      
      render(<TodoList />);
      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
      
      const taskElement = screen.getByText('Test Task').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Failed to toggle task')).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      vi.mocked(api.fetchTasks)
        .mockRejectedValueOnce(new api.ApiError('Connection failed'))
        .mockResolvedValueOnce([]);
      
      render(<TodoList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      });
    });

    it('loads tasks from API on mount', async () => {
      const mockTasks = [
        {
          id: 'test-id-1',
          title: 'Stored Active Task',
          completed: false,
          createdAtMs: Date.now(),
        },
        {
          id: 'test-id-2',
          title: 'Stored Completed Task',
          completed: true,
          createdAtMs: Date.now(),
        },
      ];
      vi.mocked(api.fetchTasks).mockResolvedValueOnce(mockTasks);
      
      render(<TodoList />);
      
      await waitFor(() => {
        expect(screen.getByText('Stored Active Task')).toBeInTheDocument();
        expect(screen.getByText('Stored Completed Task')).toBeInTheDocument();
        expect(screen.getByTestId('active-tasks-section')).toBeInTheDocument();
        expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
      });
    });
  });

  describe('list counters', () => {
    it('displays active tasks count when there are active tasks', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'First Task');
      await user.click(button);
      
      await user.type(input, 'Second Task');
      await user.click(button);
      
      const activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toBeInTheDocument();
      expect(activeCount).toHaveTextContent('(2)');
    });

    it('displays completed tasks count when there are completed tasks', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task to Complete');
      await user.click(button);
      
      const taskElement = screen.getByText('Task to Complete').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      const completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toBeInTheDocument();
      expect(completedCount).toHaveTextContent('(1)');
    });

    it('updates active tasks count when a task is added', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'First Task');
      await user.click(button);
      
      let activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(1)');
      
      await user.type(input, 'Second Task');
      await user.click(button);
      
      activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(2)');
    });

    it('updates active tasks count when a task is completed', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'First Task');
      await user.click(button);
      
      await user.type(input, 'Second Task');
      await user.click(button);
      
      let activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(2)');
      
      const taskElement = screen.getByText('First Task').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(1)');
      
      const completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toHaveTextContent('(1)');
    });

    it('updates completed tasks count when a task is uncompleted', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task to Toggle');
      await user.click(button);
      
      const taskElement = screen.getByText('Task to Toggle').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      let completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toHaveTextContent('(1)');
      
      const completedToggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(completedToggleButton);
      
      expect(screen.queryByTestId('completed-tasks-count')).not.toBeInTheDocument();
      const activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(1)');
    });

    it('updates active tasks count when a task is deleted', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'First Task');
      await user.click(button);
      
      await user.type(input, 'Second Task');
      await user.click(button);
      
      let activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(2)');
      
      const taskElement = screen.getByText('First Task').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
      await user.click(deleteButton);
      
      activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(1)');
    });

    it('updates completed tasks count when a completed task is deleted', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task to Complete');
      await user.click(button);
      
      const taskElement = screen.getByText('Task to Complete').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      let completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toHaveTextContent('(1)');
      
      const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
      await user.click(deleteButton);
      
      expect(screen.queryByTestId('completed-tasks-count')).not.toBeInTheDocument();
      expect(screen.queryByTestId('completed-tasks-section')).not.toBeInTheDocument();
    });

    it('displays correct counts for multiple tasks in both lists', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task 1');
      await user.click(button);
      
      await user.type(input, 'Task 2');
      await user.click(button);
      
      await user.type(input, 'Task 3');
      await user.click(button);
      
      let activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(3)');
      
      const task2Element = screen.getByText('Task 2').closest('li');
      const task2Id = task2Element?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleTask2 = screen.getByTestId(`task-toggle-${task2Id}`);
      await user.click(toggleTask2);
      
      const task3Element = screen.getByText('Task 3').closest('li');
      const task3Id = task3Element?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleTask3 = screen.getByTestId(`task-toggle-${task3Id}`);
      await user.click(toggleTask3);
      
      activeCount = screen.getByTestId('active-tasks-count');
      expect(activeCount).toHaveTextContent('(1)');
      
      const completedCount = screen.getByTestId('completed-tasks-count');
      expect(completedCount).toHaveTextContent('(2)');
    });
  });

  describe('collapsible lists', () => {
    it('can collapse and expand active tasks list', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Active Task');
      await user.click(button);
      
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
      expect(screen.getByText('Active Task')).toBeInTheDocument();
      
      const toggleButton = screen.getByTestId('active-tasks-toggle');
      await user.click(toggleButton);
      
      expect(screen.queryByTestId('task-list')).not.toBeInTheDocument();
      expect(screen.queryByText('Active Task')).not.toBeInTheDocument();
      
      await user.click(toggleButton);
      
      expect(screen.getByTestId('task-list')).toBeInTheDocument();
      expect(screen.getByText('Active Task')).toBeInTheDocument();
    });

    it('can collapse and expand completed tasks list', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task to Complete');
      await user.click(button);
      
      const taskElement = screen.getByText('Task to Complete').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const toggleButton = screen.getByTestId(`task-toggle-${taskId}`);
      await user.click(toggleButton);
      
      expect(screen.getByTestId('completed-task-list')).toBeInTheDocument();
      expect(screen.getByText('Task to Complete')).toBeInTheDocument();
      
      const collapseToggle = screen.getByTestId('completed-tasks-toggle');
      await user.click(collapseToggle);
      
      expect(screen.queryByTestId('completed-task-list')).not.toBeInTheDocument();
      expect(screen.queryByText('Task to Complete')).not.toBeInTheDocument();
      
      await user.click(collapseToggle);
      
      expect(screen.getByTestId('completed-task-list')).toBeInTheDocument();
      expect(screen.getByText('Task to Complete')).toBeInTheDocument();
    });

    it('shows chevron up icon when expanded and chevron down when collapsed', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Test Task');
      await user.click(button);
      
      const toggleButton = screen.getByTestId('active-tasks-toggle');
      const chevronIcon = toggleButton.querySelector('i');
      
      expect(chevronIcon).toHaveClass('fa-chevron-up');
      
      await user.click(toggleButton);
      
      expect(chevronIcon).toHaveClass('fa-chevron-down');
    });
  });
});

