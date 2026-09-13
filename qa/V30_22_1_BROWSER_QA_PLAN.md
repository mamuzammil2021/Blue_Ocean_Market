# V30.22.1 Browser Regression Plan

Run on localhost with an isolated test database.

1. **Public auth isolation:** Login, Forgot Password and Reset Password with syntactically valid and invalid emails. No `Authentication required` contact-validation error may appear before authentication.
2. **Supplier contact validation:** Add/Edit Supplier, select Pakistan +92, type `3001234567`, confirm only a phone success message appears. Enter an invalid email separately and confirm the error stays under Email.
3. **Buyer contact validation:** Repeat Supplier test in Add/Edit Buyer and embedded contact forms.
4. **Numeric freedom:** In payment/cost/advance/price/value fields enter `100000`, then `100000.50`. Both must pass HTML validation where decimals are logically allowed. Count fields must still reject fractional pieces/boxes/machines.
5. **Top feedback layer:** Trigger a blocked Save/Submit while a modal is open. The action message must render above the modal/confirm/processing layers and the first invalid field should be brought into view.
6. **Single-file helper:** Open Buyer Payment or another single receipt field. Helper must say `1 file only`; selecting one valid file must pass.
7. **Attachment integrity:** Upload representative PDF, JPG/PNG, DOCX and XLSX files. View stored files, then Download Original. Compare SHA-256 with the source files; they must match exactly.
8. **Preview fallback:** PDF/images preview in-app. Office/unsupported formats must display `Preview not available — Download Original`, not a broken viewer.
9. **Review once:** Save Add Buyer/Add Supplier/payment once. Review & Confirm must appear exactly once and one backend mutation should occur.
10. **Financial regression:** Test Pay From/Receive Into account filtering, duplicate payment reference behavior, Finance verification, Posting Control and final Accounting posting.
