# V30.69.8 deep record refresh stabilization — staging candidate

Built from V30.69.7 supplied archive. Diagnosed competing Pink Salt route restoration and startup detail restoration racing with asynchronous view list rendering. Changes are restricted to client-side routing.

- Persistent detail restore awaits module load before opening the record, rather than relying exclusively on fixed timers.
- Pink Salt duplicate automatic restorer after loadView and on fixed timer disabled; central persistent router is authoritative for refresh restoration.
- Pink Salt supplier/import details registered in the central detail-route writer (original handlers remain intact).
- Avoid recording a successful restoration if no supported handler is installed.
- Boot no longer schedules a generic field-state restore over the deep-link record.
- Updated JS cache versions.

Validation: node --check for three changed JavaScript files, and `node qa/qa_v3698_deep_restore.js` (5 mocked asynchronous lifecycle cases). This is **not** a full authenticated Chromium or Render test. Existing QA file `qa_v3696_system_routing.js` has hardcoded old version-string assertions and does not pass unchanged; the first fourteen assertions pass, final obsolete cache-version assertion fails. Do not merge to production without real authenticated deep-link refresh and browser Back/Forward tests.

No DB migration, server business workflow, finance posting or persistent disk changes.
