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
  };
  console.log(`Database config: ${config.host}:${config.port}/${config.database} (user: ${config.user})`);
  return config;
};

/**
 * Create a connection pool
 */
const createPool = () => {
  const dbConfig = getDbConfig();
  return mysql.createPool(dbConfig);
};

/**
 * Get the pool
 */
let pool: mysql.Pool | null = null;
const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

/**
 * Check if a username exists
 * @route GET /api/account/check
 */
router.get('/check', async (req, res) => {
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required',
    });
  }
  
  try {
    const connection = await getPool().getConnection();
    
    try {
      const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
      console.log(`Checking username in table: ${accountTable}`);
      
      const [rows] = await connection.execute(
        `SELECT id FROM ${accountTable} WHERE username = ?`,
        [username]
      );
      
      const exists = Array.isArray(rows) && rows.length > 0;
      
      res.json({
        success: true,
        exists,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error checking username:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking username',
    });
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
  const { username, email, salt, verifier, expansion, language } = req.body;
  
  // Validate required fields
  if (!username || !email || !salt || !verifier) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, salt, and verifier are required',
    });
  }
  
  try {
    const connection = await getPool().getConnection();
    
    try {
      const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
      console.log(`Creating account in table: ${accountTable}`);
      
      // Check if username already exists
      const [existingUsers] = await connection.execute(
        `SELECT id FROM ${accountTable} WHERE username = ?`,
        [username]
      );
      
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
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
      
      // Insert the new account with SRP6 data
      const [result] = await connection.execute(
        `INSERT INTO ${accountTable} (
          username, 
          salt, 
          verifier, 
          email, 
          reg_mail, 
          joindate, 
          expansion, 
          locale
        ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [
          username,
          Buffer.from(salt, 'base64'),  // Convert base64 salt to binary
          Buffer.from(verifier, 'base64'),  // Convert base64 verifier to binary
          email,
          email,
          accountExpansion,
          localeId
        ]
      );
      
      // Get the account ID
      const accountId = (result as any).insertId;
      
      res.json({
        success: true,
        message: 'Account created successfully',
        accountId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error creating account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 