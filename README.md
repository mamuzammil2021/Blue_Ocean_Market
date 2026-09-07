# Blue Ocean Market V30.16.0 — Users & Access Control Local Test

V30.16.0 continues from V30.15.0 without an intentional database reset. This release adds a system-wide hybrid access-control architecture: role templates provide sensible defaults, while effective permissions, business-unit scope, action rights, sensitive rights, delegated administration and limits control what each user can actually see and do.

## Main changes

- Added a global **Users & Access** control surface with Effective Access visibility.
- CEO / Owner has global user-access administration across all business units.
- Business Unit Managers can create/manage users only inside assigned business units and cannot grant access above their own effective authority.
- Finance Head can create/manage Finance users and Finance-related access within authorized business-unit scope.
- Added **Finance Head** and **Finance User** role templates while retaining the existing Finance / Admin role for compatibility.
- Added multi-business-unit user assignment with a primary business unit and assigned-unit switching for non-CEO users who have more than one unit.
- Added granular module/tab and action permissions: View, Create, Edit, Delete, Void, Approve, Export, Print, Verify, Correct and Allocate.
- Added sensitive permissions for user management, approval rules, accounting adjustments, payroll, audit logs and system administration.
- Added delegated-administration permissions and configurable financial/sales limits.
- Added **Apply Role Template** and CEO-only **Copy Access From Another User** workflows.
- Added access-change audit history and immediate access revocation through live user/access resolution on every authenticated request.
- Frontend sidebar/tab visibility and backend route authorization now use the same effective-access model. Pink Salt navigation no longer bypasses permission visibility.
- Added UI action disabling for obvious restricted create/edit/delete/void/approve/verify/allocate/export/print controls; server authorization remains authoritative.
- Retained V30.15 Pink Salt supplier accounts, V30.14 Review & Confirm/processing safeguards, V30.13 receivables/pricing, V30.12 quantity integrity and V30.11 context integrity.

## Local test

1. Keep the existing `data/` and `uploads/` folders from your current working build if you want to continue with the same records.
2. Copy them into this V30.16 project folder before starting, if they are not already present.
3. Run `npm install` or `npm ci` when dependencies are not installed.
4. Run `npm run qa:current`.
5. Start with `npm start` or `START_LOCAL_MAC.command` on macOS.

The application performs additive schema migrations on startup. Keep your prior working ZIP until V30.16 has been validated against your real local test data.
