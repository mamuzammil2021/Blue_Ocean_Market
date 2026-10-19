# V30.69.28 — Direct deep-route hydration

Baseline: actual protected V30.69.27 supplier-account/Cash release. The Library source check found no newer protected source. The V30.69.26 baseline quoted in the request was historical and was not used as the development baseline.

## Root cause

The existing sole router restored the correct URL, but its `apply` lifecycle unconditionally awaited `loadView()` before opening a registered record. That rendered the module list/dashboard first. Profiles then initialized a default section before the router selected the requested section. Pink Salt supplier native and shared adapters repeated section loading. Accounting and Access Control depended on parent structural containers; creating those containers also fetched and rendered their default overview.

## Changes

- Extend existing route descriptors with direct destinations, structural prerequisites, initial-section arguments and section ownership. Preserve existing URL syntax and history ownership.
- Resolve authentication, access, business unit and full destination before rendering a registered record. Keep one destination loading surface during required dependency reads.
- Open records directly without rendering a module list. Accounting and Settings expose their existing structural shells without loading a default overview.
- Supply the requested section to Excavator supplier/buyer/Pakistan, employee and profile loaders. Pink Salt supplier section loading has one owner; customer panels start with the requested visibility state.
- Await required Excavator profile data before committing the initial record frame. Preserve cache/deduplication and native payment handlers.
- Preserve navigation AbortError signals and reject stale GET results. Retain the existing epoch/controller and serialized lifecycle; add no competing route listener or timer-based restorer.
- Reuse the existing authenticated shell across navigation. Local section updates retain the profile heading/content host.
- Reject invalid registered profile/settings sections explicitly. Preserve missing, denied and temporary-error URLs with appropriate states and Retry.
- Add bounded, opt-in development traces (`window.BOM_ROUTE_DEBUG=true` before startup); no trace is collected by default. Trace contains route/phase/timing only.

No server business logic, database schema, Chart of Accounts, bank snapshots, financial mutation handlers or payment policies changed. The existing single router and registry remain authoritative. Matching canonical legacy modules and the served runtime bundle were updated together.
