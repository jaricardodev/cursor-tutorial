import { useState, useMemo } from 'react';
import type { Task } from '../types';
import { createTask } from '../types';
import { TaskInput } from './TaskInput';
import { TaskItem } from './TaskItem';

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);

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
              <h2>Active Tasks</h2>
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
            </div>
          )}
          {completedTasks.length > 0 && (
            <div data-testid="completed-tasks-section">
              <h2>Completed Tasks</h2>
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
            </div>
          )}
        </>
      )}
    </div>
  );
}

