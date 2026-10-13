# Routing architecture

public/route-registry.js declares supported views, record kinds, open handlers, section handlers and business-unit families. public/v3693-persistent-routing.js is the sole active URL restoration controller. It is loaded after application components. Existing historical scripts remain for compatibility, but their independent active routing owners were retired or delegated.

Restoration hydrates current server permissions, checks explicit business-unit access, awaits lazy module initialization, opens the requested record, then restores its section. A serialized transition and abort signal prevent obsolete reads from overwriting newer navigation. Server authorization remains authoritative. Missing or forbidden destinations retain their URL with an explicit error; transient failure offers Retry.

Add future read routes through BOMRoutes.register using the existing entries as examples. Return promises from asynchronous open and section handlers. Preserve trusted native handlers before wrapping them; do not install independent hash listeners, restoration timers or session-only route owners. Root workspaces use the shared controller. Safe state uses BOMRouter.state.

URLs may contain registered navigation state only: IDs, sections, unit IDs, enums, dates, sort and pagination. Credentials and payment input must never enter URLs. Private free-text search and unsaved financial form values are deliberately not serialized.

Review/payment mutation modals retain existing Review & Confirm and protected processing behavior. Restoration never automatically submits a mutation. Registered temporary read/editor destinations can reopen their surface; unsaved values are not recovered. Cancel does not save. Dirty-form protection uses the existing confirmation surface. All history/dirty-form combinations still require the manual acceptance listed in QA_COVERAGE.md.

Approval-history projection is read-only. Trusted platform entity metadata selects sources; unregistered or independently unscoped source records are omitted until a reviewed adapter exists. Record permissions, sensitive Payroll restrictions, Finance access and credential redaction apply. No posting policy or financial mutation engine is changed by this projection.

