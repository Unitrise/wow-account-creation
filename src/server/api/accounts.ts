// import express from 'express';
import mysql from 'mysql2/promise';
import { getConfigValue, clearConfigCache } from '../../services/configService';
import { Router } from 'express';
// import { pool } from '../../services/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as soapService from '../../services/soap';

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
 * Check if an email exists
 * @route GET /api/account/check-email
 */
router.get('/check-email', async (req, res) => {
  console.log('Received email check request:', req.query);
  const { email } = req.query;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email is required and must be a string',
    });
  }
  
  let connection;
  try {
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    console.log(`Checking email '${email}' in table: ${accountTable}`);
    
    const [rows] = await connection.execute(
      `SELECT id FROM ${accountTable} WHERE email = ?`,
      [email]
    );
    
    const exists = Array.isArray(rows) && rows.length > 0;
    console.log(`Email '${email}' exists:`, exists);
    
    res.json({
      success: true,
      exists,
    });
  } catch (error) {
    console.error('Database error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking email',
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

// Constants for WoW's SRP6
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';

/**
 * Create a new account
 * @route POST /api/account/create
 */
router.post('/create', async (req, res) => {
  console.log('Received account creation request:', req.body);
  let connection;

  try {
    // Get database connection
    const currentPool = await getPool();
    connection = await currentPool.getConnection();
    
    // Get account table name from config
    const accountTable = getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
    
    // Check if we're processing a Battle.net account
    const isBattleNetRequest = req.body.isBattleNet || req.body.bnet_hash;
    
    if (isBattleNetRequest) {
      console.log('Processing Battle.net account creation');
      
      // First, check if the Battle.net accounts table exists
      const [bnetTables] = await connection.execute(
        `SHOW TABLES LIKE 'battlenet_accounts'`
      );
      
      if (!Array.isArray(bnetTables) || bnetTables.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Battle.net accounts are not supported on this server"
        });
      }
      
      // Detect the authentication method based on the request payload
      const isSRP6Request = req.body.salt && req.body.verifier;
      const isLegacyRequest = req.body.bnet_hash || (!isSRP6Request && req.body.password);
      const srp6Version = req.body.srp_version || 0;
      
      console.log(`Battle.net request type: ${isSRP6Request ? `SRP6 v${srp6Version}` : isLegacyRequest ? 'Legacy' : 'Unknown'}`);
      
      if (isLegacyRequest) {
        // Legacy authentication for Battle.net accounts
        const { email, password, bnet_hash, expansion = 2 } = req.body;
        
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Email is required for Battle.net accounts'
          });
        }
        
        // Calculate the SHA256 hash for Battle.net if it wasn't provided
        let battleNetHash = bnet_hash;
        if (!battleNetHash && password) {
          // SHA256(UPPER(email):UPPER(password)) reversed as hex
          const hash = crypto.createHash('sha256')
            .update(`${email.toUpperCase()}:${password.toUpperCase()}`)
            .digest('hex')
            .toUpperCase();
            
          // Reverse the binary representation of the hash
          const binaryHash = Buffer.from(hash, 'hex');
          const reversedBinary = Buffer.from(Array.from(binaryHash).reverse());
          battleNetHash = reversedBinary.toString('hex').toUpperCase();
        }
        
        console.log(`Creating Battle.net account for '${email}' using legacy SHA256 authentication`);
        
        // Insert Battle.net account
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO battlenet_accounts 
           (email, sha_pass_hash) 
           VALUES (?, ?)`,
          [email.toUpperCase(), battleNetHash]
        );
        
        const bnetAccountId = result.insertId;
        
        // Now create the game account linked to this Battle.net account
        const gameAccountName = `${bnetAccountId}#1`;
        
        // For the game account, calculate SHA1 hash
        const gameAccountHash = crypto.createHash('sha1')
          .update(`${gameAccountName.toUpperCase()}:${password.toUpperCase()}`)
          .digest('hex')
          .toUpperCase();
        
        await connection.execute(
          `INSERT INTO ${accountTable} 
           (username, sha_pass_hash, email, expansion, battlenet_account, battlenet_index, locked, active_realm_id, online) 
           VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0)`,
          [gameAccountName.toUpperCase(), gameAccountHash, email.toUpperCase(), expansion, bnetAccountId, 1]
        );
      } else if (isSRP6Request) {
        // SRP6 authentication for Battle.net accounts
        const { 
          email, 
          salt, 
          verifier, 
          srp_version = 0,
          expansion = 2
        } = req.body;
        
        if (!email || !salt || !verifier) {
          return res.status(400).json({
            success: false,
            message: 'Email, salt, and verifier are required for Battle.net SRP6 authentication'
          });
        }
        
        console.log(`Creating Battle.net account for '${email}' using SRP6 v${srp_version} authentication`);
        
        // Check which fields to use for salt and verifier
        const saltField = getConfigValue<string>('DB_FIELD_SALT', 'salt');
        const verifierField = getConfigValue<string>('DB_FIELD_VERIFIER', 'verifier');
        
        // Insert Battle.net account with SRP6
        const [result] = await connection.execute<ResultSetHeader>(
          `INSERT INTO battlenet_accounts 
           (email, srp_version, ${saltField}, ${verifierField}) 
           VALUES (?, ?, ?, ?)`,
          [
            email.toUpperCase(), 
            srp_version,
            Buffer.from(salt, 'base64'), 
            Buffer.from(verifier, 'base64')
          ]
        );
        
        const bnetAccountId = result.insertId;
        
        // Now create the game account linked to this Battle.net account
        const gameAccountName = `${bnetAccountId}#1`;
        
        // For the game account, we need to calculate a new verifier
        // We'll just use the same password but with the game account username
        // In a real implementation, we might need to fetch this differently
        const gameAccountSalt = crypto.randomBytes(32);
        
        // For passwords longer than 16 characters in SRP6v2, we truncate to 16
        const effectivePassword = srp_version === 2 && req.body.password && req.body.password.length > 16
          ? req.body.password.slice(0, 16)
          : req.body.password;
        
        // If we have a password, calculate the verifier for the game account
        if (effectivePassword) {
          const h1 = crypto.createHash('sha1')
            .update(`${gameAccountName.toUpperCase()}:${effectivePassword.toUpperCase()}`)
            .digest('hex')
            .toUpperCase();
            
          const saltHex = gameAccountSalt.toString('hex').toUpperCase();
          const h2 = crypto.createHash('sha1')
            .update(saltHex + h1)
            .digest('hex')
            .toUpperCase();
            
          const x = BigInt('0x' + h2);
          const N_BIGINT = BigInt('0x' + N_HEX);
          const g_BIGINT = BigInt(g_HEX);
          const v = modPow(g_BIGINT, x, N_BIGINT);
          
          const vHex = v.toString(16).padStart(64, '0');
          const gameAccountVerifier = Buffer.from(vHex, 'hex');
          
          // Insert the game account
          await connection.execute(
            `INSERT INTO ${accountTable} 
             (username, ${saltField}, ${verifierField}, email, expansion, battlenet_account, battlenet_index, locked, active_realm_id, online) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
            [
              gameAccountName.toUpperCase(),
              gameAccountSalt,
              gameAccountVerifier,
              email.toUpperCase(),
              expansion,
              bnetAccountId,
              1
            ]
          );
        } else {
          // If we don't have a password, create the account with empty verifier
          // This is not secure but matches the behavior of some implementations
          await connection.execute(
            `INSERT INTO ${accountTable} 
             (username, email, expansion, battlenet_account, battlenet_index, locked, active_realm_id, online) 
             VALUES (?, ?, ?, ?, ?, 0, 0, 0)`,
            [
              gameAccountName.toUpperCase(),
              email.toUpperCase(),
              expansion,
              bnetAccountId,
              1
            ]
          );
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid Battle.net account registration request format'
        });
      }
      
      console.log('Battle.net account and game account created successfully');
      res.json({
        success: true,
        message: 'Battle.net account created successfully'
      });
      return;
    }
    
    // From here on, handle regular account creation (non-Battle.net)
    
    // Detect the authentication method based on the request payload
    const isSRP6Request = req.body.salt && req.body.verifier;
    const isLegacyRequest = req.body.password && !isSRP6Request;
    
    console.log(`Request type detected: ${isSRP6Request ? 'SRP6' : isLegacyRequest ? 'Legacy' : 'Unknown'}`);
    
    // Check if the account table has sha_pass_hash column (legacy mode)
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM ${accountTable} LIKE 'sha_pass_hash'`
    );
    
    const hasLegacyColumn = Array.isArray(columns) && columns.length > 0;
    console.log(`Database supports legacy auth: ${hasLegacyColumn ? 'Yes' : 'No'}`);
    
    if (isLegacyRequest && hasLegacyColumn) {
      // Legacy authentication with sha_pass_hash
      const { username, password, email, expansion = 2 } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and email are required'
        });
      }
      
      // Calculate SHA1 hash in the format AzerothCore expects
      const sha_pass_hash = crypto.createHash('sha1')
        .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
        .digest('hex')
        .toUpperCase();
      
      console.log(`Creating account '${username}' using legacy SHA1 authentication`);
      
      // Insert account using legacy format
      await connection.execute(
        `INSERT INTO ${accountTable} 
         (username, sha_pass_hash, email, reg_mail, expansion, joindate, locked, active_realm_id, online) 
         VALUES (?, ?, ?, ?, ?, NOW(), 0, 0, 0)`,
        [username.toUpperCase(), sha_pass_hash, email.toLowerCase(), email.toLowerCase(), expansion]
      );
    } else if (isSRP6Request) {
      // Modern SRP6 authentication with salt and verifier
      const { 
        username, 
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
      
      console.log(`Creating account '${username}' using SRP6 authentication`);
      
      // Insert account using AzerothCore's SRP6 format
      await connection.execute(
        `INSERT INTO ${accountTable} 
         (username, salt, verifier, email, reg_mail, expansion, joindate, locale, os, session_key, locked, active_realm_id, online) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NULL, 0, 0, 0)`,
        [
          username.toUpperCase(), 
          Buffer.from(salt, 'base64'), // Convert base64 string to binary buffer
          Buffer.from(verifier, 'base64'), // Convert base64 string to binary buffer
          email.toLowerCase(), 
          reg_mail.toLowerCase(), 
          expansion,
          locale,
          os
        ]
      );
    } else if (isLegacyRequest && !hasLegacyColumn) {
      // Legacy request but no sha_pass_hash column - generate SRP6 credentials
      const { username, password, email, expansion = 2 } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({
          success: false,
          message: 'Username, password, and email are required'
        });
      }
      
      console.log(`Converting legacy request to SRP6 for account '${username}'`);
      
      // Generate a random 32-byte salt
      const salt = crypto.randomBytes(32);
      
      // Calculate verifier
      // Step 1: Get h1 = SHA1(username:password)
      const h1 = crypto.createHash('sha1')
        .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
        .digest('hex')
        .toUpperCase();
      
      // Step 2: Get h2 = SHA1(salt | h1)
      const saltHex = salt.toString('hex').toUpperCase();
      const h2 = crypto.createHash('sha1')
        .update(saltHex + h1)
        .digest('hex')
        .toUpperCase();
      
      // Step 3: Calculate v = g^x % N
      const x = BigInt('0x' + h2);
      const N_BIGINT = BigInt('0x' + N_HEX);
      const g_BIGINT = BigInt(g_HEX);
      const v = modPow(g_BIGINT, x, N_BIGINT);
      
      // Step 4: Convert v to a binary buffer
      const vHex = v.toString(16).padStart(64, '0');
      const verifier = Buffer.from(vHex, 'hex');
      
      // Insert account using AzerothCore's SRP6 format (for legacy request conversion)
      await connection.execute(
        `INSERT INTO ${accountTable} 
         (username, salt, verifier, email, reg_mail, expansion, joindate, locale, os, session_key, locked, active_realm_id, online) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NULL, 0, 0, 0)`,
        [
          username.toUpperCase(), 
          salt,
          verifier,
          email.toLowerCase(), 
          email.toLowerCase(), 
          expansion,
          0, // locale
          'Win' // os
        ]
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format or unsupported authentication method'
      });
    }

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
    
    // Check if the account table has sha_pass_hash column (legacy mode)
    const [columns] = await connection.execute(
      `SHOW COLUMNS FROM ${accountTable} LIKE 'sha_pass_hash'`
    );
    
    const useLegacyAuth = Array.isArray(columns) && columns.length > 0;
    console.log(`Using ${useLegacyAuth ? 'legacy SHA1' : 'SRP6'} authentication for login`);
    
    if (useLegacyAuth) {
      // Legacy authentication with sha_pass_hash
      // Calculate SHA1 hash in the format AzerothCore expects
      const sha_pass_hash = crypto.createHash('sha1')
        .update(`${username.toUpperCase()}:${password.toUpperCase()}`)
        .digest('hex')
        .toUpperCase();
      
      // Verify credentials
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM ${accountTable} WHERE username = ? AND sha_pass_hash = ?`,
        [username.toUpperCase(), sha_pass_hash]
      );
      
      if (rows.length > 0) {
        // Generate a new session key (40 bytes)
        const sessionKey = crypto.randomBytes(40);
        
        // Update last login and session key
        await connection.execute(
          `UPDATE ${accountTable} SET session_key = ?, last_login = NOW(), last_ip = ?, locked = 0, online = 0, active_realm_id = 0 WHERE id = ?`,
          [sessionKey, req.ip || '127.0.0.1', rows[0].id]
        );
        
        console.log('Login successful using legacy authentication');
        return res.json({ 
          success: true,
          sessionKey: sessionKey.toString('base64') // Return session key to client
        });
      } else {
        // Update failed logins count
        const [accountRows] = await connection.execute<RowDataPacket[]>(
          `SELECT id FROM ${accountTable} WHERE username = ?`,
          [username.toUpperCase()]
        );
        
        if (accountRows.length > 0) {
          await connection.execute(
            `UPDATE ${accountTable} SET failed_logins = failed_logins + 1, last_attempt_ip = ? WHERE id = ?`,
            [req.ip || '127.0.0.1', accountRows[0].id]
          );
        }
        
        console.log('Login failed: Invalid password (legacy authentication)');
        return res.json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
    } else {
      // SRP6 authentication
      // Get account data
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
        // Generate a new session key (40 bytes)
        const sessionKey = crypto.randomBytes(40);
        
        // Update last login and session key
        await connection.execute(
          `UPDATE ${accountTable} SET session_key = ?, last_login = NOW(), last_ip = ?, locked = 0, online = 0, active_realm_id = 0 WHERE id = ?`,
          [sessionKey, req.ip || '127.0.0.1', account.id]
        );

        console.log('Login successful using SRP6 authentication');
        res.json({ 
          success: true,
          sessionKey: sessionKey.toString('base64') // Return session key to client
        });
      } else {
        // Update failed logins count
        await connection.execute(
          `UPDATE ${accountTable} SET failed_logins = failed_logins + 1, last_attempt_ip = ? WHERE id = ?`,
          [req.ip || '127.0.0.1', account.id]
        );
        
        console.log('Login failed: Invalid password (SRP6 authentication)');
        res.json({ 
          success: false, 
          message: 'Invalid username or password' 
        });
      }
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

/**
 * Create a new account using server console commands
 * @route POST /api/account/create-with-command
 */
router.post('/create-with-command', async (req, res) => {
  console.log('Received account creation request for command execution:', req.body);
  
  const { username, password, email, gmlevel = 0 } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  // Get the world server command from config, or use default
  const serverCommand = getConfigValue<string>('SERVER_COMMAND_PATH', 'worldserver.exe');
  const serverConsolePort = getConfigValue<number>('SERVER_CONSOLE_PORT', 3443);
  
  try {
    // Execute using telnet or SOAP based on what's available
    // For this example, we'll use a direct command through a telnet/netcat client
    // This code assumes you have socat, telnet, or netcat installed
    
    // Build the account creation command
    // Format is usually: account create [username] [password] [email]
    const createAccountCmd = `account create ${username} ${password}`;
    // If email is provided, add it as well
    const emailCmd = email ? `account set email ${username} ${email}` : '';
    // If GM level is provided and not zero, set it
    const gmLevelCmd = gmlevel > 0 ? `account set gmlevel ${username} ${gmlevel} -1` : '';
    
    // Combine commands into one string to send to the server
    const commandsToRun = [createAccountCmd, emailCmd, gmLevelCmd].filter(cmd => cmd).join('\n');
    
    // Method 1: Using telnet/socat to connect to the server console
    // If this is running on the same machine as the server, we can use a simpler approach
    
    const execPromise = promisify(exec);
    
    // Check if this is on the same machine as the server and try direct method
    const isServerLocal = getConfigValue<boolean>('SERVER_IS_LOCAL', true);
    
    let commandOutput = '';
    
    if (isServerLocal) {
      // On Windows, we might use the admin console by passing commands directly to the server
      // Note: This approach requires that the server supports command-line arguments for commands
      const result = await execPromise(`${serverCommand} --command="${createAccountCmd}"`);
      commandOutput = result.stdout || result.stderr || 'Command executed but no output received';
    } else {
      // For remote server, use telnet/socat to connect to the remote admin console
      // This assumes the server has a telnet console enabled on the specified port
      const result = await execPromise(`echo "${commandsToRun}" | telnet localhost ${serverConsolePort}`);
      commandOutput = result.stdout || result.stderr || 'Command executed but no output received';
    }
    
    // Check for common error messages in the output
    if (commandOutput.includes('Account with this name already exists') || 
        commandOutput.toLowerCase().includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Account with this name already exists'
      });
    }
    
    if (commandOutput.toLowerCase().includes('error') || commandOutput.toLowerCase().includes('failed')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create account through console',
        details: commandOutput
      });
    }
    
    console.log('Account created successfully through console');
    console.log('Command output:', commandOutput);
    
    res.json({
      success: true,
      message: 'Account created successfully',
      details: commandOutput
    });
  } catch (error: any) {
    console.error('Error executing server command:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute server command',
      details: error.message
    });
  }
});

/**
 * Create a new account using server console commands via SOAP
 * @route POST /api/account/create-with-soap
 */
router.post('/create-with-soap', async (req, res) => {
  console.log('Received account creation request for SOAP execution:', req.body);
  
  const { username, password, email, gmlevel = 0, expansion = 2 } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }
  
  try {
    // Create account using SOAP
    let result = await soapService.createAccount(username, password, email, expansion);
    
    // Set GM level if needed
    if (gmlevel > 0) {
      try {
        const gmResult = await soapService.setGMLevel(username, gmlevel);
        result += '\n' + gmResult;
      } catch (gmError) {
        console.warn('Failed to set GM level, but account was created:', gmError);
      }
    }
    
    console.log('Account created successfully via SOAP');
    console.log('Result:', result);
    
    // Check for common error messages in the result
    if (result.includes('Account already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Account with this name already exists'
      });
    }
    
    res.json({
      success: true,
      message: 'Account created successfully',
      details: result
    });
  } catch (error: any) {
    console.error('Error creating account via SOAP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create account via SOAP',
      details: error.message
    });
  }
});

export default router; 