'use strict';
// Per-payment details only. No recipient master or reusable account is created.
const { fail } = require('./pink-fx-calculation');
async function validate(body, currency) {
  const out = { currency, method: String(body.payment_method || 'Bank') };
  for (const [key, max] of [['receiver_name', 160], ['receiver_details', 500], ['receiver_bank_name', 160], ['receiver_account_holder', 160], ['receiver_account_number', 100], ['receiver_account_country', 100]]) {
    const v = String(body[key] || '').trim();if (v.length > max || /[\x00-\x1f\x7f]/.test(v)) await fail('Recipient details are too long or contain invalid characters.');out[key] = v;
  }
  if (!out.receiver_name) await fail('Enter the cost recipient name.');
  if (out.method !== 'Cash') {
    if (!out.receiver_bank_name) await fail('Enter the recipient bank or payment provider.');
    if (!out.receiver_account_holder) await fail('Enter the recipient account holder.');
    if (!out.receiver_account_number) await fail('Enter the recipient account or payment identifier.');
  } else for (const key of ['receiver_bank_name', 'receiver_account_holder', 'receiver_account_number', 'receiver_account_country']) out[key] = '';
  if (body.receiver_currency && body.receiver_currency !== currency) await fail('Recipient account currency must match the payment currency.');
  return out;
}
module.exports = { validate };
