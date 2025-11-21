import express from 'express';
import cors from 'cors';
import { getAllTasks, saveTasks, getTaskById } from './storage.js';
import type { Task } from './types.js';

const app = express();
const PORT = 3001;

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    // Allow specific production origin
    if (origin === 'http://localhost:5173') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type'],
  credentials: false,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GET /tasks - newest first
app.get('/tasks', (req, res) => {
  try {
    const tasks = getAllTasks();
    const sorted = tasks.sort((a, b) => b.createdAtMs - a.createdAtMs);
    res.json(sorted);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /tasks - create new task
app.post('/tasks', (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required and must be a string' });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    const tasks = getAllTasks();
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      createdAtMs: Date.now(),
    };

    tasks.push(newTask);
    saveTasks(tasks);

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id/toggle - toggle completed status
app.patch('/tasks/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const tasks = getAllTasks();
    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = tasks[taskIndex];
    const updatedTask = { ...task, completed: !task.completed };
    tasks[taskIndex] = updatedTask;
    saveTasks(tasks);

    res.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// DELETE /tasks/:id - delete task
app.delete('/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tasks = getAllTasks();
    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    tasks.splice(taskIndex, 1);
    saveTasks(tasks);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Server also accessible on http://127.0.0.1:${PORT}`);
});

