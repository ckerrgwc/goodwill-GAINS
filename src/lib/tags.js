// Weekly tag-color rotation. Every item gets the color of the week it was
// entered, so the floor can see at a glance how long merchandise has been out.

export const TAG_COLORS = ['Blue', 'Green', 'Yellow', 'Pink', 'Orange'];

export const TAG_STYLES = {
  Blue: { hex: '#2563eb', soft: 'bg-blue-100 text-blue-800 ring-blue-300', solid: 'bg-blue-600', text: 'text-white' },
  Green: { hex: '#16a34a', soft: 'bg-green-100 text-green-800 ring-green-300', solid: 'bg-green-600', text: 'text-white' },
  Yellow: { hex: '#facc15', soft: 'bg-yellow-100 text-yellow-800 ring-yellow-300', solid: 'bg-yellow-400', text: 'text-slate-900' },
  Pink: { hex: '#ec4899', soft: 'bg-pink-100 text-pink-800 ring-pink-300', solid: 'bg-pink-500', text: 'text-white' },
  Orange: { hex: '#f97316', soft: 'bg-orange-100 text-orange-800 ring-orange-300', solid: 'bg-orange-500', text: 'text-white' },
};

const DAY_MS = 24 * 60 * 60 * 1000;
// Monday, 2024-01-01 — weeks run Monday through Sunday.
const ROTATION_EPOCH = Date.UTC(2024, 0, 1);

/** Parse a YYYY-MM-DD string as a UTC date (avoids timezone drift). */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso, days) {
  const t = new Date(parseISODate(iso) + days * DAY_MS);
  return t.toISOString().slice(0, 10);
}

export function weekIndex(iso) {
  return Math.floor((parseISODate(iso) - ROTATION_EPOCH) / (7 * DAY_MS));
}

export function tagColorForDate(iso) {
  const n = TAG_COLORS.length;
  return TAG_COLORS[((weekIndex(iso) % n) + n) % n];
}

/** Monday of the week containing `iso`. */
export function weekStartISO(iso) {
  const days = Math.floor((parseISODate(iso) - ROTATION_EPOCH) / DAY_MS);
  const offset = ((days % 7) + 7) % 7;
  return addDaysISO(iso, -offset);
}

/**
 * The rotation schedule for the current cycle: one entry per color, oldest
 * first, ending with this week. Lets staff see which color is "about to
 * rotate out" and is the natural candidate for a markdown.
 */
export function rotationSchedule(today = todayISO()) {
  const thisWeek = weekStartISO(today);
  return TAG_COLORS.map((_, i) => {
    const start = addDaysISO(thisWeek, -7 * (TAG_COLORS.length - 1 - i));
    return {
      color: tagColorForDate(start),
      weekStart: start,
      weekEnd: addDaysISO(start, 6),
      weeksOld: TAG_COLORS.length - 1 - i,
    };
  });
}

/**
 * True when an item was entered before the oldest week in the current
 * rotation — its tag color is about to repeat, so it should be pulled.
 */
export function isPastRotation(dateEntered, today = todayISO()) {
  return dateEntered < rotationSchedule(today)[0].weekStart;
}
