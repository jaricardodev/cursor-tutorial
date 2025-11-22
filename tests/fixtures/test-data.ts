import type { Task } from '../../backend/src/types.js';

export const testTasks: Task[] = [
  {
    id: 'test-task-1',
    title: 'Test Task 1',
    completed: false,
    createdAtMs: Date.now() - 10000,
  },
  {
    id: 'test-task-2',
    title: 'Test Task 2',
    completed: true,
    createdAtMs: Date.now() - 5000,
  },
  {
    id: 'test-task-3',
    title: 'Test Task 3',
    completed: false,
    createdAtMs: Date.now(),
  },
];

export function createTestTask(overrides?: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Test Task',
    completed: false,
    createdAtMs: Date.now(),
    ...overrides,
  };
}

