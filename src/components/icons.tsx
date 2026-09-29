const base = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className: "inline-block shrink-0" } as const;

export function CheckIcon(): React.JSX.Element { return <svg {...base}><path d="m5 12 5 5 9-10" /></svg>; }
export function AlertIcon(): React.JSX.Element { return <svg {...base}><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>; }
export function ExternalIcon(): React.JSX.Element { return <svg {...base}><path d="M7 17 17 7M8 7h9v9" /></svg>; }
export function ArrowLeftIcon(): React.JSX.Element { return <svg {...base}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>; }
