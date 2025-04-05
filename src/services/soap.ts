import axios from 'axios';
import { getConfigValue } from './configService.js';

/**
 * Interface for SOAP connection options
 */
export interface SoapOptions {
  host: string;
  port: number;
  username: string;
  password: string;
  protocol?: 'http' | 'https';
}

/**
 * Get SOAP connection options from config
 */
export const getSoapOptions = (): SoapOptions => {
  return {
    host: getConfigValue<string>('SOAP_HOST', '127.0.0.1'),
    port: getConfigValue<number>('SOAP_PORT', 7878), // Default SOAP port for AzerothCore
    username: getConfigValue<string>('SOAP_USERNAME', 'admin'),
    password: getConfigValue<string>('SOAP_PASSWORD', 'admin'),
    protocol: getConfigValue<'http' | 'https'>('SOAP_PROTOCOL', 'http')
  };
};

/**
 * Execute a SOAP command on the WoW server
 * @param command The command to execute
 * @param options SOAP connection options (optional, will use config otherwise)
 * @returns Promise with the command result
 */
export const executeSoapCommand = async (
  command: string,
  options?: Partial<SoapOptions>
): Promise<string> => {
  // Merge default options from config with provided options
  const soapOptions: SoapOptions = {
    ...getSoapOptions(),
    ...(options || {})
  };
  
  const { host, port, username, password, protocol } = soapOptions;
  
  // Build SOAP URL with authentication in the URL as recommended by AzerothCore
  const url = `${protocol}://${username}:${password}@${host}:${port}/`;
  
  // Build SOAP envelope - Keep the namespace as urn:AC for AzerothCore
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope
  xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:ns1="urn:AC">
  <SOAP-ENV:Body>
    <ns1:executeCommand>
      <command>${command}</command>
    </ns1:executeCommand>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  try {
    // Send SOAP request - use URL-based authentication instead of header
    const response = await axios.post(url, soapEnvelope, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000 // 10 seconds timeout
    });
    
    // Parse XML response
    const responseText = response.data;
    
    if (typeof responseText !== 'string') {
      throw new Error('Invalid SOAP response: not a string');
    }
    
    // Extract result from XML
    // This is a simple approach - in production you'd want a proper XML parser
    let result = responseText;
    
    // Different WoW emulators have different response formats
    // Try to handle the most common ones - Fixed the typo in the first pattern
    const resultPatterns = [
      /<result>([\s\S]*?)<\/result>/,
      /<ns1:executeCommandResponse>([\s\S]*?)<\/ns1:executeCommandResponse>/,
      /<executeCommandResponse>([\s\S]*?)<\/executeCommandResponse>/,
      /<return>([\s\S]*?)<\/return>/
    ];
    
    for (const pattern of resultPatterns) {
      const match = pattern.exec(responseText);
      if (match && match[1]) {
        result = match[1].trim();
        break;
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('SOAP request failed:', error);
    
    // Format error message
    const errorMessage = error.response
      ? `SOAP Error: ${error.response.status} - ${error.response.statusText}`
      : error.message || 'Unknown SOAP error';
      
    throw new Error(errorMessage);
  }
};

/**
 * Create a new account using SOAP
 * @param username Account username
 * @param password Account password
 * @param email Account email (optional)
 * @param expansion Expansion level (optional, default: 2)
 * @returns Promise with the command result
 */
export const createAccount = async (
  username: string,
  password: string,
  email?: string,
  expansion: number = 2
): Promise<string> => {
  // Build account creation command
  let result = await executeSoapCommand(`account create ${username} ${password}`);
  
  // Set email if provided
  if (email) {
    try {
      result += '\n' + await executeSoapCommand(`account set email ${username} ${email}`);
    } catch (error) {
      console.warn('Could not set email, continuing with account creation');
    }
  }
  
  // Set expansion level
  try {
    result += '\n' + await executeSoapCommand(`account set expansion ${username} ${expansion}`);
  } catch (error) {
    console.warn('Could not set expansion level, continuing with account creation');
  }
  
  return result;
};

/**
 * Set GM level for an account
 * @param username Account username
 * @param level GM level (0-3)
 * @param realmId Realm ID (-1 for all realms)
 * @returns Promise with the command result
 */
export const setGMLevel = async (
  username: string,
  level: number,
  realmId: number = -1
): Promise<string> => {
  return executeSoapCommand(`account set gmlevel ${username} ${level} ${realmId}`);
};

export default {
  executeSoapCommand,
  createAccount,
  setGMLevel,
  getSoapOptions
}; 