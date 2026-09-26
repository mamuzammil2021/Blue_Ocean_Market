#!/usr/bin/env python3
"""Conservative row-level evidence classification; never equate source inventory with acceptance."""
import collections
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = json.loads((root / 'accounting_spec/V30_57_6_WORKBOOK_TO_CODE_MATRIX.json').read_text())
rows = source['rows']
assert len(rows) == 499

for r in rows:
    old = r['status']
    r['code_reference'] = r.get('code_evidence', '')
    r['test_reference'] = ''
    r['blocking_reason'] = r.get('remaining_or_decision', '')
    r['decision_owner'] = 'Engineering' if old == 'REFERENCE_ONLY' else 'Accountant / Owner'
    r['next_action'] = 'Retain reference specification' if old == 'REFERENCE_ONLY' else 'Verify against isolated existing-data copy and obtain applicable approval'
    r['evidence_level'] = 'Reference only'
    r['policy_status'] = 'Not applicable'
    if old == 'REFERENCE_ONLY':
        r['implementation_status'] = 'Reference / header'
        r['blocking_reason'] = ''
    elif old == 'DEFERRED_V30_58':
        r.update(implementation_status='V30.58 scope', policy_status='Unassessed', evidence_level='Scope only', next_action='Plan in V30.58; do not activate in V30.57')
    elif old == 'REQUIRES_ACCOUNTANT_POLICY_SIGNOFF':
        r.update(implementation_status='Policy-dependent design / existing source where cited', policy_status='Awaiting accountant approval', evidence_level='Source inventory only')
    elif old == 'NEW_SOURCE_FIXTURE_VERIFIED_PARTIAL':
        r.update(implementation_status='Partial technical implementation', policy_status='Review required for posting treatment', evidence_level='Isolated fixture', test_reference='qa/qa_v3572_real_sqlite.js; qa/qa_v3577_inventory_review.js')
    else:
        r.update(implementation_status='Existing source; end-to-end unverified' if old == 'EXISTING_SOURCE_UNVERIFIED' else 'Partial existing source', policy_status='Review if posting policy applies', evidence_level='Source inspection only')

    name = (str(r.get('identifier', '')) + ' ' + str(r.get('requirement', ''))).lower()
    sheet = r['sheet']
    if sheet == 'Proposed COA' and r['row'] >= 4:
        r.update(code_reference='accounting_spec/V30_57_COA_COMPATIBILITY_PROPOSAL.json; server/v357-completion.js', test_reference='qa/qa_v357_consolidated_functional.js', policy_status='Mapping awaits accountant signoff; posting unchanged', evidence_level='Seed collision fixture; actual Render accounts unverified', next_action='Review runtime mapping against isolated Render copy and sign code/meaning decisions')
    elif sheet == 'Inventory & Costing' and r['row'] >= 4:
        r.update(code_reference='server/v357-inventory-review.js; server/v357-realworld.js; ' + r['code_reference'], test_reference='qa/qa_v3577_inventory_review.js', implementation_status='Source and posted-GL review fixture; costing treatment inactive where policy dependent', policy_status='Costing and eligibility await accountant approval', evidence_level='Isolated source/GL fixture', next_action='Approve cost policy; stage source-to-journal reconciliation with existing data')
    elif sheet == 'Controls & Corrections' and r['row'] in (4, 6, 9, 10, 18, 19, 21, 23, 27):
        r.update(code_reference='server/v357-payroll-link.js; server/v357-completion.js; server/v357-inventory-review.js; ' + r['code_reference'], test_reference='qa/qa_v357_consolidated_functional.js; qa/qa_v3577_inventory_review.js', implementation_status='Technical control fixture verified, legacy paths require staging review', evidence_level='Isolated fixture', policy_status='No new posting policy activated', next_action='Stage inherited and new paths with existing data and roles')
    elif sheet == 'Auto Posting Rules' and str(r.get('identifier', '')).startswith('GL-'):
        r.update(policy_status='Account mapping/posting treatment awaits accountant approval', next_action='Match existing system keys; approve rule before activating new posting')
    if sheet == 'Auto Posting Rules' and r.get('identifier') == 'GL-002':
        r.update(code_reference='server/v357-realworld.js; server/v357-payroll-link.js', test_reference='qa/qa_v3572_real_sqlite.js; qa/qa_v357_consolidated_functional.js', evidence_level='Isolated fixture', implementation_status='Partial technical settlement linkage verified', policy_status='Recognition mapping awaits approval')
    if sheet == 'Source Mapping' and any(t in name for t in ('payroll', 'supplier', 'fixed asset', 'inter-bu', 'tax')):
        r.update(code_reference='server/v357-completion.js; server/v357-payroll-link.js; ' + r['code_reference'], test_reference='qa/qa_v357_consolidated_functional.js', evidence_level='Isolated fixture; mapping not live-data verified', next_action='Check source ID and journal references in existing-data staging')

counts = collections.Counter(r['implementation_status'] for r in rows)
source['summary'].update(latest_evidence='V30.57 consolidated engineering build: isolated Node 22 fixtures, inherited regression and fresh runtime are recorded in QA report. No Render copy, authenticated browser staging, accountant signoff or production acceptance is claimed.', implementation_status_counts=dict(counts), fields_added=['implementation_status','policy_status','code_reference','test_reference','evidence_level','blocking_reason','decision_owner','next_action'])
out = root / 'accounting_spec/V30_57_CONSOLIDATED_499_ROW_MATRIX.json'
out.write_text(json.dumps(source, indent=2, ensure_ascii=False) + '\n')
print(out.name, len(rows), dict(counts))
