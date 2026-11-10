'use strict';

const dedicatedTypes = new Set(['Purchase', 'Local Sale', 'Export Sale', 'Purchase Payment', 'Sale Payment']);
const costTypes = new Set(['Logistics', 'Repair', 'Part Purchase', 'Customs Duty', 'Tax / VAT',
  'Shipping / Freight', 'Commission', 'Documentation / Clearance', 'Other Cost']);
const sourceKeys = ['repair_id', 'logistics_id', 'part_id'];
const protectedPartStates = new Set(['sold', 'exported', 'voided']);
const dedicatedMessage = 'Use the dedicated machine purchase, sale, or payment workflow for this record.';
const partMessage = 'Parts sale, export, and reversal require a controlled workflow.';

function isDedicatedType(value) {
  return dedicatedTypes.has(value);
}

function costMetadata(body) {
  const raw = body.metadata;
  const metadata = raw == null || raw === '' ? {} : typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) throw new Error('Invalid machine cost metadata.');
  if (sourceKeys.some(key => Object.hasOwn(body, key) || Object.hasOwn(metadata, key))) {
    throw new Error('Machine cost source links are assigned by the server.');
  }
  return metadata;
}

function flag(value) {
  return !['', '0', 'false', 'off', 'no'].includes(String(value ?? '').trim().toLowerCase());
}

function changesPartDisposition(body, existing = {}) {
  const previous = String(existing.status || '');
  const next = String(body.status ?? existing.status ?? '');
  const protectedState = value => protectedPartStates.has(value.trim().toLowerCase());
  return (next !== previous && (protectedState(next) || protectedState(previous)))
    || (body.sold_export != null && flag(body.sold_export) !== flag(existing.sold_export))
    || (body.sale_price != null && Number(body.sale_price) !== Number(existing.sale_price || 0))
    || (body.sale_date != null && String(body.sale_date) !== String(existing.sale_date || ''));
}

module.exports = { costTypes, isDedicatedType, dedicatedMessage, costMetadata, changesPartDisposition, partMessage, flag };
