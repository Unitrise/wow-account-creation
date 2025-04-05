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

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'client')));

// API routes
app.use('/api/account', accountsRouter);

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server name: ${getConfigValue<string>('SERVER_NAME', 'WoW Israel')}`);
  console.log(`Using database: ${getConfigValue<string>('DB_NAME', 'acore_auth')} on ${getConfigValue<string>('DB_HOST', 'localhost')}`);
  console.log(`Core type: ${getConfigValue<string>('SERVER_CORE_TYPE', 'azerothcore')}`);
}); 