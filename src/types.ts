export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export function createTask(title: string): Task {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: Date.now(),
  };
}

