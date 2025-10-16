import { sql, getDatabase } from '../lib/database.js';
import type {
    ServiceArea,
    ServiceAreaRow,
    ServiceAreaType
} from '../types/index.js';
import { NotFoundError, DatabaseError } from '../lib/errors.js';

export class ServiceAreaModel {
    // Create a new service area
    static async create(data: {
        tradesperonId: string;
        areaType: ServiceAreaType;
        centerLatitude?: number;
        centerLongitude?: number;
        radiusMiles?: number;
        city?: string;
        state?: string;
        zipCode?: string;
        displayName: string;
    }): Promise<ServiceArea> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, data.tradesperonId)
                .input('areaType', sql.NVarChar(20), data.areaType)
                .input('centerLatitude', sql.Decimal(10, 8), data.centerLatitude || null)
                .input('centerLongitude', sql.Decimal(11, 8), data.centerLongitude || null)
                .input('radiusMiles', sql.Int, data.radiusMiles || null)
                .input('city', sql.NVarChar(100), data.city || null)
                .input('state', sql.NVarChar(50), data.state || null)
                .input('zipCode', sql.NVarChar(10), data.zipCode || null)
                .input('displayName', sql.NVarChar(255), data.displayName)
                .query(`
          INSERT INTO service_areas 
          (tradesperson_id, area_type, center_latitude, center_longitude, radius_miles,
           city, state, zip_code, display_name)
          OUTPUT INSERTED.*
          VALUES (@tradesperonId, @areaType, @centerLatitude, @centerLongitude, @radiusMiles,
                  @city, @state, @zipCode, @displayName)
        `);

            const row = result.recordset[0] as ServiceAreaRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to create service area', error as Error);
        }
    }

    // Get all service areas for a tradesperson
    static async findByTradesperonId(tradesperonId: string): Promise<ServiceArea[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('tradesperonId', sql.UniqueIdentifier, tradesperonId)
                .query(`
          SELECT * FROM service_areas 
          WHERE tradesperson_id = @tradesperonId
          ORDER BY created_at ASC
        `);

            return result.recordset.map((row: ServiceAreaRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find service areas', error as Error);
        }
    }

    // Get service area by ID
    static async findById(id: string): Promise<ServiceArea | null> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          SELECT * FROM service_areas 
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                return null;
            }

            const row = result.recordset[0] as ServiceAreaRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            throw new DatabaseError('Failed to find service area', error as Error);
        }
    }

    // Update service area
    static async update(id: string, updates: {
        centerLatitude?: number;
        centerLongitude?: number;
        radiusMiles?: number;
        city?: string;
        state?: string;
        zipCode?: string;
        displayName?: string;
        isActive?: boolean;
    }): Promise<ServiceArea> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Build dynamic query based on provided updates
            const setParts: string[] = [];

            if (updates.centerLatitude !== undefined) {
                request.input('centerLatitude', sql.Decimal(10, 8), updates.centerLatitude);
                setParts.push('center_latitude = @centerLatitude');
            }
            if (updates.centerLongitude !== undefined) {
                request.input('centerLongitude', sql.Decimal(11, 8), updates.centerLongitude);
                setParts.push('center_longitude = @centerLongitude');
            }
            if (updates.radiusMiles !== undefined) {
                request.input('radiusMiles', sql.Int, updates.radiusMiles);
                setParts.push('radius_miles = @radiusMiles');
            }
            if (updates.city !== undefined) {
                request.input('city', sql.NVarChar(100), updates.city);
                setParts.push('city = @city');
            }
            if (updates.state !== undefined) {
                request.input('state', sql.NVarChar(50), updates.state);
                setParts.push('state = @state');
            }
            if (updates.zipCode !== undefined) {
                request.input('zipCode', sql.NVarChar(10), updates.zipCode);
                setParts.push('zip_code = @zipCode');
            }
            if (updates.displayName !== undefined) {
                request.input('displayName', sql.NVarChar(255), updates.displayName);
                setParts.push('display_name = @displayName');
            }
            if (updates.isActive !== undefined) {
                request.input('isActive', sql.Bit, updates.isActive);
                setParts.push('is_active = @isActive');
            }

            if (setParts.length === 0) {
                throw new Error('No updates provided');
            }

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          UPDATE service_areas 
          SET ${setParts.join(', ')}
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

            if (result.recordset.length === 0) {
                throw new NotFoundError('ServiceArea', id);
            }

            const row = result.recordset[0] as ServiceAreaRow;
            return this.mapRowToEntity(row);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to update service area', error as Error);
        }
    }

    // Delete service area
    static async delete(id: string): Promise<void> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const result = await request
                .input('id', sql.UniqueIdentifier, id)
                .query(`
          DELETE FROM service_areas 
          WHERE id = @id
        `);

            if (result.rowsAffected[0] === 0) {
                throw new NotFoundError('ServiceArea', id);
            }
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('Failed to delete service area', error as Error);
        }
    }

    // Find service areas within a geographic radius
    static async findWithinRadius(
        latitude: number,
        longitude: number,
        radiusMiles: number,
        limit?: number,
        offset?: number
    ): Promise<ServiceArea[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Convert miles to meters (1 mile = 1609.34 meters)
            const radiusMeters = radiusMiles * 1609.34;

            let query = `
        SELECT * FROM service_areas 
        WHERE area_type = 'radius'
          AND is_active = 1
          AND center_point.STDistance(geography::Point(@latitude, @longitude, 4326)) <= @radiusMeters
        ORDER BY center_point.STDistance(geography::Point(@latitude, @longitude, 4326))
      `;

            if (limit) {
                request.input('limit', sql.Int, limit);
                request.input('offset', sql.Int, offset || 0);
                query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
            }

            const result = await request
                .input('latitude', sql.Decimal(10, 8), latitude)
                .input('longitude', sql.Decimal(11, 8), longitude)
                .input('radiusMeters', sql.Float, radiusMeters)
                .query(query);

            return result.recordset.map((row: ServiceAreaRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find service areas within radius', error as Error);
        }
    }

    // Find service areas by city and state
    static async findByLocation(
        city?: string,
        state?: string,
        zipCode?: string,
        limit?: number,
        offset?: number
    ): Promise<ServiceArea[]> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            const conditions: string[] = ['is_active = 1'];

            if (city) {
                request.input('city', sql.NVarChar(100), city);
                conditions.push('city = @city');
            }
            if (state) {
                request.input('state', sql.NVarChar(50), state);
                conditions.push('state = @state');
            }
            if (zipCode) {
                request.input('zipCode', sql.NVarChar(10), zipCode);
                conditions.push('zip_code = @zipCode');
            }

            let query = `
        SELECT * FROM service_areas 
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
      `;

            if (limit) {
                request.input('limit', sql.Int, limit);
                request.input('offset', sql.Int, offset || 0);
                query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
            }

            const result = await request.query(query);

            return result.recordset.map((row: ServiceAreaRow) => this.mapRowToEntity(row));
        } catch (error) {
            throw new DatabaseError('Failed to find service areas by location', error as Error);
        }
    }

    // Get service area statistics
    static async getStats(): Promise<{
        total: number;
        active: number;
        byType: Record<string, number>;
        averageRadius: number;
    }> {
        try {
            const pool = await getDatabase();
            const request = pool.request();

            // Get total and active counts
            const countsResult = await request.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM service_areas
      `);

            // Get counts by area type
            const typeResult = await request.query(`
        SELECT area_type, COUNT(*) as count 
        FROM service_areas 
        WHERE is_active = 1
        GROUP BY area_type
      `);

            // Get average radius for radius-type areas
            const radiusResult = await request.query(`
        SELECT AVG(CAST(radius_miles as FLOAT)) as avg_radius
        FROM service_areas 
        WHERE area_type = 'radius' AND is_active = 1 AND radius_miles IS NOT NULL
      `);

            const byType: Record<string, number> = {};
            typeResult.recordset.forEach((row: any) => {
                byType[row.area_type] = row.count;
            });

            return {
                total: countsResult.recordset[0].total,
                active: countsResult.recordset[0].active,
                byType,
                averageRadius: radiusResult.recordset[0].avg_radius || 0,
            };
        } catch (error) {
            throw new DatabaseError('Failed to get service area statistics', error as Error);
        }
    }

    // Helper method to convert database row to entity
    private static mapRowToEntity(row: ServiceAreaRow): ServiceArea {
        return {
            id: row.id,
            tradesperonId: row.tradesperson_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            areaType: row.area_type as ServiceAreaType,
            centerLatitude: row.center_latitude || undefined,
            centerLongitude: row.center_longitude || undefined,
            radiusMiles: row.radius_miles || undefined,
            city: row.city || undefined,
            state: row.state || undefined,
            zipCode: row.zip_code || undefined,
            displayName: row.display_name,
            isActive: row.is_active,
        };
    }
}