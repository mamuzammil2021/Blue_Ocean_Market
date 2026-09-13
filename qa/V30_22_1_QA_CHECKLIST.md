# Blue Ocean Market V30.22.1 QA Checklist

## Release regression blockers

- [ ] Supplier phone shows only phone validation; Email shows only email validation.
- [ ] Buyer phone shows only phone validation; Email shows only email validation.
- [ ] Login, Forgot Password and Reset Password do not call authenticated business-contact validation.
- [ ] Save/submit error, warning and success messages remain visible above modal/confirm/processing overlays.
- [ ] `100000` is accepted in payment/price/cost/value fields; decimals such as `100000.50` remain optional.
- [ ] True count fields remain integer-compatible.
- [ ] Single-file receipt/evidence fields display `1 file only` and accept one file.
- [ ] Multi-file fields display their contextual/system maximum and enforce the same limit server-side.
- [ ] Upload PDF/JPG/PNG/DOCX/XLSX; stored/downloaded bytes match the originals.
- [ ] Stored attachment preview uses MIME metadata; unsupported formats show Download Original fallback.
- [ ] Download Original restores the original filename and extension.
- [ ] Review & Confirm appears once, then saves once with duplicate-submit protection.
- [ ] Modal X appears top-right where a close control is used; Cancel/Back actions return to the correct state.
- [ ] Exact Pay From / Receive Into account and payment-reference integrity remain functional.
- [ ] Finance → Posting Control → Accounting regression path remains intact.

## Security / persistence

- [ ] `/uploads/...` is not publicly readable.
- [ ] Attachment View/Download requires authenticated BU/module permission.
- [ ] Audit history remains preserved.
- [ ] Refresh/logout/login does not lose saved operational/financial data.
