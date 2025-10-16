import type { AuthUser, AuthState } from '../types/api';
export declare const useAuthStore: import("pinia").StoreDefinition<"auth", Pick<{
    user: any;
    token: any;
    isLoading: any;
    lastError: any;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    authState: import("vue").ComputedRef<AuthState>;
    login: (email: string, password: string) => Promise<void>;
    loginWithAzureB2C: (azureToken: string) => Promise<void>;
    register: (userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updatedUser: Partial<AuthUser>) => void;
    clearAuth: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}, any>, Pick<{
    user: any;
    token: any;
    isLoading: any;
    lastError: any;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    authState: import("vue").ComputedRef<AuthState>;
    login: (email: string, password: string) => Promise<void>;
    loginWithAzureB2C: (azureToken: string) => Promise<void>;
    register: (userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updatedUser: Partial<AuthUser>) => void;
    clearAuth: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}, any>, Pick<{
    user: any;
    token: any;
    isLoading: any;
    lastError: any;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    authState: import("vue").ComputedRef<AuthState>;
    login: (email: string, password: string) => Promise<void>;
    loginWithAzureB2C: (azureToken: string) => Promise<void>;
    register: (userData: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    updateUser: (updatedUser: Partial<AuthUser>) => void;
    clearAuth: () => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}, any>>;
export type AuthStore = ReturnType<typeof useAuthStore>;
