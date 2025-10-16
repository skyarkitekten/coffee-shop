import { sql, getDatabase } from '../lib/database.js';
import type {
    License,
    LicenseRow,
    VerificationStatus
} from '../types/index.js';
import { NotFoundError, DatabaseError } from '../lib/errors.js';

export class LicenseModel {
    // Create a new license
    static async create(data: {
        tradesperonId: string;
        licenseType: string;
        licenseNumber: string;
        issuingAuthority: string;
        issueDate: Date;
        expirationDate: Date;
        documentUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
    }): Promise<License> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, data.tradesperonId)
                .input('licenseType', sql.NVarChar(255), data.licenseType)
                .input('licenseNumber', sql.NVarChar(100), data.licenseNumber)
                .input('issuingAuthority', sql.NVarChar(255), data.issuingAuthority)
                .input('issueDate', sql.Date, data.issueDate)
                .input('expirationDate', sql.Date, data.expirationDate)
                .input('documentUrl', sql.NVarChar(1000), data.documentUrl)
                .input('fileName', sql.NVarChar(255), data.fileName)
                .input('fileSize', sql.BigInt, data.fileSize)
                .input('mimeType', sql.NVarChar(100), data.mimeType)
                .query(`
          INSERT INTO licenses 
          (tradesperson_id, license_type, license_number, issuing_authority, 
           issue_date, expiration_date, document_url, file_name, file_size, mime_type)
          OUTPUT INSERTED.*
          VALUES (@tradesperonId, @licenseType, @licenseNumber, @issuingAuthority,
                  @issueDate, @expirationDate, @documentUrl, @fileName, @fileSize, @mimeType)
        `);

            const row = result.recordset[0] as LicenseRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to create license', error as Error);
        }
    }

    // Get all licenses for a tradesperson
    static async findByTradesperonId(tradesperonId: string): Promise<License[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, tradesperonId)
                .query(`
          SELECT * FROM licenses 
          WHERE tradesperson_id = @tradesperonId
          ORDER BY created_at DESC
        `);

            return result.recordset.map((row: LicenseRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find licenses', error as Error);
        }
    }

    // Get license by ID
    static async findById(id: string): Promise<License | null> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          SELECT * FROM licenses 
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                return null;
            }

            const row = result.recordset[0] as LicenseRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to find license', error as Error);
        }
    }

    // Update license verification status
    static async updateVerificationStatus(id: string, updates: {
        verificationStatus: VerificationStatus;
        verificationNotes?: string;
        verifiedBy?: string;
    }): Promise<License> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const verifiedAt = updates.verificationStatus === 'verified' ? new Date() : null;

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .input('verificationStatus', sql.NVarChar(20), updates.verificationStatus)
                .input('verificationNotes', sql.NVarChar(1000), updates.verificationNotes || null)
                .input('verifiedBy', sql.NVarChar(255), updates.verifiedBy || null)
                .input('verifiedAt', sql.DateTime2, verifiedAt)
                .query(`
          UPDATE licenses 
          SET verification_status = @verificationStatus,
              verification_notes = @verificationNotes,
              verified_by = @verifiedBy,
              verified_at = @verifiedAt
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                throw new NotFoundError('License', id);
            }

            const row = result.recordset[0] as LicenseRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update license verification', error as Error);
        }
    }

    // Delete license
    static async delete(id: string): Promise<void> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          DELETE FROM licenses 
          WHERE id = @id
        `);

            if (result.rowsAffected[0] === 0) {
                throw new NotFoundError('License', id);
            }
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete license', error as Error);
        }
    }

    // Find licenses by verification status
    static async findByVerificationStatus(
        status: VerificationStatus,
        limit?: number,
        offset?: number
    ): Promise<License[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            let query = `
        SELECT * FROM licenses 
        WHERE verification_status = @status
        ORDER BY created_at DESC
      `;

            if (limit) {
                request.input('limit', sql.Int, limit);
                request.input('offset', sql.Int, offset || 0);
                query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
            }

            const result = await request
                .input('status', sql.NVarChar(20), status)
                .query(query);

            return result.recordset.map((row: LicenseRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find licenses by verification status', error as Error);
        }
    }

    // Find expired or expiring licenses
    static async findExpiringLicenses(daysFromNow: number = 30): Promise<License[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysFromNow);

            const result = await request
                .input('futureDate', sql.Date, futureDate)
                .query(`
          SELECT * FROM licenses 
          WHERE expiration_date <= @futureDate
            AND verification_status = 'verified'
          ORDER BY expiration_date ASC
        `);

            return result.recordset.map((row: LicenseRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find expiring licenses', error as Error);
        }
    }

    // Check if license number already exists for the same authority
    static async existsByNumberAndAuthority(
        licenseNumber: string,
        issuingAuthority: string,
        excludeId?: string
    ): Promise<boolean> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            let query = `
        SELECT COUNT(*) as count FROM licenses 
        WHERE license_number = @licenseNumber 
          AND issuing_authority = @issuingAuthority
      `;

            if (excludeId) {
                request.input('excludeId', sql.UniqueIdentifier, excludeId);
                query += ' AND id != @excludeId';
            }

            const result = await request
                .input('licenseNumber', sql.NVarChar(100), licenseNumber)
                .input('issuingAuthority', sql.NVarChar(255), issuingAuthority)
                .query(query);

            return result.recordset[0].count > 0;
        } catch (error) {
            throw new DatabaseError('Failed to check license existence', error as Error);
        }
    }

    // Get license statistics
    static async getStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        expiringSoon: number;
        expired: number;
    }> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Get total count
            const totalResult = await request.query(`
        SELECT COUNT(*) as total FROM licenses
      `);

            // Get counts by verification status
            const statusResult = await request.query(`
        SELECT verification_status, COUNT(*) as count 
        FROM licenses 
        GROUP BY verification_status
      `);

            // Get expiring licenses count (next 30 days)
            const expiringResult = await request.query(`
        SELECT COUNT(*) as count FROM licenses 
        WHERE expiration_date <= DATEADD(day, 30, GETDATE())
          AND expiration_date > GETDATE()
          AND verification_status = 'verified'
      `);

            // Get expired licenses count
            const expiredResult = await request.query(`
        SELECT COUNT(*) as count FROM licenses 
        WHERE expiration_date <= GETDATE()
          AND verification_status = 'verified'
      `);

            const byStatus: Record<string, number> = {};
            statusResult.recordset.forEach((row: any) => {
                byStatus[row.verification_status] = row.count;
            });

            return {
                total: totalResult.recordset[0].total,
                byStatus,
                expiringSoon: expiringResult.recordset[0].count,
                expired: expiredResult.recordset[0].count,
            };
        } catch (error) {
            throw new DatabaseError('Failed to get license statistics', error as Error);
        }
    }

    // Helper method to convert database row to entity
    private static mapRowToEntity(row: LicenseRow): License {
        return {
            id: row.id,
            tradesperonId: row.tradesperson_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            licenseType: row.license_type,
            licenseNumber: row.license_number,
            issuingAuthority: row.issuing_authority,
            issueDate: row.issue_date,
            expirationDate: row.expiration_date,
            documentUrl: row.document_url,
            fileName: row.file_name,
            fileSize: row.file_size,
            mimeType: row.mime_type,
            verificationStatus: row.verification_status as VerificationStatus,
            verificationNotes: row.verification_notes || undefined,
            verifiedAt: row.verified_at || undefined,
            verifiedBy: row.verified_by || undefined,
        };
    }
}