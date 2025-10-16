import { sql, getDatabase } from '../lib/database.js';
import type {
    TradeSpecialty,
    TradeSpecialtyRow,
    TradeType,
    SkillLevel
} from '../types/index.js';
import { NotFoundError, DatabaseError } from '../lib/errors.js';

export class TradeSpecialtyModel {
    // Create a new trade specialty
    static async create(data: {
        tradesperonId: string;
        tradeType: TradeType;
        skillLevel: SkillLevel;
        yearsOfExperience: number;
        specializations: string[];
        isCertified: boolean;
        certificationBody?: string;
    }): Promise<TradeSpecialty> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, data.tradesperonId)
                .input('tradeType', sql.NVarChar(50), data.tradeType)
                .input('skillLevel', sql.NVarChar(20), data.skillLevel)
                .input('yearsOfExperience', sql.Int, data.yearsOfExperience)
                .input('specializations', sql.NVarChar(sql.MAX), JSON.stringify(data.specializations))
                .input('isCertified', sql.Bit, data.isCertified)
                .input('certificationBody', sql.NVarChar(255), data.certificationBody || null)
                .query(`
          INSERT INTO trade_specialties 
          (tradesperson_id, trade_type, skill_level, years_of_experience, specializations, is_certified, certification_body)
          OUTPUT INSERTED.*
          VALUES (@tradesperonId, @tradeType, @skillLevel, @yearsOfExperience, @specializations, @isCertified, @certificationBody)
        `);

            const row = result.recordset[0] as TradeSpecialtyRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to create trade specialty', error as Error);
        }
    }

    // Get all specialties for a tradesperson
    static async findByTradesperonId(tradesperonId: string): Promise<TradeSpecialty[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, tradesperonId)
                .query(`
          SELECT * FROM trade_specialties 
          WHERE tradesperson_id = @tradesperonId
          ORDER BY created_at ASC
        `);

            return result.recordset.map((row: TradeSpecialtyRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find trade specialties', error as Error);
        }
    }

    // Get specialty by ID
    static async findById(id: string): Promise<TradeSpecialty | null> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          SELECT * FROM trade_specialties 
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                return null;
            }

            const row = result.recordset[0] as TradeSpecialtyRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to find trade specialty', error as Error);
        }
    }

    // Update specialty
    static async update(id: string, updates: {
        tradeType?: TradeType;
        skillLevel?: SkillLevel;
        yearsOfExperience?: number;
        specializations?: string[];
        isCertified?: boolean;
        certificationBody?: string;
    }): Promise<TradeSpecialty> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Build dynamic query based on provided updates
            const setParts: string[] = [];

            if (updates.tradeType !== undefined) {
                request.input('tradeType', sql.NVarChar(50), updates.tradeType);
                setParts.push('trade_type = @tradeType');
            }
            if (updates.skillLevel !== undefined) {
                request.input('skillLevel', sql.NVarChar(20), updates.skillLevel);
                setParts.push('skill_level = @skillLevel');
            }
            if (updates.yearsOfExperience !== undefined) {
                request.input('yearsOfExperience', sql.Int, updates.yearsOfExperience);
                setParts.push('years_of_experience = @yearsOfExperience');
            }
            if (updates.specializations !== undefined) {
                request.input('specializations', sql.NVarChar(sql.MAX), JSON.stringify(updates.specializations));
                setParts.push('specializations = @specializations');
            }
            if (updates.isCertified !== undefined) {
                request.input('isCertified', sql.Bit, updates.isCertified);
                setParts.push('is_certified = @isCertified');
            }
            if (updates.certificationBody !== undefined) {
                request.input('certificationBody', sql.NVarChar(255), updates.certificationBody);
                setParts.push('certification_body = @certificationBody');
            }

            if (setParts.length === 0) {
                throw new Error('No updates provided');
            }

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          UPDATE trade_specialties 
          SET ${setParts.join(', ')}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                throw new NotFoundError('TradeSpecialty', id);
            }

            const row = result.recordset[0] as TradeSpecialtyRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update trade specialty', error as Error);
        }
    }

    // Delete specialty
    static async delete(id: string): Promise<void> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          DELETE FROM trade_specialties 
          WHERE id = @id
        `);

            if (result.rowsAffected[0] === 0) {
                throw new NotFoundError('TradeSpecialty', id);
            }
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete trade specialty', error as Error);
        }
    }

    // Find specialties by trade type
    static async findByTradeType(tradeType: TradeType, limit?: number): Promise<TradeSpecialty[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            let query = `
        SELECT * FROM trade_specialties 
        WHERE trade_type = @tradeType
        ORDER BY created_at DESC
      `;

            if (limit) {
                request.input('limit', sql.Int, limit);
                query += ' OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY';
            }

            const result = await request
                .input('tradeType', sql.NVarChar(50), tradeType)
                .query(query);

            return result.recordset.map((row: TradeSpecialtyRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find trade specialties by type', error as Error);
        }
    }

    // Check if tradesperson already has this trade type
    static async existsForTradesperson(tradesperonId: string, tradeType: TradeType): Promise<boolean> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, tradesperonId)
                .input('tradeType', sql.NVarChar(50), tradeType)
                .query(`
          SELECT COUNT(*) as count FROM trade_specialties 
          WHERE tradesperson_id = @tradesperonId AND trade_type = @tradeType
        `);

            return result.recordset[0].count > 0;
        } catch (error) {
            throw new DatabaseError('Failed to check trade specialty existence', error as Error);
        }
    }

    // Get statistics about specialties
    static async getStats(): Promise<{
        totalSpecialties: number;
        byTradeType: Record<string, number>;
        bySkillLevel: Record<string, number>;
    }> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Get total count
            const totalResult = await request.query(`
        SELECT COUNT(*) as total FROM trade_specialties
      `);

            // Get counts by trade type
            const tradeTypeResult = await request.query(`
        SELECT trade_type, COUNT(*) as count 
        FROM trade_specialties 
        GROUP BY trade_type
        ORDER BY count DESC
      `);

            // Get counts by skill level
            const skillLevelResult = await request.query(`
        SELECT skill_level, COUNT(*) as count 
        FROM trade_specialties 
        GROUP BY skill_level
        ORDER BY count DESC
      `);

            const byTradeType: Record<string, number> = {};
            tradeTypeResult.recordset.forEach(row => {
                byTradeType[row.trade_type] = row.count;
            });

            const bySkillLevel: Record<string, number> = {};
            skillLevelResult.recordset.forEach(row => {
                bySkillLevel[row.skill_level] = row.count;
            });

            return {
                totalSpecialties: totalResult.recordset[0].total,
                byTradeType,
                bySkillLevel,
            };
        } catch (error) {
            throw new DatabaseError('Failed to get trade specialty statistics', error as Error);
        }
    }

    // Helper method to convert database row to entity
    private static mapRowToEntity(row: TradeSpecialtyRow): TradeSpecialty {
        let specializations: string[] = [];

        try {
            if (row.specializations) {
                specializations = JSON.parse(row.specializations);
            }
        } catch (error) {
            console.warn('Failed to parse specializations JSON:', row.specializations);
        }

        return {
            id: row.id,
            tradesperonId: row.tradesperson_id,
            createdAt: row.created_at,
            tradeType: row.trade_type as TradeType,
            skillLevel: row.skill_level as SkillLevel,
            yearsOfExperience: row.years_of_experience,
            specializations,
            isCertified: row.is_certified,
            certificationBody: row.certification_body || undefined,
        };
    }
}