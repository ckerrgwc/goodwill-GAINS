import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceCart, roundToPricePoint, suggestClothingPrice, suggestHouseholdPrice, lookupBrandTier } from './pricing.js';
import { TAG_COLORS, isPastRotation, tagColorForDate, rotationSchedule, weekStartISO } from './tags.js';
import { encodeCode39 } from './barcode.js';
import { nextItemId, normalizeScan } from './ids.js';

test('price points', () => {
  assert.equal(roundToPricePoint(0.3), 0.49);
  assert.equal(roundToPricePoint(1.2), 0.99);
  assert.equal(roundToPricePoint(12.4), 11.99);
  assert.equal(roundToPricePoint(12.6), 12.99);
});

test('clothing pricing scales with tier and condition', () => {
  const base = suggestClothingPrice({ category: 'Jackets', brandTier: 'Mid-tier', condition: 'Good' });
  assert.equal(base.price, 11.99);
  const premium = suggestClothingPrice({ category: 'Jackets', brandTier: 'Premium', condition: 'New with Tags' });
  assert.ok(premium.price > base.price * 3);
  const fair = suggestClothingPrice({ category: 'Jackets', brandTier: 'Value', condition: 'Fair' });
  assert.ok(fair.price < base.price);
});

test('household pricing uses estimated value', () => {
  const r = suggestHouseholdPrice({ type: 'Lighting', material: 'Brass', condition: 'Good', estimatedValue: 60 });
  assert.equal(r.price, 25.99); // 60 * .35 * 1.25 = 26.25
});

test('brand directory lookup is case-insensitive', () => {
  assert.equal(lookupBrandTier('  PATAGONIA '), 'Premium');
  assert.equal(lookupBrandTier('Unknown Co'), null);
});

test('tag colors rotate weekly and are stable within a week', () => {
  assert.equal(tagColorForDate('2024-01-01'), 'Blue');
  assert.equal(tagColorForDate('2024-01-07'), 'Blue');
  assert.equal(tagColorForDate('2024-01-08'), 'Green');
  assert.equal(tagColorForDate('2024-02-05'), 'Blue'); // 5 weeks later
  assert.equal(tagColorForDate('2023-12-31'), 'Orange'); // before epoch
  assert.equal(weekStartISO('2026-10-15'), '2026-10-12');
  const sched = rotationSchedule('2026-10-13');
  assert.deepEqual(new Set(sched.map((s) => s.color)), new Set(TAG_COLORS));
  assert.equal(sched.at(-1).color, tagColorForDate('2026-10-13'));
  assert.equal(isPastRotation('2026-09-14', '2026-10-13'), false); // oldest week's Monday
  assert.equal(isPastRotation('2026-09-13', '2026-10-13'), true); // same color as this week
});

test('cart pricing applies tag promotions before tax', () => {
  const items = [
    { id: 'A', price: 10, tag_color: 'Blue' },
    { id: 'B', price: 5.99, tag_color: 'Green' },
  ];
  const t = priceCart(items, { Blue: 50 }, 0.06);
  assert.equal(t.subtotal, 15.99);
  assert.equal(t.discountTotal, 5);
  assert.equal(t.tax, 0.66);
  assert.equal(t.total, 11.65);
});

test('code 39 encodes ids with start/stop characters', () => {
  const { bars, width } = encodeCode39('CL-10001');
  assert.equal(bars.length, 10 * 5); // 10 chars (incl. * *) × 5 bars
  assert.equal(width, 10 * 15 + 9); // 3 wide (3) + 6 narrow (1) per char, 1-module gaps
  assert.throws(() => encodeCode39('a#b'));
});

test('ids and scan normalization', () => {
  const items = [{ id: 'CL-10001' }, { id: 'CL-10007' }, { id: 'HH-20002' }];
  assert.equal(nextItemId(items, 'Clothing'), 'CL-10008');
  assert.equal(nextItemId([], 'Household'), 'HH-20001');
  assert.equal(normalizeScan(' cl10042 '), 'CL-10042');
  assert.equal(normalizeScan('hh-20001'), 'HH-20001');
});
