import Link from "next/link";

import { Logo } from "@/components/logo";

export function EmptyState({ symbol, title, description, href, action }: {
  symbol?: string; title: string; description: string; href: string; action: string;
}): React.JSX.Element {
  return <section className="card border-2 border-honey bg-butter py-10 text-center">
    <div className="flex justify-center">{symbol ? <span className="text-5xl" aria-hidden="true">{symbol}</span> : <Logo size={56} />}</div>
    <h2 className="mt-4 text-xl font-extrabold text-ink">{title}</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-navy">{description}</p>
    <Link href={href} className="button mt-6">{action}</Link>
  </section>;
}
