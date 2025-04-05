import axios from 'axios';
import { Buffer } from 'buffer';
import { getConfigValue } from './configService.js';
import { BigInteger } from 'jsbn';
import SHA1 from 'crypto-js/sha1';
import Hex from 'crypto-js/enc-hex';
import SHA256 from 'crypto-js/sha256';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Constants for WoW's SRP6
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';
const k_HEX = '3';

const N = new BigInteger(N_HEX, 16);
const g = new BigInteger(g_HEX, 16);
const k = new BigInteger(k_HEX, 16);

// Configuration - set this to match your server's authentication method
// You can also fetch this from your server API if it's dynamically detected
const USE_LEGACY_AUTH = true; // Set to false to use SRP6 authentication

// Interfaces
export interface AccountData {
  username: string;
  email: string;
  password: string;
  isBattleNet?: boolean;
  language?: string;
  expansion?: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  accountId?: number;
}

/**
 * Calculate SHA1 hash and return hex string
 */
function sha1(data: string): string {
  return Hex.stringify(SHA1(data)).toUpperCase();
}

/**
 * Calculate SHA256 hash and return hex string
 */
function sha256(data: string): string {
  return Hex.stringify(SHA256(data)).toUpperCase();
}

/**
 * Calculate WoW's legacy password hash
 * SHA1(UPPER(username) + ':' + UPPER(password))
 */
function calculateLegacyHash(username: string, password: string): string {
  return sha1(`${username.toUpperCase()}:${password.toUpperCase()}`);
}

/**
 * Calculate BattleNet legacy hash
 * SHA256(UPPER(email):UPPER(password)) reversed as hex
 */
function calculateBattleNetHash(email: string, password: string): string {
  const hash = sha256(`${email.toUpperCase()}:${password.toUpperCase()}`);
  // Reverse the binary representation of the hash and convert back to hex
  const binaryHash = Buffer.from(hash, 'hex');
  const reversedBinary = Buffer.from(Array.from(binaryHash).reverse());
  return reversedBinary.toString('hex').toUpperCase();
}

/**
 * Calculate SRP6 verifier using WoW's method
 */
function calculateSRP6Verifier(username: string, password: string, salt: Uint8Array): Uint8Array {
  // Step 1: Convert username and password to uppercase
  username = username.toUpperCase();
  password = password.toUpperCase();
  
  // Step 2: Calculate h1 = SHA1(username:password)
  const h1 = sha1(`${username}:${password}`);
  
  // Step 3: Calculate h2 = SHA1(salt | h1)
  const saltHex = Buffer.from(salt).toString('hex').toUpperCase();
  const h2 = sha1(saltHex + h1);
  
  // Step 4: Convert h2 to a BigInteger
  const x = new BigInteger(h2, 16);
  
  // Step 5: Calculate v = g^x % N
  const v = g.modPow(x, N);
  
  // Step 6: Convert v to a byte array
  const vHex = v.toString(16).padStart(64, '0');
  return Buffer.from(vHex, 'hex');
}

/**
 * Calculate SRP6 verifier for BattleNet v1
 */
function calculateBnetSRP6VerifierV1(email: string, password: string, salt: Uint8Array): Uint8Array {
  // Step 1: Convert email and password to uppercase
  email = email.toUpperCase();
  password = password.toUpperCase();
  
  // Step 2: Calculate h1 = SHA1(email:password)
  const h1 = sha1(`${email}:${password}`);
  
  // Step 3: Calculate h2 = SHA1(salt | h1)
  const saltHex = Buffer.from(salt).toString('hex').toUpperCase();
  const h2 = sha1(saltHex + h1);
  
  // Step 4: Convert h2 to a BigInteger
  const x = new BigInteger(h2, 16);
  
  // Step 5: Calculate v = g^x % N
  const v = g.modPow(x, N);
  
  // Step 6: Convert v to a byte array
  const vHex = v.toString(16).padStart(64, '0');
  return Buffer.from(vHex, 'hex');
}

/**
 * Calculate SRP6 verifier for BattleNet v2
 */
function calculateBnetSRP6VerifierV2(email: string, password: string, salt: Uint8Array): Uint8Array {
  // Step 1: Convert email to uppercase, password can be longer than 16 chars
  email = email.toUpperCase();
  
  // Step 2: Calculate h1 = SHA256(email:password)
  const h1 = sha256(`${email}:${password}`);
  
  // Step 3: Calculate h2 = SHA256(salt | h1)
  const saltHex = Buffer.from(salt).toString('hex').toUpperCase();
  const h2 = sha256(saltHex + h1);
  
  // Step 4: Convert h2 to a BigInteger
  const x = new BigInteger(h2, 16);
  
  // Step 5: Calculate v = g^x % N
  const v = g.modPow(x, N);
  
  // Step 6: Convert v to a byte array
  const vHex = v.toString(16).padStart(64, '0');
  return Buffer.from(vHex, 'hex');
}

/**
 * Check if a username exists
 */
export const checkUsername = async (username: string): Promise<boolean> => {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.API_BASE_URL || 'http://localhost:3000';
    
    const response = await axios.get(`${baseUrl}/api/account/check?username=${encodeURIComponent(username.toUpperCase())}`);
    return response.data.exists;
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

/**
 * Check if an email exists
 */
export const checkEmail = async (email: string): Promise<boolean> => {
  try {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.API_BASE_URL || 'http://localhost:3000';
    
    const response = await axios.get(`${baseUrl}/api/account/check-email?email=${encodeURIComponent(email.toUpperCase())}`);
    return response.data.exists;
  } catch (error) {
    console.error('Email check error:', error);
    return false;
  }
};

/**
 * Register account using either legacy SHA1 or SRP6 authentication
 * Support for both regular and Battle.net accounts
 */
export const registerAccount = async (accountData: AccountData): Promise<RegisterResponse> => {
  try {
    const { username, email, password, isBattleNet = false } = accountData;
    
    // Use the current window location as the base URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.API_BASE_URL || 'http://localhost:3000';
      
    console.log('Using API base URL:', baseUrl);
    
    // Get authentication configuration
    const useLegacyAuth = getConfigValue<boolean>('USE_LEGACY_AUTH', true);
    const srp6Version = getConfigValue<number>('SRP6_VERSION', 0);
    
    let registrationData: any = {};
    
    if (isBattleNet) {
      // Battle.net account registration
      if (useLegacyAuth) {
        // Legacy authentication for Battle.net
        console.log('Using legacy SHA256 authentication for Battle.net registration');
        
        const bnetHash = calculateBattleNetHash(email, password);
        
        registrationData = {
          email: email.toUpperCase(),
          password: password, // Send plain password, server will hash it
          bnet_hash: bnetHash,
          expansion: accountData.expansion || 2,
          isBattleNet: true
        };
      } else {
        // SRP6 authentication for Battle.net accounts
        console.log(`Using SRP6 v${srp6Version} authentication for Battle.net registration`);
        
        // Generate a random 32-byte salt
        const salt = new Uint8Array(32);
        window.crypto.getRandomValues(salt);
        
        let verifier: Uint8Array;
        
        // Handle different SRP6 versions
        if (srp6Version === 1) {
          verifier = calculateBnetSRP6VerifierV1(email, password, salt);
        } else if (srp6Version === 2) {
          verifier = calculateBnetSRP6VerifierV2(email, password, salt);
        } else {
          // Default to v0
          verifier = calculateSRP6Verifier(email, password, salt);
        }
        
        registrationData = {
          email: email.toUpperCase(),
          salt: Buffer.from(salt).toString('base64'),
          verifier: Buffer.from(verifier).toString('base64'),
          expansion: accountData.expansion || 2,
          srp_version: srp6Version,
          isBattleNet: true
        };
      }
    } else {
      // Regular account registration
      if (useLegacyAuth) {
        // Legacy authentication with sha_pass_hash
        console.log('Using legacy SHA1 authentication for registration');
        
        registrationData = {
          username: username.toUpperCase(),
          password: password, // Send the plain password, server will hash it
          email: email.toLowerCase(),
          expansion: accountData.expansion || 2
        };
      } else {
        // SRP6 authentication with salt and verifier
        console.log('Using SRP6 authentication for registration');
        
        // Generate a random 32-byte salt
        const salt = new Uint8Array(32);
        window.crypto.getRandomValues(salt);
        
        // Calculate the verifier using the salt and user credentials
        const verifier = calculateSRP6Verifier(username, password, salt);
        
        registrationData = {
          username: username.toUpperCase(),
          salt: Buffer.from(salt).toString('base64'),
          verifier: Buffer.from(verifier).toString('base64'),
          email: email.toLowerCase(),
          reg_mail: email.toLowerCase(),
          expansion: accountData.expansion || 2,
          locale: 0,
          os: 'Win'
        };
      }
    }
    
    console.log('Sending registration data');
    
    const response = await axios.post(
      `${baseUrl}/api/account/create`,
      registrationData
    );
    
    return {
      success: response.data.success,
      message: response.data.message || 'Account created successfully!',
      accountId: response.data.accountId
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed'
    };
  }
};

/**
 * Login using either legacy SHA1 or SRP6 authentication
 */
export const loginAccount = async (username: string, password: string): Promise<boolean> => {
  try {
    // Use the current window location as the base URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.API_BASE_URL || 'http://localhost:3000';
    
    let loginData;
    
    if (USE_LEGACY_AUTH) {
      // Legacy authentication with sha_pass_hash
      console.log('Using legacy SHA1 authentication for login');
      
      loginData = {
        username: username.toUpperCase(),
        password: password // Send the plain password, server will hash it
      };
    } else {
      // For SRP6, we should implement the challenge-response protocol
      // For simplicity, we're just sending the credentials directly
      console.log('Using SRP6 authentication for login');
      
      loginData = {
        username: username.toUpperCase(),
        password: password
      };
    }
      
    const response = await axios.post(`${baseUrl}/api/auth/login`, loginData);
    
    if (response.data.success && response.data.sessionKey) {
      // Store the session key for future authenticated requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('wow_session_key', response.data.sessionKey);
        localStorage.setItem('wow_username', username.toUpperCase());
      }
      console.log('Login successful, session key stored');
    }
    
    return response.data.success;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

export default {
    registerAccount,
    loginAccount,
    checkUsername,
    checkEmail
};