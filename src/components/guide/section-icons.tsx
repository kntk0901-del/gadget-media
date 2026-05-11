/**
 * Decorative SVG icons used as section badges in editorial guides.
 * Pure inline SVG — no external assets, no copyright concerns.
 */

type Props = { className?: string; size?: number };

export function CameraIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect x="3" y="8" width="26" height="18" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M11 8 L13 5 H19 L21 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="17" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="17" r="2" fill="currentColor" />
      <circle cx="25" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function GamingIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path d="M9 10 H23 C26 10 29 13 29 17 C29 22 26 24 24 24 C22 24 21 22 19 22 H13 C11 22 10 24 8 24 C6 24 3 22 3 17 C3 13 6 10 9 10 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="7" y="15" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="5" y="17" width="6" height="2" rx="1" fill="currentColor" />
      <circle cx="22" cy="16" r="1.5" fill="currentColor" />
      <circle cx="25" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BatteryIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect x="3" y="10" width="22" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="27" y="13" width="2" height="6" rx="1" fill="currentColor" />
      <path d="M14 12 L11 18 H15 L13 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AiIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M11 13 L13 19 L14 16 L18 16 L19 19 L21 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="23" cy="9" r="1" fill="currentColor" />
      <circle cx="23" cy="23" r="1" fill="currentColor" />
      <circle cx="9" cy="23" r="1" fill="currentColor" />
    </svg>
  );
}

export function CompactIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect x="11" y="4" width="10" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="22" r="0.8" fill="currentColor" />
      <path d="M6 16 L9 16 M23 16 L26 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14 L9 16 L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M26 14 L23 16 L26 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function CostIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 8 V24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 12 H14 C12 12 11 13 11 14.5 S12 17 14 17 H18 C20 17 21 18 21 19.5 S20 22 18 22 H11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function FoldableIcon({ className, size = 28 }: Props) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <rect x="4" y="5" width="11" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="17" y="5" width="11" height="22" rx="2" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M16 5 V27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function UseCaseIcon({ icon, className, size = 28 }: Props & { icon: string }) {
  switch (icon) {
    case "camera":   return <CameraIcon className={className} size={size} />;
    case "gaming":   return <GamingIcon className={className} size={size} />;
    case "battery":  return <BatteryIcon className={className} size={size} />;
    case "ai":       return <AiIcon className={className} size={size} />;
    case "compact":  return <CompactIcon className={className} size={size} />;
    case "cost":     return <CostIcon className={className} size={size} />;
    case "foldable": return <FoldableIcon className={className} size={size} />;
    default:         return null;
  }
}
