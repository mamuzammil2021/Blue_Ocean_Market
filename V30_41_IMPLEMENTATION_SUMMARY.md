# V30.41.0 Implementation Summary

## Baseline
Built directly on the protected **V30.40.0** package, which itself carries the V30.39.2 runtime/data-path optimization baseline. No destructive reset is introduced.

## Access Control Center — System Settings
V30.41 moves shared access-structure design out of the normal Users list and into **System Settings → Security & Access → Access Control Center**.

The Access Control Center now separates:
- **Access Profiles** — reusable job/responsibility bundles with a clear description, multiple module/action permissions, sensitive/delegated permissions and limits.
- **Permission Groups** — reusable add-on bundles; each group can contain multiple related permissions.
- **Access Policies** — reusable runtime restriction sets; each policy can contain multiple rules and may be company-wide or BU-scoped.
- **Approval Levels** — L0–L5 configuration kept separate from feature permissions; L5 remains protected dual approval.
- **Access Audit** — shared-structure and user-access change history.
- **Security Defaults** — retained as a separate technical-security configuration view.

Authorized CEO / Owner and System Administrator users can create/edit/duplicate/archive the shared structures. Assigned-profile/group impact is displayed before sensitive changes, and archive is blocked where removal would orphan live assignments.

## Permission Groups
Permission Groups are now first-class configurable structures rather than assignment-only rows. A group can hold multiple permissions, including module/action, sensitive and delegated permissions. Group create/edit/duplicate/archive is audited and invalidates effective-access caches immediately.

## Access Policies
New additive `access_policy_sets` storage provides multi-rule policy sets. Supported rule concepts in V30.41 are:
- Deny Action
- Require Approval Level
- Require Permission
- Require Permission Group
- CEO / Owner Only

Policies can be company-wide or scoped to a Business Unit. Policy enforcement is applied after ordinary effective permission resolution, so a policy can restrict an allowed action but cannot create a permission the user does not otherwise have. CEO / Owner retains the protected bypass.

## Approval Levels
New additive `access_approval_levels` configuration defines L0–L5 names/descriptions/default payment, expense and approval limits. L5 is explicitly protected as dual approval and is not offered as an ordinary single-user level.

## Simple Users & Access workflow
The Users & Access screen is now focused on day-to-day administration instead of shared access design.

New-user creation supports, in one Review & Confirm workflow:
- user identity and separate **Job Title / Position**;
- one or more Business Units plus Primary BU;
- multiple Access Profiles;
- BU scope per profile assignment;
- one Primary Profile for legacy/default display context only;
- multiple optional Permission Groups with BU scope;
- separate Approval Authority and limits;
- Effective Access preview with permission-source visibility.

The existing detailed Access Management screen remains available for existing-user profile/group/authority management and rare **Advanced / Individual Exceptions**.

## Delegated administration & segregation of duties
- Delegated administrators remain restricted to their assigned BU scope.
- They cannot assign permissions, profile limits or approval authority above their own effective authority.
- Shared structure management remains protected.
- Existing Finance maker/checker and Accounting self-posting protections remain active even when a user has multiple profiles/groups.

## Migration compatibility
The V30.41 schema changes are additive:
- `users.job_title`
- `access_role_templates.description`
- `access_policy_sets`
- `access_approval_levels`

Existing V30.40 profile/group/user assignment tables remain intact. Existing users and their effective access are not reset or rewritten.

## Machine Cost Edit correction
The V30.40 Machine Cost UI regression is corrected at the individual row level. An unrelated locked cost no longer causes normal Edit to appear locked for every cost row. Finance Verified costs keep normal Edit locked; Accounting Posted records retain the existing controlled-correction protection.

## Browser/runtime delivery
The existing compatibility runtime and V30.40 layer are retained, with a final `v341-client.js` overlay loaded after them. Cache identity is advanced to `30.41.0`.
