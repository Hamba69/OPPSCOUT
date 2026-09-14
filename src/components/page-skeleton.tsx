export function PageSkeleton({ section }: { section: "matches" | "provider" | "admin" }): React.JSX.Element {
  const metricCards = section !== "matches";
  return <main className="page-shell" aria-busy="true" aria-label={`Loading ${section} view`}>
    <p className="sr-only" role="status">Getting your {section} view ready…</p>
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="h-3 w-28 rounded-full bg-leaf/15" />
      <div className="mt-4 h-10 w-4/5 max-w-lg rounded-2xl bg-ink/10" />
      <div className="mt-4 h-4 w-3/5 max-w-md rounded-full bg-ink/5" />
      {section === "provider" && <div className="mt-6 flex flex-wrap gap-3">{[0, 1, 2].map((item) => <div key={item} className="h-11 w-28 rounded-full border-2 border-ink/10 bg-white" />)}</div>}
      <div className={`mt-8 grid gap-5 md:grid-cols-2 ${section === "provider" ? "lg:grid-cols-3" : ""}`}>
        {Array.from({ length: metricCards ? 6 : 4 }, (_, index) => <div key={index} className="card">
          <div className="flex items-start justify-between gap-4"><div className="h-5 w-3/5 rounded-full bg-ink/10" /><div className={`${metricCards ? "h-9 w-14 rounded-xl" : "size-16 rounded-full"} shrink-0 bg-butter`} /></div>
          <div className="mt-5 h-3 w-2/5 rounded-full bg-ink/5" />
          {metricCards ? <div className="mt-6 flex h-14 items-end gap-3">{[30, 40, 35, 48, 52, 56, 60].map((height, i) => <div key={i} style={{ height: `${height}%` }} className="flex-1 rounded-t-md bg-leaf/10" />)}</div> : <><div className="mt-6 h-20 rounded-2xl bg-butter/70" /><div className="mt-3 h-20 rounded-2xl bg-ink/5" /><div className="mt-6 h-11 rounded-full bg-sun/40" /></>}
        </div>)}
      </div>
    </div>
  </main>;
}
