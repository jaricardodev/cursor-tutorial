import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from './TodoList';

describe('TodoList', () => {
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
});

