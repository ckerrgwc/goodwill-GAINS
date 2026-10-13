import { addDaysISO, tagColorForDate, todayISO } from '../lib/tags.js';

// Seed rows are written with `daysAgo` so the demo always looks current:
// dates (and therefore tag colors) are resolved relative to today on first load.
const SEED = [
  { id: 'CL-10001', name: "Vintage Levi's Trucker Jacket", category: 'Jackets', type: 'Clothing', brand_or_material: "Levi's", condition: 'Good', price: 24.99, status: 'In Stock', daysAgo: 27, attributes: { size: 'L', gender: "Men's", brand_tier: 'Mid-tier' } },
  { id: 'CL-10002', name: "Levi's 501 Original Fit Jeans", category: 'Denim', type: 'Clothing', brand_or_material: "Levi's", condition: 'Like New', price: 11.99, status: 'In Stock', daysAgo: 22, attributes: { size: 'M', gender: "Men's", brand_tier: 'Mid-tier' } },
  { id: 'CL-10003', name: 'Patagonia Better Sweater Fleece', category: 'Sweaters', type: 'Clothing', brand_or_material: 'Patagonia', condition: 'Good', price: 17.99, status: 'In Stock', daysAgo: 15, attributes: { size: 'S', gender: "Women's", brand_tier: 'Premium' } },
  { id: 'CL-10004', name: 'Floral Wrap Midi Dress', category: 'Dresses', type: 'Clothing', brand_or_material: 'Old Navy', condition: 'New with Tags', price: 10.99, status: 'In Stock', daysAgo: 3, attributes: { size: 'M', gender: "Women's", brand_tier: 'Value' } },
  { id: 'CL-10005', name: 'Carhartt Duck Canvas Chore Coat', category: 'Outerwear', type: 'Clothing', brand_or_material: 'Carhartt', condition: 'Fair', price: 9.99, status: 'In Stock', daysAgo: 26, attributes: { size: 'XL', gender: "Men's", brand_tier: 'Mid-tier' } },
  { id: 'CL-10006', name: 'Coach Leather Crossbody Bag', category: 'Accessories', type: 'Clothing', brand_or_material: 'Coach', condition: 'Like New', price: 34.99, status: 'Sold', daysAgo: 10, attributes: { size: 'One Size', gender: "Women's", brand_tier: 'Premium' } },
  { id: 'CL-10007', name: 'Nike Air Max 90 Sneakers', category: 'Shoes', type: 'Clothing', brand_or_material: 'Nike', condition: 'Good', price: 12.99, status: 'In Stock', daysAgo: 8, attributes: { size: 'One Size', gender: 'Unisex', brand_tier: 'Mid-tier' } },
  { id: 'CL-10008', name: 'Kids Graphic Dinosaur Tee', category: 'Kids Clothing', type: 'Clothing', brand_or_material: 'Target', condition: 'Good', price: 2.99, status: 'In Stock', daysAgo: 1, attributes: { size: '4-6', gender: 'Boys', brand_tier: 'Value' } },
  { id: 'CL-10009', name: 'J.Crew Cable-Knit Cardigan', category: 'Sweaters', type: 'Clothing', brand_or_material: 'J.Crew', condition: 'Poor', price: 2.99, status: 'Damaged', daysAgo: 16, attributes: { size: 'M', gender: "Women's", brand_tier: 'Mid-tier' } },
  { id: 'HH-20001', name: 'Stoneware Dinner Plate Set (6)', category: 'Dishware', type: 'Household', brand_or_material: 'Stoneware', condition: 'Good', price: 14.99, status: 'In Stock', daysAgo: 24, attributes: { estimated_value: 50 } },
  { id: 'HH-20002', name: 'Mid-Century Brass Table Lamp', category: 'Lighting', type: 'Household', brand_or_material: 'Brass', condition: 'Good', price: 21.99, status: 'In Stock', daysAgo: 12, attributes: { estimated_value: 60 } },
  { id: 'HH-20003', name: 'Pyrex Butterprint Mixing Bowl', category: 'Kitchenware', type: 'Household', brand_or_material: 'Glass', condition: 'Like New', price: 12.99, status: 'In Stock', daysAgo: 5, attributes: { estimated_value: 35 } },
  { id: 'HH-20004', name: 'Lodge 10" Cast Iron Skillet', category: 'Kitchenware', type: 'Household', brand_or_material: 'Cast Iron', condition: 'Fair', price: 7.99, status: 'In Stock', daysAgo: 28, attributes: { estimated_value: 30 } },
  { id: 'HH-20005', name: 'Crystal Wine Glasses (Set of 4)', category: 'Glassware', type: 'Household', brand_or_material: 'Crystal', condition: 'Like New', price: 19.99, status: 'In Stock', daysAgo: 2, attributes: { estimated_value: 40 } },
  { id: 'HH-20006', name: 'Hand-Thrown Ceramic Vase', category: 'Home Decor', type: 'Household', brand_or_material: 'Ceramic', condition: 'Good', price: 5.99, status: 'Sold', daysAgo: 19, attributes: { estimated_value: 20 } },
  { id: 'HH-20007', name: 'Solid Oak Bookshelf Crate', category: 'Furniture', type: 'Household', brand_or_material: 'Solid Wood', condition: 'Good', price: 18.99, status: 'In Stock', daysAgo: 9, attributes: { estimated_value: 45 } },
];

export function buildSeedState(today = todayISO()) {
  const items = SEED.map(({ daysAgo, ...row }) => {
    const date_entered = addDaysISO(today, -daysAgo);
    return { ...row, date_entered, tag_color: tagColorForDate(date_entered), history: [] };
  });

  // Back the two pre-sold items with a real transaction so reports line up.
  const sold = items.filter((i) => i.status === 'Sold');
  const subtotal = sold.reduce((s, i) => s + i.price, 0);
  const tax = Math.round(subtotal * 0.06 * 100) / 100;
  const txn = {
    id: 'T001001',
    timestamp: new Date(`${addDaysISO(today, -1)}T14:32:00`).toISOString(),
    lines: sold.map((i) => ({ id: i.id, name: i.name, tag_color: i.tag_color, price: i.price, pct: 0, discount: 0, net: i.price })),
    subtotal,
    discountTotal: 0,
    tax,
    total: Math.round((subtotal + tax) * 100) / 100,
    taxRate: 0.06,
    payment: { method: 'Card', cardLast4: '4242' },
  };
  sold.forEach((i) => Object.assign(i, { sold_at: txn.timestamp, sold_price: i.price, transaction_id: txn.id }));

  return { items, transactions: [txn], promotions: {} };
}
