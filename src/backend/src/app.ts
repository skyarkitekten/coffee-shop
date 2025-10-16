import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { config, validateConfig } from './lib/config.js';
import { errorHandler } from './lib/errors.js';
import { getDatabase, checkDatabaseHealth } from './lib/database.js';
import { initializeStorage, checkStorageHealth } from './lib/storage.js';

// Create Fastify instance
const app = fastify({
    logger: {
        level: config.logging.level,
        transport: config.server.environment === 'development' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        } : undefined,
    },
});

// Register plugins
await app.register(cors, {
    origin: config.server.environment === 'development' ? true : ['https://your-frontend-domain.com'],
    credentials: true,
});

await app.register(helmet, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
});

await app.register(jwt, {
    secret: config.auth.jwtSecret,
});

await app.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});

// API Documentation
await app.register(swagger, {
    openapi: {
        openapi: '3.1.0',
        info: {
            title: 'Tradesperson Profile Management API',
            description: 'API for managing tradesperson profiles, search, and job applications',
            version: '1.0.0',
        },
        servers: [
            {
                url: `${config.api.baseUrl}/api/${config.api.version}`,
                description: 'API Server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
});

await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
    },
});

// Global error handler
app.setErrorHandler(errorHandler);

// Health check route
app.get('/health', {
    schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
            200: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    checks: {
                        type: 'object',
                        properties: {
                            database: { type: 'boolean' },
                            storage: { type: 'boolean' },
                        },
                    },
                },
            },
        },
    },
}, async (request, reply) => {
    const checks = {
        database: await checkDatabaseHealth(),
        storage: await checkStorageHealth(),
    };

    const allHealthy = Object.values(checks).every(Boolean);
    const status = allHealthy ? 'healthy' : 'unhealthy';
    const statusCode = allHealthy ? 200 : 503;

    return reply.code(statusCode).send({
        status,
        timestamp: new Date().toISOString(),
        checks,
    });
});

// API routes prefix
app.register(async function (fastify) {
    // Profile routes will be registered here
    // await fastify.register(profileRoutes, { prefix: '/profiles' });

    // Search routes will be registered here
    // await fastify.register(searchRoutes, { prefix: '/search' });

    // Job application routes will be registered here
    // await fastify.register(jobRoutes, { prefix: '/jobs' });

    // Admin routes will be registered here
    // await fastify.register(adminRoutes, { prefix: '/admin' });
}, { prefix: `/api/${config.api.version}` });

// Initialize services
const initializeServices = async (): Promise<void> => {
    try {
        // Validate configuration
        validateConfig();

        // Initialize database connection
        await getDatabase();
        app.log.info('Database connection established');

        // Initialize Azure storage
        await initializeStorage();
        app.log.info('Azure storage initialized');

    } catch (error) {
        app.log.error('Failed to initialize services:', error);
        throw error;
    }
};

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
    try {
        app.log.info('Starting graceful shutdown...');

        // Close Fastify server
        await app.close();

        // Close database connections
        const { closeDatabase } = await import('./lib/database.js');
        await closeDatabase();

        app.log.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        app.log.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const start = async (): Promise<void> => {
    try {
        await initializeServices();

        const address = await app.listen({
            port: config.server.port,
            host: config.server.host,
        });

        app.log.info(`Server listening at ${address}`);
    } catch (error) {
        app.log.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    start();
}

export { app, start, initializeServices };