/**
 * Stylized inline SVG smartphone illustrations. NOT photographic — we draw
 * abstract shapes ourselves to avoid copyright / trademark concerns.
 *
 * Each brand has a recognizable camera-bump silhouette that hints at the
 * real device family without copying any specific product photography.
 */

type Props = {
  brand: string;
  color: string;       // body
  accent: string;      // screen / highlight
  width?: number;
  height?: number;
  className?: string;
};

export function PhoneSvg({ brand, color, accent, width = 88, height = 180, className }: Props) {
  // shared phone body
  const bodyR = 14;
  const screenInset = 6;
  return (
    <svg
      viewBox="0 0 88 180"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={`screen-${brand}-${accent.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`body-${brand}-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* body */}
      <rect x="2" y="2" width="84" height="176" rx={bodyR} fill={`url(#body-${brand}-${color.replace("#", "")})`} />
      {/* screen */}
      <rect
        x={screenInset}
        y={screenInset}
        width={88 - screenInset * 2}
        height={180 - screenInset * 2}
        rx={bodyR - 4}
        fill={`url(#screen-${brand}-${accent.replace("#", "")})`}
      />
      {/* brand-specific camera bump */}
      <CameraBump brand={brand} />
    </svg>
  );
}

function CameraBump({ brand }: { brand: string }) {
  switch (brand) {
    case "apple":
      // 3 lenses in a square cluster, like iPhone Pro
      return (
        <g>
          <rect x="14" y="18" width="36" height="34" rx="8" fill="#000" opacity="0.55" />
          <circle cx="22" cy="26" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="34" cy="26" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="22" cy="38" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="34" cy="38" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="44" cy="32" r="1.6" fill="#fff" opacity="0.6" />
        </g>
      );
    case "samsung":
      // vertical 3-lens stripe like Galaxy S Ultra
      return (
        <g>
          <circle cx="22" cy="22" r="5" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="0.7" />
          <circle cx="22" cy="22" r="2.2" fill="#222" />
          <circle cx="22" cy="36" r="5" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="0.7" />
          <circle cx="22" cy="36" r="2.2" fill="#222" />
          <circle cx="22" cy="50" r="4" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="0.7" />
          <circle cx="22" cy="50" r="1.8" fill="#222" />
        </g>
      );
    case "google":
      // signature horizontal camera bar across the top
      return (
        <g>
          <rect x="6" y="20" width="76" height="18" rx="9" fill="#0c0c0c" opacity="0.7" />
          <circle cx="22" cy="29" r="5" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="22" cy="29" r="2" fill="#333" />
          <circle cx="36" cy="29" r="5" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="36" cy="29" r="2" fill="#333" />
        </g>
      );
    case "sony":
      // square camera bump, 3 stacked lenses (Xperia look)
      return (
        <g>
          <rect x="14" y="18" width="20" height="44" rx="4" fill="#0a0a0a" opacity="0.7" />
          <circle cx="24" cy="26" r="3.4" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.7" />
          <circle cx="24" cy="40" r="3.4" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.7" />
          <circle cx="24" cy="54" r="3.4" fill="#1a1a1a" stroke="#3a3a3a" strokeWidth="0.7" />
        </g>
      );
    case "xiaomi":
      // big circular camera deco like Xiaomi Ultra
      return (
        <g>
          <circle cx="44" cy="34" r="22" fill="#000" opacity="0.55" />
          <circle cx="44" cy="34" r="18" fill="#0a0a0a" />
          <circle cx="38" cy="28" r="5" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="52" cy="28" r="5" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="38" cy="42" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
          <circle cx="52" cy="42" r="4" fill="#1a1a1a" stroke="#444" strokeWidth="0.7" />
        </g>
      );
    default:
      // generic
      return (
        <g>
          <rect x="18" y="20" width="22" height="28" rx="6" fill="#000" opacity="0.45" />
          <circle cx="26" cy="30" r="3.5" fill="#1a1a1a" />
          <circle cx="36" cy="30" r="3.5" fill="#1a1a1a" />
        </g>
      );
  }
}
