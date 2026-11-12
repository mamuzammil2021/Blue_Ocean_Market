'use strict';

const assert = require('node:assert/strict');
const { createHash, randomUUID } = require('node:crypto');
const { launch } = require('./fixture.cjs');

async function run() {
  const fixture = await launch();
  const { base, db, login } = fixture;
  async function request(path, method = 'GET', body, token = login.token, unit) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (unit) headers['X-Business-Unit-ID'] = String(unit);
    const response = await fetch(base + path, { method, headers, body: body && JSON.stringify(body) });
    return { status: response.status, data: await response.json().catch(() => ({})) };
  }

  try {
    const pink = await db.prepare("SELECT id FROM business_units WHERE name='Pink Salt'").get();
    const catalog = await request('/api/access/catalog');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.data.feature_parents.pinkSaltProcurement, 'purchases');

    const email = 'temporary@blueocean.local';
    const password = 'Temporary!Pwd900';
    const newPassword = 'Replacement!Pwd900';
    const created = await request('/api/access/users-v341', 'POST', {
      name: 'Temporary QA', email, password, business_unit_ids: [pink.id],
      primary_business_unit_id: pink.id, profiles: [{ role_key: 'operations_manager', business_unit_id: pink.id, is_primary: true }]
    }, login.token, pink.id);
    assert.equal(created.status, 200, JSON.stringify(created.data));

    const impact = await request('/api/access/profiles/operations_manager/impact');
    assert.equal(impact.status, 200);
    assert.ok(impact.data.some(unit => unit.id === pink.id && Number(unit.affected_users) >= 1));

    const signIn = (value) => request('/api/auth/login', 'POST', { email, password: value }, null);
    const challenge = await signIn(password);
    assert.equal(challenge.status, 200);
    assert.equal(challenge.data.password_change_required, true);
    assert.equal(challenge.data.token, undefined);
    assert.equal((await request('/api/context', 'GET', null, challenge.data.challenge)).status, 401);

    const change = (value) => request('/api/auth/temporary-password', 'POST', {
      challenge: challenge.data.challenge, password: value, confirm_password: value
    }, null);
    assert.equal((await change('weak')).status, 400);
    assert.equal((await change(password)).status, 400);
    assert.equal((await change(newPassword)).status, 200);
    assert.equal((await change(newPassword)).status, 401);
    assert.equal((await signIn(password)).status, 401);

    const signedIn = await signIn(newPassword);
    assert.ok(signedIn.data.token);
    const token = signedIn.data.token;
    assert.equal((await request('/api/pink-salt/imports', 'GET', null, token, pink.id)).status, 200);
    assert.equal((await request('/api/v350/pink-salt/imports/page', 'GET', null, token, pink.id)).status, 200);
    assert.equal((await request('/api/access/me', 'GET', null, token, pink.id)).data.permissions['module.pinkSaltProcurement.view'], true);
    await db.prepare("INSERT INTO user_access_overrides(user_id,business_unit_id,permission_key,effect) VALUES(?,?,'module.pinkSaltProcurement.view','Deny')").run(created.data.id, pink.id);
    await fixture.restart();
    const restartedToken = (await signIn(newPassword)).data.token;
    assert.ok(restartedToken);
    assert.equal((await request('/api/pink-salt/imports', 'GET', null, restartedToken, pink.id)).status, 403);
    assert.equal((await request('/api/v350/pink-salt/imports/page', 'GET', null, restartedToken, pink.id)).status, 403);
    assert.equal((await request('/api/pink-salt/raw-stock', 'GET', null, restartedToken, pink.id)).status, 200);
    const reset = randomUUID();
    const digest = createHash('sha256').update(reset).digest('hex');
    await db.prepare("INSERT INTO password_resets(user_id,token,token_hash,expires_at) VALUES(?,?,?,bom.utc_datetime('now','+30 minutes'))").run(created.data.id, digest, digest);
    const resetPassword = 'ResetReplacement!900';
    assert.equal((await request('/api/auth/reset', 'POST', { token: reset, policy_only: true }, null)).status, 200);
    assert.equal((await request('/api/auth/reset', 'POST', { token: reset, password: 'weak' }, null)).status, 400);
    const resetResults = await Promise.all([1, 2].map(() =>
      request('/api/auth/reset', 'POST', { token: reset, password: resetPassword }, null)));
    assert.deepEqual(resetResults.map(result => result.status).sort(), [200, 400]);
    assert.equal((await request('/api/context', 'GET', null, restartedToken)).status, 401);
    assert.ok((await signIn(resetPassword)).data.token);
    console.log('PASS temporary password lifecycle, scoped feature grant and override, profile impact, and single-use reset');
  } finally {
    await fixture.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
