import { encodeCode39 } from '../lib/barcode.js';

/** Scannable Code 39 barcode rendered as crisp SVG (prints sharp at any DPI). */
export default function Barcode({ value, height = 56, className = '', showText = true }) {
  const { bars, width } = encodeCode39(value);
  const quiet = 10; // quiet zone, in modules, on each side
  const total = width + quiet * 2;
  const textH = showText ? 14 : 0;
  return (
    <svg
      viewBox={`0 0 ${total} ${height + textH}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label={`Barcode ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={total} height={height + textH} fill="#fff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x + quiet} y={0} width={b.width} height={height} fill="#000" />
      ))}
      {showText && (
        <text x={total / 2} y={height + 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fontWeight="700" fill="#000" letterSpacing="2">
          {value}
        </text>
      )}
    </svg>
  );
}
