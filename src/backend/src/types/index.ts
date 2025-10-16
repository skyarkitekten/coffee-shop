// Core data types based on the data model and database schema

export enum ProfileStatus {
    DRAFT = 'draft',
    COMPLETE = 'complete',
    SUSPENDED = 'suspended',
}

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
    NOT_SUBMITTED = 'not_submitted',
}

export enum TradeType {
    ELECTRICIAN = 'electrician',
    PLUMBER = 'plumber',
    CARPENTER = 'carpenter',
    WELDER = 'welder',
    HVAC_TECHNICIAN = 'hvac_technician',
    MASON = 'mason',
    ROOFER = 'roofer',
    PAINTER = 'painter',
    FLOORING_INSTALLER = 'flooring_installer',
    GENERAL_CONTRACTOR = 'general_contractor',
}

export enum SkillLevel {
    APPRENTICE = 'apprentice',
    JOURNEYMAN = 'journeyman',
    SPECIALIST = 'specialist',
    MASTER = 'master',
}

export enum ServiceAreaType {
    RADIUS = 'radius',
    CITY = 'city',
    ZIP = 'zip',
}

export enum ApplicationStatus {
    APPLIED = 'applied',
    VIEWED = 'viewed',
    SHORTLISTED = 'shortlisted',
    REJECTED = 'rejected',
    WITHDRAWN = 'withdrawn',
}

// Core entity interfaces
export interface TradesperonProfile {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;

    // Personal Information
    firstName: string;
    lastName: string;
    email: string;
    phone: string;

    // Professional Information
    experienceYears: number;
    bio?: string;

    // Status and Verification
    profileStatus: ProfileStatus;
    licenseVerificationStatus: VerificationStatus;
    isAvailable: boolean;

    // Relationships (populated when needed)
    tradeSpecialties?: TradeSpecialty[];
    licenses?: License[];
    serviceAreas?: ServiceArea[];
    jobApplications?: JobApplication[];
}

// Backward-compatible aliases (preferred future naming convention uses 'Tradesperson')
export type TradespersonProfile = TradesperonProfile;
export type PublicTradespersonProfile = PublicTradesperonProfile;
// Alias field name types for clarity in future refactor
export type TradespersonProfileRow = TradesperonProfileRow;

export interface TradeSpecialty {
    id: string;
    tradesperonId: string;
    createdAt: Date;

    // Trade Information
    tradeType: TradeType;
    skillLevel: SkillLevel;
    yearsOfExperience: number;
    specializations: string[];

    // Certification status
    isCertified: boolean;
    certificationBody?: string;
}

export interface License {
    id: string;
    tradesperonId: string;
    createdAt: Date;
    updatedAt: Date;

    // License Details
    licenseType: string;
    licenseNumber: string;
    issuingAuthority: string;
    issueDate: Date;
    expirationDate: Date;

    // File Storage
    documentUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;

    // Verification
    verificationStatus: VerificationStatus;
    verificationNotes?: string;
    verifiedAt?: Date;
    verifiedBy?: string;
}

export interface ServiceArea {
    id: string;
    tradesperonId: string;
    createdAt: Date;
    updatedAt: Date;

    // Area Definition
    areaType: ServiceAreaType;

    // For radius-based areas
    centerLatitude?: number;
    centerLongitude?: number;
    radiusMiles?: number;

    // For location-based areas
    city?: string;
    state?: string;
    zipCode?: string;

    // Display and search
    displayName: string;
    isActive: boolean;
}

export interface JobApplication {
    id: string;
    tradesperonId: string;
    jobId: string;
    createdAt: Date;
    updatedAt: Date;

    // Application Status
    status: ApplicationStatus;
    appliedAt: Date;

    // Communication
    coverMessage?: string;

    // Tracking
    viewedByEmployer: boolean;
    viewedAt?: Date;
    employerNotes?: string;
}

// API Request/Response types
export interface CreateProfileRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    experienceYears: number;
    bio?: string;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    phone?: string;
    experienceYears?: number;
    bio?: string;
    isAvailable?: boolean;
}

export interface CreateTradeSpecialtyRequest {
    tradeType: TradeType;
    skillLevel: SkillLevel;
    yearsOfExperience: number;
    specializations: string[];
    isCertified: boolean;
    certificationBody?: string;
}

export interface CreateLicenseRequest {
    licenseType: string;
    licenseNumber: string;
    issuingAuthority: string;
    issueDate: string; // ISO date string
    expirationDate: string; // ISO date string
    file: File; // For file upload
}

export interface CreateServiceAreaRequest {
    areaType: ServiceAreaType;
    centerLatitude?: number;
    centerLongitude?: number;
    radiusMiles?: number;
    city?: string;
    state?: string;
    zipCode?: string;
    displayName: string;
}

export interface SearchProfilesRequest {
    tradeTypes?: TradeType[];
    skillLevels?: SkillLevel[];
    location?: {
        latitude: number;
        longitude: number;
        radiusMiles: number;
    };
    city?: string;
    state?: string;
    zipCode?: string;
    isVerified?: boolean;
    page?: number;
    limit?: number;
}

export interface SearchProfilesResponse {
    profiles: PublicTradesperonProfile[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

// Public profile view (limited information for search results)
export interface PublicTradesperonProfile {
    id: string;
    firstName: string;
    lastName: string;
    experienceYears: number;
    bio?: string;
    profileStatus: ProfileStatus;
    licenseVerificationStatus: VerificationStatus;
    isAvailable: boolean;
    tradeSpecialties: TradeSpecialty[];
    serviceAreas: Pick<ServiceArea, 'displayName' | 'areaType'>[];
    // Note: Contact details, license documents, and sensitive info excluded
}

// Database row types (snake_case to match SQL)
export interface TradesperonProfileRow {
    id: string;
    user_id: string;
    created_at: Date;
    updated_at: Date;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    experience_years: number;
    bio?: string;
    profile_status: string;
    license_verification_status: string;
    is_available: boolean;
}

export interface TradeSpecialtyRow {
    id: string;
    tradesperson_id: string;
    created_at: Date;
    trade_type: string;
    skill_level: string;
    years_of_experience: number;
    specializations?: string; // JSON string
    is_certified: boolean;
    certification_body?: string;
}

export interface LicenseRow {
    id: string;
    tradesperson_id: string;
    created_at: Date;
    updated_at: Date;
    license_type: string;
    license_number: string;
    issuing_authority: string;
    issue_date: Date;
    expiration_date: Date;
    document_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    verification_status: string;
    verification_notes?: string;
    verified_at?: Date;
    verified_by?: string;
}

export interface ServiceAreaRow {
    id: string;
    tradesperson_id: string;
    created_at: Date;
    updated_at: Date;
    area_type: string;
    center_latitude?: number;
    center_longitude?: number;
    radius_miles?: number;
    city?: string;
    state?: string;
    zip_code?: string;
    display_name: string;
    is_active: boolean;
}

export interface JobApplicationRow {
    id: string;
    tradesperson_id: string;
    job_id: string;
    created_at: Date;
    updated_at: Date;
    status: string;
    applied_at: Date;
    cover_message?: string;
    viewed_by_employer: boolean;
    viewed_at?: Date;
    employer_notes?: string;
}

// Utility types for data transformation
export type DbRowToEntity<T> = T extends TradesperonProfileRow
    ? TradesperonProfile
    : T extends TradeSpecialtyRow
    ? TradeSpecialty
    : T extends LicenseRow
    ? License
    : T extends ServiceAreaRow
    ? ServiceArea
    : T extends JobApplicationRow
    ? JobApplication
    : never;

// Error types
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface ValidationError extends ApiError {
    code: 'VALIDATION_ERROR';
    field: string;
    value: unknown;
}

export interface NotFoundError extends ApiError {
    code: 'NOT_FOUND';
    resource: string;
    id: string;
}

export interface UnauthorizedError extends ApiError {
    code: 'UNAUTHORIZED';
}

export interface ForbiddenError extends ApiError {
    code: 'FORBIDDEN';
    resource: string;
    action: string;
}

// Response wrapper types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}