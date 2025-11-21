import type { Task } from '../types';

const API_BASE_URL = 'http://localhost:3001';

export class ApiError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Check for network/CORS errors - these are the most common fetch failures
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    if (error instanceof TypeError || errorMessage.includes('fetch') || errorMessage.includes('network')) {
      // Common browser fetch error messages
      if (errorMessage.includes('failed to fetch') || 
          errorMessage.includes('networkerror') ||
          errorMessage.includes('network error') ||
          errorMessage.includes('load failed')) {
        throw new ApiError('Unable to connect to server. Please check if the backend is running on http://localhost:3001');
      }
      if (errorMessage.includes('cors')) {
        throw new ApiError('CORS error: The backend may not be allowing requests from this origin.');
      }
      // Generic fetch/network error
      throw new ApiError('Unable to connect to server. Please check if the backend is running on http://localhost:3001');
    }
    
    throw new ApiError(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function fetchTasks(): Promise<Task[]> {
  return fetchWithErrorHandling<Task[]>(`${API_BASE_URL}/tasks`);
}

export async function createTask(title: string): Promise<Task> {
  return fetchWithErrorHandling<Task>(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function toggleTask(id: string): Promise<Task> {
  return fetchWithErrorHandling<Task>(`${API_BASE_URL}/tasks/${id}/toggle`, {
    method: 'PATCH',
  });
}

export async function deleteTask(id: string): Promise<void> {
  return fetchWithErrorHandling<void>(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
  });
}


