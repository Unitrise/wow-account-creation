import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadConfig, getConfigValue } from '../services/configService';

// Define config context type
interface ConfigContextType {
  config: Record<string, any>;
  isLoading: boolean;
  refresh: () => void;
}

// Create context with default values
const ConfigContext = createContext<ConfigContextType>({
  config: {},
  isLoading: true,
  refresh: () => {},
});

// Config provider component
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Function to load config
  const loadConfigData = async () => {
    try {
      setIsLoading(true);
      // Load config silently - we use getConfigValue directly
      loadConfig();
      
      // Create a more friendly object with converted values
      const processedConfig: Record<string, any> = {
        // Server info
        SERVER_NAME: getConfigValue<string>('SERVER_NAME', 'WoW Israel'),
        SERVER_REALM: getConfigValue<string>('SERVER_REALMLIST', 'wow-israel.com'),
        SERVER_EXPANSION: getConfigValue<number>('SERVER_EXPANSION', 2),
        
        // Features
        FEATURE_ACCOUNT_CREATION: getConfigValue<boolean>('FEATURE_ACCOUNT_CREATION', true),
        FEATURE_CHARACTER_MANAGEMENT: getConfigValue<boolean>('FEATURE_CHARACTER_MANAGEMENT', false),
        FEATURE_ITEM_SHOP: getConfigValue<boolean>('FEATURE_ITEM_SHOP', false),
        FEATURE_NEWS: getConfigValue<boolean>('FEATURE_NEWS', false),
        
        // UI
        UI_THEME: getConfigValue<string>('UI_THEME', 'dark'),
        UI_PRIMARY_COLOR: getConfigValue<string>('UI_PRIMARY_COLOR', '#00A8E1'),
        UI_SECONDARY_COLOR: getConfigValue<string>('UI_SECONDARY_COLOR', '#FFB100'),
      };
      
      setConfig(processedConfig);
    } catch (error) {
      console.error('Error loading config in context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadConfigData();
  }, []);

  // Context value
  const value = {
    config,
    isLoading,
    refresh: loadConfigData,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use config
export const useConfig = () => useContext(ConfigContext);

export default ConfigContext; 