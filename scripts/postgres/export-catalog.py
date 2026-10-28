#!/usr/bin/env python3
"""Export schema metadata only from an initialized V30.69.50 SQLite snapshot.

No row data, user names, passwords, connection strings or secrets are exported.
Regeneration is explicit; production startup never opens SQLite.
"""
import argparse
import hashlib
import json
import sqlite3
from pathlib import Path


def quote(name):
    return '"' + name.replace('"', '""') + '"'


def export(source):
    db = sqlite3.connect(source.resolve().as_uri() + '?mode=ro', uri=True)
    db.row_factory = sqlite3.Row
    db.execute('BEGIN')
    tables = []
    for row in db.execute("SELECT name,sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
        table = dict(row)
        table['columns'] = [dict(x) for x in db.execute('PRAGMA table_info(' + quote(row['name']) + ')')]
        table['foreignKeys'] = [dict(x) for x in db.execute('PRAGMA foreign_key_list(' + quote(row['name']) + ')')]
        table['indexes'] = []
        for idx in db.execute('PRAGMA index_list(' + quote(row['name']) + ')'):
            index = dict(idx)
            index['columns'] = [dict(x) for x in db.execute('PRAGMA index_xinfo(' + quote(idx['name']) + ')')]
            index['sql'] = db.execute('SELECT sql FROM sqlite_master WHERE name=?', (idx['name'],)).fetchone()[0]
            table['indexes'].append(index)
        tables.append(table)
    catalog = dict(baselineVersion='30.69.50', tables=tables,
                   views=[dict(x) for x in db.execute("SELECT name,sql FROM sqlite_master WHERE type='view' ORDER BY name")],
                   triggers=[dict(x) for x in db.execute("SELECT name,tbl_name,sql FROM sqlite_master WHERE type='trigger' ORDER BY name")])
    db.rollback()
    db.close()
    catalog['schemaSha256'] = hashlib.sha256(json.dumps(catalog, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    return catalog


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshot', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    catalog = export(args.snapshot)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(catalog, indent=2) + '\n')
    print(json.dumps(dict(tables=len(catalog['tables']), columns=sum(len(t['columns']) for t in catalog['tables']), schemaSha256=catalog['schemaSha256'])))
