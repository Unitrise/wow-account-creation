import mysql from 'mysql2/promise';
import { createHash } from 'crypto';
import { getConfigValue } from './configService';

// Database connection configuration
const dbConfig = {
  host: getConfigValue<string>('DB_HOST', 'localhost'),
  port: getConfigValue<number>('DB_PORT', 3306),
  user: getConfigValue<string>('DB_USER', 'root'),
  password: getConfigValue<string>('DB_PASSWORD', 'root'),
  database: getConfigValue<string>('DB_NAME', 'acore_auth'),
};

// Create a connection pool
export const pool = mysql.createPool(dbConfig);

// Character database connection (if separate)
if (getConfigValue<string>('USE_CHARS_DB', 'false') === 'true') {
  const charDbConfig = {
    host: getConfigValue<string>('DB_CHARS_HOST', 'localhost'),
    port: getConfigValue<number>('DB_CHARS_PORT', 3306),
    user: getConfigValue<string>('DB_CHARS_USER', 'root'),
    password: getConfigValue<string>('DB_CHARS_PASSWORD', 'root'),
    database: getConfigValue<string>('DB_CHARS_DATABASE', 'acore_characters'),
  };
  // Character pool creation commented out until needed
  // mysql.createPool(charDbConfig);
}

// Password hashing methods
const hashMethods = {
  // AzerothCore/TrinityCore default
  sha1: (password: string, options: any = {}): string => {
    const hash = createHash('sha1').update(password).digest('hex');
    return options.uppercase ? hash.toUpperCase() : hash;
  },
  
  // vBulletin style hashing (used by some custom servers)
  vbulletin: (password: string, options: any = {}): string => {
    const salt = options.salt || '';
    const hash = createHash('md5').update(password + salt).digest('hex');
    return options.uppercase ? hash.toUpperCase() : hash;
  },
  
  // TrinityCore style with username (username:password)
  trinitycore: (password: string, options: any = {}): string => {
    const username = options.username || '';
    const combined = `${username.toUpperCase()}:${password.toUpperCase()}`;
    const hash = createHash('sha1').update(combined).digest('hex');
    return options.uppercase ? hash.toUpperCase() : hash;
  },
  
  // Plain text (for testing only, not recommended)
  plain: (password: string): string => {
    return password;
  }
};

// Function to hash password using configured method
export const hashPassword = (
  password: string, 
  options: { 
    hashType?: string; 
    uppercase?: boolean; 
    salt?: string;
    username?: string;
  } = {}
): string => {
  const hashType = options.hashType || getConfigValue<string>('PASSWORD_HASH_TYPE', 'sha1');
  const hashMethod = hashMethods[hashType as keyof typeof hashMethods] || hashMethods.sha1;
  
  return hashMethod(password, options);
};

// Interface for account options
interface AccountOptions {
  hashType?: string;
  uppercase?: boolean;
  salt?: string;
  defaultStatus?: number;
  defaultExpansion?: number;
  defaultLevel?: number;
  requireEmail?: boolean;
  verifyEmail?: boolean;
  accountTable?: string;
}

// Function to create a new account
export const createAccount = async (
  username: string,
  email: string,
  password: string,
  options: AccountOptions = {}
): Promise<{ success: boolean; message: string }> => {
  const accountTable = options.accountTable || getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
  // Status is set by the database default value
  const defaultExpansion = options.defaultExpansion !== undefined 
    ? options.defaultExpansion 
    : getConfigValue<number>('ACCOUNT_DEFAULT_EXPANSION', 2);
  
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();
    
    try {
      // Check if username already exists
      const [existingUsers] = await connection.execute(
        `SELECT id FROM ${accountTable} WHERE username = ?`,
        [username]
      );
      
      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        return { success: false, message: 'Username already exists' };
      }
      
      // Hash the password with configured options
      const hashedPassword = hashPassword(password, {
        hashType: options.hashType || getConfigValue<string>('PASSWORD_HASH_TYPE', 'sha1'),
        uppercase: options.uppercase !== undefined 
          ? options.uppercase 
          : getConfigValue<string>('PASSWORD_UPPERCASE', 'true') === 'true',
        salt: options.salt || getConfigValue<string>('PASSWORD_SALT', ''),
        username
      });
      
      // Insert the new account
      await connection.execute(
        `INSERT INTO ${accountTable} (username, sha_pass_hash, email, reg_mail, joindate, expansion) 
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [username, hashedPassword, email, email, defaultExpansion]
      );
      
      return { success: true, message: 'Account created successfully' };
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return { 
      success: false, 
      message: 'An error occurred while creating the account' 
    };
  }
};

// Function to verify account credentials
export const verifyAccount = async (
  username: string,
  password: string,
  options: AccountOptions = {}
): Promise<{ success: boolean; message: string }> => {
  const accountTable = options.accountTable || getConfigValue<string>('DB_TABLE_ACCOUNT', 'account');
  
  try {
    const connection = await pool.getConnection();
    
    try {
      // Hash the password with the same method used for account creation
      const hashedPassword = hashPassword(password, {
        hashType: options.hashType || getConfigValue<string>('PASSWORD_HASH_TYPE', 'sha1'),
        uppercase: options.uppercase !== undefined 
          ? options.uppercase 
          : getConfigValue<string>('PASSWORD_UPPERCASE', 'true') === 'true',
        salt: options.salt || getConfigValue<string>('PASSWORD_SALT', ''),
        username
      });
      
      const [accounts] = await connection.execute(
        `SELECT id FROM ${accountTable} WHERE username = ? AND sha_pass_hash = ?`,
        [username, hashedPassword]
      );
      
      if (Array.isArray(accounts) && accounts.length > 0) {
        return { success: true, message: 'Login successful' };
      } else {
        return { success: false, message: 'Invalid username or password' };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return { 
      success: false, 
      message: 'An error occurred while verifying the account' 
    };
  }
};

export default {
  createAccount,
  verifyAccount,
  hashPassword
}; 