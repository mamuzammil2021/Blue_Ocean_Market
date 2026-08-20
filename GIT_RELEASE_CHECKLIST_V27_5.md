# V27.5 Git / Live Test Checklist

1. Run `npm run qa:current`.
2. Start locally and verify `/api/health` reports `27.5.0`.
3. Test English default and Korean switch with CEO and a non-CEO user.
4. Test Finance Pending Review → Open Verification → Verify/Correction/Reject and confirm no DB action occurs when dialogs are cancelled.
5. Confirm no visible screen refresh occurs from waiting; refresh should follow explicit actions/navigation only.
6. Test desktop, tablet and mobile widths.
7. Commit to a test branch, push to GitHub, deploy the test branch on Render.
8. Do not rely on Render ephemeral SQLite/uploads for production data; use persistent storage before real use.
