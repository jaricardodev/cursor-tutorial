import { useState } from 'react';
import type { FormEvent } from 'react';

interface TaskInputProps {
  onAddTask: (title: string) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      onAddTask(trimmedTitle);
      setTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="task-input-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task..."
        data-testid="task-input"
      />
      <button type="submit" data-testid="task-add-button">
        Add
      </button>
    </form>
  );
}

