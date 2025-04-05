// Different import approaches based on environment
import type { PathLike } from 'fs';

// TypeScript interfaces for dynamic imports
interface FileSystem {
  existsSync: (path: PathLike) => boolean;
  readFileSync: (path: PathLike, encoding: string) => string;
}

interface PathModule {
  resolve: (...paths: string[]) => string;
  join: (...paths: string[]) => string;
  dirname: (path: string) => string;
}

// interface UrlModule {
//   fileURLToPath: (url: string) => string;
// }

// Module references - initialized differently based on environment
let fs: FileSystem | null = null;
let path: PathModule | null = null;

// For browser environments, we'll use default config values
const isBrowser = typeof window !== 'undefined';

// Try to load modules only in Node.js environment
if (!isBrowser) {
  try {
    // In CommonJS environment, we can require these directly
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    path = require('path');
    // __dirname is already available in CommonJS
  } catch (error) {
    console.error('Failed to load server modules:', error);
  }
}

// Config cache
let configCache: Record<string, string> | null = null;

/**
 * Load configuration from a file (server-side)
 * or from a static local configuration (client-side)
 * @param relativePath Path to the config file (relative to project root)
 * @returns Configuration object
 */
export function loadConfig(relativePath = 'config.cfg'): Record<string, string> {
  // If config is already cached, return it
  if (configCache) {
    return configCache;
  }
  
  const config: Record<string, string> = {};
  
  try {
    // Server-side loading from file
    if (!isBrowser && fs && path) {
      // Resolve path to config file
      // The config file should be in the project root
      const configPath = path.resolve(process.cwd(), relativePath);
      
      console.log(`Loading config from: ${configPath}`);
      
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.warn(`Config file not found at ${configPath}`);
        return config;
      }
      
      // Read the config file
      const configData = fs.readFileSync(configPath, 'utf8');
      
      // Parse the config file line by line
      const lines = configData.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) {
          continue;
        }
        
        // Extract key-value pairs
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          config[key] = value;
        }
      }
    } else {
      // Client-side: use defaults
      console.log('Client-side loading defaults from static configuration');
      
      // Default client configuration - these values should match your config.cfg
      Object.assign(config, {
        // Server info
        SERVER_NAME: 'WoW Israel',
        SERVER_REALM: 'wow-israel.com',
        SERVER_EXPANSION: '2',
        SERVER_REALMLIST: 'wow-israel.com',
        
        // API settings
        API_BASE_URL: window.location.origin || 'http://localhost:3000',
        API_ACCOUNT_CREATE: '/api/account/create',
        API_ACCOUNT_CHECK: '/api/account/check',
        API_ACCOUNT_LOGIN: '/api/account/login',
        
        // Features
        FEATURE_ACCOUNT_CREATION: 'true',
        FEATURE_CHARACTER_MANAGEMENT: 'false',
        FEATURE_ITEM_SHOP: 'false',
        FEATURE_NEWS: 'false',
        
        // Account settings
        ACCOUNT_DEFAULT_STATUS: '0',
        ACCOUNT_DEFAULT_EXPANSION: '2',
        ACCOUNT_REQUIRE_EMAIL: 'true',
        
        // Appearance
        UI_THEME: 'dark',
        UI_PRIMARY_COLOR: '#00A8E1',
        UI_SECONDARY_COLOR: '#FFB100'
      });
    }
    
    // Cache the config
    configCache = config;
    
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
  
  return config;
}

/**
 * Get a value from the config
 * @param key Config key
 * @param defaultValue Default value if key is not found
 * @returns Config value or default
 */
export function getConfigValue<T>(key: string, defaultValue: T): T {
  // Ensure config is loaded
  const config = loadConfig();
  
  if (key in config) {
    const value = config[key];
    
    // Auto-convert based on default value type
    if (typeof defaultValue === 'boolean') {
      return (value === 'true') as unknown as T;
    } else if (typeof defaultValue === 'number') {
      return Number(value) as unknown as T;
    } else {
      return value as unknown as T;
    }
  }
  
  return defaultValue;
}

/**
 * Clear the config cache, forcing a reload on next request
 */
export function clearConfigCache(): void {
  configCache = null;
}

export default {
  loadConfig,
  getConfigValue,
  clearConfigCache
}; 