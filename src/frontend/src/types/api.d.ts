export declare enum ProfileStatus {
    DRAFT = "draft",
    COMPLETE = "complete",
    SUSPENDED = "suspended"
}
export declare enum VerificationStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    REJECTED = "rejected",
    NOT_SUBMITTED = "not_submitted"
}
export declare enum TradeType {
    ELECTRICIAN = "electrician",
    PLUMBER = "plumber",
    CARPENTER = "carpenter",
    WELDER = "welder",
    HVAC_TECHNICIAN = "hvac_technician",
    MASON = "mason",
    ROOFER = "roofer",
    PAINTER = "painter",
    FLOORING_INSTALLER = "flooring_installer",
    GENERAL_CONTRACTOR = "general_contractor"
}
export declare enum SkillLevel {
    APPRENTICE = "apprentice",
    JOURNEYMAN = "journeyman",
    SPECIALIST = "specialist",
    MASTER = "master"
}
export declare enum ServiceAreaType {
    RADIUS = "radius",
    CITY = "city",
    ZIP = "zip"
}
export declare enum ApplicationStatus {
    APPLIED = "applied",
    VIEWED = "viewed",
    SHORTLISTED = "shortlisted",
    REJECTED = "rejected",
    WITHDRAWN = "withdrawn"
}
export interface TradesperonProfile {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    experienceYears: number;
    bio?: string;
    profileStatus: ProfileStatus;
    licenseVerificationStatus: VerificationStatus;
    isAvailable: boolean;
    tradeSpecialties?: TradeSpecialty[];
    licenses?: License[];
    serviceAreas?: ServiceArea[];
    jobApplications?: JobApplication[];
}
export interface TradeSpecialty {
    id: string;
    tradesperonId: string;
    createdAt: Date;
    tradeType: TradeType;
    skillLevel: SkillLevel;
    yearsOfExperience: number;
    specializations: string[];
    isCertified: boolean;
    certificationBody?: string;
}
export interface License {
    id: string;
    tradesperonId: string;
    createdAt: Date;
    updatedAt: Date;
    licenseType: string;
    licenseNumber: string;
    issuingAuthority: string;
    issueDate: Date;
    expirationDate: Date;
    documentUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
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
    areaType: ServiceAreaType;
    centerLatitude?: number;
    centerLongitude?: number;
    radiusMiles?: number;
    city?: string;
    state?: string;
    zipCode?: string;
    displayName: string;
    isActive: boolean;
}
export interface JobApplication {
    id: string;
    tradesperonId: string;
    jobId: string;
    createdAt: Date;
    updatedAt: Date;
    status: ApplicationStatus;
    appliedAt: Date;
    coverMessage?: string;
    viewedByEmployer: boolean;
    viewedAt?: Date;
    employerNotes?: string;
}
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
    issueDate: string;
    expirationDate: string;
    file: File;
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
}
export interface SearchProfilesResponse {
    profiles: PublicTradesperonProfile[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    timestamp: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
export interface UIState {
    loading: boolean;
    error: string | null;
}
export interface FormField {
    value: string | number | boolean;
    error: string | null;
    touched: boolean;
}
export interface FormState {
    [key: string]: FormField;
}
export interface RouteParams {
    [key: string]: string | undefined;
}
export interface RouteQuery {
    [key: string]: string | string[] | undefined;
}
export interface BaseComponentProps {
    class?: string;
    id?: string;
}
export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    azureId: string;
}
export interface FileUploadState {
    file: File | null;
    uploading: boolean;
    progress: number;
    error: string | null;
    success: boolean;
}
export interface SearchFilters {
    tradeTypes: string[];
    skillLevels: string[];
    location: {
        type: 'radius' | 'city' | 'zip';
        latitude?: number;
        longitude?: number;
        radiusMiles?: number;
        city?: string;
        state?: string;
        zipCode?: string;
    } | null;
    isVerified: boolean | null;
    sortBy: 'relevance' | 'experience' | 'distance';
    sortOrder: 'asc' | 'desc';
}
export interface ProfileCompletion {
    personalInfo: boolean;
    tradeSpecialties: boolean;
    serviceAreas: boolean;
    licenses: boolean;
    overallComplete: boolean;
    completionPercentage: number;
}
export interface NotificationMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    actions?: NotificationAction[];
}
export interface NotificationAction {
    label: string;
    action: () => void;
    style?: 'primary' | 'secondary';
}
export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}
export interface TableRow {
    id: string;
    [key: string]: unknown;
}
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}
export interface MapMarker {
    id: string;
    position: LocationCoordinates;
    title: string;
    description?: string;
    onClick?: () => void;
}
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: unknown) => string | null;
}
export interface ValidationSchema {
    [fieldName: string]: ValidationRule;
}
export interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}
export interface ModalOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'confirm' | 'alert' | 'prompt';
    onConfirm?: () => void;
    onCancel?: () => void;
}
export interface ThemeColors {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: string;
}
export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';
export interface ResponsiveValue<T> {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    wide?: T;
}
export interface ApiErrorDetails {
    field?: string;
    message: string;
    code?: string;
}
export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: ApiErrorDetails[];
        timestamp: string;
        path: string;
        method: string;
    };
}
export interface ComponentEvent<T = unknown> {
    type: string;
    data?: T;
    preventDefault?: () => void;
    stopPropagation?: () => void;
}
export interface PaginationState {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
}
export interface LoadingStates {
    [key: string]: boolean;
}
export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}
export interface CacheOptions {
    ttl?: number;
    key: string;
}
export interface FeatureFlags {
    [featureName: string]: boolean;
}
