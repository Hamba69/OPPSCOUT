import Link from "next/link";

export function EmptyState({ title, description, href, action, background = "butter" }: {
  title: string; description: string; href: string; action: string; background?: "butter" | "white";
}): React.JSX.Element {
  return <section className={`surface ${background === "white" ? "!bg-white" : ""} py-10 text-center`}>
    <div className="flex justify-center"><span className="orb block size-14" aria-hidden="true" /></div>
    <h2 className="mt-4 text-xl font-extrabold text-ink">{title}</h2>
    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-navy">{description}</p>
    <Link href={href} className="button mt-6">{action}</Link>
  </section>;
}
