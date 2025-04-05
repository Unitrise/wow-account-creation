import { getConfig, getConfigValue } from './configLoader';

// Load configuration from config.cfg
const config = getConfig();

// Client configuration
export const clientConfig = {
  // API Base URL
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // API Endpoints
  API_ACCOUNT_CREATE: import.meta.env.VITE_API_ACCOUNT_CREATE || getConfigValue(config, 'API_ACCOUNT_CREATE', '/api/account/create'),
  API_ACCOUNT_CHECK: import.meta.env.VITE_API_ACCOUNT_CHECK || getConfigValue(config, 'API_ACCOUNT_CHECK', '/api/account/check'),
  API_ACCOUNT_LOGIN: import.meta.env.VITE_API_ACCOUNT_LOGIN || '/api/account/login',
  
  // Feature Flags
  FEATURE_ACCOUNT_CREATION: import.meta.env.VITE_FEATURE_ACCOUNT_CREATION !== 'false' && getConfigValue(config, 'FEATURE_ACCOUNT_CREATION', true),
  FEATURE_PASSWORD_RESET: import.meta.env.VITE_FEATURE_PASSWORD_RESET === 'true',
  FEATURE_NEWS: import.meta.env.VITE_FEATURE_NEWS === 'true' || getConfigValue(config, 'FEATURE_NEWS', false),
  
  // Server Configuration
  SERVER_NAME: import.meta.env.VITE_SERVER_NAME || getConfigValue(config, 'SERVER_NAME', 'WoW Israel'),
  SERVER_REALM: import.meta.env.VITE_SERVER_REALM || getConfigValue(config, 'SERVER_REALMLIST', 'wow-israel.com'),
  SERVER_EXPANSION: import.meta.env.VITE_SERVER_EXPANSION || getConfigValue(config, 'SERVER_EXPANSION', 'wotlk'),
  
  // Password Settings
  PASSWORD_HASH_TYPE: getConfigValue(config, 'PASSWORD_HASH_TYPE', 'sha1'),
  PASSWORD_UPPERCASE: getConfigValue(config, 'PASSWORD_UPPERCASE', true),
  PASSWORD_SALT: getConfigValue(config, 'PASSWORD_SALT', ''),
  
  // Account Settings
  ACCOUNT_DEFAULT_STATUS: getConfigValue(config, 'ACCOUNT_DEFAULT_STATUS', 0),
  ACCOUNT_DEFAULT_EXPANSION: getConfigValue(config, 'ACCOUNT_DEFAULT_EXPANSION', 2),
  ACCOUNT_REQUIRE_EMAIL: getConfigValue(config, 'ACCOUNT_REQUIRE_EMAIL', true),
  
  // Analytics & Logging
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'error',
}; 