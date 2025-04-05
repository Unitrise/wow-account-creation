/**
 * Database Configuration
 * 
 * This file contains all database-related configuration settings.
 * Customize these values based on your WoW private server setup.
 */

// Database connection settings
export const dbConfig = {
  // Database server connection info
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'acore_auth',
  },

  // Database tables configuration
  tables: {
    // Auth database tables
    account: process.env.DB_TABLE_ACCOUNT || 'account',
    accountAccess: process.env.DB_TABLE_ACCOUNT_ACCESS || 'account_access',
    realmlist: process.env.DB_TABLE_REALMLIST || 'realmlist',
    
    // Character database tables (if used)
    characters: process.env.DB_CHARS_TABLE_CHARACTERS || 'characters',
    characterInventory: process.env.DB_CHARS_TABLE_INVENTORY || 'character_inventory',
    itemInstance: process.env.DB_CHARS_TABLE_ITEM_INSTANCE || 'item_instance',
  },
  
  // Set to true to use separate character database connection
  useCharactersDb: process.env.USE_CHARS_DB === 'true' || false,
  
  // Character database connection (if separate from auth)
  charactersDbConnection: {
    host: process.env.DB_CHARS_HOST || 'localhost',
    port: parseInt(process.env.DB_CHARS_PORT || '3306'),
    user: process.env.DB_CHARS_USER || 'root',
    password: process.env.DB_CHARS_PASSWORD || 'root',
    database: process.env.DB_CHARS_DATABASE || 'acore_characters',
  },
};

// Password hashing configuration (depending on core type)
export const passwordConfig = {
  // Available types: 'sha1', 'vbulletin', 'trinitycore', 'srp6'
  hashType: process.env.PASSWORD_HASH_TYPE || 'sha1',
  
  // Whether to use uppercase for hashed passwords
  uppercase: process.env.PASSWORD_UPPERCASE === 'true' || true,
  
  // Salt to use for password hashing (if applicable)
  salt: process.env.PASSWORD_SALT || '',
};

// Account creation settings
export const accountConfig = {
  // Default account status (0: normal, 1: closed, etc.)
  defaultStatus: parseInt(process.env.ACCOUNT_DEFAULT_STATUS || '0'),
  
  // Default expansion (0: Classic, 1: TBC, 2: WotLK, etc.)
  defaultExpansion: parseInt(process.env.ACCOUNT_DEFAULT_EXPANSION || '2'),
  
  // Default account level (0: Player, 1-3: GM levels, etc.)
  defaultLevel: parseInt(process.env.ACCOUNT_DEFAULT_LEVEL || '0'),
  
  // Whether email is required for registration
  requireEmail: process.env.ACCOUNT_REQUIRE_EMAIL === 'true' || true,
  
  // Whether to verify email
  verifyEmail: process.env.ACCOUNT_VERIFY_EMAIL === 'true' || false,
}; 