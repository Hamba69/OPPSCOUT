import { describe, expect, it } from "vitest";

import {
  assertSafeDatabaseTarget,
  parseSupabaseProjectRef,
  UnsafeDatabaseTargetError,
} from "@/lib/safety/db-guard";

const productionRef = "abcdefghijklmnopqrst";
const developmentRef = "zyxwvutsrqponmlkjihg";

describe("database write guard", () => {
  it("allows explicit local URLs without contacting a database", () => {
    expect(assertSafeDatabaseTarget({
      variableName: "LOCAL_DATABASE_URL",
      value: "postgresql://local-user:local-pass@localhost:55432/oppscout",
    })).toMatchObject({
      variableName: "LOCAL_DATABASE_URL",
      hostname: "localhost",
      port: 55432,
      isLocal: true,
      projectRef: null,
    });
  });

  it("allows only the documented local hostnames through explicit safe variables", () => {
    expect(assertSafeDatabaseTarget({
      variableName: "LOCAL_DIRECT_URL",
      value: "postgresql://localhost:5432/oppscout",
    }).isLocal).toBe(true);
    expect(assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value: "postgresql://127.0.0.1:5432/oppscout",
    }).isLocal).toBe(true);
    expect(assertSafeDatabaseTarget({
      variableName: "DEV_DIRECT_URL",
      value: "postgresql://host.docker.internal:5432/oppscout",
    }).isLocal).toBe(true);
    for (const host of ["127.0.0.2", "[::1]", "192.168.1.20"]) {
      expect(() => assertSafeDatabaseTarget({
        variableName: "LOCAL_DATABASE_URL",
        value: `postgresql://${host}:5432/oppscout`,
      })).toThrow(UnsafeDatabaseTargetError);
    }
  });

  it("accepts a distinct remote dev project when its project ref is provable", () => {
    const target = assertSafeDatabaseTarget({
      variableName: "DEV_DIRECT_URL",
      value: `postgresql://postgres.${developmentRef}:pw@db.${developmentRef}.supabase.co:5432/postgres`,
      productionProjectRef: productionRef,
      repositoryDatabaseUrl: `postgresql://postgres.${productionRef}:pw@db.${productionRef}.supabase.co:5432/postgres`,
    });
    expect(target).toMatchObject({ projectRef: developmentRef, isLocal: false });
  });

  it("rejects production and default environment variable names", () => {
    for (const variableName of ["DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
      expect(() => assertSafeDatabaseTarget({
        variableName,
        value: "postgresql://localhost:5432/oppscout",
      })).toThrow(UnsafeDatabaseTargetError);
    }
  });

  it("rejects malformed, missing, and non-PostgreSQL URLs", () => {
    for (const value of [undefined, "not-a-url", "https://example.com"]) {
      expect(() => assertSafeDatabaseTarget({
        variableName: "LOCAL_DATABASE_URL",
        value,
      })).toThrow(UnsafeDatabaseTargetError);
    }
  });

  it("rejects a local URL under a non-database variable name", () => {
    expect(() => assertSafeDatabaseTarget({
      variableName: "LOCAL_SUPABASE_URL",
      value: "postgresql://localhost:5432/oppscout",
    })).toThrow(UnsafeDatabaseTargetError);
  });

  it("rejects a remote target without a parseable project reference", () => {
    expect(() => assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value: "postgresql://dbuser:pw@db.example.net:5432/oppscout",
      productionProjectRef: productionRef,
    })).toThrow(/reference cannot be determined/);
  });

  it("rejects remote writes without a production comparison reference", () => {
    expect(() => assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value: `postgresql://postgres.${developmentRef}:pw@db.${developmentRef}.supabase.co:5432/postgres`,
    })).toThrow(/cannot be established/);
  });

  it("rejects remote references matching either production reference", () => {
    const value = `postgresql://postgres.${productionRef}:pw@db.${productionRef}.supabase.co:5432/postgres`;
    expect(() => assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value,
      productionProjectRef: productionRef,
    })).toThrow(/matches a configured production reference/);
    expect(() => assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value,
      repositoryDatabaseUrl: value,
    })).toThrow(/matches a configured production reference/);
  });

  it("fails closed if the repository's production URL cannot be parsed", () => {
    expect(() => assertSafeDatabaseTarget({
      variableName: "DEV_DATABASE_URL",
      value: `postgresql://postgres.${developmentRef}:pw@db.${developmentRef}.supabase.co:5432/postgres`,
      productionProjectRef: productionRef,
      repositoryDatabaseUrl: "not-a-url",
    })).toThrow(UnsafeDatabaseTargetError);
  });

  it("parses direct and pooler Supabase project references", () => {
    expect(parseSupabaseProjectRef(
      `postgresql://postgres.${productionRef}:pw@db.${productionRef}.supabase.co:5432/postgres`,
    )).toBe(productionRef);
    expect(parseSupabaseProjectRef(
      `postgresql://postgres.${productionRef}:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    )).toBe(productionRef);
    expect(parseSupabaseProjectRef(
      `postgresql://postgres.${productionRef}:pw@untrusted.example:6543/postgres`,
    )).toBeNull();
  });
});
