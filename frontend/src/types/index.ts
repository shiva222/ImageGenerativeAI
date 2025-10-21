export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface Generation {
  id: string;
  prompt: string;
  style: string;
  status: 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  resultImageUrl?: string;
  created_at: string;
}

export interface GenerationResponse {
  success: boolean;
  message: string;
  data: {
    generation: Generation;
  };
}

export interface GenerationsListResponse {
  success: boolean;
  data: {
    generations: Generation[];
    total: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
}

export type StyleOption = 'realistic' | 'artistic' | 'cartoon' | 'vintage';

export interface CreateGenerationData {
  prompt: string;
  style: StyleOption;
  image: File;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
}
