import axios, { AxiosError } from 'axios';
import { Buffer } from 'buffer';
import { getConfigValue } from './configService.js';
import { BigInteger } from 'jsbn';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Constants for AzerothCore SRP6 calculation
// These match the values used by AzerothCore
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';
const N = new BigInteger(N_HEX, 16);
const g = new BigInteger(g_HEX, 16);
// const k = new BigInteger('3', 10);

// Interfaces
export interface AccountData {
  username: string;
  email: string;
  password: string;
  language?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  accountId?: number;
}

interface ErrorResponse {
  message: string;
  [key: string]: any;
}

/**
 * Creates a SHA1 hash of the input using Web Crypto API
 * @param input - String to hash
 * @returns SHA1 hash as a hex string
 */
const sha1 = async (input: string): Promise<string> => {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Use Web Crypto API to hash
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
};

/**
 * Generate random bytes using Web Crypto API
 * @param size - Number of bytes to generate
 * @returns Buffer with random bytes
 */
const randomBytes = (size: number): Buffer => {
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  return Buffer.from(array);
};

/**
 * Calculates the SRP6 verifier using AzerothCore's method
 * @param username - Account username
 * @param password - Account password
 * @param salt - Random salt as Buffer
 * @returns SRP6 verifier as a Buffer
 */
const calculateSRP6Verifier = async (username: string, password: string, salt: Buffer): Promise<Buffer> => {
  // AzerothCore uses uppercase username and password for the identity calculation
  const identity = (username.toUpperCase() + ':' + password.toUpperCase());
  const h1 = await sha1(identity);
  
  // Convert salt to hex string
  const saltHex = salt.toString('hex').toUpperCase();
  
  // Calculate x (H(s, H(I)))
  const x = new BigInteger(await sha1(saltHex + h1), 16);
  
  // Calculate v = g^x % N
  const v = g.modPow(x, N);
  
  // Convert v to a Buffer
  const vHex = v.toString(16).padStart(64, '0');
  return Buffer.from(vHex, 'hex');
};

/**
 * Get base API URL from config
 */
const getBaseUrl = (): string => {
  return getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
};

/**
 * Get API endpoint from config
 */
const getApiEndpoint = (endpoint: string): string => {
  return getConfigValue<string>(`API_${endpoint.toUpperCase()}`, `/api/${endpoint.toLowerCase()}`);
};

/**
 * Registers a new account with AzerothCore SRP6 authentication
 * @param accountData - Account registration data
 * @returns Promise with registration result
 */
export const registerAccount = async (accountData: AccountData): Promise<RegisterResponse> => {
  try {
    console.log('Starting account registration process...');
    
    // Check if account creation is enabled
    if (!getConfigValue<boolean>('FEATURE_ACCOUNT_CREATION', true)) {
      console.log('Account creation is disabled');
      return { success: false, message: 'Account creation is disabled in server configuration' };
    }
    
    const { username, email, password, language = 'en' } = accountData;
    
    // Validate username and password
    if (username.length < 3 || username.length > 32) {
      console.log('Invalid username length');
      return { success: false, message: 'Username must be between 3 and 32 characters' };
    }
    
    if (password.length < 8) {
      console.log('Invalid password length');
      return { success: false, message: 'Password must be at least 8 characters' };
    }
    
    // Check if email is required
    if (getConfigValue<boolean>('ACCOUNT_REQUIRE_EMAIL', true) && (!email || !email.includes('@'))) {
      console.log('Invalid email');
      return { success: false, message: 'Valid email address is required' };
    }
    
    // Check if username exists before continuing
    console.log('Checking if username exists...');
    try {
      const exists = await checkUsernameExists(username);
      if (exists) {
        console.log('Username already exists');
        return { success: false, message: 'Username already exists' };
      }
    } catch (error) {
      console.error('Error checking username existence:', error);
    }
    
    console.log('Generating SRP6 authentication data...');
    // Generate a random salt (32 bytes as required by AzerothCore)
    const salt = randomBytes(32);
    
    // Calculate the verifier using SRP6
    const verifier = await calculateSRP6Verifier(username, password, salt);
    
    // Get the API endpoint
    const createEndpoint = getApiEndpoint('ACCOUNT_CREATE');
    const baseUrl = getBaseUrl();
    console.log('Sending registration request to:', `${baseUrl}${createEndpoint}`);
    
    // Send registration data to server
    const response = await axios.post(
      `${baseUrl}${createEndpoint}`,
      {
        username,
        email,
        salt: salt.toString('base64'),
        verifier: verifier.toString('base64'),
        expansion: getConfigValue<number>('ACCOUNT_DEFAULT_EXPANSION', 2),
        language
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Registration response:', response.data);
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: 'Account created successfully! You can now log in to the game using your credentials.',
        accountId: response.data.accountId
      };
    } else {
      console.error('Registration failed:', response.data);
      return {
        success: false,
        message: response.data.message || 'Unknown error occurred during account creation'
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    const axiosError = error as AxiosError<ErrorResponse>;
    const errorMessage = axiosError.response?.data?.message || 'Server error during registration';
    return { success: false, message: errorMessage };
  }
};

/**
 * Checks if a username already exists
 * @param username - Username to check
 * @returns Promise with boolean result
 */
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const checkEndpoint = getApiEndpoint('ACCOUNT_CHECK');
    const response = await axios.get(
      `${getBaseUrl()}${checkEndpoint}?username=${encodeURIComponent(username)}`,
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
    
    if (response.data && response.data.success) {
      return response.data.exists;
    }
    
    console.error('Invalid response format:', response.data);
    return true; // Assume username exists in case of invalid response
  } catch (error: any) {
    console.error('Username check error:', error);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout while checking username. Please try again.');
    }
    // Assume username exists in case of error to prevent duplicate accounts
    return true;
  }
};

/**
 * Generate session key for authentication
 * Currently not used for web authentication but could be useful for game client
 */
export const generateSessionKey = (): Buffer => {
  return randomBytes(40);
};

export default {
  registerAccount,
  checkUsernameExists,
  generateSessionKey
}; 