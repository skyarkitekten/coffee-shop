import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
// Lazy load components for better performance
const HomePage = () => import('../pages/HomePage.vue');
const ProfilePage = () => import('../pages/ProfilePage.vue');
const SearchPage = () => import('../pages/SearchPage.vue');
const JobsPage = () => import('../pages/JobsPage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const RegisterPage = () => import('../pages/RegisterPage.vue');
const NotFoundPage = () => import('../pages/NotFoundPage.vue');
// Define routes
const routes = [
    {
        path: '/',
        name: 'home',
        component: HomePage,
        meta: {
            title: 'Coffee Shop - Connect with Skilled Tradespeople',
            requiresAuth: false,
        },
    },
    {
        path: '/login',
        name: 'login',
        component: LoginPage,
        meta: {
            title: 'Login - Coffee Shop',
            requiresAuth: false,
            hideForAuthenticated: true,
        },
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterPage,
        meta: {
            title: 'Register - Coffee Shop',
            requiresAuth: false,
            hideForAuthenticated: true,
        },
    },
    {
        path: '/profile',
        name: 'profile',
        component: ProfilePage,
        meta: {
            title: 'My Profile - Coffee Shop',
            requiresAuth: true,
        },
    },
    {
        path: '/search',
        name: 'search',
        component: SearchPage,
        meta: {
            title: 'Find Tradespeople - Coffee Shop',
            requiresAuth: false,
        },
    },
    {
        path: '/jobs',
        name: 'jobs',
        component: JobsPage,
        meta: {
            title: 'Job Opportunities - Coffee Shop',
            requiresAuth: true,
        },
    },
    {
        path: '/profile/:id',
        name: 'publicProfile',
        component: () => import('../pages/PublicProfilePage.vue'),
        props: true,
        meta: {
            title: 'Tradesperson Profile - Coffee Shop',
            requiresAuth: false,
        },
    },
    // Catch-all route for 404
    {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: NotFoundPage,
        meta: {
            title: '404 - Page Not Found',
            requiresAuth: false,
        },
    },
];
// Create router instance
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // Scroll to saved position if available (browser back/forward)
        if (savedPosition) {
            return savedPosition;
        }
        // Scroll to anchor if hash is provided
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',
            };
        }
        // Scroll to top for new routes
        return { top: 0 };
    },
});
// Navigation guards
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    // Update document title
    if (to.meta.title) {
        document.title = to.meta.title;
    }
    // Check if route requires authentication
    if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
            // Redirect to login page with return URL
            next({
                name: 'login',
                query: { redirect: to.fullPath },
            });
            return;
        }
    }
    // Hide certain pages for authenticated users (like login/register)
    if (to.meta.hideForAuthenticated && authStore.isAuthenticated) {
        next({ name: 'profile' });
        return;
    }
    // Continue with navigation
    next();
});
// Global error handling for router
router.onError((error) => {
    console.error('Router error:', error);
    // In production, you might want to send this to an error tracking service
});
export default router;
// Helper functions for programmatic navigation
export const navigateToProfile = () => {
    router.push({ name: 'profile' });
};
export const navigateToSearch = (query) => {
    router.push({ name: 'search', query });
};
export const navigateToPublicProfile = (profileId) => {
    router.push({ name: 'publicProfile', params: { id: profileId } });
};
export const navigateToLogin = (redirectUrl) => {
    const query = redirectUrl ? { redirect: redirectUrl } : {};
    router.push({ name: 'login', query });
};
export const navigateToJobs = () => {
    router.push({ name: 'jobs' });
};
// Route name constants for type safety
export const ROUTE_NAMES = {
    HOME: 'home',
    LOGIN: 'login',
    REGISTER: 'register',
    PROFILE: 'profile',
    SEARCH: 'search',
    JOBS: 'jobs',
    PUBLIC_PROFILE: 'publicProfile',
    NOT_FOUND: 'notFound',
};
