import express from 'express';
import mysql from 'mysql2/promise';
import { getConfigValue, clearConfigCache } from '../../services/configService';

const router = express.Router();

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
let pool: mysql.Pool | null = null;
const getPool = async () => {
  if (!pool) {
    pool = createPool();
  }
  
  try {
    // Test if pool is still working
    const connection = await pool.getConnection();
    connection.release();
    return pool;
  } catch (error) {
    console.error('Pool connection failed, creating new pool:', error);
    pool = createPool();
    return pool;
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
  console.log('Received account creation request');
  const { username, email, salt, verifier, expansion, language } = req.body;
  
  // Log the received data (excluding sensitive info)
  console.log('Account creation data:', {
    username,
    email,
    expansion,
    language,
    hasSalt: !!salt,
    hasVerifier: !!verifier
  });
  
  // Validate required fields
  if (!username || !email || !salt || !verifier) {
    console.error('Missing required fields:', {
      hasUsername: !!username,
      hasEmail: !!email,
      hasSalt: !!salt,
      hasVerifier: !!verifier
    });
    return res.status(400).json({
      success: false,
      message: 'Username, email, salt, and verifier are required',
    });
  }
  
  let connection;
  try {
    console.log('Getting database connection...');
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    console.log('Database connection acquired');
    
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    console.log(`Creating account in table: ${accountTable}`);
    
    // Check if username already exists
    console.log('Checking for existing username...');
    const [existingUsers] = await connection.execute(
      `SELECT id FROM ${accountTable} WHERE username = ?`,
      [username]
    );
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      console.log('Username already exists');
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }
    
    // Get default expansion from config
    const defaultExpansion = getConfigValue<number>('ACCOUNT_DEFAULT_EXPANSION', 2);
    const accountExpansion = expansion !== undefined ? expansion : defaultExpansion;
    
    // Convert language to locale ID
    const localeId = getLocaleId(language);
    
    console.log('Inserting new account...');
    // Insert the new account with SRP6 data
    const [result] = await connection.execute(
      `INSERT INTO ${accountTable} (
        username,
        salt,
        verifier,
        email,
        reg_mail,
        joindate,
        last_ip,
        expansion,
        locale,
        os
      ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`,
      [
        username,
        Buffer.from(salt, 'base64'),  // Convert base64 salt to binary
        Buffer.from(verifier, 'base64'),  // Convert base64 verifier to binary
        email,
        email,
        '127.0.0.1',  // default last_ip
        accountExpansion,
        localeId,
        ''  // default os
      ]
    );
    
    // Get the account ID
    const accountId = (result as any).insertId;
    console.log('Account created successfully:', { accountId });
    
    res.json({
      success: true,
      message: 'Account created successfully',
      accountId,
    });
  } catch (error) {
    console.error('Database error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    if (connection) {
      console.log('Releasing database connection');
      connection.release();
    }
  }
});

export default router; 