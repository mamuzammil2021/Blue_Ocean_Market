# Blue Ocean Market V30.61.0 — Registry Foundation & Multi-BU Meetings

Built directly on the protected V30.60.0 source. This is an additive, compatibility-first foundation build; it does not rewrite Finance or Accounting workflows and does not reset or replace existing data.

## Implemented

- Added a shared platform registry foundation:
  - `platform_modules`
  - `platform_entities`
  - `platform_entity_capabilities`
  - `platform_related_records`
- Seeded current core modules/entities so existing Blue Ocean functionality can progressively migrate into common services rather than only registering future modules.
- Added registry discovery API and generic related-record API for authenticated system use.
- Added safe BU-scope junctions for Meetings and Tasks:
  - `meeting_business_units`
  - `task_business_units`
- Existing single-BU Meetings and Tasks are backfilled automatically into the junction tables. Existing `business_unit_id` remains intact as the compatibility/primary BU field.
- Meetings now support:
  - Single BU
  - Multi-BU
  - Company-wide (CEO / Owner)
  - Selected Users scope
- Meeting visibility and manager access now understand registered multi-BU scope while preserving attendee/organizer access.
- Meeting UI now allows selection of multiple authorized BUs and keeps attendee selection independent from meeting scope.
- Meeting cards/calendar/detail show combined BU scope where relevant.
- Meeting-created Tasks are registered into Task BU scope and related back to their source Meeting through generic related records.
- Normal newly-created Tasks are registered into the Task scope junction and can create generic related-record links when the target entity type is registered.
- Meeting save refreshes the Meetings workspace directly rather than forcing a complete `loadView()` remount.

## Compatibility / safety decisions

- No existing Finance/Accounting posting logic was moved or rewritten.
- No existing `business_unit_id` columns were removed or repurposed.
- Existing Meetings/Tasks are migrated with `INSERT OR IGNORE` only.
- Registry adoption is incremental: stable modules do not need to be rewritten merely to satisfy the new architecture.
- Company-wide meeting creation is intentionally restricted to CEO / Owner in this first build.
- Existing access assignments continue to determine which BUs a non-CEO user may include in a multi-BU meeting.

## Future development rule embodied by this build

When an existing area is safely touched in future work, prefer registration/reuse through the shared platform layer. If migration would materially increase risk to a stable workflow, preserve the old workflow and make the new implementation registry-compatible instead.
