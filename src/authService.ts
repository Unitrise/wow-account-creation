import axios, { AxiosError } from 'axios';
import { getConfigValue } from './services/configService';
import { BigInteger } from 'jsbn';

// Constants for AzerothCore SRP6 calculation
// These match the values used by AzerothCore
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';
const N = new BigInteger(N_HEX, 16);
const g = new BigInteger(g_HEX, 16);

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
 * Creates a SHA1 hash of the input using browser SubtleCrypto
 * @param input - String to hash
 * @returns SHA1 hash as a hex string
 */
const sha1 = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
};

/**
 * Generate random bytes using Web Crypto API
 * @param size - Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
const getRandomBytes = (size: number): Uint8Array => {
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  return array;
};

/**
 * Convert a Uint8Array to a hex string
 */
const toHexString = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Convert a Uint8Array to a base64 string
 */
const toBase64 = (bytes: Uint8Array): string => {
  const binString = Array.from(bytes)
    .map(x => String.fromCodePoint(x))
    .join('');
  return btoa(binString);
};

/**
 * Calculates the SRP6 verifier using AzerothCore's method
 * @param username - Account username
 * @param password - Account password
 * @param salt - Random salt as Uint8Array
 * @returns Promise resolving to SRP6 verifier as a Uint8Array
 */
const calculateSRP6Verifier = async (username: string, password: string, salt: Uint8Array): Promise<Uint8Array> => {
  // AzerothCore uses uppercase username and password for the identity calculation
  const identity = (username.toUpperCase() + ':' + password.toUpperCase());
  const h1 = await sha1(identity);
  
  // Convert salt to hex string
  const saltHex = toHexString(salt).toUpperCase();
  
  // Calculate x (H(s, H(I)))
  const x = new BigInteger(await sha1(saltHex + h1), 16);
  
  // Calculate v = g^x % N
  const v = g.modPow(x, N);
  
  // Convert v to a Uint8Array
  const vHex = v.toString(16).padStart(64, '0');
  // Convert hex string to Uint8Array
  const vBytes = new Uint8Array(32); // 32 bytes for 256 bits
  for (let i = 0; i < 32; i++) {
    vBytes[i] = parseInt(vHex.substring(i * 2, i * 2 + 2), 16);
  }
  return vBytes;
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
    // Check if account creation is enabled
    if (!getConfigValue<boolean>('FEATURE_ACCOUNT_CREATION', true)) {
      return { success: false, message: 'Account creation is disabled in server configuration' };
    }
    
    const { username, email, password, language = 'en' } = accountData;
    
    // Validate username and password
    if (username.length < 3 || username.length > 32) {
      return { success: false, message: 'Username must be between 3 and 32 characters' };
    }
    
    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }
    
    // Check if email is required
    if (getConfigValue<boolean>('ACCOUNT_REQUIRE_EMAIL', true) && (!email || !email.includes('@'))) {
      return { success: false, message: 'Valid email address is required' };
    }
    
    // Check if username exists before continuing
    try {
      const exists = await checkUsernameExists(username);
      if (exists) {
        return { success: false, message: 'Username already exists' };
      }
    } catch (error) {
      console.error('Error checking username existence:', error);
      // Continue with registration attempt even if check fails
    }
    
    // Generate a random salt (32 bytes as required by AzerothCore)
    const salt = getRandomBytes(32);
    
    // Calculate the verifier using SRP6
    const verifier = await calculateSRP6Verifier(username, password, salt);
    
    // Send registration data to server
    const createEndpoint = getApiEndpoint('ACCOUNT_CREATE');
    const response = await axios.post(`${getBaseUrl()}${createEndpoint}`, {
      username,
      email,
      salt: toBase64(salt),
      verifier: toBase64(verifier),
      expansion: getConfigValue<number>('ACCOUNT_DEFAULT_EXPANSION', 2),
      language
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: 'Account created successfully! You can now log in to the game using your credentials.',
        accountId: response.data.accountId
      };
    } else {
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
    const response = await axios.get(`${getBaseUrl()}${checkEndpoint}?username=${encodeURIComponent(username)}`);
    return response.data.exists;
  } catch (error) {
    console.error('Username check error:', error);
    // Assume username exists in case of error to prevent creating duplicate accounts
    return true;
  }
};

/**
 * Generate session key for authentication
 * Currently not used for web authentication but could be useful for game client
 */
export const generateSessionKey = (): Uint8Array => {
  return getRandomBytes(40);
};

export default {
  registerAccount,
  checkUsernameExists,
  generateSessionKey
}; 