🎯 Single Task: Implement Tenant Isolation via org_id + Membership Pivot
🧩 Objective

Establish a shared-schema multi-tenant system where:

All business data is scoped by org_id
User access is controlled via org_memberships
Backend enforces strict org-level isolation
🔧 Scope of Work
1. Create Core Tables
organizations
id
name
owner_id
created_at
org_memberships (pivot)
id
user_id
org_id
role
status
created_at
Add unique constraint:
UNIQUE(user_id, org_id)
2. Add org_id to ALL tenant tables

Apply to:

invoices
employees
products
projects
etc.
org_id NOT NULL
FOREIGN KEY (org_id) REFERENCES organizations(id)
Add index:
INDEX(org_id)
3. Enforce org context in backend (MANDATORY)
Middleware
Extract org_id from JWT
Attach to request context
Global Query Enforcement

Automatically apply:

WHERE org_id = :jwt_org_id

Implementation:

Laravel → Global Scope
Symfony → Doctrine Filter
Write Enforcement
On INSERT:
Always set org_id from JWT
Ignore any org_id from client
4. Org Switch Mechanism
Endpoint:
POST /auth/switch-org

Flow:

Validate user exists in org_memberships
Get role

Issue new JWT:

{
  "user_id": X,
  "org_id": Y,
  "role": "admin"
}
5. Security Validation (Critical)

Implement test:

Scenario:

User A (Org X)
Attempts to access Org Y data

Expected:

403 Forbidden
✅ Acceptance Criteria
 All tenant tables contain org_id
 org_memberships is the only source of user-org relation
 JWT contains org_id + role
 Backend enforces WHERE org_id automatically
 Client cannot override org_id
 Org switch re-issues JWT
 Cross-org access returns 403
⚠️ Non-Negotiable Constraints
❌ No separate tables per company
❌ No reliance on pivot table for data ownership
❌ No queries without org filter
❌ No org_id from request body
🧠 Outcome

After this one task is done, you will have:

Secure tenant isolation
Scalable architecture
Foundation for billing, roles, permissions, etc.