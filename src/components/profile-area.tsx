import Link from "next/link";

const links = [
  ["Profile", "/profile", "profile"],
  ["Settings", "/settings", "account"],
] as const;

/** Title card plus Profile | Settings tabs above the page body. */
export function ProfileArea({ active, title, children }: { active: (typeof links)[number][2]; title: string; children: React.ReactNode }): React.JSX.Element {
  return <>
    <header className="title-card"><h1>{title}</h1></header>
    <nav aria-label="Profile menu" className="flex gap-1.5">
      {links.map(([label, href, id]) => <Link key={id} href={href} prefetch aria-current={active === id ? "page" : undefined} className="chip">{label}</Link>)}
    </nav>
    <div className="flex min-w-0 flex-col gap-6">{children}</div>
  </>;
}
