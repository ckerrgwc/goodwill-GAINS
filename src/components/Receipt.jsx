import { forwardRef } from 'react';
import Barcode from './Barcode.jsx';
import { dateTime, money } from '../lib/format.js';

const Receipt = forwardRef(function Receipt({ txn }, ref) {
  return (
    <div ref={ref} className="receipt mx-auto w-[300px] bg-white px-5 py-6 font-mono text-[12px] leading-relaxed text-slate-900 shadow-lg ring-1 ring-slate-200">
      <div className="text-center">
        <div className="font-sans text-xl font-extrabold tracking-tight">GAINS Thrift</div>
        <div>Donated goods · Community good</div>
        <div className="mt-1 text-slate-600">{dateTime(txn.timestamp)}</div>
        <div className="text-slate-600">Receipt #{txn.id}</div>
      </div>
      <div className="my-3 border-t border-dashed border-slate-400" />
      {txn.lines.map((l) => (
        <div key={l.id} className="mb-1.5">
          <div className="flex justify-between gap-2">
            <span className="truncate">{l.name}</span>
            <span>{money(l.price)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>{l.id} · {l.tag_color}</span>
            {l.discount > 0 && <span>-{money(l.discount)} ({l.pct}%)</span>}
          </div>
        </div>
      ))}
      <div className="my-3 border-t border-dashed border-slate-400" />
      <Row label={`Subtotal (${txn.lines.length} item${txn.lines.length === 1 ? '' : 's'})`} value={money(txn.subtotal)} />
      {txn.discountTotal > 0 && <Row label="Tag discounts" value={`-${money(txn.discountTotal)}`} />}
      <Row label={`Sales tax (${(txn.taxRate * 100).toFixed(0)}%)`} value={money(txn.tax)} />
      <div className="mt-1 flex justify-between font-sans text-lg font-extrabold">
        <span>TOTAL</span>
        <span>{money(txn.total)}</span>
      </div>
      <div className="my-3 border-t border-dashed border-slate-400" />
      {txn.payment.method === 'Cash' ? (
        <>
          <Row label="Cash tendered" value={money(txn.payment.tendered)} />
          <Row label="Change due" value={money(txn.payment.change)} />
        </>
      ) : (
        <Row label={`Card ****${txn.payment.cardLast4}`} value={money(txn.total)} />
      )}
      {txn.discountTotal > 0 && (
        <div className="mt-2 text-center font-bold">You saved {money(txn.discountTotal)}!</div>
      )}
      <div className="mt-4">
        <Barcode value={txn.id} height={36} className="h-10 w-full" showText={false} />
      </div>
      <div className="mt-3 text-center text-slate-600">
        All sales final. Thank you for shopping —
        <br />
        your purchase supports job training in our community.
      </div>
    </div>
  );
});

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default Receipt;
