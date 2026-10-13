// Short register beeps via Web Audio (no assets needed). Fails silently.
let ctx;
export function beep(kind = 'ok') {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = kind === 'ok' ? 1760 : 220;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (kind === 'ok' ? 0.08 : 0.3));
  } catch {
    // Audio unavailable.
  }
}
