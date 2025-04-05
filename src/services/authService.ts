import axios, { AxiosError } from 'axios';
import { Buffer } from 'buffer';
import { getConfigValue } from './configService.js';
import { BigInteger } from 'jsbn';
import SHA1 from 'crypto-js/sha1';
import Hex from 'crypto-js/enc-hex';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Constants for WoW's SRP6
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
 * Convert a string to binary buffer exactly as WoW does
 */
function stringToBuffer(str: string): Buffer {
    return Buffer.from(str, 'binary');
}

/**
 * Convert hex string to binary buffer
 */
function hexToBuffer(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
}

/**
 * Calculate SHA1 hash and return binary buffer
 */
function sha1Binary(data: string | Buffer): Buffer {
    const hash = SHA1(typeof data === 'string' ? data : data.toString('binary'));
    return hexToBuffer(Hex.stringify(hash));
}

/**
 * Calculate verifier using exact WoW protocol
 */
function calculateVerifier(username: string, password: string, salt: Buffer): Buffer {
    try {
        // 1. Convert username and password to uppercase
        const upperUsername = username.toUpperCase();
        const upperPassword = password.toUpperCase();

        // 2. Concatenate username:password and calculate SHA1
        const identity = `${upperUsername}:${upperPassword}`;
        const h1 = sha1Binary(identity);

        // 3. Concatenate salt and h1 and calculate SHA1
        const combined = Buffer.concat([salt, h1]);
        const x = new BigInteger(sha1Binary(combined).toString('hex'), 16);

        // 4. Calculate v = g^x % N
        const v = g.modPow(x, N);

        // 5. Convert to 32-byte buffer (WoW expects exactly 32 bytes)
        const vHex = v.toString(16).padStart(64, '0');
        return hexToBuffer(vHex);
    } catch (error) {
        console.error('Error calculating verifier:', error);
        throw error;
    }
}

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
 * Register account with exact WoW protocol format
 */
export const registerAccount = async (accountData: AccountData): Promise<RegisterResponse> => {
    try {
        const { username, email, password } = accountData;

        // Generate 32-byte salt using crypto
        const salt = Buffer.from(new Uint8Array(32));
        window.crypto.getRandomValues(salt);

        // Calculate verifier
        const verifier = calculateVerifier(username, password, salt);

        // Prepare registration data matching DB schema
        const registrationData = {
            username: username.toUpperCase(),
            email: email.toLowerCase(),
            reg_mail: email.toLowerCase(), // WoW stores registration email separately
            salt: salt.toString('binary'),    // Store as binary(32)
            verifier: verifier.toString('binary'), // Store as binary(32)
            expansion: 2,
            locale: 0,
            os: 'Win',
            locked: 0,
            last_ip: '127.0.0.1',
            failed_logins: 0,
            online: 0,
            totaltime: 0
        };

        const baseUrl = getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
        const response = await axios.post(
            `${baseUrl}/api/account/create`,
            registrationData,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                transformRequest: [(data) => {
                    // Convert binary data to base64 for transport
                    return JSON.stringify({
                        ...data,
                        salt: Buffer.from(data.salt, 'binary').toString('base64'),
                        verifier: Buffer.from(data.verifier, 'binary').toString('base64')
                    });
                }]
            }
        );

        if (response.data.success) {
            return {
                success: true,
                message: 'Account created successfully!',
                accountId: response.data.accountId
            };
        }

        return {
            success: false,
            message: response.data.message || 'Failed to create account'
        };

    } catch (error: any) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: error.response?.data?.message || 'Server error during registration'
        };
    }
};

/**
 * Login using WoW's SRP6 protocol
 */
export const loginAccount = async (username: string, password: string): Promise<boolean> => {
    try {
        const upperUsername = username.toUpperCase();
        const upperPassword = password.toUpperCase();

        // Calculate initial hash
        const identity = `${upperUsername}:${upperPassword}`;
        const h1 = sha1Binary(identity);

        // Get challenge from server
        const baseUrl = getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
        const challengeResponse = await axios.post(`${baseUrl}/api/auth/challenge`, {
            username: upperUsername
        });

        if (!challengeResponse.data.success) {
            throw new Error(challengeResponse.data.message || 'Failed to get auth challenge');
        }

        const { salt: saltBase64, B: serverPublicKey } = challengeResponse.data;
        const salt = Buffer.from(saltBase64, 'base64');

        // Calculate proof using WoW's exact method
        const combined = Buffer.concat([salt, h1]);
        const x = new BigInteger(sha1Binary(combined).toString('hex'), 16);
        
        // Generate client ephemeral
        const a = new BigInteger(Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString('hex'), 16);
        const A = g.modPow(a, N);

        // Calculate session key
        const u = new BigInteger(sha1Binary(A.toString(16) + serverPublicKey).toString('hex'), 16);
        const S = new BigInteger(serverPublicKey, 16)
            .subtract(g.modPow(x, N).multiply(new BigInteger('3', 16)))
            .modPow(a.add(u.multiply(x)), N);

        // Calculate proof
        const sessionKey = sha1Binary(S.toString(16));
        const proof = sha1Binary(Buffer.concat([
            sha1Binary(N.toString(16)),
            sha1Binary(g.toString(16)),
            sha1Binary(upperUsername),
            salt,
            Buffer.from(A.toString(16), 'hex'),
            Buffer.from(serverPublicKey, 'hex'),
            sessionKey
        ]));

        // Send proof to server
        const loginResponse = await axios.post(`${baseUrl}/api/auth/proof`, {
            username: upperUsername,
            A: A.toString(16),
            M1: proof.toString('base64')
        });

        return loginResponse.data.success;

    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};

/**
 * Check if username exists
 */
export const checkUsername = async (username: string): Promise<boolean> => {
  try {
    const baseUrl = getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
    const response = await axios.get(`${baseUrl}/api/account/check/${username.toUpperCase()}`);
    return response.data.exists;
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

/**
 * Generate session key for authentication
 * Currently not used for web authentication but could be useful for game client
 */
export const generateSessionKey = (): Buffer => {
  return Buffer.from(new Uint8Array(40));
};

export default {
  registerAccount,
  loginAccount,
  checkUsername,
  generateSessionKey
}; 