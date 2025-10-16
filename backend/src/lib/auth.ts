import jwt from 'jsonwebtoken';
import { config } from './config.js';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { TradesperonProfile } from '../types/index.js';

export interface AuthUser {
    id: string;
    email: string;
    azureId: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
    user: AuthUser;
}

// JWT token generation
export const generateToken = (user: AuthUser): string => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            azureId: user.azureId,
        },
        config.auth.jwtSecret,
        {
            expiresIn: config.auth.jwtExpiresIn,
            issuer: 'coffee-shop-api',
            audience: 'coffee-shop-client',
        }
    );
};

// JWT token verification
export const verifyToken = (token: string): AuthUser | null => {
    try {
        const decoded = jwt.verify(token, config.auth.jwtSecret) as jwt.JwtPayload;

        if (typeof decoded === 'object' && decoded.id && decoded.email && decoded.azureId) {
            return {
                id: decoded.id,
                email: decoded.email,
                azureId: decoded.azureId,
            };
        }

        return null;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

// Fastify authentication hook
export const authenticateUser = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            await reply.code(401).send({
                error: 'UNAUTHORIZED',
                message: 'Missing or invalid authorization header',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const user = verifyToken(token);

        if (!user) {
            await reply.code(401).send({
                error: 'UNAUTHORIZED',
                message: 'Invalid or expired token',
            });
            return;
        }

        // Attach user to request
        (request as AuthenticatedRequest).user = user;
    } catch (error) {
        console.error('Authentication error:', error);
        await reply.code(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Authentication service error',
        });
    }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuthentication = async (
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    try {
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const user = verifyToken(token);

            if (user) {
                (request as AuthenticatedRequest).user = user;
            }
        }

        // Don't fail if no valid token - just continue without user
    } catch (error) {
        console.error('Optional authentication error:', error);
        // Don't fail the request for optional auth
    }
};

// Authorization helpers
export const requireProfileOwnership = (
    userIdFromToken: string,
    profileUserId: string
): boolean => {
    return userIdFromToken === profileUserId;
};

export const requireVerifiedProfile = (profile: TradesperonProfile): boolean => {
    return profile.licenseVerificationStatus === 'verified';
};

// Azure AD B2C integration helpers
export const validateAzureB2CToken = async (azureToken: string): Promise<AuthUser | null> => {
    // TODO: Implement Azure AD B2C token validation
    // This would typically involve:
    // 1. Validating the token signature using Azure's public keys
    // 2. Checking token expiration and audience
    // 3. Extracting user information from the token

    // For now, this is a placeholder
    console.warn('Azure AD B2C token validation not yet implemented');
    return null;
};

// Create session for Azure AD B2C authenticated user
export const createSessionFromAzureUser = async (azureUser: {
    id: string;
    email: string;
    name: string;
}): Promise<{ token: string; user: AuthUser }> => {
    const user: AuthUser = {
        id: azureUser.id, // This would typically be mapped to our internal user ID
        email: azureUser.email,
        azureId: azureUser.id,
    };

    const token = generateToken(user);

    return { token, user };
};

// Rate limiting helper
export const createRateLimitKey = (request: FastifyRequest): string => {
    const userToken = request.headers.authorization;
    const clientIp = request.ip;

    if (userToken) {
        // Rate limit by user token
        return `user:${userToken}`;
    }

    // Rate limit by IP
    return `ip:${clientIp}`;
};

// Permission checking
export enum Permission {
    READ_OWN_PROFILE = 'read:own:profile',
    WRITE_OWN_PROFILE = 'write:own:profile',
    READ_PUBLIC_PROFILES = 'read:public:profiles',
    VERIFY_LICENSES = 'verify:licenses',
    ADMIN_PROFILES = 'admin:profiles',
}

export const hasPermission = (user: AuthUser, permission: Permission): boolean => {
    // Basic permission model - in production this would be more sophisticated
    switch (permission) {
        case Permission.READ_OWN_PROFILE:
        case Permission.WRITE_OWN_PROFILE:
        case Permission.READ_PUBLIC_PROFILES:
            return true; // All authenticated users can do these

        case Permission.VERIFY_LICENSES:
        case Permission.ADMIN_PROFILES:
            // TODO: Check user roles/permissions in database
            return false; // For now, no admin permissions

        default:
            return false;
    }
};