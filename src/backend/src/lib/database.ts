import sql from 'mssql';
import { config } from './config.js';

let poolPromise: Promise<sql.ConnectionPool> | null = null;

const dbConfig: sql.config = {
    user: config.database.user,
    password: config.database.password,
    server: config.database.server,
    database: config.database.name,
    options: {
        encrypt: true, // Required for Azure SQL
        trustServerCertificate: false,
        requestTimeout: 30000,
        connectionTimeout: 15000,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

export const getDatabase = async (): Promise<sql.ConnectionPool> => {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig).connect();

        poolPromise.catch((err) => {
            console.error('Database connection failed:', err);
            poolPromise = null;
        });
    }

    return poolPromise;
};

export const closeDatabase = async (): Promise<void> => {
    if (poolPromise) {
        const pool = await poolPromise;
        await pool.close();
        poolPromise = null;
    }
};

export { sql };

// Health check function
export const checkDatabaseHealth = async (): Promise<boolean> => {
    try {
        const pool = await getDatabase();
        const result = await pool.request().query('SELECT 1 as healthy');
        return result.recordset[0]?.healthy === 1;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};