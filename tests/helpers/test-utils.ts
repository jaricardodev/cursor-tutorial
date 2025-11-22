import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Task } from '../../backend/src/types.js';

const TEST_DATA_DIR = join(process.cwd(), 'backend', 'data', 'test');
const TEST_DATA_FILE = join(TEST_DATA_DIR, 'tasks.json');

export function setupTestData(tasks: Task[] = []): void {
  // Ensure test data directory exists
  if (!existsSync(TEST_DATA_DIR)) {
    mkdirSync(TEST_DATA_DIR, { recursive: true });
  }
  
  // Write test data
  writeFileSync(TEST_DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

export function cleanupTestData(): void {
  // Clear test data file
  if (existsSync(TEST_DATA_FILE)) {
    writeFileSync(TEST_DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getTestDataFile(): string {
  return TEST_DATA_FILE;
}

