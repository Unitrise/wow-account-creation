// import express from 'express';
import mysql from 'mysql2/promise';
import { getConfigValue, clearConfigCache } from '../../services/configService';
import { Router } from 'express';
// import { pool } from '../../services/database';
import { RowDataPacket } from 'mysql2';
import crypto from 'crypto';

const router = Router();

// Clear any cached config to ensure we load fresh values
clearConfigCache();

/**
 * Get database configuration from config.cfg
 */
const getDbConfig = () => {
  console.log('Loading database configuration from config file');
  const config = {
    host: getConfigValue<string>('DB_HOST', 'localhost'),
    port: getConfigValue<number>('DB_PORT', 3306),
    user: getConfigValue<string>('DB_USER', 'root'),
    password: getConfigValue<string>('DB_PASSWORD', 'root'),
    database: getConfigValue<string>('DB_NAME', 'acore_auth'),
    // Add connection timeout and other options
    connectTimeout: 10000, // 10 seconds
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  };
  console.log(`Database config: ${config.host}:${config.port}/${config.database} (user: ${config.user})`);
  return config;
};

/**
 * Create a connection pool
 */
const createPool = () => {
  const dbConfig = getDbConfig();
  const newPool = mysql.createPool(dbConfig);
  
  // Test the connection
  newPool.getConnection()
    .then(connection => {
      console.log('Database connection test successful');
      connection.release();
    })
    .catch(err => {
      console.error('Database connection test failed:', err);
    });
    
  return newPool;
};

/**
 * Get the pool with connection check
 */
let dbPool: mysql.Pool | null = null;
const getPool = async () => {
  if (!dbPool) {
    dbPool = createPool();
  }
  
  try {
    // Test if pool is still working
    const connection = await dbPool.getConnection();
    connection.release();
    return dbPool;
  } catch (error) {
    console.error('Pool connection failed, creating new pool:', error);
    dbPool = createPool();
    return dbPool;
  }
};

/**
 * Check if a username exists
 * @route GET /api/account/check
 */
router.get('/check', async (req, res) => {
  console.log('Received username check request:', req.query);
  const { username } = req.query;
  
  if (!username || typeof username !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Username is required and must be a string',
    });
  }
  
  let connection;
  try {
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    console.log(`Checking username '${username}' in table: ${accountTable}`);
    
    const [rows] = await connection.execute(
      `SELECT id FROM ${accountTable} WHERE username = ?`,
      [username]
    );
    
    const exists = Array.isArray(rows) && rows.length > 0;
    console.log(`Username '${username}' exists:`, exists);
    
    res.json({
      success: true,
      exists,
    });
  } catch (error) {
    console.error('Database error checking username:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking username',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * Convert language code to AzerothCore locale ID
 */
const getLocaleId = (language: string = 'en'): number => {
  const localeMap: { [key: string]: number } = {
    'en': 0,  // English
    'ko': 1,  // Korean
    'fr': 2,  // French
    'de': 3,  // German
    'zh': 4,  // Chinese
    'tw': 5,  // Taiwanese
    'es': 6,  // Spanish (Spain)
    'mx': 7,  // Spanish (Mexico)
    'ru': 8   // Russian
  };
  
  // Get the base language code (first 2 characters)
  const baseLanguage = language.toLowerCase().slice(0, 2);
  
  // Return the locale ID or default to English (0)
  return localeMap[baseLanguage] || 0;
};

/**
 * Create a new account
 * @route POST /api/account/create
 */
router.post('/create', async (req, res) => {
  console.log('Received account creation request:', req.body);
  const { 
    username, 
    // For SRP6 we need salt and verifier instead of sha_pass_hash
    salt, 
    verifier, 
    email, 
    reg_mail = email,
    expansion = 2,
    locale = 0,
    os = 'Win' 
  } = req.body;
  
  if (!username || !salt || !verifier || !email) {
    return res.status(400).json({
      success: false,
      message: 'Username, salt, verifier, and email are required'
    });
  }
  
  let connection;
  try {
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    console.log(`Creating account '${username}' in table: ${accountTable}`);
    
    // Insert account using AzerothCore's table structure
    const [result] = await connection.execute(
      `INSERT INTO ${accountTable} 
       (username, salt, verifier, email, reg_mail, expansion, joindate, locale, os) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        username, 
        Buffer.from(salt, 'base64'), // Convert base64 string to binary buffer
        Buffer.from(verifier, 'base64'), // Convert base64 string to binary buffer
        email, 
        reg_mail, 
        expansion,
        locale,
        os
      ]
    );

    console.log('Account created successfully');
    res.json({
      success: true,
      message: 'Account created successfully'
    });

  } catch (error: any) {
    console.error('Account creation error:', error);
    res.status(500).json({
      success: false,
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Username already exists' 
        : 'Failed to create account',
      details: error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Constants for WoW's SRP6
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';

/**
 * Login account
 * @route POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  console.log('Received login request');
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  let connection;
  try {
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    console.log(`Verifying login for '${username}' in table: ${accountTable}`);
    
    // First get the account details including salt and verifier
    const [rows] = await connection.execute<RowDataPacket[]>(
      `SELECT id, username, salt, verifier FROM ${accountTable} WHERE username = ?`,
      [username.toUpperCase()]
    );

    if (!rows || rows.length === 0) {
      console.log('Login failed: Account not found');
      return res.json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    const account = rows[0];
    
    // For simplicity in a web application, we're using a direct login approach
    // This is not the full SRP6 protocol used by the game client
    
    // Step 1: Get the stored salt
    const salt = account.salt; // This is a binary buffer
    
    // Step 2: Calculate h1 = SHA1(username:password)
    const h1 = crypto.createHash('sha1')
      .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
      .digest('hex')
      .toUpperCase();
    
    // Step 3: Calculate h2 = SHA1(salt | h1)
    const saltHex = salt.toString('hex').toUpperCase();
    const h2 = crypto.createHash('sha1')
      .update(saltHex + h1)
      .digest('hex')
      .toUpperCase();
    
    // Step 4: Convert h2 to a BigInteger
    const x = BigInt('0x' + h2);
    
    // Step 5: Calculate v = g^x % N
    const N_BIGINT = BigInt('0x' + N_HEX);
    const g_BIGINT = BigInt(g_HEX);
    const v = modPow(g_BIGINT, x, N_BIGINT);
    
    // Step 6: Convert v to a byte array and compare with stored verifier
    const vHex = v.toString(16).padStart(64, '0');
    const calculatedVerifier = Buffer.from(vHex, 'hex');
    const storedVerifier = account.verifier; // This is a binary buffer
    
    // Compare calculated verifier with stored verifier
    let isPasswordValid = false;
    try {
      // For more robust comparison, use a constant-time comparison function
      isPasswordValid = crypto.timingSafeEqual(calculatedVerifier, storedVerifier);
    } catch (e) {
      console.error('Verifier comparison error:', e);
      isPasswordValid = false;
    }
    
    if (isPasswordValid) {
      // Update last login
      await connection.execute(
        `UPDATE ${accountTable} SET last_login = NOW(), last_ip = ? WHERE id = ?`,
        [req.ip, account.id]
      );

      console.log('Login successful');
      res.json({ success: true });
    } else {
      // Update failed logins count
      await connection.execute(
        `UPDATE ${accountTable} SET failed_logins = failed_logins + 1, last_attempt_ip = ? WHERE id = ?`,
        [req.ip, account.id]
      );
      
      console.log('Login failed: Invalid password');
      res.json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

/**
 * Helper function for modular exponentiation
 * Calculates (base^exponent) % modulus
 */
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  return result;
}

export default router; 