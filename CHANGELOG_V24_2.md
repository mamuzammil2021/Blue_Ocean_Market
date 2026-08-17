# Blue Ocean Market V24.2 — Excavator fixes

- Renamed **Buy Used Machine** to **Buy Machine**.
- Added required **Machine Name** field and persisted it in `excavator_assets` with automatic migration for existing databases.
- Machine search now includes machine name.
- Sold machines hide/disable Open Machine, Add Cost, Sell and Payments for all non-CEO users; backend also blocks cost/payment mutations after sale.
- CEO retains access to closed-machine actions and permanent delete.
- Added API no-cache headers so Excavator Operations and all business-unit dashboards always request fresh data.
- Preserved business-unit scoping through the existing `X-Business-Unit-ID` mechanism.
- Updated frontend cache version to 24.2 and package version to 24.2.0.
