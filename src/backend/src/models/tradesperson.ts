import { sql, getDatabase } from '../lib/database.js';
import type {
    TradesperonProfile,
    TradesperonProfileRow,
    ProfileStatus,
    VerificationStatus
} from '../types/index.js';
import { NotFoundError, DatabaseError } from '../lib/errors.js';

export class TradesperonProfileModel {
    // Create a new tradesperson profile
    static async create(data: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        experienceYears: number;
        bio?: string;
    }): Promise<TradesperonProfile> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('userId', sql.NVarChar(255), data.userId)
                .input('firstName', sql.NVarChar(50), data.firstName)
                .input('lastName', sql.NVarChar(50), data.lastName)
                .input('email', sql.NVarChar(255), data.email)
                .input('phone', sql.NVarChar(20), data.phone)
                .input('experienceYears', sql.Int, data.experienceYears)
                .input('bio', sql.NVarChar(1000), data.bio || null)
                .query(`
          INSERT INTO tradesperson_profiles 
          (user_id, first_name, last_name, email, phone, experience_years, bio)
          OUTPUT INSERTED.*
          VALUES (@userId, @firstName, @lastName, @email, @phone, @experienceYears, @bio)
        `);

            const row = result.recordset[0] as TradesperonProfileRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to create tradesperson profile', error as Error);
        }
    }

    // Get profile by user ID
    static async findByUserId(userId: string): Promise<TradesperonProfile | null> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('userId', sql.NVarChar(255), userId)
                .query(`
          SELECT * FROM tradesperson_profiles 
          WHERE user_id = @userId
        `);

            if (result.recordset.length === 0) {
                return null;
            }

            const row = result.recordset[0] as TradesperonProfileRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to find tradesperson profile', error as Error);
        }
    }

    // Get profile by ID
    static async findById(id: string): Promise<TradesperonProfile | null> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          SELECT * FROM tradesperson_profiles 
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                return null;
            }

            const row = result.recordset[0] as TradesperonProfileRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to find tradesperson profile', error as Error);
        }
    }

    // Update profile
    static async update(id: string, updates: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        experienceYears?: number;
        bio?: string;
        isAvailable?: boolean;
        profileStatus?: ProfileStatus;
        licenseVerificationStatus?: VerificationStatus;
    }): Promise<TradesperonProfile> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Build dynamic query based on provided updates
            const setParts: string[] = [];

            if (updates.firstName !== undefined) {
                request.input('firstName', sql.NVarChar(50), updates.firstName);
                setParts.push('first_name = @firstName');
            }
            if (updates.lastName !== undefined) {
                request.input('lastName', sql.NVarChar(50), updates.lastName);
                setParts.push('last_name = @lastName');
            }
            if (updates.phone !== undefined) {
                request.input('phone', sql.NVarChar(20), updates.phone);
                setParts.push('phone = @phone');
            }
            if (updates.experienceYears !== undefined) {
                request.input('experienceYears', sql.Int, updates.experienceYears);
                setParts.push('experience_years = @experienceYears');
            }
            if (updates.bio !== undefined) {
                request.input('bio', sql.NVarChar(1000), updates.bio);
                setParts.push('bio = @bio');
            }
            if (updates.isAvailable !== undefined) {
                request.input('isAvailable', sql.Bit, updates.isAvailable);
                setParts.push('is_available = @isAvailable');
            }
            if (updates.profileStatus !== undefined) {
                request.input('profileStatus', sql.NVarChar(20), updates.profileStatus);
                setParts.push('profile_status = @profileStatus');
            }
            if (updates.licenseVerificationStatus !== undefined) {
                request.input('licenseVerificationStatus', sql.NVarChar(20), updates.licenseVerificationStatus);
                setParts.push('license_verification_status = @licenseVerificationStatus');
            }

            if (setParts.length === 0) {
                throw new Error('No updates provided');
            }

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          UPDATE tradesperson_profiles 
          SET ${setParts.join(', ')}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                throw new NotFoundError('TradesperonProfile', id);
            }

            const row = result.recordset[0] as TradesperonProfileRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update tradesperson profile', error as Error);
        }
    }

    // Delete profile
    static async delete(id: string): Promise<void> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          DELETE FROM tradesperson_profiles 
          WHERE id = @id
        `);

            if (result.rowsAffected[0] === 0) {
                throw new NotFoundError('TradesperonProfile', id);
            }
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete tradesperson profile', error as Error);
        }
    }

    // Find profiles by criteria (for search functionality)
    static async findByCriteria(criteria: {
        tradeTypes?: string[];
        verificationStatus?: VerificationStatus;
        isAvailable?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<TradesperonProfile[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            let whereClause = '1=1';
            const conditions: string[] = [];

            if (criteria.verificationStatus) {
                request.input('verificationStatus', sql.NVarChar(20), criteria.verificationStatus);
                conditions.push('license_verification_status = @verificationStatus');
            }

            if (criteria.isAvailable !== undefined) {
                request.input('isAvailable', sql.Bit, criteria.isAvailable);
                conditions.push('is_available = @isAvailable');
            }

            if (conditions.length > 0) {
                whereClause = conditions.join(' AND ');
            }

            let limitClause = '';
            if (criteria.limit) {
                request.input('limit', sql.Int, criteria.limit);
                request.input('offset', sql.Int, criteria.offset || 0);
                limitClause = 'ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
            }

            const result = await request.query(`
        SELECT * FROM tradesperson_profiles 
        WHERE ${whereClause}
        ${limitClause}
      `);

            return result.recordset.map((row: TradesperonProfileRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find tradesperson profiles', error as Error);
        }
    }

    // Check if profile is complete (all required fields filled)
    static async checkCompletion(id: string): Promise<{
        isComplete: boolean;
        missingFields: string[];
    }> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          SELECT * FROM vw_profile_completeness 
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                throw new NotFoundError('TradesperonProfile', id);
            }

            const completeness = result.recordset[0];
            const missingFields: string[] = [];

            // Check individual requirements
            const profile = await this.findById(id);
            if (!profile) {
                throw new NotFoundError('TradesperonProfile', id);
            }

            if (!profile.firstName) missingFields.push('firstName');
            if (!profile.lastName) missingFields.push('lastName');
            if (!profile.email) missingFields.push('email');
            if (!profile.phone) missingFields.push('phone');

            // TODO: Check for trade specialties, service areas, and verified licenses
            // This would require additional queries to the related tables

            return {
                isComplete: completeness.is_complete === 1,
                missingFields,
            };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to check profile completion', error as Error);
        }
    }

    // Helper method to convert database row to entity
    private static mapRowToEntity(row: TradesperonProfileRow): TradesperonProfile {
        return {
            id: row.id,
            userId: row.user_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            experienceYears: row.experience_years,
            bio: row.bio || undefined,
            profileStatus: row.profile_status as ProfileStatus,
            licenseVerificationStatus: row.license_verification_status as VerificationStatus,
            isAvailable: row.is_available,
        };
    }
}