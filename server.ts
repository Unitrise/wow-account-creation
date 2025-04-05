import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import accountsRouter from './src/server/api/accounts';
import { loadConfig, getConfigValue } from './src/services/configService';

// Load configuration
const config = loadConfig('config.cfg');

const app = express();
const PORT = getConfigValue<number>('PORT', 3000);

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Function to start the server
function startServer(clientPath: string) {
  console.log(`Starting server with client path: ${clientPath}`);
  
  // Verify the client directory exists
  if (!fs.existsSync(clientPath)) {
    console.error(`Client directory not found: ${clientPath}`);
    process.exit(1);
  }
  
  // Verify index.html exists
  const indexPath = path.join(clientPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`Index file not found at: ${indexPath}`);
    console.log('Available files in client directory:', fs.readdirSync(clientPath));
    process.exit(1);
  }
  
  // Serve static files from the React app
  app.use(express.static(clientPath));
  console.log(`Static files being served from: ${clientPath}`);

  // API routes
  app.use('/api/account', accountsRouter);
  console.log('API routes configured');

  // Catch-all handler for SPA
  app.get('*', (req, res) => {
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(indexPath);
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server name: ${getConfigValue<string>('SERVER_NAME', 'WoW Israel')}`);
    console.log(`Using database: ${getConfigValue<string>('DB_NAME', 'acore_auth')} on ${getConfigValue<string>('DB_HOST', 'localhost')}`);
    console.log(`Core type: ${getConfigValue<string>('SERVER_CORE_TYPE', 'azerothcore')}`);
  });
}

// Determine the correct path to the client files
// In production, the client files are in dist/client
// In development, they might be in a different location
const clientPath = path.join(__dirname, 'client');

console.log(`Looking for client files in: ${clientPath}`);

// Check if the directory exists
if (!fs.existsSync(clientPath)) {
  console.error(`Directory not found: ${clientPath}`);
  
  // Log available directories for debugging
  try {
    console.log('Available directories in dist:', fs.readdirSync(path.join(__dirname)));
  } catch (err) {
    console.error('Error reading dist directory:', err);
  }
  
  // Try alternative paths
  const alternativePaths = [
    path.join(__dirname, '..', 'client'),
    path.join(__dirname, '..', 'dist', 'client'),
    path.join(__dirname, 'dist', 'client')
  ];
  
  let foundPath = false;
  
  for (const altPath of alternativePaths) {
    console.log(`Trying alternative path: ${altPath}`);
    if (fs.existsSync(altPath)) {
      console.log(`Found alternative path: ${altPath}`);
      foundPath = true;
      startServer(altPath);
      break;
    }
  }
  
  if (!foundPath) {
    console.error('Could not find client directory in any of the expected locations');
    process.exit(1);
  }
} else {
  startServer(clientPath);
} 