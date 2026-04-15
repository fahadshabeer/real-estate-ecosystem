# Backend Integration Architecture

This project uses repository abstractions on top of Firebase so the data layer can be migrated to Supabase later with minimal UI changes.

## Layers

- `lib/backend/types/*`: domain + environment types
- `lib/backend/ports/*`: repository interfaces (auth/company)
- `lib/backend/firebase/*`: Firebase implementations
- `lib/backend/factory.ts`: repository wiring (Firebase implementation)
- `hooks/use-*.ts`: TanStack Query state management + pagination

## Runtime configuration

Set in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firestore model (current)

- `companies` collection
  - `id` (`DEV-YYYY-####`/`BRK-YYYY-####`)
  - `type`
  - `name`, `email`, `phone`, `registrationNumber`
  - `status`, `searchableName`, `createdAt`, `updatedAt`
- `user_profiles` collection
  - `role`, `companyId`, `email`, timestamps
- `meta/company_counter_{type}` docs
  - sequence for deterministic IDs
- `meta/counter_*` docs
  - transaction-based counters for deterministic IDs (`DEV/BRK/AGR/REQ/PRP/MAP/AGT/NOT/LOG`)

## Firebase Storage model (current)

- bucket path: `company-logos/{namespace}/{timestamp}-{filename}`
- signup uploads logo through storage repository and stores resulting `logoUrl` in company record

## Pagination pattern

Uses cursor pagination:

- repository returns `{ items, nextCursor }`
- UI uses `useInfiniteQuery`
- UI calls `fetchNextPage()`

This maps cleanly to Supabase keyset pagination later.

## Supabase migration path

To migrate, add:

- `lib/backend/supabase/auth-repository.ts`
- `lib/backend/supabase/company-repository.ts`

No UI rewrite required if repository contracts remain unchanged.

## Firebase security and deploy artifacts

- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `firebase.json`

## Secure onboarding (Firebase mode)

- Signup uses `POST /api/onboarding/signup` (server-side, `firebase-admin`)
- API flow:
  - create Auth user
  - transactionally allocate deterministic company ID (`DEV/BRK-YYYY-####`)
  - write `companies` + `user_profiles`
  - rollback created auth user if Firestore transaction fails
- Firestore client rule for `companies.create` is disabled (`allow create: if false`) to avoid direct client onboarding writes.
- Company profile edits use `PATCH /api/company/profile` with Firebase ID token verification; `companies.update` is also disabled for direct clients.
- Agreement/property write workflows now also run via authenticated server APIs:
  - `POST /api/agreements`
  - `PATCH /api/agreements/respond`
  - `POST /api/contract-requests`
  - `PATCH /api/contract-requests/status`
  - `POST /api/properties`
  - `POST /api/properties/share`
- Agent/activity write workflows are server-routed as well:
  - `POST /api/agents`
  - `PATCH /api/agents/{agentId}`
  - `DELETE /api/agents/{agentId}`
  - `POST /api/activity/notifications`
  - `POST /api/activity/logs`
- Company write workflows are server-routed:
  - `POST /api/companies`
  - `PATCH /api/company/profile`
  - `PATCH /api/company/logo`
- Storage write workflow is server-routed:
  - `POST /api/storage/company-logo`
- Contract document workflow is server-routed:
  - `POST /api/contracts/pdf` (generate secure document metadata + links)
  - `GET /api/contracts/pdf/{documentId}/download` (download generated PDF bytes)
  - `GET /api/contracts/pdf/{documentId}/verify?token=...` (public token validation)
- Trusted write APIs emit audit records (`activity_logs`) with actor/action/details through shared server audit utility.
- Audit read workflow is server-routed:
  - `GET /api/audit-logs?role=&actorLabel=&limit=&cursor=&from=&to=`
- Statistics screens now consume audit logs with cursor pagination (`useInfiniteQuery` + `nextCursor`).
- Firestore direct client writes are disabled for:
  - `agreements.create/update`
  - `contract_requests.create/update`
  - `properties.create/update`
  - `agreement_properties.create`
  - `agents.create/update/delete`
  - `notifications.create`
  - `activity_logs.create`
  - `contract_documents.create/update/delete`
- Storage direct client logo writes are disabled in `storage.rules`.
- Required server env:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_STORAGE_BUCKET` (or fallback to `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`)

Deploy commands:

- `firebase deploy --only firestore:rules,firestore:indexes`
- `firebase deploy --only storage`

## Repositories currently integrated in UI

- auth (`signup/login/logout` bridge)
- companies (`portal/brokers` paginated)
- agreements + contract requests
- properties + agreement-property sharing
- agents CRUD
- notifications/activity logs read endpoints
- contract PDF generation/download (via repository abstraction)
