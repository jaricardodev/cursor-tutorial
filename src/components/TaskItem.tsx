import type { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const handleToggleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault();
    onToggle(task.id);
  };

  const handleDeleteClick = () => {
    onDelete(task.id);
  };

  return (
    <li data-testid={`task-${task.id}`}>
      <input
        type="radio"
        checked={task.completed}
        onClick={handleToggleClick}
        onChange={() => {}}
        data-testid={`task-toggle-${task.id}`}
        aria-label={task.completed ? 'Mark as not completed' : 'Mark as completed'}
      />
      <span>{task.title}</span>
      <button
        type="button"
        onClick={handleDeleteClick}
        data-testid={`task-delete-${task.id}`}
        aria-label={`Delete task: ${task.title}`}
      >
        Delete
      </button>
    </li>
  );
}

