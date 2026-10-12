"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { registerTap } from "@/lib/register-tap";

export function AdminPortalTrigger({initiallyOpen=false}:{initiallyOpen?:boolean}):React.JSX.Element {
  const router=useRouter(),dialog=useRef<HTMLDialogElement>(null),password=useRef<HTMLInputElement>(null);
  const taps=useRef({count:0,last:0});const [error,setError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(()=>{if(initiallyOpen){dialog.current?.showModal();password.current?.focus();}},[initiallyOpen]);
  function open(){setError("");dialog.current?.showModal();password.current?.focus();}
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");try{const response=await fetch("/api/v1/admin-portal/unlock",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:password.current?.value??""})});if(response.ok){if(password.current)password.current.value="";dialog.current?.close();router.push("/admin/overview");router.refresh();return;}const body=await response.json();setError(response.status===429?`Too many attempts. Try again in ${body.error?.details?.retryAfterSeconds??60} seconds.`:response.status===401?"Incorrect password.":"Unlock is unavailable. Please try again later.");}catch{setError("Unlock is unavailable. Please try again later.");}finally{setBusy(false);}}
  return <>
    <button type="button" aria-label="OppScout" data-admin-trigger className="inline-flex size-11 select-none items-center justify-center rounded-full opacity-60 hover:opacity-100 focus-visible:opacity-100" style={{touchAction:"manipulation"}} onPointerUp={()=>{const result=registerTap(taps.current,performance.now());taps.current=result.state;if(result.triggered)open();}}><Logo size={28} /></button>
    <dialog ref={dialog} aria-labelledby="portal-unlock-title" className="w-[calc(100%-2rem)] max-w-sm rounded-3xl bg-cream p-6 text-ink shadow-soft backdrop:bg-ink/50" onClose={()=>{setError("");if(password.current)password.current.value="";}}>
      <form onSubmit={submit}><h2 id="portal-unlock-title" className="text-xl font-extrabold">Unlock portal</h2><label className="mt-5 block"><span className="label">Password</span><input ref={password} className="field" type="password" autoComplete="current-password" required maxLength={200}/></label>{error&&<p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}<button className="button mt-5 w-full" disabled={busy}>Unlock</button><button type="button" className="mt-3 min-h-11 w-full text-sm text-navy" onClick={()=>dialog.current?.close()}>Cancel</button></form>
    </dialog>
  </>;
}
