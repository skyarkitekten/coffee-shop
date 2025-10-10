# Feature Specification: Tradesperson Profile Management

**Feature Branch**: `001-as-a-tradesperson`  
**Created**: October 10, 2025  
**Status**: Draft  
**Input**: User description: "As a Tradesperson (Seeker): I want to create a profile with my skills, trade(s), and license info. I want to be discoverable by employers looking for tradespeople. I want to see jobs posted in my area that match my trade"

## Clarifications

### Session 2025-10-10

- Q: How should license verification be handled? → A: Manual review by admin staff with approve/reject workflow
- Q: How should tradesperson service areas be specified? → A: Both radius and specific locations for flexibility
- Q: What are the minimum required fields for a complete tradesperson profile? → A: Name, trade type, experience, contact info, license, and service area
- Q: What tradesperson profile information should be visible to employers? → A: All profile info except personal contact details until connection
- Q: How should tradespeople receive updates about their job applications? → A: Email notifications only for status changes

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Profile Creation (Priority: P1)

A tradesperson signs up and creates a complete profile with their professional information, making them immediately available for discovery by employers.

**Why this priority**: This is the foundation that enables all other functionality. Without profiles, there are no tradespeople for employers to find, making the entire platform unusable.

**Independent Test**: Can be fully tested by creating a tradesperson account, completing the profile form, and verifying the profile displays correctly in search results.

**Acceptance Scenarios**:

1. **Given** a new tradesperson visits the platform, **When** they complete the signup and profile creation process, **Then** their profile becomes searchable by employers
2. **Given** a tradesperson is filling out their profile, **When** they upload license information, **Then** the system stores and displays license verification status
3. **Given** a tradesperson sets their service radius, **When** employers search for tradespeople in that area, **Then** the tradesperson appears in location-based search results

---

### User Story 2 - Profile Discoverability (Priority: P2)

Employers can find and view tradesperson profiles through search and browsing functionality, with profiles displaying key qualification information.

**Why this priority**: Profile discoverability is what creates value for tradespeople - if employers can't find them, the platform fails its core purpose.

**Independent Test**: Can be tested by creating employer and tradesperson accounts, then verifying employers can search for and view tradesperson profiles based on trade type and location.

**Acceptance Scenarios**:

1. **Given** an employer searches for a specific trade type, **When** they view search results, **Then** they see relevant tradesperson profiles with key qualifications visible
2. **Given** an employer views a tradesperson profile, **When** they review the profile details, **Then** they can see trade specialties, experience level, license status, and contact information
3. **Given** multiple tradespeople in the same area, **When** an employer searches, **Then** results are ordered by relevance and profile completeness

---

### User Story 3 - Job Discovery (Priority: P3)

Tradespeople can view and apply to job postings that match their trade specialties and service area.

**Why this priority**: While important for tradesperson value, this depends on having job postings from employers and can be implemented after core profile functionality.

**Independent Test**: Can be tested by creating job postings and verifying tradespeople can view and apply to relevant opportunities.

**Acceptance Scenarios**:

1. **Given** a tradesperson logs into their account, **When** they view available jobs, **Then** they see postings that match their trade types and service radius
2. **Given** a tradesperson finds a relevant job posting, **When** they apply, **Then** their profile information is sent to the employer
3. **Given** a tradesperson has applied to jobs, **When** they check their application status, **Then** they can see which jobs they've applied to

---

### Edge Cases

- What happens when a tradesperson uploads invalid or expired license documentation?
- How does the system handle tradespeople who work in multiple trade specialties?
- What occurs when a tradesperson changes their service radius or availability?
- How does the system manage profiles for tradespeople who become inactive or don't complete their profiles?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow tradespeople to create accounts using email or phone number
- **FR-002**: System MUST collect and store tradesperson profile information including trade type, experience years, and service area (radius in miles from home address and/or specific cities/zip codes)
- **FR-003**: System MUST support license/certification upload and manual verification by admin staff with approve/reject workflow
- **FR-004**: Tradespeople MUST be able to set and update their availability preferences
- **FR-005**: System MUST make completed profiles discoverable to employers through search functionality
- **FR-006**: System MUST display tradesperson profiles with all information visible to employers except personal contact details (phone/email) until connection is made
- **FR-007**: Tradespeople MUST be able to view job postings that match their trade specialties
- **FR-008**: System MUST enable tradespeople to apply to job postings by sending their profile to employers
- **FR-009**: System MUST track profile completion status and encourage full profile completion (complete profile requires: name, trade type, experience years, contact information, license/certification, and service area)
- **FR-010**: System MUST support location-based matching between tradespeople service areas and job locations
- **FR-011**: System MUST provide admin interface for reviewing uploaded licenses and marking them as verified, rejected, or pending review
- **FR-012**: System MUST reveal tradesperson contact information to employers only after job application or mutual connection is established
- **FR-013**: System MUST send email notifications to tradespeople when their job application status changes (applied, viewed, accepted, rejected)

### Key Entities

- **Tradesperson Profile**: Core entity representing a skilled tradesperson including personal info, trade specialties, experience level, license/certification status, service radius, availability, and contact information
- **Trade Specialty**: Categorization of skilled trades (electrician, plumber, welder, etc.) with associated skill levels and certifications
- **License/Certification**: Documentation of professional credentials including type, issuing authority, expiration date, and verification status
- **Service Area**: Geographic coverage defined by either radius in miles from home address, specific cities/zip codes, or combination of both where a tradesperson is willing to work
- **Job Application**: Connection between a tradesperson and a job posting, tracking application status and communication

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Tradespeople can complete full profile creation in under 10 minutes including license upload
- **SC-002**: 80% of tradesperson signups complete their full profile within 24 hours of registration
- **SC-003**: Employers can find relevant tradespeople profiles within 3 search attempts for any common trade
- **SC-004**: 90% of tradesperson profiles appear in appropriate employer search results based on trade type and location matching
- **SC-005**: Tradespeople can successfully apply to job postings with their profile sent to employers within 1 minute of clicking apply
