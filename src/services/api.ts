import axios from 'axios';
import { getConfigValue, loadConfig } from './configService.js';

// Load configuration
const config = loadConfig();

// Define interfaces
export interface RegisterUserParams {
  username: string;
  email: string;
  password: string;
  language?: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

/**
 * Get base API URL from config
 */
const getBaseUrl = (): string => {
  return getConfigValue<string>(config, 'API_BASE_URL', 'http://localhost:3000');
};

/**
 * Get API endpoint from config
 */
const getApiEndpoint = (endpoint: string): string => {
  return getConfigValue<string>(config, `API_${endpoint.toUpperCase()}`, `/api/${endpoint.toLowerCase()}`);
};

/**
 * Create axios instance with base configuration
 */
const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Register a new user
 * @param params Registration parameters
 * @returns Promise with success status
 */
export const registerUser = async (params: RegisterUserParams): Promise<boolean> => {
  try {
    // Check if account creation is enabled
    if (!getConfigValue<boolean>(config, 'FEATURE_ACCOUNT_CREATION', true)) {
      console.error('Account creation is disabled in config');
      return false;
    }
    
    const { username, email, password, language = 'en' } = params;
    
    // Get the registration endpoint from config
    // const endpoint = getApiEndpoint('ACCOUNT_CREATE');
    
    // Call the authService directly to handle SRP6 verification
    const { registerAccount } = await import('./authService.js');
    const result = await registerAccount({ username, email, password, language });
    
    return result.success;
  } catch (error: any) {
    console.error('Registration error:', error);
    return false;
  }
};

/**
 * Login a user
 * @param params Login parameters
 * @returns Promise with login result
 */
export const loginUser = async (params: LoginParams): Promise<{ success: boolean; message: string }> => {
  try {
    const { username, password } = params;
    
    // Get the login endpoint from config
    const endpoint = getApiEndpoint('ACCOUNT_LOGIN');
    
    const response = await api.post(endpoint, {
      username,
      password,
    });
    
    return {
      success: response.data.success,
      message: response.data.message
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Server error during login'
    };
  }
};

/**
 * Check if a username already exists
 * @param username Username to check
 * @returns Promise with result
 */
export const checkUsername = async (username: string): Promise<boolean> => {
  try {
    const endpoint = getApiEndpoint('ACCOUNT_CHECK');
    const response = await api.get(`${endpoint}?username=${encodeURIComponent(username)}`);
    return response.data.exists;
  } catch (error: any) {
    console.error('Username check error:', error);
    return false;
  }
};

/**
 * Get server status
 * @returns Promise with server status
 */
export const getServerStatus = async (): Promise<{ online: boolean; players: number }> => {
  try {
    const response = await api.get('/api/server/status');
    return response.data;
  } catch (error: any) {
    console.error('Server status check error:', error);
    return { online: false, players: 0 };
  }
};

export default {
  registerUser,
  loginUser,
  checkUsername,
  getServerStatus
}; 