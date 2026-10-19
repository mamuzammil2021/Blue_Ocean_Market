# Existing data review and controlled repair

No production records have been inspected or changed. The screenshot identifiers and amounts do not provide the actual stored bank evidence or full transaction snapshot. Never use the illustrative rate of 1,000 as a production repair rate without evidence.

1. Take a consistent SQLite backup and a separate upload backup. Use the SQLite backup API or a stopped service; copying a live main file without its WAL may omit financial activity.
2. Work on a COPY. Run:

```bash
node scripts/audit-pink-valuations.js \
  --database /absolute/path/to/isolated-copy.sqlite \
  --output /absolute/path/to/pink-valuation-review.json
```

This opens the copy read-only and writes a report; it performs zero repairs. The authorized Finance endpoint `/api/pink-salt/fx/valuation-review` likewise reports findings without changing financial records. Findings are review candidates, not permission to infer a new rate. Legacy/manual records outside the FX snapshot engine need their own source/evidence review; they are not automatically converted by this script.

3. For each candidate, verify exact company account/currency, native bank debit/credit, recipient settlement, original invoice/advance carrying basis, payment-date valuation evidence, fee policy, reference, evidence and posting history. An actual foreign-to-KRW rate of 1 is an explicit evidenced exception requiring policy approval, not a default.
4. For an unposted FX payment, the responsible Finance reviewer requests correction through the existing Finance workflow. Only its original user corrects/resubmits using confirmed values. Own reference/linked versions are excluded from duplicates. Reverification is mandatory. The old snapshot remains reversed history; the new current Finance/proposal values are derived from confirmed data. Cost operational identity stays stable.
5. For a posted cost, preserve the old journal and all original values. Follow original-user plus CEO/Admin Correct Posted Cost policy or the assigned Finance correction. Review/post the linked reversal first, reverify the replacement and then review/final-post it. The server blocks out-of-order posting. The upgrade test exercises actual posted .31 data through this path.
6. Reconcile invoice outstanding, supplier credit, active Finance direction/native balance, fee movements, KRW carrying values and the net GL effect. Non-cash advance allocations are not extra payments. Retain the report, evidence, reasons, revision and approval IDs with the accounting review.

Do not bulk rewrite rates, mark every verified payment ready, edit immutable snapshots through Finance, remove duplicate protection or delete historical rows. Do not repair unrelated legacy/manual payments using an inferred FX conversion. Review their specific source workflow and prepare a separately approved case before financial mutation. Closed periods, received-inventory valuation restrictions and Accounting policies remain enforced.
