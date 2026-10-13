import { useMemo, useRef, useState } from 'react';
import { STATUSES, useStore } from '../store.jsx';
import { TAG_COLORS, isPastRotation, rotationSchedule } from '../lib/tags.js';
import { dateTime, money, shortDate } from '../lib/format.js';
import { PRINT_ENABLED, printElement } from '../lib/print.js';
import PriceTag from './PriceTag.jsx';
import { Button, Card, Field, Modal, Segmented, Select, StatusBadge, TagBadge, inputClass } from './ui.jsx';

const PROMO_PRESETS = [0, 25, 50, 75];

export default function Inventory() {
  const { state, dispatch } = useStore();
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('In Stock');
  const [tag, setTag] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.items.filter((i) => {
      if (dept !== 'All' && i.type !== dept) return false;
      if (status && status !== 'All' && i.status !== status) return false;
      if (tag && i.tag_color !== tag) return false;
      if (from && i.date_entered < from) return false;
      if (to && i.date_entered > to) return false;
      if (q && ![i.id, i.name, i.category, i.brand_or_material].some((f) => f?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [state.items, query, dept, status, tag, from, to]);

  const stats = useMemo(() => {
    const inStock = state.items.filter((i) => i.status === 'In Stock');
    const sold = state.items.filter((i) => i.status === 'Sold');
    return {
      inStock: inStock.length,
      stockValue: inStock.reduce((s, i) => s + i.price, 0),
      sold: sold.length,
      revenue: state.transactions.reduce((s, t) => s + t.total - t.tax, 0),
      shrink: state.items.filter((i) => i.status === 'Damaged' || i.status === 'Lost').length,
    };
  }, [state.items, state.transactions]);

  const selectable = filtered.filter((i) => i.status !== 'Sold');
  const allSelected = selectable.length > 0 && selectable.every((i) => selected.has(i.id));

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function bulk(newStatus) {
    dispatch({ type: 'SET_STATUS', ids: [...selected], status: newStatus });
    setSelected(new Set());
  }

  function clearFilters() {
    setQuery('');
    setDept('All');
    setStatus('All');
    setTag('');
    setFrom('');
    setTo('');
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Items in stock" value={stats.inStock} />
        <Stat label="Floor value" value={money(stats.stockValue)} />
        <Stat label="Items sold" value={stats.sold} />
        <Stat label="Net sales (all time)" value={money(stats.revenue)} accent />
        <Stat label="Damaged / lost" value={stats.shrink} warn={stats.shrink > 0} />
      </div>

      <Promotions promotions={state.promotions} items={state.items} dispatch={dispatch} onPickColor={(c) => { setTag(c); setStatus('In Stock'); }} />

      <Card>
        <div className="space-y-4 border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[16rem] flex-1">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                className={`${inputClass} pl-11 text-lg`}
                placeholder="Search by ID, name, category, brand or material…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Segmented value={dept} onChange={setDept} options={['All', 'Clothing', 'Household']} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Field label="Status">
              <Select options={['All', ...STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
            </Field>
            <Field label="Tag color">
              <Select placeholder="All colors" options={TAG_COLORS} value={tag} onChange={(e) => setTag(e.target.value)} />
            </Field>
            <Field label="Added from">
              <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Added to">
              <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <div className="col-span-2 flex items-end md:col-span-1">
              <Button variant="ghost" className="w-full" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-3">
            <span className="font-semibold text-emerald-900">{selected.size} selected</span>
            <Button size="sm" variant="danger" onClick={() => bulk('Damaged')}>Mark Damaged</Button>
            <Button size="sm" variant="secondary" onClick={() => bulk('Lost')}>Mark Lost</Button>
            <Button size="sm" variant="secondary" onClick={() => bulk('In Stock')}>Return to Stock</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Cancel</Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="w-10 px-5 py-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map((i) => i.id)))}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3">Item ID</th>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Dept</th>
                <th className="px-3 py-3">Condition</th>
                <th className="px-3 py-3">Tag</th>
                <th className="px-3 py-3">Added</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => {
                const promo = i.status === 'In Stock' ? state.promotions[i.tag_color] : 0;
                return (
                  <tr key={i.id} className={`text-sm hover:bg-slate-50 ${selected.has(i.id) ? 'bg-emerald-50/60' : ''}`}>
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30"
                        checked={selected.has(i.id)}
                        disabled={i.status === 'Sold'}
                        onChange={() => toggle(i.id)}
                        aria-label={`Select ${i.id}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-slate-900">{i.id}</td>
                    <td className="px-3 py-3">
                      <button type="button" className="text-left font-semibold text-slate-900 hover:text-emerald-700 hover:underline" onClick={() => setDetail(i)}>
                        {i.name}
                      </button>
                      <div className="text-xs text-slate-500">
                        {i.category} · {i.brand_or_material || '—'}
                        {i.attributes?.size ? ` · ${i.attributes.size}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{i.type}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{i.condition}</td>
                    <td className="px-3 py-3"><TagBadge color={i.tag_color} /></td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">
                      {shortDate(i.date_entered)}
                      {i.status === 'In Stock' && isPastRotation(i.date_entered) && (
                        <div className="text-xs font-bold text-amber-700">Pull — past rotation</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {promo ? (
                        <>
                          <div className="text-xs text-slate-400 line-through">{money(i.price)}</div>
                          <div className="font-bold text-emerald-700">{money(i.price * (1 - promo / 100))}</div>
                        </>
                      ) : (
                        <span className="font-bold text-slate-900">{money(i.status === 'Sold' ? i.sold_price ?? i.price : i.price)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={i.status} /></td>
                    <td className="whitespace-nowrap px-5 py-3 text-right">
                      <RowActions item={i} dispatch={dispatch} onOpen={() => setDetail(i)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div className="text-lg font-semibold text-slate-700">No items match these filters</div>
              <Button variant="secondary" className="mt-4" onClick={clearFilters}>Clear filters</Button>
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
          Showing {filtered.length} of {state.items.length} items
        </div>
      </Card>

      <ItemDetail item={detail && state.items.find((i) => i.id === detail.id)} onClose={() => setDetail(null)} dispatch={dispatch} />
    </div>
  );
}

function Stat({ label, value, accent, warn }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold tracking-tight ${accent ? 'text-emerald-700' : warn ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
    </Card>
  );
}

function RowActions({ item, dispatch, onOpen }) {
  const set = (status) => dispatch({ type: 'SET_STATUS', ids: [item.id], status });
  if (item.status === 'Sold') {
    return <Button size="sm" variant="ghost" onClick={onOpen}>View</Button>;
  }
  return (
    <div className="inline-flex gap-1.5">
      {item.status === 'In Stock' ? (
        <>
          <Button size="sm" variant="secondary" className="!text-red-700" onClick={() => set('Damaged')}>Damaged</Button>
          <Button size="sm" variant="secondary" onClick={() => set('Lost')}>Lost</Button>
        </>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => set('In Stock')}>Restock</Button>
      )}
      <Button size="sm" variant="ghost" onClick={onOpen}>Tag</Button>
    </div>
  );
}

function Promotions({ promotions, items, dispatch, onPickColor }) {
  const schedule = rotationSchedule();
  const active = Object.entries(promotions);
  const overdue = items.filter((i) => i.status === 'In Stock' && isPastRotation(i.date_entered)).length;
  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Tag Color Rotation & Markdowns</h3>
          <p className="text-sm text-slate-500">
            Store-wide discounts apply automatically at the register.
            {active.length > 0 && (
              <span className="ml-1 font-semibold text-emerald-700">
                Active: {active.map(([c, p]) => `${p}% off ${c}`).join(', ')}
              </span>
            )}
            {overdue > 0 && (
              <span className="ml-1 font-semibold text-amber-700">
                {overdue} item{overdue === 1 ? '' : 's'} past rotation — pull from floor.
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {schedule.map((w) => {
          const pct = promotions[w.color] ?? 0;
          const count = items.filter((i) => i.tag_color === w.color && i.status === 'In Stock').length;
          return (
            <div key={w.color} className={`rounded-xl p-4 ring-1 ring-inset ${pct ? 'bg-emerald-50 ring-emerald-300' : 'bg-slate-50 ring-slate-200'}`}>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => onPickColor(w.color)} title="Filter table to this color">
                  <TagBadge color={w.color} size="lg" />
                </button>
                <span className="text-xs font-bold uppercase text-slate-500">
                  {w.weeksOld === 0 ? 'This week' : w.weeksOld === 4 ? 'Oldest' : `${w.weeksOld} wk old`}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {shortDate(w.weekStart)} – {shortDate(w.weekEnd)}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{count} on floor</div>
              <div className="mt-3 grid grid-cols-4 gap-1">
                {PROMO_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PROMOTION', color: w.color, percent: p })}
                    className={`rounded-md py-1.5 text-xs font-bold ring-1 ring-inset transition ${
                      pct === p ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p === 0 ? 'Off' : `${p}%`}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ItemDetail({ item, onClose, dispatch }) {
  const tagRef = useRef(null);
  const [price, setPrice] = useState('');
  if (!item) return null;

  function reprice() {
    const n = parseFloat(price);
    if (n > 0) {
      dispatch({ type: 'UPDATE_PRICE', id: item.id, price: Math.round(n * 100) / 100 });
      setPrice('');
    }
  }

  const attrs =
    item.type === 'Clothing'
      ? [['Size', item.attributes?.size], ['Gender', item.attributes?.gender], ['Brand', item.brand_or_material], ['Brand tier', item.attributes?.brand_tier]]
      : [['Material', item.brand_or_material], ['Est. retail value', item.attributes?.estimated_value ? money(item.attributes.estimated_value) : null]];

  return (
    <Modal open onClose={onClose} title={item.id} width="max-w-3xl">
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-3">
          <PriceTag ref={tagRef} item={item} />
          {PRINT_ENABLED && (
            <Button variant="dark" className="w-full" onClick={() => printElement(tagRef.current)}>🖨 Reprint Tag</Button>
          )}
        </div>
        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} />
              <TagBadge color={item.tag_color} />
            </div>
            <h3 className="mt-2 text-2xl font-bold text-slate-900">{item.name}</h3>
            <p className="text-slate-500">{item.type} · {item.category} · {item.condition}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {attrs.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs font-bold uppercase text-slate-500">{k}</dt>
                <dd className="font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <dt className="text-xs font-bold uppercase text-slate-500">Date added</dt>
              <dd className="font-semibold text-slate-900">{shortDate(item.date_entered)}</dd>
            </div>
            {item.status === 'Sold' && (
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs font-bold uppercase text-slate-500">Sold</dt>
                <dd className="font-semibold text-slate-900">{money(item.sold_price)} · {item.transaction_id}</dd>
              </div>
            )}
          </dl>
          {item.status !== 'Sold' && (
            <div className="flex items-end gap-2">
              <Field label="Reprice item" className="flex-1">
                <input type="number" min="0" step="0.01" className={inputClass} placeholder={item.price.toFixed(2)} value={price} onChange={(e) => setPrice(e.target.value)} />
              </Field>
              <Button onClick={reprice} disabled={!(parseFloat(price) > 0)}>Update</Button>
            </div>
          )}
          {item.history?.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">History</h4>
              <ol className="space-y-1.5 text-sm">
                {item.history.slice().reverse().map((h, idx) => (
                  <li key={idx} className="flex justify-between gap-4">
                    <span className="font-semibold text-slate-800">
                      {h.event}
                      {h.event === 'Price change' && ` ${money(h.from)} → ${money(h.to)}`}
                      {h.txn && ` · ${h.txn}`}
                    </span>
                    <span className="text-slate-500">{dateTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

