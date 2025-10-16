declare const router: import("vue-router").Router;
export default router;
export declare const navigateToProfile: () => void;
export declare const navigateToSearch: (query?: Record<string, string>) => void;
export declare const navigateToPublicProfile: (profileId: string) => void;
export declare const navigateToLogin: (redirectUrl?: string) => void;
export declare const navigateToJobs: () => void;
export declare const ROUTE_NAMES: {
    readonly HOME: "home";
    readonly LOGIN: "login";
    readonly REGISTER: "register";
    readonly PROFILE: "profile";
    readonly SEARCH: "search";
    readonly JOBS: "jobs";
    readonly PUBLIC_PROFILE: "publicProfile";
    readonly NOT_FOUND: "notFound";
};
export type RouteName = (typeof ROUTE_NAMES)[keyof typeof ROUTE_NAMES];
