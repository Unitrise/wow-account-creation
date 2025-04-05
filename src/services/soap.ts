import axios from 'axios';
import { getConfigValue } from './configService.js';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXmlString = promisify(parseString);

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
    password: getConfigValue<string>('SOAP_PASSWORD', '23698741'),
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
  
  // Build SOAP envelope exactly as shown in AzerothCore documentation
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
    // Send SOAP request with URL-based authentication
    const response = await axios.post(url, soapEnvelope, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000, // 10 seconds timeout
      auth: {
        username,
        password
      }
    });
    
    // Parse XML response using xml2js
    const responseText = response.data;
    
    if (typeof responseText !== 'string') {
      throw new Error('Invalid SOAP response: not a string');
    }

    // Parse the XML to a JavaScript object
    const xml = await parseXmlString(responseText) as any;
    
    if (!xml) {
      throw new Error('Failed to parse XML response');
    }
    
    // Extract response data using the path shown in the example
    const body = xml["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][0];
    
    // Check for fault first
    const fault = body["SOAP-ENV:Fault"];
    if (fault) {
      const faultCode = fault[0]["faultcode"][0];
      const faultString = fault[0]["faultstring"][0];
      throw new Error(`SOAP Fault: ${faultCode} - ${faultString}`);
    }
    
    // Check for successful response
    const responseNode = body["ns1:executeCommandResponse"];
    if (responseNode && responseNode[0]["result"]) {
      return responseNode[0]["result"][0];
    }
    
    // If we can't find the expected structure, return the raw XML
    console.warn('Unable to extract result from SOAP response, returning raw XML');
    return responseText;
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