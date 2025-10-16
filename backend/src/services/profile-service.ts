import { TradesperonProfileModel } from '../models/tradesperson.js';
import { TradeSpecialtyModel } from '../models/trade-specialty.js';
import { LicenseModel } from '../models/license.js';
import { ServiceAreaModel } from '../models/service-area.js';
import { uploadFile, deleteFile } from '../lib/storage.js';
import { ProfileStatus, VerificationStatus } from '../types/index.js';
import type {
    TradesperonProfile,
    CreateProfileRequest,
    UpdateProfileRequest,
    CreateTradeSpecialtyRequest,
    CreateServiceAreaRequest
} from '../types/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../lib/errors.js';

export class ProfileService {
    // Create a new tradesperson profile
    static async createProfile(
        userId: string,
        data: CreateProfileRequest
    ): Promise<TradesperonProfile> {
        // Check if profile already exists for this user
        const existingProfile = await TradesperonProfileModel.findByUserId(userId);
        if (existingProfile) {
            throw new ConflictError('Profile already exists for this user');
        }

        // Validate email format
        if (!this.isValidEmail(data.email)) {
            throw new ValidationError('email', data.email, 'Invalid email format');
        }

        // Validate phone format (basic E.164 format check)
        if (!this.isValidPhone(data.phone)) {
            throw new ValidationError('phone', data.phone, 'Invalid phone format (use E.164 format)');
        }

        // Validate experience years
        if (data.experienceYears < 0 || data.experienceYears > 50) {
            throw new ValidationError('experienceYears', data.experienceYears, 'Experience years must be between 0 and 50');
        }

        return await TradesperonProfileModel.create({
            userId,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            experienceYears: data.experienceYears,
            ...(data.bio && { bio: data.bio }),
        });
    }

    // Get profile with all related data
    static async getProfileWithDetails(userId: string): Promise<TradesperonProfile & {
        tradeSpecialties: any[];
        licenses: any[];
        serviceAreas: any[];
    }> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        // Load related data
        const [tradeSpecialties, licenses, serviceAreas] = await Promise.all([
            TradeSpecialtyModel.findByTradesperonId(profile.id),
            LicenseModel.findByTradesperonId(profile.id),
            ServiceAreaModel.findByTradesperonId(profile.id),
        ]);

        return {
            ...profile,
            tradeSpecialties,
            licenses,
            serviceAreas,
        };
    }

    // Update profile basic information
    static async updateProfile(
        userId: string,
        updates: UpdateProfileRequest
    ): Promise<TradesperonProfile> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        // Validate updates
        if (updates.phone && !this.isValidPhone(updates.phone)) {
            throw new ValidationError('phone', updates.phone, 'Invalid phone format (use E.164 format)');
        }

        if (updates.experienceYears !== undefined && (updates.experienceYears < 0 || updates.experienceYears > 50)) {
            throw new ValidationError('experienceYears', updates.experienceYears, 'Experience years must be between 0 and 50');
        }

        const updatedProfile = await TradesperonProfileModel.update(profile.id, updates);

        // Check if profile should be marked as complete
        await this.updateProfileCompletionStatus(updatedProfile.id);

        return updatedProfile;
    }

    // Add trade specialty
    static async addTradeSpecialty(
        userId: string,
        data: CreateTradeSpecialtyRequest
    ): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        // Check if specialty already exists
        const exists = await TradeSpecialtyModel.existsForTradesperson(profile.id, data.tradeType);
        if (exists) {
            throw new ConflictError(`Trade specialty ${data.tradeType} already exists for this profile`);
        }

        // Validate years of experience
        if (data.yearsOfExperience < 0 || data.yearsOfExperience > 50) {
            throw new ValidationError('yearsOfExperience', data.yearsOfExperience, 'Years of experience must be between 0 and 50');
        }

        await TradeSpecialtyModel.create({
            tradesperonId: profile.id,
            tradeType: data.tradeType,
            skillLevel: data.skillLevel,
            yearsOfExperience: data.yearsOfExperience,
            specializations: data.specializations,
            isCertified: data.isCertified,
            ...(data.certificationBody && { certificationBody: data.certificationBody }),
        });

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Remove trade specialty
    static async removeTradeSpecialty(userId: string, specialtyId: string): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        const specialty = await TradeSpecialtyModel.findById(specialtyId);
        if (!specialty || specialty.tradesperonId !== profile.id) {
            throw new NotFoundError('TradeSpecialty', specialtyId);
        }

        await TradeSpecialtyModel.delete(specialtyId);

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Upload license document
    static async uploadLicense(
        userId: string,
        licenseData: {
            licenseType: string;
            licenseNumber: string;
            issuingAuthority: string;
            issueDate: Date;
            expirationDate: Date;
        },
        file: {
            buffer: Buffer;
            originalName: string;
            mimeType: string;
            size: number;
        }
    ): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        // Validate file
        this.validateLicenseFile(file);

        // Validate dates
        if (licenseData.expirationDate <= licenseData.issueDate) {
            throw new ValidationError('expirationDate', licenseData.expirationDate, 'Expiration date must be after issue date');
        }

        if (licenseData.expirationDate <= new Date()) {
            throw new ValidationError('expirationDate', licenseData.expirationDate, 'License has already expired');
        }

        // Check for duplicate license number
        const exists = await LicenseModel.existsByNumberAndAuthority(
            licenseData.licenseNumber,
            licenseData.issuingAuthority
        );
        if (exists) {
            throw new ConflictError('License with this number already exists for this authority');
        }

        // Upload file to Azure Blob Storage
        const documentUrl = await uploadFile(
            `license-${profile.id}-${Date.now()}-${file.originalName}`,
            file.buffer,
            file.mimeType
        );

        // Create license record
        await LicenseModel.create({
            tradesperonId: profile.id,
            licenseType: licenseData.licenseType,
            licenseNumber: licenseData.licenseNumber,
            issuingAuthority: licenseData.issuingAuthority,
            issueDate: licenseData.issueDate,
            expirationDate: licenseData.expirationDate,
            documentUrl,
            fileName: file.originalName,
            fileSize: file.size,
            mimeType: file.mimeType,
        });

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Remove license
    static async removeLicense(userId: string, licenseId: string): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        const license = await LicenseModel.findById(licenseId);
        if (!license || license.tradesperonId !== profile.id) {
            throw new NotFoundError('License', licenseId);
        }

        // Delete file from storage
        try {
            const fileName = license.documentUrl.split('/').pop() || '';
            await deleteFile(fileName);
        } catch (error) {
            console.warn('Failed to delete license file from storage:', error);
            // Continue with database deletion even if file deletion fails
        }

        await LicenseModel.delete(licenseId);

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Add service area
    static async addServiceArea(
        userId: string,
        data: CreateServiceAreaRequest
    ): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        // Validate service area data based on type
        this.validateServiceAreaData(data);

        const createData: any = {
            tradesperonId: profile.id,
            areaType: data.areaType,
            displayName: data.displayName,
        };

        if (data.centerLatitude !== undefined) createData.centerLatitude = data.centerLatitude;
        if (data.centerLongitude !== undefined) createData.centerLongitude = data.centerLongitude;
        if (data.radiusMiles !== undefined) createData.radiusMiles = data.radiusMiles;
        if (data.city !== undefined) createData.city = data.city;
        if (data.state !== undefined) createData.state = data.state;
        if (data.zipCode !== undefined) createData.zipCode = data.zipCode;

        await ServiceAreaModel.create(createData);

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Remove service area
    static async removeServiceArea(userId: string, areaId: string): Promise<void> {
        const profile = await TradesperonProfileModel.findByUserId(userId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', userId);
        }

        const area = await ServiceAreaModel.findById(areaId);
        if (!area || area.tradesperonId !== profile.id) {
            throw new NotFoundError('ServiceArea', areaId);
        }

        await ServiceAreaModel.delete(areaId);

        // Update profile completion status
        await this.updateProfileCompletionStatus(profile.id);
    }

    // Check and update profile completion status
    private static async updateProfileCompletionStatus(profileId: string): Promise<void> {
        const completion = await TradesperonProfileModel.checkCompletion(profileId);

        const profile = await TradesperonProfileModel.findById(profileId);
        if (!profile) return;

        const newStatus: ProfileStatus = completion.isComplete ? ProfileStatus.COMPLETE : ProfileStatus.DRAFT;

        if (profile.profileStatus !== newStatus) {
            await TradesperonProfileModel.update(profileId, { profileStatus: newStatus });
        }
    }

    // Validation helpers
    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private static isValidPhone(phone: string): boolean {
        // Basic E.164 format validation
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
    }

    private static validateLicenseFile(file: {
        mimeType: string;
        size: number;
        originalName: string;
    }): void {
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new ValidationError('file', file.size, 'File size must be less than 10MB');
        }

        // Check file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimeType)) {
            throw new ValidationError('file', file.mimeType, 'File must be PDF, JPG, or PNG');
        }

        // Check file extension
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const extension = file.originalName.toLowerCase().substring(file.originalName.lastIndexOf('.'));
        if (!allowedExtensions.includes(extension)) {
            throw new ValidationError('file', extension, 'File extension must be .pdf, .jpg, .jpeg, or .png');
        }
    }

    private static validateServiceAreaData(data: CreateServiceAreaRequest): void {
        if (data.areaType === 'radius') {
            if (!data.centerLatitude || !data.centerLongitude || !data.radiusMiles) {
                throw new ValidationError('serviceArea', data, 'Radius type requires latitude, longitude, and radius');
            }
            if (data.radiusMiles > 100) {
                throw new ValidationError('radiusMiles', data.radiusMiles, 'Radius cannot exceed 100 miles');
            }
        } else if (data.areaType === 'city') {
            if (!data.city || !data.state) {
                throw new ValidationError('serviceArea', data, 'City type requires city and state');
            }
        } else if (data.areaType === 'zip') {
            if (!data.zipCode) {
                throw new ValidationError('serviceArea', data, 'ZIP type requires zip code');
            }
            // Basic US ZIP code validation
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(data.zipCode)) {
                throw new ValidationError('zipCode', data.zipCode, 'Invalid ZIP code format');
            }
        }
    }
}