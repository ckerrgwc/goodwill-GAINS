// Code 39 barcode encoder. Code 39 is read by virtually every USB/handheld
// retail scanner out of the box, so printed tags work with real hardware:
// the scanner "types" the item ID and presses Enter in the register field.

const PATTERNS = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw', '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn', '9': 'nnwwnnwnn', A: 'wnnnnwnnw', B: 'nnwnnwnnw',
  C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww',
  O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn',
  S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw',
  W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn', Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
  $: 'nwnwnwnnn', '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn',
};

/**
 * Encode `text` as a list of bars: [{ x, width }] in module units, plus the
 * total width. Narrow = 1 module, wide = 3 modules, 1-module gap between
 * characters. Start/stop '*' are added automatically.
 */
export function encodeCode39(text) {
  const value = `*${String(text).toUpperCase()}*`;
  const bars = [];
  let x = 0;
  for (let c = 0; c < value.length; c++) {
    const pattern = PATTERNS[value[c]];
    if (!pattern) throw new Error(`Code 39 cannot encode "${value[c]}"`);
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === 'w' ? 3 : 1;
      if (i % 2 === 0) bars.push({ x, width: w });
      x += w;
    }
    if (c < value.length - 1) x += 1;
  }
  return { bars, width: x };
}
