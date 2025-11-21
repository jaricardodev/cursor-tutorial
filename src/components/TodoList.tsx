import { useState, useMemo, useEffect } from 'react';
import type { Task } from '../types';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';
import { fetchTasks, createTask, toggleTask, deleteTask, ApiError } from '../services/api';

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActiveCollapsed, setIsActiveCollapsed] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load tasks';
      setError(errorMessage);
      console.error('Failed to load tasks:', err);
      // Log additional debugging info
      if (err instanceof ApiError && err.message.includes('Unable to connect')) {
        console.error('Backend server should be running on http://localhost:3001');
        console.error('Run: npm run start:backend or npm run dev:backend');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks]
  );

  const handleAddTask = async (title: string) => {
    setError(null);
    try {
      const newTask = await createTask(title);
      setTasks((prevTasks) => [newTask, ...prevTasks]);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create task';
      setError(errorMessage);
      console.error('Failed to create task:', err);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    setError(null);
    const previousTasks = [...tasks];
    
    // Optimistic update
    setTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = prevTasks[taskIndex];
      const updatedTask = { ...task, completed: !task.completed };
      const otherTasks = prevTasks.filter((t) => t.id !== taskId);

      return [updatedTask, ...otherTasks];
    });

    try {
      await toggleTask(taskId);
      // Reload all tasks to maintain server-side ordering (newest first)
      const fetchedTasks = await fetchTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      // Revert optimistic update on error
      setTasks(previousTasks);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to toggle task';
      setError(errorMessage);
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setError(null);
    const previousTasks = [...tasks];
    
    // Optimistic update
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

    try {
      await deleteTask(taskId);
    } catch (err) {
      // Revert optimistic update on error
      setTasks(previousTasks);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div data-testid="todo-list">
      <h1>Todo List</h1>
      {error && (
        <div data-testid="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
          <button onClick={loadTasks} type="button">
            Retry
          </button>
        </div>
      )}
      <TaskInput onAddTask={handleAddTask} />
      {isLoading ? (
        <p data-testid="loading-message">Loading tasks...</p>
      ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
        <p data-testid="empty-message">No tasks yet. Add one to get started!</p>
      ) : (
        <>
          {activeTasks.length > 0 && (
            <div data-testid="active-tasks-section">
              <h2>
                <button
                  type="button"
                  onClick={() => setIsActiveCollapsed(!isActiveCollapsed)}
                  className="collapse-toggle"
                  data-testid="active-tasks-toggle"
                  aria-label={isActiveCollapsed ? 'Expand active tasks' : 'Collapse active tasks'}
                >
                  <i className={`fas fa-chevron-${isActiveCollapsed ? 'down' : 'up'}`}></i>
                </button>
                Active Tasks{' '}
                <span data-testid="active-tasks-count">({activeTasks.length})</span>
              </h2>
              {!isActiveCollapsed && (
                <ul data-testid="task-list">
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
          {completedTasks.length > 0 && (
            <div data-testid="completed-tasks-section">
              <h2>
                <button
                  type="button"
                  onClick={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
                  className="collapse-toggle"
                  data-testid="completed-tasks-toggle"
                  aria-label={isCompletedCollapsed ? 'Expand completed tasks' : 'Collapse completed tasks'}
                >
                  <i className={`fas fa-chevron-${isCompletedCollapsed ? 'down' : 'up'}`}></i>
                </button>
                Completed Tasks{' '}
                <span data-testid="completed-tasks-count">({completedTasks.length})</span>
              </h2>
              {!isCompletedCollapsed && (
                <ul data-testid="completed-task-list">
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleToggleTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

