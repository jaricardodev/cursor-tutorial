import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem';
import type { Task } from '../types';

describe('TaskItem', () => {
  const mockTask: Task = {
    id: 'test-id-1',
    title: 'Test Task',
    completed: false,
    createdAtMs: Date.now(),
  };

  it('renders task title', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders radio button', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const radio = screen.getByTestId('task-toggle-test-id-1');
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute('type', 'radio');
  });

  it('renders delete button', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const deleteButton = screen.getByTestId('task-delete-test-id-1');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton.querySelector('i.fa-trash')).toBeInTheDocument();
  });

  it('radio button is unchecked for active task', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const radio = screen.getByTestId('task-toggle-test-id-1');
    expect(radio).not.toBeChecked();
  });

  it('radio button is checked for completed task', () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const completedTask = { ...mockTask, completed: true };
    render(<TaskItem task={completedTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const radio = screen.getByTestId('task-toggle-test-id-1');
    expect(radio).toBeChecked();
  });

  it('calls onToggle when radio button is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const radio = screen.getByTestId('task-toggle-test-id-1');
    await user.click(radio);
    
    expect(onToggle).toHaveBeenCalledWith('test-id-1');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button is clicked and user confirms', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => true);
    
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const deleteButton = screen.getByTestId('task-delete-test-id-1');
    await user.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Task"?');
    expect(onDelete).toHaveBeenCalledWith('test-id-1');
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not call onDelete when delete button is clicked and user cancels', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    window.confirm = vi.fn(() => false);
    
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={onDelete} />);
    
    const deleteButton = screen.getByTestId('task-delete-test-id-1');
    await user.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Task"?');
    expect(onDelete).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

