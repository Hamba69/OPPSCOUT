"use client";

import { useEffect, useState } from "react";

export function useTransientMessage<T>(duration = 3000): readonly [T | null, (message: T | null) => void] {
  const [message, setMessage] = useState<T | null>(null);

  useEffect(() => {
    if (message === null) return;
    const timeout = window.setTimeout(() => setMessage(null), duration);
    return () => window.clearTimeout(timeout);
  }, [duration, message]);

  return [message, setMessage] as const;
}
