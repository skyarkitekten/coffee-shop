import { LicenseService } from '../src/services/license-service.js';

// Basic structural smoke test – ensures service exports expected methods

describe('LicenseService smoke', () => {
    it('should expose expected static methods', () => {
        const methods = [
            'getByTradesperonId',
            'getById',
            'uploadLicense',
            'delete',
            'updateVerificationStatus',
            'getPendingVerifications',
            'isExpired',
            'isExpiringSoon',
            'getExpiringSoonForTradesperson'
        ];

        for (const m of methods) {
            expect(typeof (LicenseService as any)[m]).toBe('function');
        }
    });
});
