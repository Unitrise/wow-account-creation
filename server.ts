import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import accountsRouter from './src/server/api/accounts';
import { loadConfig, getConfigValue, clearConfigCache } from './src/services/configService';

// Clear any cached config to ensure we load fresh values
clearConfigCache();

// Load configuration
const config = loadConfig('config.cfg');
console.log('Server configuration loaded:', config);

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

// Try to find the client directory
const possibleClientPaths = [
  path.join(process.cwd(), 'dist', 'client'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'public'),
];

let clientPath = '';

for (const p of possibleClientPaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    clientPath = p;
    break;
  }
}

if (!clientPath) {
  console.error('Could not find client directory with index.html');
  console.log('Tried the following paths:');
  possibleClientPaths.forEach(p => console.log(`- ${p}`));
  process.exit(1);
}

// Start the server with the found client path
startServer(clientPath); 