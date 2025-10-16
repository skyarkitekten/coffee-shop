// Test setup file for backend tests
import 'dotenv/config';

// Global test configuration
beforeAll(async () => {
    // Setup test database connection if needed
});

afterAll(async () => {
    // Cleanup test resources
});

// Mock external services for testing
jest.mock('@azure/storage-blob');
jest.mock('@azure/identity');