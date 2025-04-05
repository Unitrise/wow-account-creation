import express from 'express';
import cors from 'cors';
import path from 'path';
import { loadConfig } from '../services/configService';

// Load configuration
const config = loadConfig('config.cfg');
const PORT = parseInt(config.PORT || '3000', 10);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Serving index.html from:', res);
  next();
});

// Serve static files from the React app
const clientPath = path.resolve(__dirname, '../../dist');
console.log('Serving static files from:', clientPath);
app.use(express.static(clientPath));

// API routes
app.use('/api/accounts', require('./routes/accounts').default);

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  console.log('Serving index.html from:', req);
  const indexPath = path.resolve(clientPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server name: ${config.SERVER_NAME || 'WoW Israel'}`);
  console.log(`Using database: ${config.DB_NAME || 'acore_auth'} on ${config.DB_HOST || 'localhost'}`);
  console.log(`Core type: ${config.SERVER_CORE_TYPE || 'azerothcore'}`);
}); 