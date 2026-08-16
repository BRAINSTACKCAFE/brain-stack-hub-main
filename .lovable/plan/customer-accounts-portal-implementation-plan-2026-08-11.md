# Customer Accounts + Portal — Implementation Plan

## Goal
Move BRAIN STACK CAFE from a public brochure site to a working customer platform: signed-in users can submit real service requests, upload documents, track progress, and manage shop orders.

## Phase Scope
- Email + password authentication (with password reset).
- `profiles` table linked to each account.
- Protected customer portal routes under `/_authenticated/`.
- Service request engine that stores submissions in the database.
- Document uploads for requests (NIN photos, certificates, etc.).
- Customer dashboard: view requests, statuses, messages, and receipts.
- Public `/track` page still works for guests using a reference number.
- Shop order flow for computer accessories (save order, then hand off to WhatsApp/payment later).

## Out of Scope for This Phase
- Admin dashboard (next phase).
- Payment processing and Paystack integration (dedicated phase after admin).
- Real-time chat / notifications.

## Database Schema

### 1. `public.profiles`
Stores user-facing profile data. Auto-created on signup via trigger.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, references auth.users(id) on delete cascade |
| email | text | Denormalized for quick display |
| full_name | text | |
| phone | text | |
| address | text | Delivery/residence address |
| state | text | |
| lga | text | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: users read/update only their own row.

### 2. `public.service_requests`
One row per customer submission.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | references auth.users(id), nullable for guest submissions |
| reference | text | unique, e.g. BSC-NIN-123456 |
| service_slug | text | links to catalog service |
| service_name | text | snapshot at creation |
| status | text | pending / in_review / processing / completed / cancelled |
| amount | integer | amount in kobo, nullable |
| form_data | jsonb | the submitted form answers |
| notes | text | internal/customer visible notes |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: users read their own requests; admins read all (admin role check via has_role).

### 3. `public.request_documents`
Files attached to a request.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| request_id | uuid | references service_requests(id) on delete cascade |
| label | text | e.g. "Client photograph" |
| storage_path | text | Storage bucket path |
| created_at | timestamptz | default now() |

RLS: owner of parent request can read; admins read all.

### 4. `public.shop_orders`
Orders for computer accessories.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | references auth.users(id) |
| status | text | pending / confirmed / shipped / delivered / cancelled |
| delivery_method | text | pickup / waybill |
| delivery_address | text | |
| total_amount | integer | kobo |
| notes | text | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### 5. `public.shop_order_items`
Line items for each order.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| order_id | uuid | references shop_orders(id) on delete cascade |
| product_slug | text | |
| product_name | text | snapshot |
| quantity | integer | |
| unit_price | integer | kobo |

### 6. `public.user_roles`
For future admin/moderator access.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | references auth.users(id) on delete cascade |
| role | app_role enum | admin / moderator / user |

Includes `has_role` security definer function and RLS policies.

## Auth Flow
- `/auth` — public route with sign-in / sign-up tabs and password reset link.
- `/reset-password` — public route for setting a new password from email link.
- `/_authenticated/dashboard` — customer home after login.
- `/_authenticated/requests` — list of service requests.
- `/_authenticated/requests/$id` — request detail + document upload.
- `/_authenticated/orders` — shop orders.
- `/_authenticated/profile` — edit profile.
- Header updates to show account menu when signed in.

## Service Request Submission
- Existing public service pages keep their forms.
- When signed in, submitting a form creates a real `service_requests` row instead of only WhatsApp handoff.
- Reference number format preserved: `BSC-<SERVICE>-XXXXXX`.
- After submission, redirect to dashboard with a success toast and option to continue on WhatsApp for payment/inquiry.
- Guest users still get the WhatsApp handoff path.

## Document Uploads
- Use Lovable Cloud Storage bucket `request-documents`.
- Upload widget in request detail and during submission.
- Files stored under `request-documents/{request_id}/{file_name}`.
- Public read only via signed URLs / RLS; customer sees only their own documents.

## Public Tracking
- `/track` accepts a reference number.
- Looks up the request and shows status + latest update without requiring login.
- If the request belongs to a signed-in user, show full detail link.

## Shop Orders
- `/shop` product grid remains public.
- Signed-in users can "Create order" which saves a `shop_orders` row + items.
- Order confirmation page offers WhatsApp handoff and notes payment will be added later.

## UI/UX
- Reuse the existing "Ink & Signal" design system.
- Dashboard uses a clean sidebar or top tabs (responsive).
- Empty states guide users to services or shop.
- Toasts for all major actions.

## Implementation Steps
1. Run migration for profiles, service_requests, request_documents, shop_orders, shop_order_items, user_roles, and triggers.
2. Configure auth (email confirmation enabled by default; no auto-confirm unless requested).
3. Create `src/hooks/use-auth.ts` and auth context wired to Supabase `onAuthStateChange`.
4. Build `/auth` and `/reset-password` routes.
5. Create `_authenticated/route.tsx` and portal pages (dashboard, requests, orders, profile).
6. Add server functions for CRUD operations with RLS-safe patterns.
7. Integrate document upload into service request flow.
8. Update header with session-aware account menu.
9. Update public service forms to save real requests when signed in.
10. Verify with Playwright: sign up, submit request, upload document, track reference, view dashboard.

## Security Notes
- All server functions validate input with Zod.
- RLS policies enforce row-level ownership.
- Admin reads use `has_role` security definer function, not broad policies.
- No service_role bypass for ordinary customer reads.
