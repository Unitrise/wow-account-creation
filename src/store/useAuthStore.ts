import { create } from 'zustand';

interface AuthState {
  username: string;
  email: string;
  password: string;
  language: 'en' | 'he';
  isLoading: boolean;
  error: string | null;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setLanguage: (language: 'en' | 'he') => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  username: '',
  email: '',
  password: '',
  language: 'en',
  isLoading: false,
  error: null,
  setUsername: (username) => set({ username }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setLanguage: (language) => set({ language }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({
    username: '',
    email: '',
    password: '',
    error: null,
    isLoading: false,
  }),
})); 