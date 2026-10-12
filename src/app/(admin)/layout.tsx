import type { Metadata } from "next";
import { requireAdminPortal } from "@/lib/admin-portal";
import { ADMIN_PAGES } from "@/lib/route-template";
import { LockPortal } from "@/components/admin-controls";
import { AdminNav } from "@/components/admin-nav";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}):Promise<React.JSX.Element>{await requireAdminPortal();return <div className="mx-auto max-w-[1600px] overflow-x-clip lg:flex"><aside className="border-b border-ink/10 bg-butter/40 p-4 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-56 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r"><div className="flex items-center justify-between gap-3 lg:block"><p className="font-extrabold text-ink">OppScout portal</p><LockPortal/></div><AdminNav sections={ADMIN_PAGES}/></aside><div className="min-w-0 flex-1">{children}</div></div>;}
