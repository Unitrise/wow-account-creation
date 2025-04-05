import fs from 'fs';
import path from 'path';

/**
 * ConfigLoader
 * 
 * Loads and parses the config.cfg file and provides access to configuration values.
 */
class ConfigLoader {
  private config: Record<string, string> = {};
  private configPath: string;
  
  constructor(configPath: string = '../config.cfg') {
    this.configPath = configPath;
    this.loadConfig();
  }
  
  /**
   * Load the configuration file
   */
  private loadConfig(): void {
    try {
      // Get absolute path to the config file
      const absolutePath = path.resolve(__dirname, this.configPath);
      
      // Read the config file
      const configData = fs.readFileSync(absolutePath, 'utf8');
      
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
          this.config[key] = value;
        }
      }
      
      console.log('Configuration loaded successfully');
    } catch (error) {
      console.error('Error loading configuration:', error);
      // Fall back to environment variables
      console.warn('Falling back to environment variables');
    }
  }
  
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue Default value if key not found
   * @returns The configuration value
   */
  get(key: string, defaultValue: string = ''): string {
    // First try to get from config
    if (this.config[key] !== undefined) {
      return this.config[key];
    }
    
    // Then try to get from environment variable
    if (process.env[key] !== undefined) {
      return process.env[key] as string;
    }
    
    // Fall back to default value
    return defaultValue;
  }
  
  /**
   * Get a configuration value as a number
   * @param key The configuration key
   * @param defaultValue Default value if key not found
   * @returns The configuration value as a number
   */
  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.get(key, defaultValue.toString());
    return Number(value);
  }
  
  /**
   * Get a configuration value as a boolean
   * @param key The configuration key
   * @param defaultValue Default value if key not found
   * @returns The configuration value as a boolean
   */
  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.get(key, defaultValue.toString());
    return value.toLowerCase() === 'true';
  }
  
  /**
   * Get all configuration values
   * @returns All configuration values
   */
  getAll(): Record<string, string> {
    return { ...this.config };
  }
}

// Create a singleton instance
const configLoader = new ConfigLoader();

export default configLoader; 