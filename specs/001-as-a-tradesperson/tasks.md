---
description: "Implementation tasks for tradesperson profile management feature"
---

# Tasks: Tradesperson Profile Management

**Input**: Design documents from `/specs/001-as-a-tradesperson/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/` (as defined in plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for web application

- [x] T001 Create project structure with `backend/` and `frontend/` directories per implementation plan
- [x] T002 [P] Initialize backend Node.js project with Fastify dependencies in `backend/package.json`
- [x] T003 [P] Initialize frontend Vue.js 3 project with TypeScript in `frontend/package.json`
- [x] T004 [P] Configure TypeScript strict mode for both backend (`backend/tsconfig.json`) and frontend (`frontend/tsconfig.json`)
- [x] T005 [P] Configure linting and formatting tools (ESLint, Prettier) in both projects
- [x] T006 [P] Setup Vitest configuration for frontend testing in `frontend/vitest.config.ts`
- [x] T007 [P] Setup Jest/Supertest configuration for backend testing in `backend/jest.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Setup Azure SQL Database schema and migrations framework in `backend/src/lib/database.ts`
- [x] T009 Create database migration for initial schema in `backend/migrations/001_initial_schema.sql`
- [x] T010 [P] Implement Azure AD B2C authentication framework in `backend/src/lib/auth.ts`
- [x] T011 [P] Setup Fastify server with middleware structure in `backend/src/app.ts`
- [x] T012 [P] Configure Azure Blob Storage client for file uploads in `backend/src/lib/storage.ts`
- [x] T013 Create base TypeScript interfaces from data model in `backend/src/types/index.ts`
- [x] T014 [P] Setup error handling and logging infrastructure in `backend/src/lib/errors.ts`
- [x] T015 [P] Configure environment configuration management in `backend/src/lib/config.ts`
- [x] T016 [P] Setup API client service for frontend in `frontend/src/services/api-client.ts`
- [x] T017 [P] Configure Vue router and authentication guards in `frontend/src/router/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Profile Creation (Priority: P1) 🎯 MVP

**Goal**: Tradespeople can create complete profiles with personal info, trade specialties, licenses, and service areas

**Independent Test**: Create tradesperson account, complete profile form, verify profile displays correctly in system

### Implementation for User Story 1

- [x] T018 [P] [US1] Create TradesperonProfile model in `backend/src/models/tradesperson.ts`
- [x] T019 [P] [US1] Create TradeSpecialty model in `backend/src/models/trade-specialty.ts`
- [ ] T020 [P] [US1] Create License model in `backend/src/models/license.ts`
- [ ] T021 [P] [US1] Create ServiceArea model in `backend/src/models/service-area.ts`
- [ ] T022 [US1] Implement ProfileService for CRUD operations in `backend/src/services/profile-service.ts`
- [ ] T023 [US1] Implement TradeSpecialtyService in `backend/src/services/trade-specialty-service.ts`
- [ ] T024 [US1] Implement LicenseService with file upload handling in `backend/src/services/license-service.ts`
- [ ] T025 [US1] Implement ServiceAreaService with geographic validation in `backend/src/services/service-area-service.ts`
- [ ] T026 [US1] Create profile routes (GET, POST, PUT) in `backend/src/api/routes/profiles.ts`
- [ ] T027 [US1] Create trade specialty routes in `backend/src/api/routes/trade-specialties.ts`
- [ ] T028 [US1] Create license upload routes with SAS token generation in `backend/src/api/routes/licenses.ts`
- [ ] T029 [US1] Create service area routes in `backend/src/api/routes/service-areas.ts`
- [ ] T030 [US1] Add request validation schemas in `backend/src/api/schemas/profile-schemas.ts`
- [ ] T031 [P] [US1] Create ProfileForm component in `frontend/src/components/profile/ProfileForm.vue`
- [ ] T032 [P] [US1] Create TradeSpecialtySelector component in `frontend/src/components/profile/TradeSpecialtySelector.vue`
- [ ] T033 [P] [US1] Create LicenseUpload component with file handling in `frontend/src/components/profile/LicenseUpload.vue`
- [ ] T034 [P] [US1] Create LocationPicker component in `frontend/src/components/common/LocationPicker.vue`
- [ ] T035 [P] [US1] Create FileUpload component for license documents in `frontend/src/components/common/FileUpload.vue`
- [ ] T036 [US1] Create ProfilePage view in `frontend/src/pages/ProfilePage.vue`
- [ ] T037 [US1] Implement profile service with API integration in `frontend/src/services/profile-service.ts`
- [ ] T038 [US1] Add TypeScript types for frontend in `frontend/src/types/profile.ts`
- [ ] T039 [US1] Add form validation and error handling to ProfileForm component

**Checkpoint**: At this point, User Story 1 should be fully functional - tradespeople can create and manage complete profiles

---

## Phase 4: User Story 2 - Profile Discoverability (Priority: P2)

**Goal**: Employers can search for and view tradesperson profiles based on trade type, location, and qualifications

**Independent Test**: Create employer account, search for tradespeople by trade and location, view profile details

### Implementation for User Story 2

- [ ] T040 [P] [US2] Create SearchService for profile discovery in `backend/src/services/search-service.ts`
- [ ] T041 [US2] Implement geographic search with Azure SQL spatial functions in SearchService
- [ ] T042 [US2] Create search routes with filtering in `backend/src/api/routes/search.ts`
- [ ] T043 [US2] Add search request validation schemas in `backend/src/api/schemas/search-schemas.ts`
- [ ] T044 [US2] Create public profile view route (hide contact details) in `backend/src/api/routes/public-profiles.ts`
- [ ] T045 [P] [US2] Create SearchForm component with filters in `frontend/src/components/search/SearchForm.vue`
- [ ] T046 [P] [US2] Create SearchResults component in `frontend/src/components/search/SearchResults.vue`
- [ ] T047 [P] [US2] Create ProfileCard component for search results in `frontend/src/components/profile/ProfileCard.vue`
- [ ] T048 [P] [US2] Create FilterPanel component for search refinement in `frontend/src/components/search/FilterPanel.vue`
- [ ] T049 [US2] Create SearchPage view in `frontend/src/pages/SearchPage.vue`
- [ ] T050 [US2] Create PublicProfileView component for viewing other profiles in `frontend/src/components/profile/PublicProfileView.vue`
- [ ] T051 [US2] Implement search service with API integration in `frontend/src/services/search-service.ts`
- [ ] T052 [US2] Add search result caching and pagination to SearchResults component
- [ ] T053 [US2] Add profile completeness scoring for search ranking in backend SearchService

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - full profile creation and discovery

---

## Phase 5: User Story 3 - Job Discovery (Priority: P3)

**Goal**: Tradespeople can view job postings that match their specialties and apply with their profile information

**Independent Test**: Create job postings, verify tradespeople can view relevant jobs and submit applications

### Implementation for User Story 3

- [ ] T054 [P] [US3] Create JobApplication model in `backend/src/models/job-application.ts`
- [ ] T055 [US3] Implement JobApplicationService in `backend/src/services/job-application-service.ts`
- [ ] T056 [US3] Create job application routes in `backend/src/api/routes/job-applications.ts`
- [ ] T057 [US3] Add notification service for application status updates in `backend/src/services/notification-service.ts`
- [ ] T058 [US3] Add application validation schemas in `backend/src/api/schemas/job-application-schemas.ts`
- [ ] T059 [P] [US3] Create JobCard component for displaying opportunities in `frontend/src/components/jobs/JobCard.vue`
- [ ] T060 [P] [US3] Create JobList component with filtering in `frontend/src/components/jobs/JobList.vue`
- [ ] T061 [P] [US3] Create ApplicationForm component in `frontend/src/components/jobs/ApplicationForm.vue`
- [ ] T062 [US3] Create JobsPage view in `frontend/src/pages/JobsPage.vue`
- [ ] T063 [US3] Implement job application service in `frontend/src/services/job-application-service.ts`
- [ ] T064 [US3] Add job matching algorithm based on trade specialties and service areas
- [ ] T065 [US3] Integrate email notifications for application status changes
- [ ] T066 [US3] Add application tracking to ProfilePage for tradespeople

**Checkpoint**: All user stories should now be independently functional - complete tradesperson platform

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T067 [P] Add comprehensive input validation across all forms
- [ ] T068 [P] Implement loading states and error boundaries in frontend components
- [ ] T069 [P] Add profile completion progress indicators
- [ ] T070 [P] Optimize database queries with proper indexing
- [ ] T071 [P] Implement API rate limiting and security headers
- [ ] T072 [P] Add comprehensive logging for all user actions
- [ ] T073 [P] Create admin interface for license verification in `frontend/src/pages/AdminPage.vue`
- [ ] T074 [P] Add mobile-responsive design to all components
- [ ] T075 [P] Implement Azure Application Insights monitoring
- [ ] T076 Run quickstart.md validation and documentation updates

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent but integrates with US1 profiles
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses profiles from US1 and may integrate with search from US2

### Within Each User Story

- Models before services (data layer first)
- Services before API routes (business logic before endpoints)
- Backend API before frontend components (API contract first)
- Core components before complex integrations
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models within a story marked [P] can run in parallel
- Frontend components marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create TradesperonProfile model in backend/src/models/tradesperson.ts"
Task: "Create TradeSpecialty model in backend/src/models/trade-specialty.ts"
Task: "Create License model in backend/src/models/license.ts"
Task: "Create ServiceArea model in backend/src/models/service-area.ts"

# Launch all frontend components for User Story 1 together (after backend API is ready):
Task: "Create ProfileForm component in frontend/src/components/profile/ProfileForm.vue"
Task: "Create TradeSpecialtySelector component in frontend/src/components/profile/TradeSpecialtySelector.vue"
Task: "Create LicenseUpload component in frontend/src/components/profile/LicenseUpload.vue"
Task: "Create LocationPicker component in frontend/src/components/common/LocationPicker.vue"
Task: "Create FileUpload component in frontend/src/components/common/FileUpload.vue"
```

---

## Implementation Strategy

### MVP Scope (Recommended First Release)

Implement **User Story 1 only** for MVP:

- Complete tradesperson profile creation
- File upload for licenses
- Profile management interface
- Basic admin verification workflow

This provides immediate value to tradespeople and establishes the foundation for employer features.

### Incremental Delivery

1. **Release 1**: User Story 1 (Profile Creation) - Core value for tradespeople
2. **Release 2**: User Story 2 (Profile Discoverability) - Employer search functionality
3. **Release 3**: User Story 3 (Job Discovery) - Complete platform with job applications

Each release delivers independent value and can be tested/validated separately.

---

## Total Task Summary

- **Total Tasks**: 76
- **Setup Tasks**: 7
- **Foundational Tasks**: 10
- **User Story 1 Tasks**: 22
- **User Story 2 Tasks**: 14
- **User Story 3 Tasks**: 13
- **Polish Tasks**: 10
- **Parallel Opportunities**: 45 tasks can run in parallel within their phases
- **Independent Stories**: All 3 user stories can be implemented and tested independently after foundational phase
