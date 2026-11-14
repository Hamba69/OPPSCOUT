import Link from "next/link";

/** Admin page header: "ADMIN PORTAL" eyebrow, title, one-line subtitle and optional controls on the right. */
export function AdminHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }): React.JSX.Element {
  return <header className="surface flex flex-wrap items-center justify-between gap-5 !rounded-[1.75rem] !px-6 !py-7 sm:!px-8">
    <div className="min-w-0">
      <p className="text-xs font-bold tracking-[.08em] text-[#8A6400]">ADMIN PORTAL</p>
      <h1 className="!m-0 !mt-1.5 !text-left !text-[1.875rem] !font-extrabold !leading-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-navy">{subtitle}</p>}
    </div>
    {children}
  </header>;
}

/** Chip links that keep the other query parameters; the current option is shown as selected. */
export function ChipLinks({ label, options, current, href }: { label: string; options: ReadonlyArray<readonly [string, string]>; current: string; href: (value: string) => string }): React.JSX.Element {
  return <nav aria-label={label} className="flex flex-wrap gap-1.5">
    {options.map(([value, text]) => <Link key={value} href={href(value)} className="chip chip-soft" aria-current={current === value ? "page" : undefined}>{text}</Link>)}
  </nav>;
}
