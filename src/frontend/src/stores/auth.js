import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '../services/api-client';
export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null);
    const token = ref(null);
    const isLoading = ref(false);
    const lastError = ref(null);
    // Getters
    const isAuthenticated = computed(() => !!token.value && !!user.value);
    const authState = computed(() => ({
        user: user.value,
        token: token.value,
        isAuthenticated: isAuthenticated.value,
        isLoading: isLoading.value,
    }));
    // Actions
    const setLoading = (loading) => {
        isLoading.value = loading;
    };
    const setError = (error) => {
        lastError.value = error;
    };
    const clearError = () => {
        lastError.value = null;
    };
    const setAuth = (authUser, authToken) => {
        user.value = authUser;
        token.value = authToken;
        // Set token in API client
        apiClient.setAuthToken(authToken);
        // Persist to localStorage
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        clearError();
    };
    const clearAuth = () => {
        user.value = null;
        token.value = null;
        // Clear token from API client
        apiClient.clearAuth();
        // Clear from localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        clearError();
    };
    const login = async (email, password) => {
        try {
            setLoading(true);
            clearError();
            // TODO: Implement actual login API call
            // For now, this is a placeholder
            const response = await apiClient.post('/auth/login', {
                email,
                password,
            });
            setAuth(response.user, response.token);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Login failed';
            setError(message);
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    const loginWithAzureB2C = async (azureToken) => {
        try {
            setLoading(true);
            clearError();
            // TODO: Implement Azure B2C login
            const response = await apiClient.post('/auth/azure', {
                token: azureToken,
            });
            setAuth(response.user, response.token);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Azure login failed';
            setError(message);
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    const register = async (userData) => {
        try {
            setLoading(true);
            clearError();
            // TODO: Implement actual registration API call
            const response = await apiClient.post('/auth/register', userData);
            setAuth(response.user, response.token);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';
            setError(message);
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    const logout = async () => {
        try {
            setLoading(true);
            // Call logout endpoint if available
            try {
                await apiClient.post('/auth/logout');
            }
            catch (error) {
                // Ignore logout API errors - clear local state anyway
                console.warn('Logout API call failed:', error);
            }
            clearAuth();
        }
        finally {
            setLoading(false);
        }
    };
    const refreshToken = async () => {
        try {
            if (!token.value) {
                throw new Error('No token to refresh');
            }
            setLoading(true);
            const response = await apiClient.post('/auth/refresh');
            setAuth(response.user, response.token);
        }
        catch (error) {
            // If refresh fails, clear auth state
            clearAuth();
            throw error;
        }
        finally {
            setLoading(false);
        }
    };
    const loadStoredAuth = () => {
        try {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user');
            if (storedToken && storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setAuth(parsedUser, storedToken);
            }
        }
        catch (error) {
            console.error('Failed to load stored auth:', error);
            clearAuth();
        }
    };
    const updateUser = (updatedUser) => {
        if (user.value) {
            user.value = { ...user.value, ...updatedUser };
            localStorage.setItem('auth_user', JSON.stringify(user.value));
        }
    };
    // Initialize auth state from localStorage on store creation
    loadStoredAuth();
    // Listen for token expiration events
    if (typeof window !== 'undefined') {
        window.addEventListener('auth:token-expired', () => {
            clearAuth();
        });
    }
    return {
        // State
        user: readonly(user),
        token: readonly(token),
        isLoading: readonly(isLoading),
        lastError: readonly(lastError),
        // Getters
        isAuthenticated,
        authState,
        // Actions
        login,
        loginWithAzureB2C,
        register,
        logout,
        refreshToken,
        updateUser,
        clearAuth,
        setError,
        clearError,
    };
});
