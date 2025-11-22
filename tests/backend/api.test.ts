import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../helpers/test-server.js';
import { setupTestData, cleanupTestData, getTestDataFile } from '../helpers/test-utils.js';
import { testTasks } from '../fixtures/test-data.js';

describe('API Tests', () => {
  let app: ReturnType<typeof createTestServer>;
  
  beforeEach(() => {
    // Set test data file environment variable
    process.env.TEST_DATA_FILE = getTestDataFile();
    setupTestData([]);
    app = createTestServer();
  });

  afterEach(() => {
    cleanupTestData();
    delete process.env.TEST_DATA_FILE;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /tasks', () => {
    it('should return empty array when no tasks', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return tasks sorted by newest first', async () => {
      setupTestData(testTasks);
      
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].id).toBe('test-task-3'); // Newest first
      expect(response.body[0].createdAtMs).toBeGreaterThan(response.body[1].createdAtMs);
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'New Task' })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: 'New Task',
        completed: false,
        createdAtMs: expect.any(Number),
      });
    });

    it('should reject empty title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.error).toBe('Title cannot be empty');
    });

    it('should reject missing title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Title is required and must be a string');
    });

    it('should trim title whitespace', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '  Trimmed Task  ' })
        .expect(201);

      expect(response.body.title).toBe('Trimmed Task');
    });
  });

  describe('PATCH /tasks/:id/toggle', () => {
    it('should toggle task completion status', async () => {
      setupTestData([testTasks[0]]);
      
      const response = await request(app)
        .patch(`/tasks/${testTasks[0].id}/toggle`)
        .expect(200);

      expect(response.body.completed).toBe(true);
      expect(response.body.id).toBe(testTasks[0].id);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/tasks/non-existent-id/toggle')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      setupTestData([testTasks[0]]);
      
      await request(app)
        .delete(`/tasks/${testTasks[0].id}`)
        .expect(204);

      // Verify task is deleted
      const getResponse = await request(app)
        .get('/tasks')
        .expect(200);

      expect(getResponse.body).toHaveLength(0);
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/tasks/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });
});

