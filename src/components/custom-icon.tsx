import Image from "next/image";

const assets = {
  matches: "matches", saved: "saved", profile: "profile", feedback: "feedback",
  signOut: "signOut", overview: "overview", people: "people", chart: "chart",
  organization: "organization", shield: "shield", dot: "overview",
  search: "search", clock: "clock", check: "check", plus: "plus", edit: "edit",
  menu: "menu", mail: "mail", lock: "lock", alert: "alert", settings: "settings",
  arrow: "arrow", chevron: "arrow", back: "arrow", external: "arrow",
  up: "arrow", down: "arrow", close: "plus", flag: "flag",
  opportunities: "job", job: "job", scholarship: "scholarship", internship: "internship", grant: "grant",
} as const;

export type IconName = keyof typeof assets;
const categories = new Set(["job", "scholarship", "internship", "grant"]);
const rotations: Partial<Record<IconName, string>> = {
  back: "rotate(180deg)", external: "rotate(-45deg)", up: "rotate(-90deg)", down: "rotate(90deg)", close: "rotate(45deg)",
};

/** Generated decorative artwork. Controls retain their own text/accessible name. */
export function Icon({ name, size = 20, className = "" }: {
  name: IconName; size?: number; className?: string;
  /** Accepted for compatibility with existing callers; raster artwork has no stroke. */
  strokeWidth?: number;
}): React.JSX.Element {
  const asset = assets[name];
  const pixels = Math.max(18, size);
  return <span aria-hidden="true" className={`custom-icon inline-block shrink-0 align-middle ${className}`}
    style={{ width: pixels, height: pixels, transform: rotations[name] }}>
    <Image src={`/images/${categories.has(asset) ? "categories" : "icons"}/${asset}.webp`}
      alt="" width={pixels} height={pixels} unoptimized className="block size-full object-contain" />
  </span>;
}
