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
const k_HEX = '3';

const N = new BigInteger(N_HEX, 16);
const g = new BigInteger(g_HEX, 16);
const k = new BigInteger(k_HEX, 16);

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
 * Calculate SHA1 hash exactly as WoW client does
 */
function calculateSRP6Verifier(username: string, password: string, salt: Buffer): Buffer {
    username = username.toUpperCase();
    password = password.toUpperCase();
    const firstHash = SHA1(`${username}:${password}`);
    const saltHex = salt.toString('hex').toUpperCase();
    const secondHash = SHA1(saltHex + Hex.stringify(firstHash).toUpperCase());
    const x = new BigInteger(Hex.stringify(secondHash), 16);
    const v = g.modPow(x, N);
    const vHex = v.toString(16).padStart(64, '0');
    return Buffer.from(vHex, 'hex');
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
        
        // Generate 32-byte random salt
        const salt = Buffer.from(new Uint8Array(32));
        window.crypto.getRandomValues(salt);
        
        // Calculate verifier using WoW's method
        const verifier = calculateSRP6Verifier(username, password, salt);

        // Prepare registration data matching AzerothCore schema
        const registrationData = {
            username: username.toUpperCase(),
            email: email.toLowerCase(),
            reg_mail: email.toLowerCase(), // AzerothCore stores registration email separately
            salt: salt.toString('base64'),
            verifier: verifier.toString('base64'),
            expansion: 2,
            locale: 0,
            os: 'Win',
            last_ip: '127.0.0.1',
            last_attempt_ip: '127.0.0.1',
            failed_logins: 0,
            locked: 0,
            lock_country: '00',
            online: 0,
            totaltime: 0
        };

        console.log('Registration data (debug):', {
            username: registrationData.username,
            saltLength: salt.length,
            verifierLength: verifier.length
        });

        const baseUrl = getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
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
 * Login using WoW's SRP6 protocol
 */
export const loginAccount = async (username: string, password: string): Promise<boolean> => {
    try {
        username = username.toUpperCase();
        password = password.toUpperCase();

        // 1. Get auth challenge from server
        const baseUrl = getConfigValue<string>('API_BASE_URL', 'http://localhost:3000');
        const challengeResponse = await axios.post(`${baseUrl}/api/auth/challenge`, {
            username
        });

        if (!challengeResponse.data.success) {
            throw new Error(challengeResponse.data.message);
        }

        const { salt: saltBase64, B: serverB } = challengeResponse.data;
        const salt = Buffer.from(saltBase64, 'base64');

        // 2. Calculate first hash (identity)
        const identityHash = SHA1(`${username}:${password}`);
        
        // 3. Calculate x
        const saltHex = salt.toString('hex').toUpperCase();
        const x = new BigInteger(
            Hex.stringify(
                SHA1(saltHex + Hex.stringify(identityHash).toUpperCase())
            ),
            16
        );

        // 4. Generate random a (client private ephemeral)
        const a = new BigInteger(Buffer.from(window.crypto.getRandomValues(new Uint8Array(32))).toString('hex'), 16);
        
        // 5. Calculate A = g^a mod N (client public ephemeral)
        const A = g.modPow(a, N);

        // 6. Calculate u = H(A | B)
        const u = new BigInteger(
            Hex.stringify(
                SHA1(
                    A.toString(16).padStart(64, '0').toUpperCase() +
                    serverB.padStart(64, '0').toUpperCase()
                )
            ),
            16
        );

        // 7. Calculate session key
        const B = new BigInteger(serverB, 16);
        const S = B.subtract(k.multiply(g.modPow(x, N)))
                  .modPow(a.add(u.multiply(x)), N);

        // 8. Calculate proof M1
        const M1 = SHA1(
            A.toString(16).padStart(64, '0').toUpperCase() +
            serverB.padStart(64, '0').toUpperCase() +
            Hex.stringify(
                SHA1(S.toString(16).padStart(64, '0').toUpperCase())
            ).toUpperCase()
        );

        // 9. Send proof to server
        const loginResponse = await axios.post(`${baseUrl}/api/auth/proof`, {
            username,
            A: A.toString(16).padStart(64, '0').toUpperCase(),
            M1: Hex.stringify(M1).toUpperCase()
        });

        if (loginResponse.data.success) {
            // Store session key if needed
            localStorage.setItem('wow_session', loginResponse.data.sessionKey);
            return true;
        }

        return false;
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