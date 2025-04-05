import { create } from 'zustand';

interface RegistrationState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  language: string;
  error: string;
  isLoading: boolean;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setLanguage: (language: string) => void;
  setError: (error: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  language: 'en',
  error: '',
  isLoading: false,
  setUsername: (username) => set({ username }),
  setEmail: (email) => set({ email }),
  setPassword: (password) => set({ password }),
  setConfirmPassword: (confirmPassword) => set({ confirmPassword }),
  setLanguage: (language) => set({ language }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
})); 