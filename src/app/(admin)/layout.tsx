import type { Metadata } from "next";
import { requireAdminPortal } from "@/lib/admin-portal";
import { ADMIN_PAGES } from "@/lib/route-template";
import { AppFrame } from "@/components/app-shell";
import { AdminNav } from "@/components/admin-nav";
export const metadata:Metadata={robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}):Promise<React.JSX.Element>{await requireAdminPortal();return <AppFrame sidebar={<AdminNav sections={ADMIN_PAGES}/>}>{children}</AppFrame>;}
