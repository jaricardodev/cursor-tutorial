export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAtMs: number;
};

// Helper to convert createdAtMs to createdAt for backward compatibility if needed
export function getCreatedAt(task: Task): number {
  return task.createdAtMs;
}

