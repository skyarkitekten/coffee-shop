# Quickstart Guide: Tradesperson Profile Management

**Date**: October 10, 2025  
**Purpose**: Developer quickstart guide for implementing and testing the tradesperson profile management feature.

## Prerequisites

- Node.js 18+ with npm
- Azure CLI installed and configured
- Azure subscription with resource group
- Git access to coffee-shop repository
- VS Code with recommended extensions

## Development Environment Setup

### 1. Repository Setup

```bash
# Clone and switch to feature branch
git clone https://github.com/skyarkitekten/coffee-shop.git
cd coffee-shop
git checkout 001-as-a-tradesperson

# Install dependencies
cd backend
npm install

cd ../frontend
npm install
```

### 2. Azure Resources

```bash
# Login to Azure
az login

# Create resource group (if not exists)
az group create --name rg-coffee-shop-dev --location eastus

# Create Azure SQL Database
az sql server create \
  --name coffee-shop-sql-dev \
  --resource-group rg-coffee-shop-dev \
  --location eastus \
  --admin-user coffeeadmin \
  --admin-password 'YourSecurePassword123!'

az sql db create \
  --resource-group rg-coffee-shop-dev \
  --server coffee-shop-sql-dev \
  --name coffee-shop-db

# Create storage account for file uploads
az storage account create \
  --name coffeeshopstoragedev \
  --resource-group rg-coffee-shop-dev \
  --location eastus \
  --sku Standard_LRS
```

### 3. Environment Configuration

Create `.env` files:

**backend/.env**
```env
# Database
DATABASE_URL=mssql://coffeeadmin:YourSecurePassword123!@coffee-shop-sql-dev.database.windows.net/coffee-shop-db

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=coffeeshopstoragedev
AZURE_STORAGE_ACCOUNT_KEY=your_storage_key_here

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
AZURE_AD_B2C_TENANT_ID=your-tenant-id
AZURE_AD_B2C_CLIENT_ID=your-client-id

# API Configuration
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000

# External Services
SENDGRID_API_KEY=your-sendgrid-api-key
AZURE_MAPS_KEY=your-azure-maps-key
```

**frontend/.env**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Authentication
VITE_AZURE_AD_B2C_TENANT_ID=your-tenant-id
VITE_AZURE_AD_B2C_CLIENT_ID=your-client-id
VITE_AZURE_AD_B2C_POLICY=B2C_1_signupsignin

# Feature Flags
VITE_ENABLE_LICENSE_VERIFICATION=true
VITE_ENABLE_JOB_DISCOVERY=true

# Development
VITE_NODE_ENV=development
```

## Quick Implementation Guide

### 1. Database Schema Setup

```bash
# Navigate to backend
cd backend

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 2. Backend API Implementation

Start with the core models:

**backend/src/models/tradesperson.ts**
```typescript
import { z } from 'zod';

export const CreateTradesperonProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+\d{10,15}$/),
  experienceYears: z.number().min(0).max(50),
  bio: z.string().max(1000).optional(),
});

export type CreateTradesperonProfileRequest = z.infer<typeof CreateTradesperonProfileSchema>;
```

**backend/src/api/routes/profiles.ts**
```typescript
import { FastifyPluginAsync } from 'fastify';
import { CreateTradesperonProfileSchema } from '../../models/tradesperson.js';

const profilesRoute: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/profiles
  fastify.post('/', {
    schema: {
      body: CreateTradesperonProfileSchema,
      response: {
        201: { $ref: 'TradesperonProfile#' }
      }
    }
  }, async (request, reply) => {
    // Implementation here
    const profile = await fastify.profileService.create(request.body);
    reply.code(201).send(profile);
  });
};

export default profilesRoute;
```

### 3. Frontend Component Development

Start with the profile form component:

**frontend/src/components/profile/ProfileForm.vue**
```vue
<template>
  <form @submit.prevent="handleSubmit" class="profile-form">
    <div class="form-group">
      <label for="firstName">First Name *</label>
      <input
        id="firstName"
        v-model="form.firstName"
        type="text"
        required
        maxlength="50"
      />
    </div>
    
    <div class="form-group">
      <label for="lastName">Last Name *</label>
      <input
        id="lastName"
        v-model="form.lastName"
        type="text"
        required
        maxlength="50"
      />
    </div>
    
    <!-- Add more form fields -->
    
    <button type="submit" :disabled="isSubmitting">
      {{ isSubmitting ? 'Creating...' : 'Create Profile' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { profileService } from '../../services/api-client';
import type { CreateTradesperonProfileRequest } from '../../types/profile';

const isSubmitting = ref(false);
const form = reactive<CreateTradesperonProfileRequest>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  experienceYears: 0,
});

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    await profileService.create(form);
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    isSubmitting.value = false;
  }
}
</script>
```

## Development Workflow

### 1. Start Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 - Database (if using local):
```bash
# Start local SQL Server (if not using Azure)
docker run -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=Dev123456!' \
  -p 1433:1433 --name sql-server \
  mcr.microsoft.com/mssql/server:2019-latest
```

### 2. Testing the Implementation

#### Unit Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

#### Integration Tests
```bash
# API contract tests
cd backend
npm run test:contract

# E2E tests
cd frontend
npm run test:e2e
```

#### Manual Testing Flow

1. **Profile Creation**
   - Navigate to `http://localhost:5173/profile/create`
   - Fill out profile form with valid data
   - Verify profile appears in database

2. **License Upload**
   - Upload a test license document (PDF/JPG)
   - Verify file appears in Azure Blob Storage
   - Check verification status in admin panel

3. **Profile Search**
   - Navigate to `http://localhost:5173/search`
   - Search by trade type and location
   - Verify results match search criteria

## API Testing

### Using curl

```bash
# Create profile
curl -X POST http://localhost:3000/api/v1/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+15551234567",
    "experienceYears": 10
  }'

# Search profiles
curl "http://localhost:3000/api/v1/search/profiles?tradeType=electrician&latitude=40.7128&longitude=-74.0060&radiusMiles=10"
```

### Using Postman

Import the OpenAPI specification from `contracts/openapi.yaml` into Postman for interactive API testing.

## Common Development Tasks

### Adding a New Trade Type

1. Update enum in `backend/src/models/trade-specialty.ts`
2. Update database enum constraint
3. Update frontend components with new option
4. Add validation tests

### Adding New API Endpoint

1. Define schema in OpenAPI specification
2. Add route handler in appropriate routes file
3. Implement service layer logic
4. Add comprehensive tests
5. Update frontend API client

### Database Schema Changes

1. Create migration file
2. Update TypeScript interfaces
3. Update API schemas and validation
4. Test migration on development environment

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify Azure SQL firewall rules allow your IP
- Check connection string format
- Ensure database exists and user has permissions

**File Upload Failures**
- Verify Azure Storage account keys
- Check CORS settings on storage account
- Ensure SAS token has correct permissions

**Authentication Issues**
- Verify Azure AD B2C configuration
- Check JWT token expiration
- Ensure correct tenant/client IDs in environment

### Debug Logging

Enable debug logging:
```bash
# Backend
DEBUG=coffee-shop:* npm run dev

# Frontend  
VITE_LOG_LEVEL=debug npm run dev
```

### Performance Monitoring

View performance metrics:
- Backend: `http://localhost:3000/metrics`
- Database: Azure SQL Database query performance insights
- Frontend: Browser dev tools performance tab

## Deployment

### Staging Deployment

```bash
# Build and deploy backend
cd backend
npm run build
az webapp deploy --resource-group rg-coffee-shop-staging --name coffee-shop-api-staging

# Build and deploy frontend
cd frontend
npm run build
az storage blob upload-batch --destination '$web' --source dist --account-name coffeeshopstoragestaging
```

### Production Deployment

Follow the blue-green deployment strategy defined in the constitution using Azure DevOps pipelines.

## Next Steps

1. Implement job discovery features (future sprint)
2. Add real-time notifications
3. Enhance search with machine learning
4. Add mobile application support
5. Implement analytics and reporting

For detailed implementation guidance, refer to:
- [Data Model Documentation](./data-model.md)
- [API Contract Specification](./contracts/openapi.yaml)
- [Research Documentation](./research.md)