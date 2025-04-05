import express from 'express';
import { loadConfig } from '../../services/configService';
import { createAccount, checkAccount } from '../../services/database';

const router = express.Router();
const config = loadConfig('config.cfg');
console.log(config);

// Create new account
router.post('/create', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await createAccount(username, password, email);
    res.json(result);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Check account existence
router.post('/check', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const exists = await checkAccount(username);
    res.json({ exists });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ error: 'Failed to check account' });
  }
});

export default router; 