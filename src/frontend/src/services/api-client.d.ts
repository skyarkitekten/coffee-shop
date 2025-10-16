import type { TradesperonProfile, CreateProfileRequest, UpdateProfileRequest, SearchProfilesRequest, SearchProfilesResponse, PublicTradesperonProfile, CreateTradeSpecialtyRequest, CreateLicenseRequest, CreateServiceAreaRequest, JobApplication } from '../types/api';
export declare class ApiClient {
    private client;
    private authToken;
    constructor(baseURL?: string);
    private setupInterceptors;
    setAuthToken(token: string): void;
    clearAuth(): void;
    getAuthToken(): string | null;
    get<T>(url: string): Promise<T>;
    post<T>(url: string, data?: unknown): Promise<T>;
    put<T>(url: string, data?: unknown): Promise<T>;
    delete<T>(url: string): Promise<T>;
    getMyProfile(): Promise<TradesperonProfile>;
    createProfile(data: CreateProfileRequest): Promise<TradesperonProfile>;
    updateProfile(data: UpdateProfileRequest): Promise<TradesperonProfile>;
    getPublicProfile(profileId: string): Promise<PublicTradesperonProfile>;
    addTradeSpecialty(data: CreateTradeSpecialtyRequest): Promise<void>;
    removeTradeSpecialty(specialtyId: string): Promise<void>;
    uploadLicense(data: CreateLicenseRequest): Promise<void>;
    removeLicense(licenseId: string): Promise<void>;
    addServiceArea(data: CreateServiceAreaRequest): Promise<void>;
    removeServiceArea(areaId: string): Promise<void>;
    searchProfiles(params: SearchProfilesRequest): Promise<SearchProfilesResponse>;
    getMyApplications(): Promise<JobApplication[]>;
    applyToJob(jobId: string, coverMessage?: string): Promise<void>;
    withdrawApplication(applicationId: string): Promise<void>;
    checkHealth(): Promise<{
        status: string;
        timestamp: string;
    }>;
}
export declare const apiClient: ApiClient;
export default ApiClient;
