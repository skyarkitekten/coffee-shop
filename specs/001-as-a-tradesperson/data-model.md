# Data Model: Tradesperson Profile Management

**Date**: October 10, 2025  
**Purpose**: Define the core entities, relationships, and data structures for the tradesperson profile management system.

## Core Entities

### Tradesperson Profile

The primary entity representing a skilled tradesperson on the platform.

```typescript
interface TradesperonProfile {
  id: string; // UUID primary key
  userId: string; // External user ID from Azure AD B2C
  createdAt: Date;
  updatedAt: Date;

  // Personal Information
  firstName: string; // Required, 2-50 characters
  lastName: string; // Required, 2-50 characters
  email: string; // Required, unique, validated format
  phone: string; // Required, E.164 format

  // Professional Information
  experienceYears: number; // Required, 0-50 years
  bio?: string; // Optional, max 1000 characters

  // Status and Verification
  profileStatus: ProfileStatus; // draft | complete | suspended
  licenseVerificationStatus: VerificationStatus;
  isAvailable: boolean; // Available for new jobs

  // Relationships
  tradeSpecialties: TradeSpecialty[];
  licenses: License[];
  serviceAreas: ServiceArea[];
  jobApplications: JobApplication[];
}

enum ProfileStatus {
  DRAFT = "draft", // Profile not complete
  COMPLETE = "complete", // All required fields filled
  SUSPENDED = "suspended", // Admin suspended account
}

enum VerificationStatus {
  PENDING = "pending", // Awaiting verification
  VERIFIED = "verified", // Admin approved
  REJECTED = "rejected", // Admin rejected
  NOT_SUBMITTED = "not_submitted",
}
```

### Trade Specialty

Categorizes the specific trades and skills a tradesperson offers.

```typescript
interface TradeSpecialty {
  id: string;
  tradesperonId: string; // Foreign key to TradesperonProfile
  createdAt: Date;

  // Trade Information
  tradeType: TradeType; // Primary trade category
  skillLevel: SkillLevel; // Experience level in this trade
  yearsOfExperience: number; // Years in this specific trade
  specializations: string[]; // Specific areas within the trade

  // Certification status for this trade
  isCertified: boolean;
  certificationBody?: string;
}

enum TradeType {
  ELECTRICIAN = "electrician",
  PLUMBER = "plumber",
  CARPENTER = "carpenter",
  WELDER = "welder",
  HVAC_TECHNICIAN = "hvac_technician",
  MASON = "mason",
  ROOFER = "roofer",
  PAINTER = "painter",
  FLOORING_INSTALLER = "flooring_installer",
  GENERAL_CONTRACTOR = "general_contractor",
}

enum SkillLevel {
  APPRENTICE = "apprentice", // 0-2 years experience
  JOURNEYMAN = "journeyman", // 2-5 years experience
  SPECIALIST = "specialist", // 5-10 years experience
  MASTER = "master", // 10+ years experience
}
```

### License

Represents professional licenses and certifications uploaded by tradespeople.

```typescript
interface License {
  id: string;
  tradesperonId: string; // Foreign key to TradesperonProfile
  createdAt: Date;
  updatedAt: Date;

  // License Details
  licenseType: string; // e.g., "Master Electrician", "Plumbing License"
  licenseNumber: string; // Official license number
  issuingAuthority: string; // State board, certification body, etc.
  issueDate: Date;
  expirationDate: Date;

  // File Storage
  documentUrl: string; // Azure Blob Storage URL
  fileName: string; // Original uploaded filename
  fileSize: number; // File size in bytes
  mimeType: string; // File MIME type

  // Verification
  verificationStatus: VerificationStatus;
  verificationNotes?: string; // Admin notes on verification
  verifiedAt?: Date;
  verifiedBy?: string; // Admin user ID
}
```

### Service Area

Defines the geographic regions where a tradesperson is willing to work.

```typescript
interface ServiceArea {
  id: string;
  tradesperonId: string; // Foreign key to TradesperonProfile
  createdAt: Date;
  updatedAt: Date;

  // Area Definition
  areaType: ServiceAreaType;

  // For radius-based areas
  centerLatitude?: number; // Required for RADIUS type
  centerLongitude?: number; // Required for RADIUS type
  radiusMiles?: number; // Required for RADIUS type, max 100

  // For location-based areas
  city?: string; // Required for CITY type
  state?: string; // Required for CITY type
  zipCode?: string; // Required for ZIP type

  // Display and search
  displayName: string; // Human-readable description
  isActive: boolean; // Can be temporarily disabled
}

enum ServiceAreaType {
  RADIUS = "radius", // Radius from home address
  CITY = "city", // Specific city
  ZIP = "zip", // Specific ZIP code
}
```

### Job Application

Tracks when tradespeople apply to job postings.

```typescript
interface JobApplication {
  id: string;
  tradesperonId: string; // Foreign key to TradesperonProfile
  jobId: string; // Foreign key to Job posting (future entity)
  createdAt: Date;
  updatedAt: Date;

  // Application Status
  status: ApplicationStatus;
  appliedAt: Date;

  // Communication
  coverMessage?: string; // Optional message to employer

  // Tracking
  viewedByEmployer: boolean;
  viewedAt?: Date;
  employerNotes?: string; // Employer feedback (private)
}

enum ApplicationStatus {
  APPLIED = "applied", // Application submitted
  VIEWED = "viewed", // Employer viewed application
  SHORTLISTED = "shortlisted", // Employer interested
  REJECTED = "rejected", // Employer not interested
  WITHDRAWN = "withdrawn", // Tradesperson withdrew
}
```

## Relationships

### One-to-Many Relationships

- `TradesperonProfile` → `TradeSpecialty` (1:N)
- `TradesperonProfile` → `License` (1:N)
- `TradesperonProfile` → `ServiceArea` (1:N)
- `TradesperonProfile` → `JobApplication` (1:N)

### Constraints and Business Rules

#### Profile Completion Requirements

A profile is considered "complete" when all of the following are present:

- Personal information: firstName, lastName, email, phone
- At least one trade specialty with experience years
- At least one service area
- At least one verified license

#### Validation Rules

- **Email**: Must be unique across all profiles, valid format
- **Phone**: Must be E.164 format (+1234567890)
- **Experience Years**: 0-50 years, must be logical with birth date
- **Service Area Radius**: Maximum 100 miles
- **License Expiration**: Cannot be in the past for active profiles
- **File Uploads**: Max 10MB per file, PDF/JPG/PNG only

#### Geographic Indexing

- Service areas with lat/lng coordinates indexed for spatial queries
- City and ZIP code fields indexed for text-based searches
- Support for distance calculations using Azure SQL spatial functions

## Database Schema Considerations

### Indexing Strategy

```sql
-- Primary indexes
CREATE UNIQUE INDEX idx_tradesperson_email ON tradesperson_profiles(email);
CREATE INDEX idx_tradesperson_status ON tradesperson_profiles(profile_status, license_verification_status);

-- Trade specialty indexes
CREATE INDEX idx_trade_specialty_type ON trade_specialties(trade_type, skill_level);
CREATE INDEX idx_trade_specialty_tradesperson ON trade_specialties(tradesperson_id);

-- Service area spatial indexes
CREATE SPATIAL INDEX idx_service_area_location ON service_areas(center_point);
CREATE INDEX idx_service_area_city ON service_areas(city, state);

-- License verification indexes
CREATE INDEX idx_license_verification ON licenses(verification_status, expiration_date);

-- Application tracking indexes
CREATE INDEX idx_job_application_status ON job_applications(status, created_at);
```

### Data Migration Strategy

- Profile data migrated from existing systems via CSV import
- License documents uploaded through admin interface initially
- Geographic data validated against Azure Maps API
- Verification status set to 'pending' for imported licenses

### Archival and Retention

- Inactive profiles archived after 2 years of no activity
- License documents retained for 7 years for compliance
- Job applications archived after 1 year
- Personal data deletion support for GDPR compliance

## API Integration Points

### External Services

- **Azure AD B2C**: User authentication and basic profile data
- **Azure Blob Storage**: License document storage with CDN
- **Azure Maps**: Address validation and geocoding
- **SendGrid**: Email notifications for status changes

### Data Synchronization

- Profile changes trigger cache invalidation
- License verification updates sent via webhooks
- Search index updated on profile changes
- Email notifications queued for async processing

## Performance Considerations

### Read Optimization

- Materialized views for common search queries
- Redis caching for frequently accessed profiles
- CDN for license document downloads
- Database connection pooling for high concurrency

### Write Optimization

- Batch operations for bulk profile updates
- Async processing for file uploads and verification
- Database transactions for profile completion
- Optimistic locking for concurrent updates

This data model provides a comprehensive foundation for the tradesperson profile management system while maintaining flexibility for future enhancements and compliance with platform requirements.
