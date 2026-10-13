import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import {
  BRAND_TIERS,
  CLOTHING_CATEGORIES,
  CLOTHING_SIZES,
  CONDITIONS,
  GENDERS,
  HOUSEHOLD_TYPES,
  MATERIALS,
  lookupBrandTier,
  suggestClothingPrice,
  suggestHouseholdPrice,
} from '../lib/pricing.js';
import { tagColorForDate, todayISO } from '../lib/tags.js';
import { nextItemId } from '../lib/ids.js';
import { money } from '../lib/format.js';
import { printElement } from '../lib/print.js';
import PriceTag from './PriceTag.jsx';
import { Button, Card, Field, Modal, Segmented, Select, TagBadge, inputClass } from './ui.jsx';

const EMPTY_CLOTHING = { name: '', category: '', brand: '', brandTier: '', size: '', gender: '', condition: 'Good' };
const EMPTY_HOUSEHOLD = { name: '', category: '', material: '', condition: 'Good', estimatedValue: '' };

export default function Intake() {
  const { state, dispatch } = useStore();
  const [dept, setDept] = useState('Clothing');
  const [clothing, setClothing] = useState(EMPTY_CLOTHING);
  const [household, setHousehold] = useState(EMPTY_HOUSEHOLD);
  const [override, setOverride] = useState('');
  const [dateEntered, setDateEntered] = useState(todayISO());
  const [created, setCreated] = useState(null);
  const [recent, setRecent] = useState([]);
  const tagRef = useRef(null);
  const nameRef = useRef(null);

  const autoTier = dept === 'Clothing' ? lookupBrandTier(clothing.brand) : null;
  const effectiveTier = clothing.brandTier || autoTier || 'Mid-tier';

  const suggestion = useMemo(() => {
    if (dept === 'Clothing') {
      return suggestClothingPrice({ category: clothing.category, brandTier: effectiveTier, condition: clothing.condition });
    }
    return suggestHouseholdPrice({
      type: household.category,
      material: household.material,
      condition: household.condition,
      estimatedValue: household.estimatedValue,
    });
  }, [dept, clothing, household, effectiveTier]);

  const overrideNum = parseFloat(override);
  const finalPrice = override !== '' && overrideNum > 0 ? Math.round(overrideNum * 100) / 100 : suggestion.price;
  const tagColor = tagColorForDate(dateEntered || todayISO());

  const valid =
    dept === 'Clothing'
      ? clothing.name.trim() && clothing.category && clothing.condition
      : household.name.trim() && household.category && household.material && household.condition && Number(household.estimatedValue) > 0;

  const draftItem = {
    id: nextItemId(state.items, dept),
    name: (dept === 'Clothing' ? clothing.name : household.name) || 'Item name',
    category: (dept === 'Clothing' ? clothing.category : household.category) || 'Category',
    type: dept,
    brand_or_material: dept === 'Clothing' ? clothing.brand.trim() : household.material,
    condition: dept === 'Clothing' ? clothing.condition : household.condition,
    price: finalPrice,
    tag_color: tagColor,
    status: 'In Stock',
    date_entered: dateEntered || todayISO(),
    attributes:
      dept === 'Clothing'
        ? { size: clothing.size, gender: clothing.gender, brand_tier: effectiveTier }
        : { estimated_value: Number(household.estimatedValue) || 0 },
  };

  function submit(e) {
    e.preventDefault();
    if (!valid) return;
    const item = { ...draftItem, name: draftItem.name.trim(), history: [] };
    dispatch({ type: 'ADD_ITEM', item });
    setCreated(item);
    setRecent((r) => [item, ...r].slice(0, 6));
  }

  function nextItem({ keepAttributes }) {
    setCreated(null);
    setOverride('');
    if (dept === 'Clothing') setClothing(keepAttributes ? { ...clothing, name: '' } : EMPTY_CLOTHING);
    else setHousehold(keepAttributes ? { ...household, name: '', estimatedValue: '' } : EMPTY_HOUSEHOLD);
    setTimeout(() => nameRef.current?.focus(), 50);
  }

  const setC = (k) => (e) => setClothing({ ...clothing, [k]: e.target.value });
  const setH = (k) => (e) => setHousehold({ ...household, [k]: e.target.value });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <form onSubmit={submit} className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Back-Room Intake</h2>
              <p className="text-slate-500">Classify, price and tag donated goods.</p>
            </div>
            <Segmented
              size="lg"
              value={dept}
              onChange={(d) => {
                setDept(d);
                setOverride('');
              }}
              options={[
                { value: 'Clothing', label: '👕 Clothing' },
                { value: 'Household', label: '🏺 Household Goods' },
              ]}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-500">Item Details</h3>
          {dept === 'Clothing' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Item description" className="sm:col-span-2">
                <input ref={nameRef} className={inputClass} placeholder="e.g. Vintage Denim Jacket" value={clothing.name} onChange={setC('name')} autoFocus />
              </Field>
              <Field label="Category">
                <Select placeholder="Select category…" options={Object.keys(CLOTHING_CATEGORIES)} value={clothing.category} onChange={setC('category')} />
              </Field>
              <Field label="Gender / Department">
                <Select placeholder="Select…" options={GENDERS} value={clothing.gender} onChange={setC('gender')} />
              </Field>
              <Field label="Brand" hint={autoTier ? `Recognized brand → ${autoTier}` : 'Known brands auto-select a tier'}>
                <input className={inputClass} placeholder="e.g. Patagonia" value={clothing.brand} onChange={setC('brand')} list="brand-list" />
              </Field>
              <Field label="Brand tier">
                <Select
                  placeholder={autoTier ? `Auto: ${autoTier}` : 'Auto: Mid-tier'}
                  options={BRAND_TIERS}
                  value={clothing.brandTier}
                  onChange={setC('brandTier')}
                />
              </Field>
              <Field label="Size" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setClothing({ ...clothing, size: clothing.size === s ? '' : s })}
                      className={`min-w-[3.25rem] rounded-lg px-3 py-2.5 text-sm font-bold ring-1 ring-inset transition ${
                        clothing.size === s ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Item description" className="sm:col-span-2">
                <input ref={nameRef} className={inputClass} placeholder="e.g. Ceramic Serving Bowl" value={household.name} onChange={setH('name')} autoFocus />
              </Field>
              <Field label="Type">
                <Select placeholder="Select type…" options={Object.keys(HOUSEHOLD_TYPES)} value={household.category} onChange={setH('category')} />
              </Field>
              <Field label="Material">
                <Select placeholder="Select material…" options={Object.keys(MATERIALS)} value={household.material} onChange={setH('material')} />
              </Field>
              <Field label="Estimated retail value (new)" hint="What it would cost new in a store" className="sm:col-span-2">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    inputMode="decimal"
                    className={`${inputClass} pl-8`}
                    placeholder="0"
                    value={household.estimatedValue}
                    onChange={setH('estimatedValue')}
                  />
                </div>
              </Field>
            </div>
          )}

          <div className="mt-6">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Condition</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {CONDITIONS.map((c) => {
                const active = (dept === 'Clothing' ? clothing.condition : household.condition) === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => (dept === 'Clothing' ? setClothing({ ...clothing, condition: c }) : setHousehold({ ...household, condition: c }))}
                    className={`rounded-lg px-3 py-3 text-sm font-bold ring-1 ring-inset transition ${
                      active ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Date added" hint="Sets the tag color for the week">
              <input type="date" className={inputClass} value={dateEntered} onChange={(e) => setDateEntered(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <div className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200">
                <span className="text-sm font-semibold text-slate-600">Tag color</span>
                <TagBadge color={tagColor} size="lg" />
              </div>
            </div>
          </div>
        </Card>

        <datalist id="brand-list">
          {['Patagonia', "Levi's", 'Carhartt', 'Coach', 'Nike', 'Old Navy', 'J.Crew', 'Ralph Lauren', 'Lululemon', 'The North Face', 'Gap', 'Target'].map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </form>

      <aside className="space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-slate-900 px-6 py-4 text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Smart Price Suggestion</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-5xl font-extrabold tracking-tight">{money(suggestion.price)}</span>
              <span className="text-sm text-slate-400">
                range {money(suggestion.range[0])}–{money(suggestion.range[1])}
              </span>
            </div>
          </div>
          <dl className="divide-y divide-slate-100 px-6 py-2 text-sm">
            {suggestion.steps.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2">
                <dt className="text-slate-600">
                  {s.label}
                  {s.detail && <span className="ml-1.5 font-semibold text-slate-900">{s.detail}</span>}
                </dt>
                <dd className="font-mono font-bold text-slate-900">{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <Field label="Price override (optional)">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className={`${inputClass} pl-8`}
                  placeholder={suggestion.price.toFixed(2)}
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                />
              </div>
            </Field>
            <Button size="xl" className="mt-4 w-full" disabled={!valid} onClick={submit}>
              Add to Inventory & Print Tag · {money(finalPrice)}
            </Button>
            {!valid && <p className="mt-2 text-center text-xs text-slate-500">Fill in description, {dept === 'Clothing' ? 'category and condition' : 'type, material, condition and value'}.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Tag Preview</h3>
            <span className="font-mono text-sm text-slate-500">{draftItem.id}</span>
          </div>
          <div className="flex justify-center">
            <PriceTag item={draftItem} />
          </div>
        </Card>

        {recent.length > 0 && (
          <Card className="p-6">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Tagged this session</h3>
            <ul className="divide-y divide-slate-100">
              {recent.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-mono font-bold text-slate-900">{i.id}</span>
                  <span className="flex-1 truncate text-slate-600">{i.name}</span>
                  <span className="font-bold">{money(i.price)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>

      <Modal open={!!created} onClose={() => nextItem({ keepAttributes: true })} title="Item added to inventory">
        {created && (
          <div className="space-y-6">
            <div className="flex justify-center rounded-xl bg-slate-100 py-6">
              <PriceTag ref={tagRef} item={created} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="dark" size="lg" onClick={() => printElement(tagRef.current)}>
                🖨 Print Tag
              </Button>
              <Button variant="secondary" size="lg" onClick={() => nextItem({ keepAttributes: true })}>
                Similar Item
              </Button>
              <Button size="lg" onClick={() => nextItem({ keepAttributes: false })}>
                New Item
              </Button>
            </div>
            <p className="text-center text-sm text-slate-500">"Similar item" keeps category, brand and condition for fast batch intake.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
