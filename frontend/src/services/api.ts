import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  AuthResponse,
  GenerationResponse,
  GenerationsListResponse,
  LoginData,
  SignupData,
  CreateGenerationData,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors globally
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Let the components handle navigation instead of forcing a reload
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/signup', data);
    return response.data;
  }

  async getCurrentUser(): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.get('/auth/me');
    return response.data;
  }

  // Generation endpoints
  async createGeneration(data: CreateGenerationData, abortController?: AbortController): Promise<GenerationResponse> {
    const formData = new FormData();
    formData.append('prompt', data.prompt);
    formData.append('style', data.style);
    formData.append('image', data.image);

    const response: AxiosResponse<GenerationResponse> = await this.api.post(
      '/generations',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: abortController?.signal,
      }
    );
    return response.data;
  }

  async getGenerations(limit: number = 5): Promise<GenerationsListResponse> {
    const response: AxiosResponse<GenerationsListResponse> = await this.api.get(
      `/generations?limit=${limit}`
    );
    return response.data;
  }

  async getGeneration(id: string): Promise<GenerationResponse> {
    const response: AxiosResponse<GenerationResponse> = await this.api.get(`/generations/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
