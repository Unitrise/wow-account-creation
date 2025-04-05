// import express from 'express';
import mysql from 'mysql2/promise';
import { getConfigValue, clearConfigCache } from '../../services/configService';
import { Router } from 'express';
// import { pool } from '../../services/database';
import { RowDataPacket } from 'mysql2';

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
  const { username, sha_pass_hash, email, expansion = 2 } = req.body;
  if (!dbPool) {
    throw new Error('Database pool is not initialized');
  }
  try {
    // Insert account using WoW's standard format
    const [result] = await dbPool.query(
      `INSERT INTO account 
       (username, sha_pass_hash, email, reg_mail, expansion, joindate) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [username, sha_pass_hash, email, email, expansion]
    );

    res.json({
      success: true,
      message: 'Account created successfully'
    });

  } catch (error: any) {
    console.error('Account creation error:', error);
    res.json({
      success: false,
      message: error.code === 'ER_DUP_ENTRY' 
        ? 'Username already exists' 
        : 'Failed to create account'
    });
  }
});

router.post('/login', async (req, res) => {
  const { username, sha_pass_hash } = req.body;
  
  try {
    if (!dbPool) {
      throw new Error('Database pool is not initialized');
    }
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT id FROM account WHERE username = ? AND sha_pass_hash = ?',
      [username, sha_pass_hash]
    );

    if (rows.length > 0) {
      // Update last login
      if (!dbPool) {
        throw new Error('Database pool is not initialized');
      }
      await dbPool.query(
        'UPDATE account SET last_login = NOW(), last_ip = ? WHERE id = ?',
        [req.ip, rows[0].id]
      );

      res.json({ success: true });
    } else {
      res.json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

  } catch (error) {
    console.error('Login error:', error);
    res.json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

export default router; 