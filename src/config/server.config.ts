/**
 * Server Configuration
 * 
 * This file contains general server settings and information.
 */

// Server information
export const serverInfo = {
  // Server name displayed to users
  name: process.env.SERVER_NAME || 'WoW Israel',
  
  // Server website URL
  websiteUrl: process.env.SERVER_WEBSITE || 'https://wow-israel.com',
  
  // Server realm name
  realmName: process.env.SERVER_REALM || 'WoW-Israel',
  
  // Server expansion (0: Classic, 1: TBC, 2: WotLK, etc.)
  expansion: parseInt(process.env.SERVER_EXPANSION || '2'),
  
  // Core type (azerothcore, trinitycore, mangos, etc.)
  coreType: process.env.SERVER_CORE_TYPE || 'azerothcore',
  
  // Server connection info for client
  realmlist: process.env.SERVER_REALMLIST || 'wow-israel.com',
  
  // Server patch/version
  patchVersion: process.env.SERVER_PATCH || '3.3.5a',
  
  // Default client language
  defaultLanguage: process.env.SERVER_DEFAULT_LANGUAGE || 'en',
  
  // Available languages
  availableLanguages: ['en', 'he'],
};

// API Settings
export const apiSettings = {
  // API endpoint for account creation
  accountCreateEndpoint: process.env.API_ACCOUNT_CREATE || '/api/account/create',
  
  // API endpoint for checking account existence
  accountCheckEndpoint: process.env.API_ACCOUNT_CHECK || '/api/account/check',
  
  // API endpoint for item management (if available)
  itemManagementEndpoint: process.env.API_ITEM_MANAGE || '/api/items/manage',
  
  // Whether to use a proxy for API requests
  useProxy: process.env.API_USE_PROXY === 'true' || false,
  
  // Rate limiting (requests per minute)
  rateLimit: parseInt(process.env.API_RATE_LIMIT || '30'),
};

// Feature toggles
export const featureToggles = {
  // Enable/disable account creation
  accountCreation: process.env.FEATURE_ACCOUNT_CREATION !== 'false',
  
  // Enable/disable character management
  characterManagement: process.env.FEATURE_CHARACTER_MANAGEMENT === 'true' || false,
  
  // Enable/disable item shop
  itemShop: process.env.FEATURE_ITEM_SHOP === 'true' || false,
  
  // Enable/disable news section
  news: process.env.FEATURE_NEWS === 'true' || false,
}; 