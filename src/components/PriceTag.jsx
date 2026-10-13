import { forwardRef } from 'react';
import Barcode from './Barcode.jsx';
import { TAG_STYLES } from '../lib/tags.js';
import { money, shortDate } from '../lib/format.js';

/**
 * Physical hang-tag layout: colored header band (the week's tag color),
 * item ID, category, big price, Code 39 barcode and date added.
 */
const PriceTag = forwardRef(function PriceTag({ item, className = '' }, ref) {
  const s = TAG_STYLES[item.tag_color];
  const detail =
    item.type === 'Clothing'
      ? [item.attributes?.size && `Size ${item.attributes.size}`, item.attributes?.gender, item.brand_or_material].filter(Boolean).join(' · ')
      : [item.brand_or_material, item.condition].filter(Boolean).join(' · ');

  return (
    <div ref={ref} className={`price-tag w-[264px] overflow-hidden rounded-xl border-2 border-slate-900 bg-white font-sans text-slate-900 shadow-lg ${className}`}>
      <div className={`flex items-center justify-between px-4 py-2 ${s.solid} ${s.text}`} style={{ background: s.hex, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
        <span className="text-xs font-extrabold uppercase tracking-[0.2em]">{item.tag_color} Tag</span>
        <span className="text-xs font-bold uppercase tracking-wider">{item.type}</span>
      </div>
      <div className="relative px-4 pb-3 pt-3">
        <div className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-slate-400" aria-hidden />
        <div className="mt-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">{item.category}</div>
        <div className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</div>
        {detail && <div className="mt-0.5 truncate text-[11px] text-slate-600">{detail}</div>}
        <div className="my-2 text-center text-4xl font-extrabold tracking-tight">{money(item.price)}</div>
        <Barcode value={item.id} className="h-16 w-full" />
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-slate-300 pt-2 text-[11px] font-semibold text-slate-600">
          <span>Added {shortDate(item.date_entered)}</span>
          <span className="font-mono">{item.id}</span>
        </div>
      </div>
    </div>
  );
});

export default PriceTag;
