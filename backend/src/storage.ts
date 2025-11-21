import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Task } from './types.js';

const DATA_FILE = join(process.cwd(), 'backend', 'data', 'tasks.json');

function readTasks(): Task[] {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read tasks:', error);
  }
  return [];
}

function writeTasks(tasks: Task[]): void {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write tasks:', error);
    throw error;
  }
}

export function getAllTasks(): Task[] {
  return readTasks();
}

export function saveTasks(tasks: Task[]): void {
  writeTasks(tasks);
}

export function getTaskById(id: string): Task | undefined {
  const tasks = readTasks();
  return tasks.find((task) => task.id === id);
}

