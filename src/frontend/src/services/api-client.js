import axios, {} from 'axios';
export class ApiClient {
    client;
    authToken = null;
    constructor(baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1') {
        this.client = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor to add auth token
        this.client.interceptors.request.use((config) => {
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                this.clearAuth();
                // Redirect to login or emit auth error
                window.dispatchEvent(new CustomEvent('auth:token-expired'));
            }
            return Promise.reject(error);
        });
    }
    // Authentication methods
    setAuthToken(token) {
        this.authToken = token;
    }
    clearAuth() {
        this.authToken = null;
    }
    getAuthToken() {
        return this.authToken;
    }
    // Generic API methods
    async get(url) {
        const response = await this.client.get(url);
        return response.data.data;
    }
    async post(url, data) {
        const response = await this.client.post(url, data);
        return response.data.data;
    }
    async put(url, data) {
        const response = await this.client.put(url, data);
        return response.data.data;
    }
    async delete(url) {
        const response = await this.client.delete(url);
        return response.data.data;
    }
    // Profile API methods
    async getMyProfile() {
        return this.get('/profiles');
    }
    async createProfile(data) {
        return this.post('/profiles', data);
    }
    async updateProfile(data) {
        return this.put('/profiles', data);
    }
    async getPublicProfile(profileId) {
        return this.get(`/profiles/${profileId}`);
    }
    // Trade Specialty API methods
    async addTradeSpecialty(data) {
        return this.post('/profiles/trade-specialties', data);
    }
    async removeTradeSpecialty(specialtyId) {
        return this.delete(`/profiles/trade-specialties/${specialtyId}`);
    }
    // License API methods
    async uploadLicense(data) {
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
    async removeLicense(licenseId) {
        return this.delete(`/profiles/licenses/${licenseId}`);
    }
    // Service Area API methods
    async addServiceArea(data) {
        return this.post('/profiles/service-areas', data);
    }
    async removeServiceArea(areaId) {
        return this.delete(`/profiles/service-areas/${areaId}`);
    }
    // Search API methods
    async searchProfiles(params) {
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
        if (params.city)
            queryParams.append('city', params.city);
        if (params.state)
            queryParams.append('state', params.state);
        if (params.zipCode)
            queryParams.append('zipCode', params.zipCode);
        if (params.isVerified !== undefined)
            queryParams.append('isVerified', params.isVerified.toString());
        if (params.page)
            queryParams.append('page', params.page.toString());
        if (params.limit)
            queryParams.append('limit', params.limit.toString());
        return this.get(`/search/profiles?${queryParams.toString()}`);
    }
    // Job Application API methods (placeholder for future implementation)
    async getMyApplications() {
        return this.get('/jobs/applications');
    }
    async applyToJob(jobId, coverMessage) {
        return this.post('/jobs/applications', { jobId, coverMessage });
    }
    async withdrawApplication(applicationId) {
        return this.delete(`/jobs/applications/${applicationId}`);
    }
    // Health check
    async checkHealth() {
        const response = await this.client.get('/health');
        return response.data;
    }
}
// Create singleton instance
export const apiClient = new ApiClient();
// Export for testing or multiple instances
export default ApiClient;
