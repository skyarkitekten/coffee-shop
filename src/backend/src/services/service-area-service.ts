import { ServiceAreaModel } from '../models/service-area.js';
import { TradesperonProfileModel } from '../models/tradesperson.js';
import { ServiceAreaType } from '../types/index.js';
import type {
    ServiceArea,
    CreateServiceAreaRequest
} from '../types/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../lib/errors.js';

export class ServiceAreaService {
    // Get all service areas for a tradesperson
    static async getByTradesperonId(tradesperonId: string): Promise<ServiceArea[]> {
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        return await ServiceAreaModel.findByTradesperonId(tradesperonId);
    }

    // Get specific service area by ID
    static async getById(serviceAreaId: string): Promise<ServiceArea> {
        const serviceArea = await ServiceAreaModel.findById(serviceAreaId);
        if (!serviceArea) {
            throw new NotFoundError('ServiceArea', serviceAreaId);
        }

        return serviceArea;
    }

    // Create a new service area
    static async create(
        tradesperonId: string,
        data: CreateServiceAreaRequest
    ): Promise<ServiceArea> {
        // Verify tradesperson exists
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        // Validate service area data
        this.validateServiceAreaData(data);

        // Check for duplicate service areas (prevent overlapping areas of same type)
        const existingAreas = await ServiceAreaModel.findByTradesperonId(tradesperonId);
        this.checkForDuplicates(data, existingAreas);

        // Prepare create data with only defined properties
        const createData: any = {
            tradesperonId,
            areaType: data.areaType,
            displayName: data.displayName,
        };

        if (data.centerLatitude !== undefined) createData.centerLatitude = data.centerLatitude;
        if (data.centerLongitude !== undefined) createData.centerLongitude = data.centerLongitude;
        if (data.radiusMiles !== undefined) createData.radiusMiles = data.radiusMiles;
        if (data.city !== undefined) createData.city = data.city;
        if (data.state !== undefined) createData.state = data.state;
        if (data.zipCode !== undefined) createData.zipCode = data.zipCode;

        return await ServiceAreaModel.create(createData);
    }

    // Update service area
    static async update(
        serviceAreaId: string,
        updates: Partial<CreateServiceAreaRequest>
    ): Promise<ServiceArea> {
        const serviceArea = await ServiceAreaModel.findById(serviceAreaId);
        if (!serviceArea) {
            throw new NotFoundError('ServiceArea', serviceAreaId);
        }

        // Validate updates
        if (updates.areaType || updates.centerLatitude !== undefined ||
            updates.centerLongitude !== undefined || updates.radiusMiles !== undefined ||
            updates.city !== undefined || updates.state !== undefined || updates.zipCode !== undefined) {

            const updatedData = { ...serviceArea, ...updates };
            this.validateServiceAreaData(updatedData as CreateServiceAreaRequest);
        }

        // Prepare update data with only defined properties
        const updateData: any = {};
        if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
        if (updates.centerLatitude !== undefined) updateData.centerLatitude = updates.centerLatitude;
        if (updates.centerLongitude !== undefined) updateData.centerLongitude = updates.centerLongitude;
        if (updates.radiusMiles !== undefined) updateData.radiusMiles = updates.radiusMiles;
        if (updates.city !== undefined) updateData.city = updates.city;
        if (updates.state !== undefined) updateData.state = updates.state;
        if (updates.zipCode !== undefined) updateData.zipCode = updates.zipCode;

        return await ServiceAreaModel.update(serviceAreaId, updateData);
    }

    // Delete service area
    static async delete(serviceAreaId: string): Promise<void> {
        const serviceArea = await ServiceAreaModel.findById(serviceAreaId);
        if (!serviceArea) {
            throw new NotFoundError('ServiceArea', serviceAreaId);
        }

        await ServiceAreaModel.delete(serviceAreaId);
    }

    // Find tradespeople serving a specific location
    static async findTradesperonByLocation(
        latitude: number,
        longitude: number,
        maxDistanceMiles: number = 50
    ): Promise<ServiceArea[]> {
        return await ServiceAreaModel.findByLocation(latitude.toString(), longitude.toString(), maxDistanceMiles.toString());
    }

    // Find tradespeople within radius
    static async findWithinRadius(
        centerLat: number,
        centerLng: number,
        radiusMiles: number
    ): Promise<ServiceArea[]> {
        return await ServiceAreaModel.findWithinRadius(centerLat, centerLng, radiusMiles);
    }    // Get coverage statistics for a tradesperson
    static async getCoverageStatistics(tradesperonId: string): Promise<{
        totalAreas: number;
        radiusAreas: number;
        cityAreas: number;
        zipAreas: number;
        totalCoverageArea: number; // in square miles for radius areas
        cities: string[];
        states: string[];
        zipCodes: string[];
    }> {
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        const areas = await ServiceAreaModel.findByTradesperonId(tradesperonId);

        const stats = {
            totalAreas: areas.length,
            radiusAreas: 0,
            cityAreas: 0,
            zipAreas: 0,
            totalCoverageArea: 0,
            cities: [] as string[],
            states: [] as string[],
            zipCodes: [] as string[]
        };

        const citySet = new Set<string>();
        const stateSet = new Set<string>();
        const zipSet = new Set<string>();

        for (const area of areas) {
            switch (area.areaType) {
                case ServiceAreaType.RADIUS:
                    stats.radiusAreas++;
                    if (area.radiusMiles) {
                        // Calculate approximate area coverage (π * r²)
                        stats.totalCoverageArea += Math.PI * Math.pow(area.radiusMiles, 2);
                    }
                    break;
                case ServiceAreaType.CITY:
                    stats.cityAreas++;
                    if (area.city) citySet.add(area.city);
                    if (area.state) stateSet.add(area.state);
                    break;
                case ServiceAreaType.ZIP:
                    stats.zipAreas++;
                    if (area.zipCode) zipSet.add(area.zipCode);
                    break;
            }
        }

        stats.cities = Array.from(citySet);
        stats.states = Array.from(stateSet);
        stats.zipCodes = Array.from(zipSet);

        return stats;
    }

    // Validate service area data
    private static validateServiceAreaData(data: CreateServiceAreaRequest): void {
        if (data.areaType === ServiceAreaType.RADIUS) {
            if (!data.centerLatitude || !data.centerLongitude || !data.radiusMiles) {
                throw new ValidationError('serviceArea', data, 'Radius type requires latitude, longitude, and radius');
            }

            // Validate latitude
            if (data.centerLatitude < -90 || data.centerLatitude > 90) {
                throw new ValidationError('centerLatitude', data.centerLatitude, 'Latitude must be between -90 and 90');
            }

            // Validate longitude
            if (data.centerLongitude < -180 || data.centerLongitude > 180) {
                throw new ValidationError('centerLongitude', data.centerLongitude, 'Longitude must be between -180 and 180');
            }

            // Validate radius
            if (data.radiusMiles <= 0 || data.radiusMiles > 100) {
                throw new ValidationError('radiusMiles', data.radiusMiles, 'Radius must be between 0 and 100 miles');
            }
        } else if (data.areaType === ServiceAreaType.CITY) {
            if (!data.city || !data.state) {
                throw new ValidationError('serviceArea', data, 'City type requires city and state');
            }

            if (data.city.length < 2 || data.city.length > 100) {
                throw new ValidationError('city', data.city, 'City name must be between 2 and 100 characters');
            }

            if (data.state.length !== 2) {
                throw new ValidationError('state', data.state, 'State must be a 2-character code');
            }
        } else if (data.areaType === ServiceAreaType.ZIP) {
            if (!data.zipCode) {
                throw new ValidationError('serviceArea', data, 'ZIP type requires zip code');
            }

            // Basic US ZIP code validation
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(data.zipCode)) {
                throw new ValidationError('zipCode', data.zipCode, 'Invalid ZIP code format (use 12345 or 12345-6789)');
            }
        }

        // Validate display name
        if (data.displayName.length < 2 || data.displayName.length > 200) {
            throw new ValidationError('displayName', data.displayName, 'Display name must be between 2 and 200 characters');
        }
    }

    // Check for duplicate service areas
    private static checkForDuplicates(newArea: CreateServiceAreaRequest, existingAreas: ServiceArea[]): void {
        for (const existing of existingAreas) {
            if (existing.areaType === newArea.areaType) {
                switch (newArea.areaType) {
                    case ServiceAreaType.CITY:
                        if (existing.city === newArea.city && existing.state === newArea.state) {
                            throw new ConflictError(`Service area for ${newArea.city}, ${newArea.state} already exists`);
                        }
                        break;
                    case ServiceAreaType.ZIP:
                        if (existing.zipCode === newArea.zipCode) {
                            throw new ConflictError(`Service area for ZIP code ${newArea.zipCode} already exists`);
                        }
                        break;
                    case ServiceAreaType.RADIUS:
                        // Check if new radius overlaps significantly with existing radius areas
                        if (existing.centerLatitude && existing.centerLongitude &&
                            newArea.centerLatitude && newArea.centerLongitude) {
                            const distance = this.calculateDistance(
                                existing.centerLatitude, existing.centerLongitude,
                                newArea.centerLatitude, newArea.centerLongitude
                            );
                            const combinedRadius = (existing.radiusMiles || 0) + (newArea.radiusMiles || 0);

                            if (distance < combinedRadius * 0.5) { // 50% overlap threshold
                                throw new ConflictError('New radius area overlaps significantly with existing radius area');
                            }
                        }
                        break;
                }
            }
        }
    }

    // Calculate distance between two coordinates in miles
    private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}