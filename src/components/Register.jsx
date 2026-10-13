import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store.jsx';
import { priceCart, roundMoney, TAX_RATE } from '../lib/pricing.js';
import { nextTransactionId, normalizeScan } from '../lib/ids.js';
import { dateTime, money } from '../lib/format.js';
import { printElement } from '../lib/print.js';
import { beep } from '../lib/sound.js';
import Receipt from './Receipt.jsx';
import { Button, Card, Modal, Segmented, StatusBadge, TagBadge, inputClass } from './ui.jsx';

export default function Register() {
  const { state, dispatch } = useStore();
  const [cartIds, setCartIds] = useState([]);
  const [scan, setScan] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showLookup, setShowLookup] = useState(false);
  const scanRef = useRef(null);
  const feedbackTimer = useRef(null);

  const byId = useMemo(() => new Map(state.items.map((i) => [i.id, i])), [state.items]);
  const cartItems = cartIds.map((id) => byId.get(id)).filter(Boolean);
  const blocked = cartItems.filter((i) => i.status !== 'In Stock');
  const totals = priceCart(cartItems, state.promotions);
  const available = state.items.filter((i) => i.status === 'In Stock' && !cartIds.includes(i.id));

  const focusScanner = () => setTimeout(() => scanRef.current?.focus(), 0);
  useEffect(() => {
    focusScanner();
  }, []);

  function flash(kind, title, detail) {
    clearTimeout(feedbackTimer.current);
    setFeedback({ kind, title, detail, key: Date.now() });
    beep(kind === 'ok' ? 'ok' : 'error');
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3500);
  }

  function addById(raw) {
    const id = normalizeScan(raw);
    if (!id) return;
    const item = byId.get(id);
    if (!item) return flash('error', 'Item not found', `No inventory record for "${id}".`);
    if (cartIds.includes(id)) return flash('error', 'Already in cart', `${id} · ${item.name}`);
    if (item.status === 'Sold') return flash('error', 'Already sold', `${id} was sold on ${dateTime(item.sold_at)} (${item.transaction_id}).`);
    if (item.status !== 'In Stock') return flash('error', `Item marked ${item.status}`, `${id} must be restocked in Inventory before it can be sold.`);
    setCartIds((c) => [...c, id]);
    const pct = state.promotions[item.tag_color];
    flash('ok', `${item.name}`, `${id} · ${money(item.price)}${pct ? ` → ${pct}% off ${item.tag_color} tag` : ''}`);
  }

  function onScanSubmit(e) {
    e.preventDefault();
    addById(scan);
    setScan('');
  }

  function simulateScan() {
    if (!available.length) return flash('error', 'Nothing left to scan', 'Every in-stock item is already in the cart.');
    addById(available[Math.floor(Math.random() * available.length)].id);
    focusScanner();
  }

  function removeLine(id) {
    setCartIds((c) => c.filter((x) => x !== id));
    focusScanner();
  }

  function completeSale(payment) {
    const txn = {
      id: nextTransactionId(state.transactions),
      timestamp: new Date().toISOString(),
      lines: totals.lines.map((l) => ({
        id: l.item.id,
        name: l.item.name,
        tag_color: l.item.tag_color,
        price: l.item.price,
        pct: l.pct,
        discount: l.discount,
        net: l.net,
      })),
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      tax: totals.tax,
      total: totals.total,
      taxRate: totals.taxRate,
      payment,
    };
    dispatch({ type: 'COMPLETE_SALE', txn });
    setPaying(false);
    setCartIds([]);
    setReceipt(txn);
  }

  const recentTxns = state.transactions.slice(-5).reverse();

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-6">
        <Card className="p-5">
          <form onSubmit={onScanSubmit} className="flex flex-wrap gap-3">
            <div className="relative min-w-[16rem] flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" strokeLinecap="round" />
                </svg>
              </span>
              <input
                ref={scanRef}
                value={scan}
                onChange={(e) => setScan(e.target.value)}
                className={`${inputClass} py-5 pl-14 font-mono text-2xl font-bold uppercase tracking-widest`}
                placeholder="SCAN OR TYPE ITEM ID"
                autoComplete="off"
                spellCheck={false}
                aria-label="Barcode scanner input"
              />
            </div>
            <Button type="submit" size="xl" variant="dark">Add ⏎</Button>
            <Button size="xl" variant="secondary" onClick={simulateScan} title="Pick a random in-stock item">
              📡 Simulate Scan
            </Button>
          </form>

          <div className="mt-3 min-h-[4.5rem]">
            {feedback ? (
              <div
                key={feedback.key}
                className={`animate-flash rounded-xl px-5 py-3 ring-2 ring-inset ${
                  feedback.kind === 'ok' ? 'bg-emerald-50 text-emerald-900 ring-emerald-400' : 'bg-red-50 text-red-900 ring-red-400'
                }`}
                role="status"
              >
                <div className="text-lg font-bold">{feedback.kind === 'ok' ? '✓ ' : '✕ '}{feedback.title}</div>
                <div className="text-sm">{feedback.detail}</div>
              </div>
            ) : (
              <div className="flex h-full items-center rounded-xl border-2 border-dashed border-slate-200 px-5 py-4 text-slate-400">
                Ready to scan · USB scanners work in this field (they type the ID and press Enter)
              </div>
            )}
          </div>

          <button type="button" className="mt-2 text-sm font-semibold text-emerald-700 hover:underline" onClick={() => setShowLookup((s) => !s)}>
            {showLookup ? 'Hide' : 'Show'} item lookup ({available.length} in stock)
          </button>
          {showLookup && (
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {available.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => { addById(i.id); focusScanner(); }}
                  className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm ring-1 ring-inset ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-300"
                >
                  <span className="min-w-0">
                    <span className="block font-mono font-bold">{i.id}</span>
                    <span className="block truncate text-xs text-slate-500">{i.name}</span>
                  </span>
                  <TagBadge color={i.tag_color} />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-bold text-slate-900">
              Cart <span className="ml-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-sm text-white">{cartItems.length}</span>
            </h2>
            {cartItems.length > 0 && (
              <Button size="sm" variant="ghost" className="!text-red-600" onClick={() => { setCartIds([]); focusScanner(); }}>
                Void sale
              </Button>
            )}
          </div>
          {cartItems.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="text-5xl">🛒</div>
              <div className="mt-3 text-xl font-semibold text-slate-700">Cart is empty</div>
              <div className="text-slate-500">Scan a tag to start a sale.</div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {totals.lines.map((l, idx) => (
                <li key={l.item.id} className={`flex items-center gap-4 px-5 py-4 ${l.item.status !== 'In Stock' ? 'bg-red-50' : ''}`}>
                  <span className="w-6 text-right font-mono text-sm text-slate-400">{idx + 1}</span>
                  <TagBadge color={l.item.tag_color} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-slate-900">{l.item.name}</div>
                    <div className="text-sm text-slate-500">
                      <span className="font-mono font-semibold">{l.item.id}</span> · {l.item.category} · {l.item.condition}
                    </div>
                    {l.item.status !== 'In Stock' && (
                      <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-red-700">
                        <StatusBadge status={l.item.status} /> Remove this item to continue
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {l.pct > 0 ? (
                      <>
                        <div className="text-sm text-slate-400 line-through">{money(l.item.price)}</div>
                        <div className="text-xl font-extrabold text-emerald-700">{money(l.net)}</div>
                        <div className="text-xs font-bold text-emerald-700">{l.pct}% OFF</div>
                      </>
                    ) : (
                      <div className="text-xl font-extrabold text-slate-900">{money(l.item.price)}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(l.item.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${l.item.name}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="overflow-hidden xl:sticky xl:top-24">
          <div className="space-y-3 p-6 text-lg">
            <Line label="Subtotal" value={money(totals.subtotal)} />
            <Line label="Tag discounts" value={totals.discountTotal > 0 ? `−${money(totals.discountTotal)}` : money(0)} className={totals.discountTotal > 0 ? 'text-emerald-700' : ''} />
            <Line label={`Sales tax (${(TAX_RATE * 100).toFixed(0)}%)`} value={money(totals.tax)} />
          </div>
          <div className="flex items-baseline justify-between bg-slate-900 px-6 py-5 text-white">
            <span className="text-lg font-semibold uppercase tracking-widest text-slate-300">Total</span>
            <span className="text-5xl font-extrabold tracking-tight">{money(totals.total)}</span>
          </div>
          <div className="p-6">
            {Object.keys(state.promotions).length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-600">Active markdowns:</span>
                {Object.entries(state.promotions).map(([c, p]) => (
                  <span key={c} className="inline-flex items-center gap-1">
                    <TagBadge color={c} /> <span className="font-bold">{p}%</span>
                  </span>
                ))}
              </div>
            )}
            <Button size="xl" className="w-full" disabled={!cartItems.length || blocked.length > 0} onClick={() => setPaying(true)}>
              Pay {money(totals.total)}
            </Button>
          </div>
        </Card>

        {recentTxns.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-500">Recent sales</h3>
            <ul className="divide-y divide-slate-100">
              {recentTxns.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <div className="font-mono font-bold">{t.id}</div>
                    <div className="text-xs text-slate-500">{dateTime(t.timestamp)} · {t.lines.length} item{t.lines.length === 1 ? '' : 's'} · {t.payment.method}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{money(t.total)}</span>
                    <Button size="sm" variant="ghost" onClick={() => setReceipt(t)}>Receipt</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>

      <PaymentModal open={paying} total={totals.total} onClose={() => { setPaying(false); focusScanner(); }} onComplete={completeSale} />
      <ReceiptModal txn={receipt} onClose={() => { setReceipt(null); focusScanner(); }} />
    </div>
  );
}

function Line({ label, value, className = '' }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="text-slate-600">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function PaymentModal({ open, total, onClose, onComplete }) {
  const [method, setMethod] = useState('Cash');
  const [tendered, setTendered] = useState('');
  const [cardState, setCardState] = useState('idle');

  useEffect(() => {
    if (open) {
      setMethod('Cash');
      setTendered('');
      setCardState('idle');
    }
  }, [open]);

  const tenderedNum = roundMoney(parseFloat(tendered) || 0);
  const change = roundMoney(tenderedNum - total);
  const quick = [...new Set([total, Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 20, 50, 100].filter((v) => v >= total))]
    .sort((a, b) => a - b)
    .slice(0, 6);

  function chargeCard() {
    setCardState('processing');
    setTimeout(() => {
      setCardState('approved');
      setTimeout(() => onComplete({ method: 'Card', cardLast4: String(Math.floor(1000 + Math.random() * 9000)) }), 700);
    }, 1400);
  }

  return (
    <Modal open={open} onClose={cardState === 'idle' ? onClose : undefined} title="Take payment">
      <div className="space-y-6">
        <div className="rounded-xl bg-slate-900 px-6 py-5 text-center text-white">
          <div className="text-sm font-semibold uppercase tracking-widest text-slate-400">Amount due</div>
          <div className="text-5xl font-extrabold">{money(total)}</div>
        </div>
        <div className="flex justify-center">
          <Segmented size="lg" value={method} onChange={(m) => cardState === 'idle' && setMethod(m)} options={[{ value: 'Cash', label: '💵 Cash' }, { value: 'Card', label: '💳 Card' }]} />
        </div>

        {method === 'Cash' ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (change >= 0) onComplete({ method: 'Cash', tendered: tenderedNum, change });
            }}
          >
            <div className="grid grid-cols-3 gap-2">
              {quick.map((v) => (
                <Button key={v} variant="secondary" size="lg" onClick={() => setTendered(v.toFixed(2))}>
                  {v === total ? 'Exact' : money(v)}
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-2xl text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                autoFocus
                className={`${inputClass} py-4 pl-10 text-3xl font-bold`}
                placeholder="Cash tendered"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
              />
            </div>
            <div className={`flex items-baseline justify-between rounded-xl px-5 py-4 ${change >= 0 && tendered ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-500'}`}>
              <span className="text-lg font-semibold">Change due</span>
              <span className="text-4xl font-extrabold">{tendered ? money(Math.max(change, 0)) : '—'}</span>
            </div>
            {tendered && change < 0 && <p className="text-center font-semibold text-red-600">Short by {money(-change)}</p>}
            <Button type="submit" size="xl" className="w-full" disabled={!tendered || change < 0}>
              Complete Cash Sale
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className={`rounded-xl px-6 py-10 ring-2 ring-inset ${cardState === 'approved' ? 'bg-emerald-50 ring-emerald-400' : 'bg-slate-50 ring-slate-200'}`}>
              {cardState === 'idle' && <div className="text-xl font-semibold text-slate-700">Ask customer to insert, tap or swipe card</div>}
              {cardState === 'processing' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
                  <div className="text-xl font-semibold text-slate-700">Processing…</div>
                </div>
              )}
              {cardState === 'approved' && <div className="text-3xl font-extrabold text-emerald-700">✓ Approved</div>}
            </div>
            <Button size="xl" className="w-full" disabled={cardState !== 'idle'} onClick={chargeCard}>
              Charge {money(total)} to Card
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ReceiptModal({ txn, onClose }) {
  const ref = useRef(null);
  if (!txn) return null;
  return (
    <Modal open onClose={onClose} title={txn.payment.change != null ? `Sale complete · Change ${money(txn.payment.change)}` : 'Sale complete'}>
      <div className="space-y-5">
        <div className="max-h-[55vh] overflow-y-auto rounded-xl bg-slate-100 py-5">
          <Receipt ref={ref} txn={txn} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="dark" size="lg" onClick={() => printElement(ref.current)}>🖨 Print Receipt</Button>
          <Button size="lg" onClick={onClose}>New Sale</Button>
        </div>
      </div>
    </Modal>
  );
}
