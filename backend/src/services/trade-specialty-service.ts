import { TradeSpecialtyModel } from '../models/trade-specialty.js';
import { TradesperonProfileModel } from '../models/tradesperson.js';
import { TradeType, SkillLevel } from '../types/index.js';
import type {
    TradeSpecialty,
    CreateTradeSpecialtyRequest
} from '../types/index.js';
import { NotFoundError, ValidationError, ConflictError } from '../lib/errors.js';

export class TradeSpecialtyService {
    // Get all trade specialties for a tradesperson
    static async getByTradesperonId(tradesperonId: string): Promise<TradeSpecialty[]> {
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        return await TradeSpecialtyModel.findByTradesperonId(tradesperonId);
    }

    // Get specific trade specialty by ID
    static async getById(specialtyId: string): Promise<TradeSpecialty> {
        const specialty = await TradeSpecialtyModel.findById(specialtyId);
        if (!specialty) {
            throw new NotFoundError('TradeSpecialty', specialtyId);
        }

        return specialty;
    }

    // Create a new trade specialty
    static async create(
        tradesperonId: string,
        data: CreateTradeSpecialtyRequest
    ): Promise<TradeSpecialty> {
        // Verify tradesperson exists
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        // Check if specialty already exists for this tradesperson
        const exists = await TradeSpecialtyModel.existsForTradesperson(
            tradesperonId,
            data.tradeType
        );
        if (exists) {
            throw new ConflictError(
                `Trade specialty ${data.tradeType} already exists for this tradesperson`
            );
        }

        // Validate data
        this.validateTradeSpecialtyData(data);

        return await TradeSpecialtyModel.create({
            tradesperonId,
            tradeType: data.tradeType,
            skillLevel: data.skillLevel,
            yearsOfExperience: data.yearsOfExperience,
            specializations: data.specializations,
            isCertified: data.isCertified,
            ...(data.certificationBody && { certificationBody: data.certificationBody }),
        });
    }

    // Update trade specialty
    static async update(
        specialtyId: string,
        updates: Partial<Omit<CreateTradeSpecialtyRequest, 'tradeType'>>
    ): Promise<TradeSpecialty> {
        const specialty = await TradeSpecialtyModel.findById(specialtyId);
        if (!specialty) {
            throw new NotFoundError('TradeSpecialty', specialtyId);
        }

        // Validate updates
        if (updates.yearsOfExperience !== undefined) {
            this.validateExperience(updates.yearsOfExperience);
        }

        if (updates.skillLevel && updates.yearsOfExperience !== undefined) {
            this.validateSkillLevelConsistency(updates.skillLevel, updates.yearsOfExperience);
        }

        return await TradeSpecialtyModel.update(specialtyId, updates);
    }

    // Delete trade specialty
    static async delete(specialtyId: string): Promise<void> {
        const specialty = await TradeSpecialtyModel.findById(specialtyId);
        if (!specialty) {
            throw new NotFoundError('TradeSpecialty', specialtyId);
        }

        await TradeSpecialtyModel.delete(specialtyId);
    }

    // Search for tradespeople by trade type and skill level
    static async searchByTradeAndSkill(
        tradeType: TradeType,
        minSkillLevel?: SkillLevel,
        isCertified?: boolean
    ): Promise<{ tradesperonId: string; specialties: TradeSpecialty[] }[]> {
        const specialties = await TradeSpecialtyModel.findByTradeType(tradeType);

        let filtered = specialties;

        // Filter by skill level if specified
        if (minSkillLevel) {
            const skillOrder = {
                [SkillLevel.APPRENTICE]: 1,
                [SkillLevel.JOURNEYMAN]: 2,
                [SkillLevel.SPECIALIST]: 3,
                [SkillLevel.MASTER]: 4
            };
            const minOrder = skillOrder[minSkillLevel];
            filtered = filtered.filter(s => skillOrder[s.skillLevel] >= minOrder);
        }

        // Filter by certification if specified
        if (isCertified !== undefined) {
            filtered = filtered.filter(s => s.isCertified === isCertified);
        }

        // Group by tradesperson
        const grouped = filtered.reduce((acc, specialty) => {
            const existing = acc.find(item => item.tradesperonId === specialty.tradesperonId);
            if (existing) {
                existing.specialties.push(specialty);
            } else {
                acc.push({
                    tradesperonId: specialty.tradesperonId,
                    specialties: [specialty]
                });
            }
            return acc;
        }, [] as { tradesperonId: string; specialties: TradeSpecialty[] }[]);

        return grouped;
    }

    // Suggest trade types based on existing specializations
    static async suggestComplementaryTrades(tradesperonId: string): Promise<TradeType[]> {
        const profile = await TradesperonProfileModel.findById(tradesperonId);
        if (!profile) {
            throw new NotFoundError('TradesperonProfile', tradesperonId);
        }

        const existingSpecialties = await TradeSpecialtyModel.findByTradesperonId(tradesperonId);
        const existingTradeTypes = existingSpecialties.map(s => s.tradeType);

        // Simple complementary trade suggestions based on common combinations
        const complementaryMap: Record<TradeType, TradeType[]> = {
            [TradeType.ELECTRICIAN]: [TradeType.PLUMBER, TradeType.HVAC_TECHNICIAN, TradeType.CARPENTER],
            [TradeType.PLUMBER]: [TradeType.ELECTRICIAN, TradeType.HVAC_TECHNICIAN],
            [TradeType.CARPENTER]: [TradeType.ELECTRICIAN, TradeType.PAINTER, TradeType.FLOORING_INSTALLER],
            [TradeType.PAINTER]: [TradeType.CARPENTER, TradeType.FLOORING_INSTALLER],
            [TradeType.HVAC_TECHNICIAN]: [TradeType.ELECTRICIAN, TradeType.PLUMBER, TradeType.ROOFER],
            [TradeType.ROOFER]: [TradeType.HVAC_TECHNICIAN, TradeType.CARPENTER, TradeType.PAINTER],
            [TradeType.FLOORING_INSTALLER]: [TradeType.CARPENTER, TradeType.PAINTER],
            [TradeType.MASON]: [TradeType.CARPENTER, TradeType.PAINTER],
            [TradeType.WELDER]: [TradeType.MASON, TradeType.CARPENTER],
            [TradeType.GENERAL_CONTRACTOR]: [] // General contractor complements with everything
        };

        const suggestions = new Set<TradeType>();

        // Get suggestions based on existing trades
        for (const tradeType of existingTradeTypes) {
            const complementary = complementaryMap[tradeType] || [];
            complementary.forEach(trade => {
                if (!existingTradeTypes.includes(trade)) {
                    suggestions.add(trade);
                }
            });
        }

        return Array.from(suggestions);
    }

    // Validation helpers
    private static validateTradeSpecialtyData(data: CreateTradeSpecialtyRequest): void {
        this.validateExperience(data.yearsOfExperience);
        this.validateSkillLevelConsistency(data.skillLevel, data.yearsOfExperience);
        this.validateSpecializations(data.specializations);
        this.validateCertification(data.isCertified, data.certificationBody);
    }

    private static validateExperience(years: number): void {
        if (years < 0 || years > 50) {
            throw new ValidationError(
                'yearsOfExperience',
                years,
                'Years of experience must be between 0 and 50'
            );
        }
    }

    private static validateSkillLevelConsistency(skillLevel: SkillLevel, experience: number): void {
        // Basic consistency checks between skill level and experience
        const rules = {
            [SkillLevel.APPRENTICE]: { min: 0, max: 3 },
            [SkillLevel.JOURNEYMAN]: { min: 2, max: 10 },
            [SkillLevel.SPECIALIST]: { min: 5, max: 20 },
            [SkillLevel.MASTER]: { min: 10, max: 50 }
        };

        const rule = rules[skillLevel];
        if (experience < rule.min) {
            throw new ValidationError(
                'skillLevel',
                skillLevel,
                `${skillLevel} skill level requires at least ${rule.min} years of experience`
            );
        }
        if (experience > rule.max && rule.max < 50) {
            throw new ValidationError(
                'skillLevel',
                skillLevel,
                `${skillLevel} skill level typically has at most ${rule.max} years of experience`
            );
        }
    }

    private static validateSpecializations(specializations: string[]): void {
        if (specializations.length > 10) {
            throw new ValidationError(
                'specializations',
                specializations,
                'Cannot have more than 10 specializations'
            );
        }

        for (const spec of specializations) {
            if (spec.length > 100) {
                throw new ValidationError(
                    'specializations',
                    spec,
                    'Each specialization must be 100 characters or less'
                );
            }
        }
    }

    private static validateCertification(isCertified: boolean, certificationBody?: string): void {
        if (isCertified && !certificationBody) {
            throw new ValidationError(
                'certificationBody',
                certificationBody,
                'Certification body is required when marked as certified'
            );
        }

        if (certificationBody && certificationBody.length > 200) {
            throw new ValidationError(
                'certificationBody',
                certificationBody,
                'Certification body name must be 200 characters or less'
            );
        }
    }
}