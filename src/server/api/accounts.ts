import express from 'express';
import mysql from 'mysql2/promise';
import { getConfigValue } from '../../services/configService.js';

const router = express.Router();

/**
 * Get database configuration from config.cfg
 */
const getDbConfig = () => ({
  host: getConfigValue<string>('DB_HOST', 'localhost'),
  port: getConfigValue<number>('DB_PORT', 3306),
  user: getConfigValue<string>('DB_USER', 'acore'),
  password: getConfigValue<string>('DB_PASSWORD', 'password'),
  database: getConfigValue<string>('DB_NAME', 'acore_auth'),
});

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
 * Create a new account using SRP6
 * @route POST /api/account/create
 */
router.post('/create', async (req, res) => {
  try {
    // Check if account creation is enabled
    if (!getConfigValue<boolean>('FEATURE_ACCOUNT_CREATION', true)) {
      return res.status(403).json({
        success: false,
        message: 'Account creation is currently disabled',
      });
    }
    
    const { username, email, salt, verifier, expansion, language } = req.body;
    
    // Validate required fields
    if (!username || !email || !salt || !verifier) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing',
      });
    }
    
    const connection = await getPool().getConnection();
    
    try {
      const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
      
      // Check if username already exists
      const [existingRows] = await connection.execute(
        `SELECT id FROM ${accountTable} WHERE username = ?`,
        [username]
      );
      
      if (Array.isArray(existingRows) && existingRows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
      }
      
      // Convert from base64 to Buffer
      const saltBuffer = Buffer.from(salt, 'base64');
      const verifierBuffer = Buffer.from(verifier, 'base64');
      
      // Default expansion if not provided
      const defaultExpansion = getConfigValue<number>('ACCOUNT_DEFAULT_EXPANSION', 2);
      const accountExpansion = expansion || defaultExpansion;
      
      // Default locale
      const defaultLocale = language === 'en' ? 0 : (language === 'he' ? 10 : 0);
      
      // Insert new account with SRP6 auth
      const [result] = await connection.execute(
        `INSERT INTO ${accountTable} (username, salt, verifier, email, reg_mail, joindate, expansion, locale) 
         VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
        [username, saltBuffer, verifierBuffer, email, email, accountExpansion, defaultLocale]
      );
      
      const insertResult = result as { insertId: number };
      
      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        accountId: insertResult.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating account:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during account creation',
    });
  }
});

export default router; 