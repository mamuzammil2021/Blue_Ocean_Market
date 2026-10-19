# Scope and remaining operational acceptance

Tests use isolated synthetic databases, real local servers and authenticated Chromium. Live Render deployment, actual bank transfers, production performance and external email delivery were not performed. No production storage was accessed.

“Enter once” means once for each genuinely distinct currency pair. USD/PKR and KRW reporting cannot be determined from one USD/PKR rate alone; a separate KRW rate remains necessary. Historical invoice recognition and approved independent carrying values are not replaced by a new payment rate.

One-leg conversion support, approved accounting-policy gates, confirmed-versus-estimated amounts, financial evidence, permissions and immutable correction/reversal controls remain in force. Separate evidenced bank-charge debits retain their own linked charge movement; advance allocation creates no new cash movement.

Historical API calls without the new shared-rate mode continue to support their explicit rates. New forms opt into shared-rate calculations. Archived release notes/test reports describe earlier sources; use qa/evidence/36930-release.json for tests rerun on this release.

The focused and regression suites cover the stated scenarios and representative permissions, not every possible production record, role combination or browser/device.
