import Link from "next/link";

const links = [
  ["Profile", "/profile", "profile"],
  ["Feedback", "/feedback", "feedback"],
  ["Account", "/settings", "account"],
] as const;

export function ProfileArea({ active, children }: { active: (typeof links)[number][2]; children: React.ReactNode }): React.JSX.Element {
  return <div className="mt-6 flex flex-col gap-6 md:flex-row md:gap-10">
    <aside className="md:w-56 md:shrink-0">
      <nav aria-label="Profile menu" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:flex-col md:overflow-visible md:px-0">
        {links.map(([label, href, id]) => <Link key={id} href={href} prefetch aria-current={active === id ? "page" : undefined} className="rail-link">{label}</Link>)}
      </nav>
    </aside>
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}
