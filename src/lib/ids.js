// Item IDs: department prefix + 5-digit sequence, e.g. CL-10042 / HH-20017.
// Only uppercase letters, digits and '-' so they encode cleanly in Code 39.

export const ID_PREFIX = { Clothing: 'CL', Household: 'HH' };
const ID_START = { Clothing: 10001, Household: 20001 };

export function nextItemId(items, type) {
  const prefix = ID_PREFIX[type];
  const max = items
    .filter((i) => i.id.startsWith(`${prefix}-`))
    .reduce((m, i) => Math.max(m, Number(i.id.slice(prefix.length + 1)) || 0), ID_START[type] - 1);
  return `${prefix}-${max + 1}`;
}

/** Normalize scanner/keyboard input: trim, uppercase, accept "CL10042". */
export function normalizeScan(raw) {
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  const m = s.match(/^(CL|HH)-?(\d+)$/);
  return m ? `${m[1]}-${m[2]}` : s;
}

export function nextTransactionId(transactions) {
  return `T${String(transactions.length + 1001).padStart(6, '0')}`;
}
