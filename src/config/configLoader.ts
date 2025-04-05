import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// For TypeScript compatibility in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse a configuration file
 * @param filePath Path to the config file
 * @returns Configuration object
 */
export function loadConfig(filePath: string): Record<string, string> {
  const config: Record<string, string> = {};
  
  try {
    // Determine if we're running in production or development
    // In production, the file is in a different location
    const isProd = process.env.NODE_ENV === 'production';
    
    // The actual file path might be relative to the project root
    const rootDir = isProd 
      ? path.resolve(__dirname, '../../../')
      : path.resolve(__dirname, '../../..');
    
    const configPath = path.resolve(rootDir, filePath);
    
    if (!fs.existsSync(configPath)) {
      console.warn(`Config file not found at ${configPath}, falling back to environment variables`);
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
  } catch (error) {
    console.error('Error loading configuration:', error);
    console.warn('Falling back to environment variables');
  }
  
  return config;
}

/**
 * Get a config value with a fallback
 * @param config Config object
 * @param key Config key
 * @param fallback Fallback value
 * @returns Config value or fallback
 */
export function getConfigValue<T>(config: Record<string, string>, key: string, fallback: T): T {
  if (key in config) {
    const value = config[key];
    
    // Try to convert the value to the correct type
    if (typeof fallback === 'boolean') {
      return (value === 'true') as unknown as T;
    } else if (typeof fallback === 'number') {
      return Number(value) as unknown as T;
    } else {
      return value as unknown as T;
    }
  }
  
  return fallback;
}

/**
 * Singleton config instance
 */
let configInstance: Record<string, string> | null = null;

/**
 * Get the config singleton
 * @returns Config object
 */
export function getConfig(): Record<string, string> {
  if (!configInstance) {
    configInstance = loadConfig('config.cfg');
  }
  return configInstance;
}

export default {
  loadConfig,
  getConfigValue,
  getConfig
}; 