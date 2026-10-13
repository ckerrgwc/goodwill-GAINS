import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store.jsx';
import Intake from './components/Intake.jsx';
import Inventory from './components/Inventory.jsx';
import Register from './components/Register.jsx';
import { TagBadge } from './components/ui.jsx';
import { tagColorForDate, todayISO } from './lib/tags.js';

const TABS = [
  { id: 'register', label: 'Register', key: 'F1', icon: '🧾', Component: Register },
  { id: 'inventory', label: 'Inventory', key: 'F2', icon: '📦', Component: Inventory },
  { id: 'intake', label: 'Intake & Pricing', key: 'F3', icon: '🏷️', Component: Intake },
];

function readHash() {
  const h = window.location.hash.slice(1);
  return TABS.some((t) => t.id === h) ? h : 'register';
}

function Shell() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState(readHash);

  useEffect(() => {
    const onHash = () => setTab(readHash());
    const onKey = (e) => {
      const t = TABS.find((x) => x.key === e.key);
      if (t) {
        e.preventDefault();
        window.location.hash = t.id;
      }
    };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const Active = TABS.find((t) => t.id === tab).Component;
  const inStock = state.items.filter((i) => i.status === 'In Stock').length;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-lg font-black text-slate-900">G</div>
            <div className="leading-tight">
              <div className="text-lg font-extrabold tracking-tight">GAINS</div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Thrift POS & Inventory</div>
            </div>
          </div>

          <nav className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-base font-semibold transition ${
                  tab === t.id ? 'bg-white text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
                <kbd className={`hidden rounded px-1.5 text-[10px] font-bold lg:inline ${tab === t.id ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'}`}>{t.key}</kbd>
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-slate-400">This week</span>
              <TagBadge color={tagColorForDate(todayISO())} />
            </div>
            <div className="hidden text-slate-400 sm:block">
              <span className="font-bold text-white">{inStock}</span> in stock
            </div>
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-700 hover:bg-slate-800 hover:text-white"
              onClick={() => {
                if (window.confirm('Reset all inventory and sales to the demo data?')) dispatch({ type: 'RESET' });
              }}
            >
              Reset demo
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <Active />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
