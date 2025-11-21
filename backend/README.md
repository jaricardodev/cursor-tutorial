# Backend API

Express REST API for the Todo app.

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{ "status": "ok" }
```

### GET /tasks
Get all tasks, sorted by newest first.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Task title",
    "completed": false,
    "createdAtMs": 1234567890
  }
]
```

### POST /tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Task title"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Task title",
  "completed": false,
  "createdAtMs": 1234567890
}
```

**Errors:**
- `400` - Title is required and must be a string, or title cannot be empty

### PATCH /tasks/:id/toggle
Toggle the completed status of a task.

**Response:**
```json
{
  "id": "uuid",
  "title": "Task title",
  "completed": true,
  "createdAtMs": 1234567890
}
```

**Errors:**
- `404` - Task not found

### DELETE /tasks/:id
Delete a task.

**Response:**
- `204` - No content (success)

**Errors:**
- `404` - Task not found

## Running the Server

### Development (with auto-reload)
```bash
npm run dev:backend
```

### Production
```bash
npm run start:backend
```

The server runs on `http://localhost:3001` by default.

## Data Storage

Tasks are stored in `backend/data/tasks.json`. The file is created automatically when the first task is added.

