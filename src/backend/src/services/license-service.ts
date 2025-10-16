// License service provides CRUD operations and verification utilities for tradesperson licenses
import { LicenseModel } from '../models/license.js';
import { TradesperonProfileModel } from '../models/tradesperson.js';
import { uploadFile, deleteFile } from '../lib/storage.js';
import { validateChronology, validateFileMeta } from '../lib/validation.js';
import { warn } from '../lib/logger.js';
import { VerificationStatus } from '../types/index.js';
import type { License } from '../types/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../lib/errors.js';

export class LicenseService {
    // Get all licenses for a tradesperson
    static async getByTradesperonId(tradesperonId: string): Promise<License[]> {
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        return await LicenseModel.findByTradesperonId(tradesperonId);
    }

    // Get specific license by ID
    static async getById(licenseId: string): Promise<License> {
        const license = await LicenseModel.findById(licenseId);
        if (!license) {
            throw new NotFoundError('License', licenseId);
        }

        return license;
    }

    // Upload and create a new license
    static async uploadLicense(
        tradesperonId: string,
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
    ): Promise<License> {
        // Verify tradesperson exists
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        // Validate license data
        this.validateLicenseData(licenseData);

        // Validate file
        this.validateLicenseFile(file);

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
            `license-${tradesperonId}-${Date.now()}-${file.originalName}`,
            file.buffer,
            file.mimeType
        );

        // Create license record
        return await LicenseModel.create({
            tradesperonId,
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
    }

    // Delete license and associated file
    static async delete(licenseId: string): Promise<void> {
        const license = await LicenseModel.findById(licenseId);
        if (!license) {
            throw new NotFoundError('License', licenseId);
        }

        // Delete file from storage
        try {
            const fileName = license.documentUrl.split('/').pop() || '';
            await deleteFile(fileName);
        } catch (error) {
            warn('Failed to delete license file from storage', { error: (error as Error).message });
            // Continue with database deletion even if file deletion fails
        }

        await LicenseModel.delete(licenseId);
    }

    // Update verification status (admin function)
    static async updateVerificationStatus(
        licenseId: string,
        status: VerificationStatus,
        verificationNotes?: string
    ): Promise<License> {
        const license = await LicenseModel.findById(licenseId);
        if (!license) {
            throw new NotFoundError('License', licenseId);
        }

        return await LicenseModel.updateVerificationStatus(licenseId, {
            verificationStatus: status,
            ...(verificationNotes && { verificationNotes })
        });
    }

    // Get licenses requiring verification
    static async getPendingVerifications(): Promise<License[]> {
        return await LicenseModel.findByVerificationStatus(VerificationStatus.PENDING);
    }

    // Check if license is expired
    static isExpired(license: License): boolean {
        return license.expirationDate <= new Date();
    }

    // Check if license expires within specified days
    static isExpiringSoon(license: License, days: number = 90): boolean {
        const expirationThreshold = new Date();
        expirationThreshold.setDate(expirationThreshold.getDate() + days);
        return license.expirationDate <= expirationThreshold;
    }

    // Get licenses expiring soon for a tradesperson
    static async getExpiringSoonForTradesperson(tradesperonId: string, days: number = 90): Promise<License[]> {
        const licenses = await this.getByTradesperonId(tradesperonId);
        return licenses.filter(license => this.isExpiringSoon(license, days));
    }

    // Validate license data
    private static validateLicenseData(data: {
        licenseType: string;
        licenseNumber: string;
        issuingAuthority: string;
        issueDate: Date;
        expirationDate: Date;
    }): void {
        // Validate dates
        validateChronology(data.issueDate, data.expirationDate);

        // Validate license type
        if (data.licenseType.length < 2 || data.licenseType.length > 100) {
            throw new ValidationError('licenseType', data.licenseType, 'License type must be between 2 and 100 characters');
        }

        // Validate license number
        if (data.licenseNumber.length < 3 || data.licenseNumber.length > 50) {
            throw new ValidationError('licenseNumber', data.licenseNumber, 'License number must be between 3 and 50 characters');
        }

        // Validate issuing authority
        if (data.issuingAuthority.length < 2 || data.issuingAuthority.length > 200) {
            throw new ValidationError('issuingAuthority', data.issuingAuthority, 'Issuing authority must be between 2 and 200 characters');
        }
    }

    // Validate license file
    private static validateLicenseFile(file: {
        mimeType: string;
        size: number;
        originalName: string;
    }): void {
        validateFileMeta(file);
    }
}