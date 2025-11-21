import { useState } from 'react';
import type { Task } from '../types';
import { createTask } from '../types';
import { TaskInput } from './TaskInput';

export function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleAddTask = (title: string) => {
    const newTask = createTask(title);
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  return (
    <div data-testid="todo-list">
      <h1>Todo List</h1>
      <TaskInput onAddTask={handleAddTask} />
      {tasks.length === 0 ? (
        <p data-testid="empty-message">No tasks yet. Add one to get started!</p>
      ) : (
        <ul data-testid="task-list">
          {tasks.map((task) => (
            <li key={task.id} data-testid={`task-${task.id}`}>
              {task.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

