import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios';
import type {
    TradesperonProfile,
    CreateProfileRequest,
    UpdateProfileRequest,
    SearchProfilesRequest,
    SearchProfilesResponse,
    PublicTradesperonProfile,
    CreateTradeSpecialtyRequest,
    CreateLicenseRequest,
    CreateServiceAreaRequest,
    JobApplication,
    ApiResponse
} from '../types/api';

export class ApiClient {
    private client: AxiosInstance;
    private authToken: string | null = null;

    constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors(): void {
        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expired or invalid
                    this.clearAuth();
                    // Redirect to login or emit auth error
                    window.dispatchEvent(new CustomEvent('auth:token-expired'));
                }
                return Promise.reject(error);
            }
        );
    }

    // Authentication methods
    setAuthToken(token: string): void {
        this.authToken = token;
    }

    clearAuth(): void {
        this.authToken = null;
    }

    getAuthToken(): string | null {
        return this.authToken;
    }

    // Generic API methods
    async get<T>(url: string): Promise<T> {
        const response = await this.client.get<ApiResponse<T>>(url);
        return response.data.data!;
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.post<ApiResponse<T>>(url, data);
        return response.data.data!;
    }

    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.put<ApiResponse<T>>(url, data);
        return response.data.data!;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<ApiResponse<T>>(url);
        return response.data.data!;
    }

    // Profile API methods
    async getMyProfile(): Promise<TradesperonProfile> {
        return this.get<TradesperonProfile>('/profiles');
    }

    async createProfile(data: CreateProfileRequest): Promise<TradesperonProfile> {
        return this.post<TradesperonProfile>('/profiles', data);
    }

    async updateProfile(data: UpdateProfileRequest): Promise<TradesperonProfile> {
        return this.put<TradesperonProfile>('/profiles', data);
    }

    async getPublicProfile(profileId: string): Promise<PublicTradesperonProfile> {
        return this.get<PublicTradesperonProfile>(`/profiles/${profileId}`);
    }

    // Trade Specialty API methods
    async addTradeSpecialty(data: CreateTradeSpecialtyRequest): Promise<void> {
        return this.post<void>('/profiles/trade-specialties', data);
    }

    async removeTradeSpecialty(specialtyId: string): Promise<void> {
        return this.delete<void>(`/profiles/trade-specialties/${specialtyId}`);
    }

    // License API methods
    async uploadLicense(data: CreateLicenseRequest): Promise<void> {
        const formData = new FormData();
        formData.append('licenseType', data.licenseType);
        formData.append('licenseNumber', data.licenseNumber);
        formData.append('issuingAuthority', data.issuingAuthority);
        formData.append('issueDate', data.issueDate);
        formData.append('expirationDate', data.expirationDate);
        formData.append('file', data.file);

        await this.client.post('/profiles/licenses', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    async removeLicense(licenseId: string): Promise<void> {
        return this.delete<void>(`/profiles/licenses/${licenseId}`);
    }

    // Service Area API methods
    async addServiceArea(data: CreateServiceAreaRequest): Promise<void> {
        return this.post<void>('/profiles/service-areas', data);
    }

    async removeServiceArea(areaId: string): Promise<void> {
        return this.delete<void>(`/profiles/service-areas/${areaId}`);
    }

    // Search API methods
    async searchProfiles(params: SearchProfilesRequest): Promise<SearchProfilesResponse> {
        const queryParams = new URLSearchParams();

        if (params.tradeTypes?.length) {
            params.tradeTypes.forEach(type => queryParams.append('tradeTypes', type));
        }
        if (params.skillLevels?.length) {
            params.skillLevels.forEach(level => queryParams.append('skillLevels', level));
        }
        if (params.location) {
            queryParams.append('latitude', params.location.latitude.toString());
            queryParams.append('longitude', params.location.longitude.toString());
            queryParams.append('radiusMiles', params.location.radiusMiles.toString());
        }
        if (params.city) queryParams.append('city', params.city);
        if (params.state) queryParams.append('state', params.state);
        if (params.zipCode) queryParams.append('zipCode', params.zipCode);
        if (params.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        return this.get<SearchProfilesResponse>(`/search/profiles?${queryParams.toString()}`);
    }

    // Job Application API methods (placeholder for future implementation)
    async getMyApplications(): Promise<JobApplication[]> {
        return this.get<JobApplication[]>('/jobs/applications');
    }

    async applyToJob(jobId: string, coverMessage?: string): Promise<void> {
        return this.post<void>('/jobs/applications', { jobId, coverMessage });
    }

    async withdrawApplication(applicationId: string): Promise<void> {
        return this.delete<void>(`/jobs/applications/${applicationId}`);
    }

    // Health check
    async checkHealth(): Promise<{ status: string; timestamp: string }> {
        const response = await this.client.get('/health');
        return response.data;
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for testing or multiple instances
export default ApiClient;