import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminPortal } from "@/lib/admin-portal";
import { ADMIN_PAGES } from "@/lib/route-template";
import { LockPortal } from "@/components/admin-controls";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}):Promise<React.JSX.Element>{await requireAdminPortal();return <div className="mx-auto max-w-[1600px] lg:flex"><aside className="border-b border-ink/10 bg-butter/40 p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-52 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r"><div className="flex items-center justify-between gap-3 lg:block"><p className="font-extrabold text-ink">OppScout portal</p><LockPortal/></div><nav aria-label="Portal sections" className="mt-3 flex gap-1 overflow-x-auto lg:flex-col">{ADMIN_PAGES.map(section=><Link key={section} className="flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-semibold capitalize text-navy hover:bg-butter hover:text-ink" href={`/admin/${section}`}>{section.replace(/-/g," ")}</Link>)}</nav></aside>{children}</div>;}
