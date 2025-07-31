import { auth } from '../config/firebase';
import {
  Project,
  Presentation,
  ChatRequest,
  ChatResponse,
  ImproveSpeakerNotesRequest,
  ImproveSpeakerNotesResponse
} from '../types';

// Type definitions for API requests
interface CreateProjectDto {
  name: string;
  description?: string;
  industry?: string;
  target_audience?: string;
  business_model?: string;
}

interface UpdateProjectDto {
  name?: string;
  description?: string;
  industry?: string;
  target_audience?: string;
  business_model?: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
    this.baseURL = `${baseUrl}/api`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const user = auth.currentUser;
    if (user) {
      try {
        // Try to get token without forcing refresh first
        const token = await user.getIdToken(false);
        headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.warn('Failed to get auth token:', error);
        // Try with force refresh as fallback
        try {
          const token = await user.getIdToken(true);
          headers['Authorization'] = `Bearer ${token}`;
        } catch (refreshError) {
          console.error('Failed to refresh auth token:', refreshError);
          // Continue without auth header - let the backend handle the 401
        }
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      console.error('Authentication failed, redirecting to login');
      // You can dispatch a logout action here
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        // Try to parse error as JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text() as any;
  }

  // Generic HTTP methods
  async get<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  // Project-specific methods
  async getProjects(): Promise<Project[]> {
    const response = await this.get<{
      projects: Project[];
      total: number;
      hasMore: boolean;
    }>('/projects');
    return response.projects;
  }

  async createProject(projectData: CreateProjectDto): Promise<Project> {
    return this.post<Project>('/projects', projectData);
  }

  async getProject(id: string): Promise<Project> {
    return this.get<Project>(`/projects/${id}`);
  }

  async updateProject(id: string, projectData: UpdateProjectDto): Promise<Project> {
    return this.patch<Project>(`/projects/${id}`, projectData);
  }

  async updateProjectDescription(id: string, description: string): Promise<{
    project: Project;
    lastUpdated: Date | null;
    status: string;
  }> {
    return this.patch<{
      project: Project;
      lastUpdated: Date | null;
      status: string;
    }>(`/projects/${id}/description`, { description });
  }

  async deleteProject(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/projects/${id}`);
  }

  async getProjectStats(): Promise<any> {
    return this.get<any>('/projects/stats');
  }

  // Presentation methods
  async createPresentation(data: { projectId: string; name: string; description?: string }): Promise<Presentation> {
    return this.post<Presentation>('/presentations', data);
  }

  async getProjectPresentations(projectId: string): Promise<Presentation[]> {
    return this.get<Presentation[]>(`/presentations?projectId=${projectId}`);
  }

  async getPresentation(id: string): Promise<Presentation> {
    return this.get<Presentation>(`/presentations/${id}`);
  }

  async updatePresentation(id: string, data: { name?: string; description?: string }): Promise<Presentation> {
    return this.patch<Presentation>(`/presentations/${id}`, data);
  }

  async deletePresentation(id: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/presentations/${id}`);
  }

  // Generation methods
  async generateFreeDeck(prompt: string, projectId: string, preferredModel: string = 'local'): Promise<{ deck_id: string; message: string }> {
    return this.post<{ deck_id: string; message: string }>('/generate/free', { prompt, projectId, preferredModel });
  }

  async generateCustomDeck(formData: any, projectId: string): Promise<{ deck_id: string; message: string }> {
    return this.post<{ deck_id: string; message: string }>('/generate/custom', { ...formData, projectId });
  }

  // Deck and slide management methods
  async getDeck(deckId: string): Promise<any> {
    return this.get<any>(`/decks/${deckId}`);
  }

  async getDeckSlides(deckId: string): Promise<any[]> {
    return this.get<any[]>(`/decks/${deckId}/slides`);
  }

  async updateSlide(slideId: string, updates: any): Promise<any> {
    return this.put<any>(`/slides/${slideId}`, updates);
  }

  async regenerateSlide(slideId: string, improvementType: string = 'general'): Promise<any> {
    return this.post<any>(`/generate/slides/${slideId}/regenerate`, {
      modelChoice: 'groq', // Use Groq as default
      userFeedback: improvementType,
      userApiKey: undefined // Use system API key
    });
  }

  // Additional slide management methods
  async createSlide(deckId: string, slideData: any): Promise<any> {
    return this.post<any>(`/decks/${deckId}/slides`, slideData);
  }

  async deleteSlide(slideId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/slides/${slideId}`);
  }

  async duplicateSlide(slideId: string): Promise<any> {
    return this.post<any>(`/slides/${slideId}/duplicate`);
  }

  async reorderSlides(slideIds: string[]): Promise<void> {
    return this.post<void>('/slides/reorder', { slideIds });
  }

  async autosaveSlide(slideId: string, updates: any): Promise<{ timestamp: string }> {
    return this.patch<{ timestamp: string }>(`/slides/${slideId}/autosave`, updates);
  }

  // Project deck methods
  async getProjectDecks(projectId: string): Promise<any[]> {
    return this.get<any[]>(`/projects/${projectId}/decks`);
  }

  // Export methods
  async exportDeckToPdf(deckId: string, options: any = {}): Promise<{ message: string; downloadUrl: string }> {
    return this.post<{ message: string; downloadUrl: string }>(`/decks/${deckId}/export/pdf`, options);
  }

  async exportDeckToPptx(deckId: string, options: any = {}): Promise<{ message: string; downloadUrl: string }> {
    return this.post<{ message: string; downloadUrl: string }>(`/decks/${deckId}/export/pptx`, options);
  }

  // Chatbot methods
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>('/chatbot/chat', request);
  }

  async improveSpeakerNotes(request: ImproveSpeakerNotesRequest): Promise<ImproveSpeakerNotesResponse> {
    return this.post<ImproveSpeakerNotesResponse>('/chatbot/improve-speaker-notes', request);
  }

  // Health check
  async healthCheck() {
    return this.get('/');
  }

  async databaseHealthCheck() {
    return this.get('/health/database');
  }
}

export const apiClient = new ApiClient();
