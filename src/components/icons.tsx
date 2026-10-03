const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className: "inline-block shrink-0" } as const;

export function GearIcon(): React.JSX.Element { return <svg {...base} width={22} height={22}><path d="m9 3-.6 2.4-2 .9L4.2 5.6 2.7 8.2l1.8 1.7-.2 2.2L2.7 14l1.5 2.6 2.4-.5 1.8 1.2L9 20h3l.7-2.7 1.9-1.2 2.3.5 1.5-2.6-1.7-1.9.1-2.2 1.6-1.7-1.5-2.6-2.3.7-2-.9L12 3Z"/><circle cx="10.5" cy="11.5" r="3"/></svg>; }

export function CheckIcon(): React.JSX.Element { return <svg {...base}><path d="m5 12 5 5 9-10" /></svg>; }
export function AlertIcon(): React.JSX.Element { return <svg {...base}><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>; }
export function ExternalIcon(): React.JSX.Element { return <svg {...base}><path d="M7 17 17 7M8 7h9v9" /></svg>; }
export function ArrowLeftIcon(): React.JSX.Element { return <svg {...base}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>; }
