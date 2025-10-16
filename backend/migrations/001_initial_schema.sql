-- Initial Schema Migration for Tradesperson Profile Management
-- Date: 2025-10-10
-- Description: Creates the core tables for profiles, trades, licenses, service areas, and job applications

-- Enable spatial data support
-- Azure SQL has spatial data support built-in

-- Create Tradesperson Profiles table
CREATE TABLE tradesperson_profiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id NVARCHAR(255) NOT NULL UNIQUE, -- Azure AD B2C user ID
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Personal Information
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(20) NOT NULL,
    
    -- Professional Information
    experience_years INT NOT NULL CHECK (experience_years >= 0 AND experience_years <= 50),
    bio NVARCHAR(1000) NULL,
    
    -- Status and Verification
    profile_status NVARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (profile_status IN ('draft', 'complete', 'suspended')),
    license_verification_status NVARCHAR(20) NOT NULL DEFAULT 'not_submitted' CHECK (license_verification_status IN ('pending', 'verified', 'rejected', 'not_submitted')),
    is_available BIT NOT NULL DEFAULT 1,
    
    -- Audit fields
    INDEX idx_tradesperson_email (email),
    INDEX idx_tradesperson_status (profile_status, license_verification_status),
    INDEX idx_tradesperson_user_id (user_id)
);

-- Create Trade Specialties table
CREATE TABLE trade_specialties (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tradesperson_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Trade Information
    trade_type NVARCHAR(50) NOT NULL CHECK (trade_type IN (
        'electrician', 'plumber', 'carpenter', 'welder', 'hvac_technician',
        'mason', 'roofer', 'painter', 'flooring_installer', 'general_contractor'
    )),
    skill_level NVARCHAR(20) NOT NULL CHECK (skill_level IN ('apprentice', 'journeyman', 'specialist', 'master')),
    years_of_experience INT NOT NULL CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
    specializations NVARCHAR(MAX) NULL, -- JSON array of specializations
    
    -- Certification status
    is_certified BIT NOT NULL DEFAULT 0,
    certification_body NVARCHAR(255) NULL,
    
    FOREIGN KEY (tradesperson_id) REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
    INDEX idx_trade_specialty_type (trade_type, skill_level),
    INDEX idx_trade_specialty_tradesperson (tradesperson_id)
);

-- Create Licenses table
CREATE TABLE licenses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tradesperson_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- License Details
    license_type NVARCHAR(255) NOT NULL,
    license_number NVARCHAR(100) NOT NULL,
    issuing_authority NVARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    
    -- File Storage (Azure Blob Storage)
    document_url NVARCHAR(1000) NOT NULL,
    file_name NVARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type NVARCHAR(100) NOT NULL,
    
    -- Verification
    verification_status NVARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'not_submitted')),
    verification_notes NVARCHAR(1000) NULL,
    verified_at DATETIME2 NULL,
    verified_by NVARCHAR(255) NULL,
    
    FOREIGN KEY (tradesperson_id) REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
    INDEX idx_license_verification (verification_status, expiration_date),
    INDEX idx_license_tradesperson (tradesperson_id),
    CHECK (expiration_date > issue_date)
);

-- Create Service Areas table
CREATE TABLE service_areas (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tradesperson_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Area Definition
    area_type NVARCHAR(20) NOT NULL CHECK (area_type IN ('radius', 'city', 'zip')),
    
    -- For radius-based areas
    center_latitude DECIMAL(10, 8) NULL,
    center_longitude DECIMAL(11, 8) NULL,
    center_point GEOGRAPHY NULL, -- Computed column for spatial queries
    radius_miles INT NULL CHECK (radius_miles > 0 AND radius_miles <= 100),
    
    -- For location-based areas
    city NVARCHAR(100) NULL,
    state NVARCHAR(50) NULL,
    zip_code NVARCHAR(10) NULL,
    
    -- Display and search
    display_name NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    
    FOREIGN KEY (tradesperson_id) REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
    INDEX idx_service_area_city (city, state),
    INDEX idx_service_area_zip (zip_code),
    INDEX idx_service_area_tradesperson (tradesperson_id),
    CHECK (
        (area_type = 'radius' AND center_latitude IS NOT NULL AND center_longitude IS NOT NULL AND radius_miles IS NOT NULL) OR
        (area_type = 'city' AND city IS NOT NULL AND state IS NOT NULL) OR
        (area_type = 'zip' AND zip_code IS NOT NULL)
    )
);

-- Create spatial index for geographic queries
CREATE SPATIAL INDEX idx_service_area_location ON service_areas(center_point);

-- Create Job Applications table
CREATE TABLE job_applications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tradesperson_id UNIQUEIDENTIFIER NOT NULL,
    job_id UNIQUEIDENTIFIER NOT NULL, -- Future reference to jobs table
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Application Status
    status NVARCHAR(20) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'viewed', 'shortlisted', 'rejected', 'withdrawn')),
    applied_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    -- Communication
    cover_message NVARCHAR(2000) NULL,
    
    -- Tracking
    viewed_by_employer BIT NOT NULL DEFAULT 0,
    viewed_at DATETIME2 NULL,
    employer_notes NVARCHAR(1000) NULL,
    
    FOREIGN KEY (tradesperson_id) REFERENCES tradesperson_profiles(id) ON DELETE CASCADE,
    INDEX idx_job_application_status (status, created_at),
    INDEX idx_job_application_tradesperson (tradesperson_id),
    INDEX idx_job_application_job (job_id)
);

-- Create triggers for updated_at timestamps
CREATE TRIGGER tr_tradesperson_profiles_updated 
ON tradesperson_profiles 
AFTER UPDATE 
AS
BEGIN
    UPDATE tradesperson_profiles 
    SET updated_at = GETUTCDATE() 
    WHERE id IN (SELECT id FROM inserted);
END;

CREATE TRIGGER tr_licenses_updated 
ON licenses 
AFTER UPDATE 
AS
BEGIN
    UPDATE licenses 
    SET updated_at = GETUTCDATE() 
    WHERE id IN (SELECT id FROM inserted);
END;

CREATE TRIGGER tr_service_areas_updated 
ON service_areas 
AFTER UPDATE 
AS
BEGIN
    UPDATE service_areas 
    SET updated_at = GETUTCDATE() 
    WHERE id IN (SELECT id FROM inserted);
END;

CREATE TRIGGER tr_job_applications_updated 
ON job_applications 
AFTER UPDATE 
AS
BEGIN
    UPDATE job_applications 
    SET updated_at = GETUTCDATE() 
    WHERE id IN (SELECT id FROM inserted);
END;

-- Create trigger to compute geography point for radius-based service areas
CREATE TRIGGER tr_service_areas_geography 
ON service_areas 
AFTER INSERT, UPDATE 
AS
BEGIN
    UPDATE service_areas 
    SET center_point = geography::Point(center_latitude, center_longitude, 4326)
    WHERE id IN (SELECT id FROM inserted) 
    AND area_type = 'radius' 
    AND center_latitude IS NOT NULL 
    AND center_longitude IS NOT NULL;
END;

-- Insert some reference data for trade types (could be moved to separate reference tables)
-- This is handled in the application layer through enums for now

-- Create a view for profile completeness checking
CREATE VIEW vw_profile_completeness AS
SELECT 
    tp.id,
    tp.user_id,
    tp.profile_status,
    CASE 
        WHEN tp.first_name IS NOT NULL 
         AND tp.last_name IS NOT NULL 
         AND tp.email IS NOT NULL 
         AND tp.phone IS NOT NULL
         AND EXISTS (SELECT 1 FROM trade_specialties ts WHERE ts.tradesperson_id = tp.id)
         AND EXISTS (SELECT 1 FROM service_areas sa WHERE sa.tradesperson_id = tp.id AND sa.is_active = 1)
         AND EXISTS (SELECT 1 FROM licenses l WHERE l.tradesperson_id = tp.id AND l.verification_status = 'verified')
        THEN 1 
        ELSE 0 
    END as is_complete
FROM tradesperson_profiles tp;

PRINT 'Initial schema created successfully';