import mysql from 'mysql2/promise';
import { getConfigValue } from '../services/configService.js';

// Create connection pool
export const pool = mysql.createPool({
    host: getConfigValue('DB_HOST', 'localhost'),
    user: getConfigValue('DB_USER', 'acore'),
    password: getConfigValue('DB_PASSWORD', 'acore'),
    database: getConfigValue('DB_NAME', 'acore_auth'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err);
    }); 