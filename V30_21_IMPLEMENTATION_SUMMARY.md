# V30.21.1 Hotfix Note

This package includes a login-validation hotfix: the V30.21 system-wide contact validator no longer intercepts the unauthenticated Sign In form or call authenticated duplicate-check endpoints before login.

# Blue Ocean Market V30.21.1 — Implementation Summary

## Release focus
V30.21.1 improves financial traceability, stored-document usability and contact-data integrity while preserving the V30.20 direct-upload workflow.

## Implemented
- Added a system-wide stored-attachment viewer. Existing `/uploads/` links now open View first, with Open in New Tab and Download Original as explicit actions.
- Reused the same viewer for V30.19 preview buttons so Finance/Documents/evidence screens get one consistent post-upload experience.
- Added smart Pay From / Receive Into financial-account labels and receipt/payment default handling.
- Extended smart payment routing to embedded/prefixed payment methods such as Purchase Token payment sections.
- Added UI-first, account-scoped payment-reference duplicate validation with normalization and different-account warnings.
- Added a V30.21 backend validation API for payment references and generalized contact checks.
- Added international phone entry with country flag, country name and dial code. Country fields smart-select the phone country when available.
- Phone values are submitted in normalized international E.164-style form.
- Email/phone UI validation now attaches to contact fields throughout the UI instead of only standalone Supplier/Buyer forms.
- Preserved V30.20 attachment limits/direct upload, multiple financial accounts, GL mapping, account closing/archive, Finance and Accounting integration.

## Compatibility
- No destructive database reset.
- V30.20 financial-account schema and historical records remain intact.
- Upload-time compression/optimization/preview-before-store remains disabled.
