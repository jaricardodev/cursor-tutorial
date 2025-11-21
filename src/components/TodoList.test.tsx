import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';

describe('TodoList', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('renders the todo list heading', () => {
    render(<TodoList />);
    expect(screen.getByText('Todo List')).toBeInTheDocument();
  });

  it('shows empty message when no tasks', () => {
    render(<TodoList />);
    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  it('renders the todo list container', () => {
    render(<TodoList />);
    expect(screen.getByTestId('todo-list')).toBeInTheDocument();
  });

  it('adds a new task when form is submitted', async () => {
    const user = userEvent.setup();
    render(<TodoList />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, 'First Task');
    await user.click(button);
    
    expect(screen.getByText('First Task')).toBeInTheDocument();
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
    
    // Verify First Active is now at the top of active list
    const activeList = screen.getByTestId('task-list');
    const taskItems = activeList.querySelectorAll('li[data-testid^="task-"]');
    expect(taskItems).toHaveLength(2);
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

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('saves tasks to localStorage when a task is added', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'New Task');
      await user.click(button);
      
      const stored = localStorage.getItem('todo-app-tasks');
      expect(stored).toBeTruthy();
      
      const tasks = JSON.parse(stored || '[]');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('New Task');
      expect(tasks[0].completed).toBe(false);
    });

    it('saves tasks to localStorage when a task is toggled', async () => {
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
      
      const stored = localStorage.getItem('todo-app-tasks');
      const tasks = JSON.parse(stored || '[]');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].completed).toBe(true);
    });

    it('saves tasks to localStorage when a task is deleted', async () => {
      const user = userEvent.setup();
      render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Task to Delete');
      await user.click(button);
      
      await user.type(input, 'Task to Keep');
      await user.click(button);
      
      const taskElement = screen.getByText('Task to Delete').closest('li');
      const taskId = taskElement?.getAttribute('data-testid')?.replace('task-', '') || '';
      const deleteButton = screen.getByTestId(`task-delete-${taskId}`);
      await user.click(deleteButton);
      
      const stored = localStorage.getItem('todo-app-tasks');
      const tasks = JSON.parse(stored || '[]');
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task to Keep');
    });

    it('loads tasks from localStorage on mount', () => {
      const mockTasks = [
        {
          id: 'test-id-1',
          title: 'Stored Active Task',
          completed: false,
          createdAt: Date.now(),
        },
        {
          id: 'test-id-2',
          title: 'Stored Completed Task',
          completed: true,
          createdAt: Date.now(),
        },
      ];
      localStorage.setItem('todo-app-tasks', JSON.stringify(mockTasks));
      
      render(<TodoList />);
      
      expect(screen.getByText('Stored Active Task')).toBeInTheDocument();
      expect(screen.getByText('Stored Completed Task')).toBeInTheDocument();
      expect(screen.getByTestId('active-tasks-section')).toBeInTheDocument();
      expect(screen.getByTestId('completed-tasks-section')).toBeInTheDocument();
    });

    it('persists tasks across component remounts', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<TodoList />);
      
      const input = screen.getByTestId('task-input');
      const button = screen.getByTestId('task-add-button');
      
      await user.type(input, 'Persistent Task');
      await user.click(button);
      
      expect(screen.getByText('Persistent Task')).toBeInTheDocument();
      
      unmount();
      
      const { container } = render(<TodoList />);
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Persistent Task')).toBeInTheDocument();
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('todo-app-tasks', 'invalid json');
      
      render(<TodoList />);
      
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });

    it('handles empty localStorage gracefully', () => {
      localStorage.clear();
      
      render(<TodoList />);
      
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });
  });
});

