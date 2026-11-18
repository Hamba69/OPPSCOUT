import Image from "next/image";

/**
 * Two kinds of icon:
 * - 3D artwork (public/images) for categories, menu/navigation items and search: the app's illustrated personality.
 * - Simple line icons (inline SVG, currentColor) for small controls: arrows, save, close, edit, status marks.
 */
const artwork = {
  matches: "matches", saved: "saved", profile: "profile", feedback: "feedback",
  signOut: "signOut", overview: "overview", people: "people", chart: "chart",
  organization: "organization", shield: "shield", settings: "settings", search: "search", history: "clock",
  opportunities: "job", job: "job", scholarship: "scholarship", internship: "internship",
  grant: "grant", fellowship: "fellowship", training: "training", exhibition: "exhibition",
} as const;

const line = {
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5h.01" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  dot: <circle cx="12" cy="12" r="4" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
} as const;

export type IconName = keyof typeof artwork | keyof typeof line;
const categories = new Set(["job", "scholarship", "internship", "grant", "fellowship", "training", "exhibition"]);
const svgAssets = new Set(["fellowship", "training", "exhibition"]);

export function Icon({ name, size = 20, className = "", strokeWidth = 2 }: {
  name: IconName; size?: number; className?: string;
  /** Line icons only; the 3D artwork has no stroke. */
  strokeWidth?: number;
}): React.JSX.Element {
  if (name in line) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={`line-icon inline-block shrink-0 align-middle ${className}`}>
      {line[name as keyof typeof line]}
    </svg>;
  }
  const asset = artwork[name as keyof typeof artwork];
  const pixels = Math.max(18, size);
  const extension = svgAssets.has(asset) ? "svg" : "webp";
  return <span aria-hidden="true" className={`custom-icon inline-block shrink-0 align-middle ${className}`}
    style={{ width: pixels, height: pixels }}>
    <Image src={`/images/${categories.has(asset) ? "categories" : "icons"}/${asset}.${extension}`}
      alt="" width={pixels} height={pixels} unoptimized className="block size-full object-contain" />
  </span>;
}
