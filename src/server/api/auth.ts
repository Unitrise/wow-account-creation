import { Router } from 'express';
import { BigInteger } from 'jsbn';
import crypto from 'crypto';
import { pool } from '../../services/database';
import SHA1 from 'crypto-js/sha1';
import Hex from 'crypto-js/enc-hex';
import { RowDataPacket } from 'mysql2';

// Constants for WoW's SRP6
const N_HEX = '894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7';
const g_HEX = '7';
const k_HEX = '3';

const N = new BigInteger(N_HEX, 16);
const g = new BigInteger(g_HEX, 16);
const k = new BigInteger(k_HEX, 16);

const router = Router();

// Extend Express Request type to include session
declare module 'express-serve-static-core' {
  interface Request {
    session: any;
  }
}

router.post('/challenge', async (req, res) => {
    const { username } = req.body;
    
    try {
        // Get account from database
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id, username, salt, verifier FROM account WHERE username = ?',
            [username.toUpperCase()]
        );

        if (!rows || rows.length === 0) {
            return res.json({ success: false, message: 'Account not found' });
        }

        const account = rows[0];
        
        // Generate server ephemeral (B)
        const b = crypto.randomBytes(32);
        const B = new BigInteger(b.toString('hex'), 16);
        
        // Store b and B in session for later verification
        if (!req.session) {
            req.session = {};
        }
        req.session.auth = {
            b: b.toString('hex'),
            B: B.toString(16),
            salt: account.salt.toString('base64'),
            verifier: account.verifier.toString('base64')
        };

        res.json({
            success: true,
            salt: account.salt.toString('base64'),
            B: B.toString(16).padStart(64, '0').toUpperCase(),
            N: N_HEX,
            g: g_HEX
        });

    } catch (error) {
        console.error('Auth challenge error:', error);
        res.json({ success: false, message: 'Internal server error' });
    }
});

router.post('/proof', async (req, res) => {
    const { username, A, M1 } = req.body;
    
    try {
        if (!req.session?.auth) {
            return res.json({ success: false, message: 'No auth challenge found' });
        }

        const { b, B, salt, verifier } = req.session.auth;
        
        // Convert values to BigIntegers
        const A_big = new BigInteger(A, 16);
        const B_big = new BigInteger(B, 16);
        const b_big = new BigInteger(b, 16);
        const v_big = new BigInteger(Buffer.from(verifier, 'base64').toString('hex'), 16);
        
        // Calculate u = H(A | B)
        const u = new BigInteger(
            Hex.stringify(
                SHA1(
                    A.padStart(64, '0').toUpperCase() +
                    B.padStart(64, '0').toUpperCase()
                )
            ),
            16
        );
        
        // Calculate S = (A * v^u)^b mod N
        const S = A_big.multiply(v_big.modPow(u, N)).modPow(b_big, N);
        
        // Calculate K = H(S)
        const K = SHA1(S.toString(16).padStart(64, '0').toUpperCase());
        
        // Calculate M2 = H(A | M1 | K)
        const M2 = SHA1(
            A.padStart(64, '0').toUpperCase() +
            M1.toUpperCase() +
            Hex.stringify(K).toUpperCase()
        );
        
        // Verify client's M1
        const expectedM1 = SHA1(
            A.padStart(64, '0').toUpperCase() +
            B.padStart(64, '0').toUpperCase() +
            Hex.stringify(SHA1(S.toString(16).padStart(64, '0').toUpperCase())).toUpperCase()
        );
        
        if (Hex.stringify(expectedM1).toUpperCase() !== M1.toUpperCase()) {
            // Update failed logins
            await pool.query(
                'UPDATE account SET failed_logins = failed_logins + 1, last_attempt_ip = ? WHERE username = ?',
                [req.ip, username.toUpperCase()]
            );
            
            return res.json({ success: false, message: 'Invalid password' });
        }
        
        // Update account status
        await pool.query(
            'UPDATE account SET session_key = ?, last_login = NOW(), last_ip = ?, failed_logins = 0, online = 1 WHERE username = ?',
            [Buffer.from(Hex.stringify(K).toUpperCase(), 'hex'), req.ip, username.toUpperCase()]
        );
        
        // Clear session auth data
        delete req.session.auth;
        
        res.json({
            success: true,
            M2: Hex.stringify(M2).toUpperCase(),
            sessionKey: Hex.stringify(K).toUpperCase()
        });

    } catch (error) {
        console.error('Auth proof error:', error);
        res.json({ success: false, message: 'Invalid proof' });
    }
});

export default router; 