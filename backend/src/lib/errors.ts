import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { ZodError } from 'zod';

// Error types
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number, code: string, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    public readonly field: string;
    public readonly value: unknown;

    constructor(field: string, value: unknown, message: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
        this.value = value;
    }
}

export class NotFoundError extends AppError {
    public readonly resource: string;
    public readonly id: string;

    constructor(resource: string, id: string) {
        super(`${resource} with id ${id} not found`, 404, 'NOT_FOUND');
        this.resource = resource;
        this.id = id;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    public readonly resource: string;
    public readonly action: string;

    constructor(resource: string, action: string) {
        super(`Forbidden: Cannot ${action} ${resource}`, 403, 'FORBIDDEN');
        this.resource = resource;
        this.action = action;
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, originalError?: Error) {
        super(`Database error: ${message}`, 500, 'DATABASE_ERROR', false);
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}

export class ExternalServiceError extends AppError {
    public readonly service: string;

    constructor(service: string, message: string) {
        super(`External service error (${service}): ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', false);
        this.service = service;
    }
}

// Error response format
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        timestamp: string;
        path: string;
        method: string;
    };
}

// Global error handler for Fastify
export const errorHandler = async (
    error: FastifyError | AppError | ZodError,
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    // Log error (in production, use proper logging service)
    console.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        path,
        method,
        timestamp,
    });

    // Handle different error types
    if (error instanceof AppError) {
        await reply.code(error.statusCode).send({
            success: false,
            error: {
                code: error.code,
                message: error.message,
                details: getErrorDetails(error),
                timestamp,
                path,
                method,
            },
        } as ErrorResponse);
        return;
    }

    // Handle Zod validation errors
    if (isZodError(error)) {
        await reply.code(400).send({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Request validation failed',
                details: {
                    issues: error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message,
                        value: issue.received,
                    })),
                },
                timestamp,
                path,
                method,
            },
        } as ErrorResponse);
        return;
    }

    // Handle Fastify errors
    if (error.statusCode) {
        await reply.code(error.statusCode).send({
            success: false,
            error: {
                code: error.code || 'FASTIFY_ERROR',
                message: error.message,
                timestamp,
                path,
                method,
            },
        } as ErrorResponse);
        return;
    }

    // Handle unexpected errors
    await reply.code(500).send({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            timestamp,
            path,
            method,
        },
    } as ErrorResponse);
};

// Helper functions
function getErrorDetails(error: AppError): Record<string, unknown> | undefined {
    const details: Record<string, unknown> = {};

    if (error instanceof ValidationError) {
        details.field = error.field;
        details.value = error.value;
    } else if (error instanceof NotFoundError) {
        details.resource = error.resource;
        details.id = error.id;
    } else if (error instanceof ForbiddenError) {
        details.resource = error.resource;
        details.action = error.action;
    } else if (error instanceof ExternalServiceError) {
        details.service = error.service;
    }

    return Object.keys(details).length > 0 ? details : undefined;
}

function isZodError(error: unknown): error is ZodError {
    return error instanceof Error && error.name === 'ZodError';
}

// Success response helper
export interface SuccessResponse<T> {
    success: true;
    data: T;
    timestamp: string;
}

export const createSuccessResponse = <T>(data: T): SuccessResponse<T> => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
});

// Async error wrapper
export const asyncHandler = <T extends unknown[]>(
    fn: (...args: T) => Promise<unknown>
) => {
    return async (...args: T): Promise<unknown> => {
        try {
            return await fn(...args);
        } catch (error) {
            throw error; // Will be caught by Fastify error handler
        }
    };
};

// Error logging utility
export const logError = (error: Error, context?: Record<string, unknown>): void => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
        },
        context,
    };

    // In production, send to proper logging service (e.g., Azure Application Insights)
    console.error('Application Error:', JSON.stringify(logEntry, null, 2));
};

// Health check error
export class HealthCheckError extends AppError {
    public readonly checks: Record<string, boolean>;

    constructor(checks: Record<string, boolean>) {
        const failedChecks = Object.entries(checks)
            .filter(([, status]) => !status)
            .map(([check]) => check);

        super(
            `Health check failed: ${failedChecks.join(', ')}`,
            503,
            'HEALTH_CHECK_FAILED'
        );

        this.checks = checks;
    }
}