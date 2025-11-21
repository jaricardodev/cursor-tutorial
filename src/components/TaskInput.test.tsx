import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskInput } from './TaskInput';

describe('TaskInput', () => {
  it('renders input and button', () => {
    const onAddTask = vi.fn();
    render(<TaskInput onAddTask={onAddTask} />);
    
    expect(screen.getByTestId('task-input')).toBeInTheDocument();
    expect(screen.getByTestId('task-add-button')).toBeInTheDocument();
  });

  it('calls onAddTask with trimmed title when form is submitted', async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn();
    render(<TaskInput onAddTask={onAddTask} />);
    
    const input = screen.getByTestId('task-input');
    const button = screen.getByTestId('task-add-button');
    
    await user.type(input, '  New Task  ');
    await user.click(button);
    
    expect(onAddTask).toHaveBeenCalledWith('New Task');
    expect(input).toHaveValue('');
  });

  it('does not call onAddTask when input is empty', async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn();
    render(<TaskInput onAddTask={onAddTask} />);
    
    const button = screen.getByTestId('task-add-button');
    await user.click(button);
    
    expect(onAddTask).not.toHaveBeenCalled();
  });

  it('clears input after adding task', async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn();
    render(<TaskInput onAddTask={onAddTask} />);
    
    const input = screen.getByTestId('task-input');
    await user.type(input, 'Test Task');
    await user.click(screen.getByTestId('task-add-button'));
    
    expect(input).toHaveValue('');
  });
});

