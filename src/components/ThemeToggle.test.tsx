import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('theme-toggle');
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows moon icon in light theme', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('theme-toggle');
    const icon = toggleButton.querySelector('i');
    expect(icon).toHaveClass('fa-moon');
  });

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('theme-toggle');
    const icon = toggleButton.querySelector('i');
    
    expect(icon).toHaveClass('fa-moon');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    
    await user.click(toggleButton);
    
    expect(icon).toHaveClass('fa-sun');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    await user.click(toggleButton);
    
    expect(icon).toHaveClass('fa-moon');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists theme preference in localStorage', async () => {
    const user = userEvent.setup();
    localStorage.clear();
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('theme-toggle');
    await user.click(toggleButton);
    
    expect(localStorage.getItem('todo-app-theme')).toBe('dark');
    
    await user.click(toggleButton);
    
    expect(localStorage.getItem('todo-app-theme')).toBe('light');
  });

  it('loads theme from localStorage on mount', () => {
    localStorage.setItem('todo-app-theme', 'dark');
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByTestId('theme-toggle');
    const icon = toggleButton.querySelector('i');
    expect(icon).toHaveClass('fa-sun');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    localStorage.clear();
  });
});

