"""Build a draft-to-live reference map without mutating any ledger account."""
import csv
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = ROOT / 'accounting_spec'
source = (ROOT / 'server/v290.js').read_text()
seed_block = source.split('const SYSTEM_ACCOUNTS=[', 1)[1].split('];', 1)[0]
seed_pattern = re.compile(r"\['([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)',([01])\]")
seed = [dict(code=m[0], name=m[1], account_type=m[2], subtype=m[3], normal_balance=m[4], system_key=m[5], allow_manual=bool(int(m[6]))) for m in seed_pattern.findall(seed_block)]
assert len(seed) == 42, 'Inspect changed live seed definitions before mapping'
by_code = {a['code']: a for a in seed}
by_name = {a['name'].casefold(): a for a in seed}
rules = list(csv.DictReader((SPEC / 'POSTING_RULE_COVERAGE.csv').open()))
rows = []
for r in csv.DictReader((SPEC / 'COA_COMPATIBILITY.csv').open()):
    live = by_code.get(r['draft_code'])
    equivalent = by_name.get(r['draft_name'].casefold())
    related = [x['rule_id'] for x in rules if re.search(r'(?<!\d)' + re.escape(r['draft_code']) + r'(?!\d)', ' '.join(str(v) for v in x.values()))]
    header = r['draft_type'] == 'Header'
    rows.append({
        'draft_code': r['draft_code'], 'draft_name': r['draft_name'], 'draft_account_role': r['draft_type'],
        'existing_code_and_meaning': {'code': live['code'], 'name': live['name'], 'system_key': live['system_key']} if live else None,
        'proposed_new_code_if_needed': None,
        'existing_equivalent_account_id': None,
        'existing_equivalent_system_key': equivalent['system_key'] if equivalent and not header else None,
        'account_type': equivalent['account_type'] if equivalent and not header else None,
        'normal_balance': equivalent['normal_balance'] if equivalent and not header else None,
        'business_unit_scope': r['draft_BU'],
        'posting_eligibility': 'Reference header, never posted' if header else 'Draft mapping inactive; live account settings retained',
        'source_rule': related, 'migration_impact': 'No account, journal or opening balance mutation',
        'decision_owner': 'Authorized accountant',
        'approval_status': 'Live code meaning retained; draft replacement awaiting approval' if live and live['name'] != r['draft_name'] else 'Awaiting accountant mapping approval',
        'seed_code_collision': bool(live and live['name'] != r['draft_name']),
        'actual_database_check': 'Pending isolated copy of existing Render SQLite; runtime read-only API reports current differences and journal references.'
    })
assert len(rows) == 138 and sum(r['seed_code_collision'] for r in rows) == 30
out = {'source': 'Corrected owner instructions and Draft v2 workbook', 'seed_account_count': len(seed),
       'draft_account_count': len(rows), 'seed_code_collisions': 30,
       'live_database_comparison': 'Pending safe existing-data copy', 'seed_accounts': seed, 'rows': rows}
(SPEC / 'V30_57_COA_COMPATIBILITY_PROPOSAL.json').write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
print('Mapped', len(rows), 'draft rows and preserved', len(seed), 'seed meanings, including', 30, 'collisions')
