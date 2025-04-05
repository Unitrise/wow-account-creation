import axios from 'axios';
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
  expansion?: number;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  accountId?: number;
}

/**
 * Calculate WoW's password hash
 * SHA1(UPPER(username) + ':' + UPPER(password))
 */
function calculatePasswordHash(username: string, password: string): string {
    const concat = `${username.toUpperCase()}:${password.toUpperCase()}`;
    return Hex.stringify(SHA1(concat)).toUpperCase();
}

/**
 * Register account using WoW's standard password hashing
 */
export const registerAccount = async (accountData: AccountData): Promise<RegisterResponse> => {
    try {
        const { username, email, password } = accountData;
        
        const registrationData = {
            username: username.toUpperCase(),
            sha_pass_hash: calculatePasswordHash(username, password),
            email: email.toLowerCase(),
            reg_mail: email.toLowerCase(),
            expansion: accountData.expansion || 2,
            locale: 0,
            os: 'Win',
            locked: 0
        };

        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
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
 * Login using WoW's standard password hash
 */
export const loginAccount = async (username: string, password: string): Promise<boolean> => {
    try {
        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const response = await axios.post(`${baseUrl}/api/auth/login`, {
            username: username.toUpperCase(),
            sha_pass_hash: calculatePasswordHash(username, password)
        });

        return response.data.success;
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

export default {
    registerAccount,
    loginAccount,
    checkUsername
};