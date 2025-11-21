import { useState } from 'react';
import type { Task } from '../types';

export function TodoList() {
  const [tasks] = useState<Task[]>([]);

  return (
    <div data-testid="todo-list">
      <h1>Todo List</h1>
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

