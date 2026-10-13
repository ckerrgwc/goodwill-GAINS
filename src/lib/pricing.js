// Smart pricing suggestion engine.
//
// Clothing:  category base price × brand-tier multiplier × condition multiplier
// Household: estimated retail value × resale ratio for the item type
//            × material multiplier × condition multiplier
// Every suggestion is rounded to thrift-friendly price points ($x.99, or
// $0.49 / $0.99 under a dollar) and comes with a step-by-step breakdown.

export const CONDITIONS = ['New with Tags', 'Like New', 'Good', 'Fair', 'Poor'];

export const CONDITION_MULTIPLIER = {
  'New with Tags': 1.6,
  'Like New': 1.25,
  Good: 1.0,
  Fair: 0.7,
  Poor: 0.4,
};

export const BRAND_TIERS = ['Value', 'Mid-tier', 'Premium'];

export const BRAND_TIER_MULTIPLIER = {
  Value: 0.75,
  'Mid-tier': 1.0,
  Premium: 2.25,
};

// Known brands → tier, used to auto-suggest the tier as the associate types.
export const BRAND_DIRECTORY = {
  'old navy': 'Value',
  'faded glory': 'Value',
  'time and tru': 'Value',
  'shein': 'Value',
  'h&m': 'Value',
  'forever 21': 'Value',
  'target': 'Value',
  'walmart': 'Value',
  "levi's": 'Mid-tier',
  'levis': 'Mid-tier',
  'gap': 'Mid-tier',
  'j.crew': 'Mid-tier',
  'j crew': 'Mid-tier',
  'nike': 'Mid-tier',
  'adidas': 'Mid-tier',
  'carhartt': 'Mid-tier',
  'columbia': 'Mid-tier',
  "talbots": 'Mid-tier',
  'loft': 'Mid-tier',
  'american eagle': 'Mid-tier',
  'patagonia': 'Premium',
  'north face': 'Premium',
  'the north face': 'Premium',
  'ralph lauren': 'Premium',
  'polo ralph lauren': 'Premium',
  'coach': 'Premium',
  'lululemon': 'Premium',
  'burberry': 'Premium',
  'filson': 'Premium',
  "arc'teryx": 'Premium',
  'barbour': 'Premium',
  'free people': 'Premium',
  'anthropologie': 'Premium',
};

export function lookupBrandTier(brand) {
  if (!brand) return null;
  return BRAND_DIRECTORY[brand.trim().toLowerCase()] ?? null;
}

export const CLOTHING_CATEGORIES = {
  Outerwear: 14,
  Jackets: 12,
  Denim: 9,
  Pants: 7,
  Dresses: 9,
  Sweaters: 8,
  Tops: 5,
  Skirts: 6,
  Activewear: 6,
  Shoes: 10,
  Accessories: 4,
  'Kids Clothing': 3,
};

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '0-2', '4-6', '8-10', '12-14', '16+', 'One Size'];
export const GENDERS = ["Women's", "Men's", 'Unisex', 'Girls', 'Boys'];

export const HOUSEHOLD_TYPES = {
  Dishware: 0.3,
  Glassware: 0.3,
  Lighting: 0.35,
  'Home Decor': 0.3,
  Kitchenware: 0.3,
  Furniture: 0.35,
  'Small Appliances': 0.25,
  Linens: 0.25,
  Books: 0.2,
  'Art & Frames': 0.35,
  'Toys & Games': 0.25,
};

export const MATERIALS = {
  Ceramic: 1.0,
  Porcelain: 1.1,
  Stoneware: 1.0,
  Glass: 1.0,
  Crystal: 1.4,
  Wood: 1.1,
  'Solid Wood': 1.3,
  Metal: 1.05,
  Brass: 1.25,
  'Cast Iron': 1.3,
  Plastic: 0.7,
  Fabric: 0.85,
  Mixed: 0.95,
  Electronic: 0.9,
};

/** Round to thrift price points: $0.49 / $0.99 under $1, else $x.99. */
export function roundToPricePoint(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 0.99;
  if (amount < 0.75) return 0.49;
  if (amount < 1.5) return 0.99;
  return Math.round(amount) - 0.01;
}

function step(label, detail, value) {
  return { label, detail, value };
}

export function suggestClothingPrice({ category, brandTier, condition }) {
  const base = CLOTHING_CATEGORIES[category] ?? 5;
  const tierMult = BRAND_TIER_MULTIPLIER[brandTier] ?? 1;
  const condMult = CONDITION_MULTIPLIER[condition] ?? 1;
  const raw = base * tierMult * condMult;
  const price = roundToPricePoint(raw);
  return {
    price,
    raw,
    range: [roundToPricePoint(raw * 0.85), roundToPricePoint(raw * 1.2)],
    steps: [
      step('Category base', category || '—', `$${base.toFixed(2)}`),
      step('Brand tier', brandTier || '—', `× ${tierMult}`),
      step('Condition', condition || '—', `× ${condMult}`),
      step('Calculated', '', `$${raw.toFixed(2)}`),
      step('Rounded to price point', '', `$${price.toFixed(2)}`),
    ],
  };
}

export function suggestHouseholdPrice({ type, material, condition, estimatedValue }) {
  const value = Number(estimatedValue) || 0;
  const ratio = HOUSEHOLD_TYPES[type] ?? 0.3;
  const matMult = MATERIALS[material] ?? 1;
  const condMult = CONDITION_MULTIPLIER[condition] ?? 1;
  const raw = value * ratio * matMult * condMult;
  const price = roundToPricePoint(raw);
  return {
    price,
    raw,
    range: [roundToPricePoint(raw * 0.85), roundToPricePoint(raw * 1.2)],
    steps: [
      step('Est. retail value', '', `$${value.toFixed(2)}`),
      step('Resale ratio', type || '—', `× ${ratio}`),
      step('Material', material || '—', `× ${matMult}`),
      step('Condition', condition || '—', `× ${condMult}`),
      step('Calculated', '', `$${raw.toFixed(2)}`),
      step('Rounded to price point', '', `$${price.toFixed(2)}`),
    ],
  };
}

export const TAX_RATE = 0.06;

export function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Price a cart. Each line gets the best active promotion for its tag color.
 * Tax is applied to the post-discount subtotal.
 */
export function priceCart(items, promotions, taxRate = TAX_RATE) {
  const lines = items.map((item) => {
    const pct = promotions[item.tag_color] ?? 0;
    const discount = roundMoney(item.price * (pct / 100));
    return { item, pct, discount, net: roundMoney(item.price - discount) };
  });
  const subtotal = roundMoney(lines.reduce((s, l) => s + l.item.price, 0));
  const discountTotal = roundMoney(lines.reduce((s, l) => s + l.discount, 0));
  const taxable = roundMoney(subtotal - discountTotal);
  const tax = roundMoney(taxable * taxRate);
  const total = roundMoney(taxable + tax);
  return { lines, subtotal, discountTotal, taxable, tax, total, taxRate };
}
