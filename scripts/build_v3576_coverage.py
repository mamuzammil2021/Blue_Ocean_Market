#!/usr/bin/env python3
"""Generate a conservative row-addressable review of the supplied draft workbook.

This reads the preserved workbook and existing collision/rule audits. It never
changes the workbook or activates any proposed posting account or rule.
"""
import csv
import json
from collections import Counter
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
spec = root / 'accounting_spec'
book = openpyxl.load_workbook(spec / 'Blue_Ocean_Accounting_Requirements_Draft_v2_Current_Project.xlsx', read_only=False, data_only=True)
coa = {r['draft_code']: r for r in csv.DictReader((spec / 'COA_COMPATIBILITY.csv').open())}
rules = {r['rule_id']: r for r in csv.DictReader((spec / 'POSTING_RULE_COVERAGE.csv').open())}
out = []

def review(sheet, row, cells):
    key = str(cells[0] or '').strip()
    label = str(cells[1] or '').strip()[:240]
    status, evidence, next_step = 'UNVERIFIED_END_TO_END', '', 'Trace operational source, eligibility, journal, reversal and GL fixture before activation.'
    if sheet in {'Overview', 'Change Log', 'Lists', 'Source Mapping'} or row <= (3 if sheet in {'Proposed COA', 'Auto Posting Rules'} else 2):
        status, next_step = 'REFERENCE_ONLY', 'Description/header; no posting activation implied.'
    elif sheet == 'Proposed COA' and key in coa:
        item = coa[key]
        status = 'REQUIRES_ACCOUNTANT_POLICY_SIGNOFF'
        evidence = 'accounting_spec/COA_COMPATIBILITY.csv; server/v290.js SYSTEM_ACCOUNTS'
        next_step = ('Occupied existing code: preserve live purpose and decide a compatible alternate.'
                     if item['code_collision'] == 'YES' else 'Draft-only code: approve account type, posting eligibility, dimensions and compatible code before activation.')
    elif sheet == 'Auto Posting Rules' and key in rules:
        evidence = 'accounting_spec/POSTING_RULE_COVERAGE.csv'
        if key == 'GL-002':
            status = 'NEW_SOURCE_FIXTURE_VERIFIED_PARTIAL'
            evidence += '; server/v357-realworld.js accrual proposal; qa/qa_v3572_real_sqlite.js'
            next_step = 'Accrual proposal tested; source invoice evidence and verified Finance settlement linkage remain.'
        elif key == 'GL-005':
            status = 'EXISTING_SOURCE_PARTIAL'
            evidence += '; server/v290.js inter-unit-transfers; server/v357-realworld.js elimination preview; qa/qa_v3576_interbu_elimination.js'
            next_step = 'Posted transfer pair checked; consolidation-only elimination and payroll counterpart mapping remain.'
        elif key == 'GL-006':
            status = 'EXISTING_SOURCE_PARTIAL'
            evidence += '; server/v290.js payroll runs/approve'
            next_step = 'Verify approved payroll source through Posting Control, deductions, settlement and BU allocation on live-shaped fixtures.'
        elif key.startswith(('EX-', 'PS-')):
            status = 'EXISTING_SOURCE_UNVERIFIED'
            evidence += '; server/v290.js journal mapping; server/server.js operational source'
            next_step = 'Draft account numbers conflict with existing code map; inspect actual source-specific posting and financial reversal with fixture.'
        else:
            status = 'REQUIRES_ACCOUNTANT_POLICY_SIGNOFF'
            next_step = 'Draft posting policy and account mapping not approved; do not auto-activate.'
    elif sheet == 'Review & Changes':
        status, evidence, next_step = 'REQUIRES_ACCOUNTANT_POLICY_SIGNOFF', 'Workbook Review & Changes', 'Resolve the requested policy decision before changing posting behavior.'
    elif sheet in {'Reports', 'Migration & Opening', 'Reconciliation & Close'}:
        status, evidence, next_step = 'DEFERRED_V30_58', 'V30_57_REMAINING_WORK.md; server/v290.js existing baseline where applicable', 'V30.58 scope; existing baseline does not establish full draft requirement coverage.'
    elif sheet == 'Inventory & Costing':
        status, evidence, next_step = 'REQUIRES_ACCOUNTANT_POLICY_SIGNOFF', 'server/v290.js inventory source mapping; workbook costing proposal', 'Approve capitalization/loss policy and reconcile machine, import and batch sources to posted GL fixture.'
    elif sheet == 'Controls & Corrections':
        status, evidence, next_step = 'EXISTING_SOURCE_UNVERIFIED', 'server/v290.js Posting Control; server/v354-finance-integrity.js', 'Verify this specific control through source-to-posted/reversed journal fixture and authenticated roles.'
    elif sheet == 'Dimensions & Subledgers':
        status, evidence, next_step = 'EXISTING_SOURCE_UNVERIFIED', 'server/v290.js accounting_journal_lines.dimension_json', 'Verify this dimension on each relevant source journal and reversal; prevent source-key omissions.'
    elif sheet == 'Supplier Account Model':
        status, evidence, next_step = 'EXISTING_SOURCE_UNVERIFIED', 'server/server.js Pink Salt operational supplier sources; server/v290.js', 'Reconcile unified supplier obligation/payment/allocation subledger against posted GL and prevent duplicate credit use.'
    return dict(sheet=sheet,row=row,identifier=key,requirement=label,status=status,code_evidence=evidence,remaining_or_decision=next_step)

for sheet in book:
    for row in sheet:
        values = [c.value for c in row]
        if not any(v is not None for v in values):
            continue
        out.append(review(sheet.title, row[0].row, values))

summary = dict(total_rows=len(out),status_counts=dict(Counter(x['status'] for x in out)),
               proposed_coa_rows=sum(x['sheet']=='Proposed COA' and x['identifier'] in coa for x in out),
               proposed_rule_rows=sum(x['sheet']=='Auto Posting Rules' and x['identifier'] in rules for x in out),
               occupied_code_conflicts=sum(x['sheet']=='Proposed COA' and x['identifier'] in coa and coa[x['identifier']]['code_collision']=='YES' for x in out),
               interpretation='A source/fixture label is not authenticated end-to-end or accountant policy approval.')
assert summary['proposed_coa_rows']==138 and summary['proposed_rule_rows']==61 and summary['occupied_code_conflicts']==30
(spec / 'V30_57_6_WORKBOOK_TO_CODE_MATRIX.json').write_text(json.dumps({'summary':summary,'rows':out},indent=2,ensure_ascii=False)+'\n')
print(json.dumps(summary))
