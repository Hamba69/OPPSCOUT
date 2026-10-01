import { describe, expect, it, vi } from 'vitest';
import { parseDatabaseDate } from '@/lib/database-date';

describe('REST database timestamps', () => {
  it('keeps timezone-less UTC timestamps stable on an East Africa server', () => {
    vi.stubEnv('TZ', 'Africa/Nairobi');
    try {
      expect(parseDatabaseDate('2026-12-30T21:00:00')?.toISOString()).toBe('2026-12-30T21:00:00.000Z');
      expect(parseDatabaseDate('2026-10-01T21:00:00.123')?.toISOString()).toBe('2026-10-01T21:00:00.123Z');
    } finally { vi.unstubAllEnvs(); }
  });
  it('preserves explicit offsets and optional dates', () => {
    expect(parseDatabaseDate('2026-12-31T00:00:00+03:00')?.toISOString()).toBe('2026-12-30T21:00:00.000Z');
    expect(parseDatabaseDate('2026-12-30T21:00:00Z')?.toISOString()).toBe('2026-12-30T21:00:00.000Z');
    expect(parseDatabaseDate(null)).toBeNull();
    const date = new Date();
    expect(parseDatabaseDate(date)).toBe(date);
  });
});
