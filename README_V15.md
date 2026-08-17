# Blue Ocean Market V15

This build is a corrective rebuild after inspection of V14. It follows the recorded dashboard architecture, the supplied blueprint baseline, and the Excavator ground-reality workflow.

## Run
See INSTALL_MAC.txt. The project requires Node.js and the listed npm dependencies.

## Core rules
- CEO workspace toggle controls business-unit scope.
- Dashboard shows only the selected business-unit dashboard.
- All Business Units shows only the consolidated CEO dashboard.
- Every business unit has one dashboard.
- MIMI Restaurant Tables is separate from POS.
- Excavator machines are persistent long-running deals with separate stage transactions, pause/resume, multiple documents per stage, parts and KRW base currency.
