import mysql from 'mysql2/promise';
import { getConfigValue, loadConfig } from '../../services/configService';
import { Router } from 'express';
import database from '../../services/database';

const router = Router();
const config = loadConfig();

/**
 * Get database configuration from config.cfg
 */
const getDbConfig = () => ({
  host: getConfigValue<string>(config, 'DB_HOST', 'localhost'),
  port: getConfigValue<number>(config, 'DB_PORT', 3306),
  user: getConfigValue<string>(config, 'DB_USER', 'acore'),
  password: getConfigValue<string>(config, 'DB_PASSWORD', 'password'),
  database: getConfigValue<string>(config, 'DB_NAME', 'acore_auth'),
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
      const accountTable = getConfigValue<string>(config, 'DB_TABLE_ACCOUNT', 'account');
      
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
  const { username, password, email } = req.body;

  try {
    // Check if account creation is enabled
    const accountCreationEnabled = getConfigValue<boolean>(config, 'FEATURE_ACCOUNT_CREATION', true);
    if (!accountCreationEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Account creation is currently disabled',
      });
    }

    // Check if account already exists
    const exists = await database.checkAccount(username);
    if (exists) {
      return res.status(400).json({ error: 'Account already exists' });
    }

    // Create the account
    const result = await database.createAccount(username, email, password);
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    res.json({ success: true, accountId: result.message });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

/**
 * Check account endpoint
 * @route GET /api/account/check/:username
 */
router.get('/check/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const exists = await database.checkAccount(username);
    res.json({ exists });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ error: 'Failed to check account' });
  }
});

/**
 * Login endpoint
 * @route POST /api/account/login
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await database.verifyAccount(username, password);
    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router; 