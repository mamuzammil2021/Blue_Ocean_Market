# V30.21 QA Checklist

- [x] Release/package/browser cache identity is V30.21.1.
- [x] V30.21 backend/browser overlays load after V30.20.
- [x] Stored attachment links use View first and expose Download Original.
- [x] Existing V30.19 preview actions use the V30.21 viewer.
- [x] International phone UI shows flag + country + dial code.
- [x] Country selection can drive phone country code.
- [x] Phone submission value uses international `+` format.
- [x] Email/phone validation is attached system-wide by field semantics.
- [x] Embedded purchase-token payment gets an exact compatible account selector.
- [x] Incoming/outgoing account direction is shown as Receive Into / Pay From.
- [x] Default receipt vs payment account selection is direction-aware.
- [x] Payment reference duplicate validation is account-scoped and normalized.
- [x] Same-account duplicate blocks; different-account match warns.
- [x] Existing V30.20 QA/regression requirements remain in the current suite.
