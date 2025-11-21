import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});

