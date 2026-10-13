import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { buildSeedState } from './data/seed.js';

const STORAGE_KEY = 'gains-thrift-pos-v1';

export const STATUSES = ['In Stock', 'Sold', 'Damaged', 'Lost'];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) return parsed;
    }
  } catch {
    // Private mode / blocked storage: fall through to seed data.
  }
  return buildSeedState();
}

function stamp(item, event) {
  return { ...item, history: [...(item.history ?? []), { at: new Date().toISOString(), ...event }] };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, items: [stamp(action.item, { event: 'Intake', price: action.item.price }), ...state.items] };

    case 'SET_STATUS': {
      const ids = new Set(action.ids);
      return {
        ...state,
        items: state.items.map((i) =>
          ids.has(i.id) && i.status !== 'Sold'
            ? stamp({ ...i, status: action.status }, { event: `Marked ${action.status}`, note: action.note })
            : i,
        ),
      };
    }

    case 'UPDATE_PRICE':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? stamp({ ...i, price: action.price }, { event: 'Price change', from: i.price, to: action.price }) : i,
        ),
      };

    case 'SET_PROMOTION': {
      const promotions = { ...state.promotions };
      if (action.percent > 0) promotions[action.color] = action.percent;
      else delete promotions[action.color];
      return { ...state, promotions };
    }

    case 'COMPLETE_SALE': {
      const { txn } = action;
      const byId = new Map(txn.lines.map((l) => [l.id, l]));
      return {
        ...state,
        transactions: [...state.transactions, txn],
        items: state.items.map((i) => {
          const line = byId.get(i.id);
          if (!line) return i;
          return stamp(
            { ...i, status: 'Sold', sold_at: txn.timestamp, sold_price: line.net, transaction_id: txn.id },
            { event: 'Sold', txn: txn.id, net: line.net },
          );
        }),
      };
    }

    case 'RESET':
      return buildSeedState();

    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage unavailable — the app still works for this session.
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
