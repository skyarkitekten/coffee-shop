import 'dotenv/config';

export const config = {
    // Server Configuration
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
    },

    // Database Configuration
    database: {
        server: process.env.DATABASE_SERVER || 'localhost',
        name: process.env.DATABASE_NAME || 'coffee_shop',
        user: process.env.DATABASE_USER || 'admin',
        password: process.env.DATABASE_PASSWORD || '',
        connectionString: process.env.DATABASE_URL,
    },

    // Authentication Configuration
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        azureAdB2C: {
            tenantId: process.env.AZURE_AD_B2C_TENANT_ID || '',
            clientId: process.env.AZURE_AD_B2C_CLIENT_ID || '',
            clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET || '',
            policy: process.env.AZURE_AD_B2C_POLICY || 'B2C_1_signupsignin',
        },
    },

    // Azure Storage Configuration
    storage: {
        accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
        accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
        containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'licenses',
    },

    // External Services
    externalServices: {
        sendgridApiKey: process.env.SENDGRID_API_KEY || '',
        azureMapsKey: process.env.AZURE_MAPS_KEY || '',
    },

    // API Configuration
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        version: 'v1',
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
};

// Validation function to check required environment variables
export const validateConfig = (): void => {
    const requiredVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'AZURE_STORAGE_ACCOUNT_NAME',
        'AZURE_STORAGE_ACCOUNT_KEY',
    ];

    const missingVars = requiredVars.filter(varName => {
        const value = process.env[varName];
        return !value || value.trim() === '';
    });

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
};