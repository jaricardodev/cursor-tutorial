import { useState, useMemo, useEffect } from 'react';
import type { Task } from '../types';
import { createTask } from '../types';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

const STORAGE_KEY = 'todo-app-tasks';

function loadTasksFromStorage(): Task[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Task[];
    }
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
  }
  return [];
}

function saveTasksToStorage(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
}

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage());
  const [isActiveCollapsed, setIsActiveCollapsed] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks]
  );

  const handleAddTask = (title: string) => {
    const newTask = createTask(title);
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = prevTasks[taskIndex];
      const updatedTask = { ...task, completed: !task.completed };
      const otherTasks = prevTasks.filter((t) => t.id !== taskId);

      return [updatedTask, ...otherTasks];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  return (
    <div data-testid="todo-list">
      <h1>Todo List</h1>
      <TaskInput onAddTask={handleAddTask} />
      {activeTasks.length === 0 && completedTasks.length === 0 ? (
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

