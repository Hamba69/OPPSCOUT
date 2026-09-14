import Link from "next/link";

export function EmptyState({ symbol, title, description, href, action }: {
  symbol: string; title: string; description: string; href: string; action: string;
}): React.JSX.Element {
  return <section className="card bg-butter py-10 text-center">
    <div className="text-5xl" aria-hidden="true">{symbol}</div>
    <h2 className="mt-4 text-2xl font-black">{title}</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink/65">{description}</p>
    <Link href={href} className="button mt-6">{action}</Link>
  </section>;
}
