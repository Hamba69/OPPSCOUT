import "server-only";

import type { UserProfile } from "@/core/entities/domain";
import { NotFoundError } from "@/core/errors/app-error";
import type { ProfileInput } from "@/lib/repository/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type SupabaseProfileRow = Omit<UserProfile, "dateOfBirth" | "createdAt" | "updatedAt"> & {
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
};

function profileFromSupabase(value: unknown): UserProfile {
  const row = value as SupabaseProfileRow;
  return {
    ...row,
    dateOfBirth: row.dateOfBirth ? new Date(`${row.dateOfBirth.slice(0, 10)}T00:00:00.000Z`) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function profileData(input: ProfileInput): Record<string, unknown> {
  const { dateOfBirth, ...rest } = input;
  return {
    ...rest,
    ...(dateOfBirth === undefined
      ? {}
      : { dateOfBirth: dateOfBirth?.toISOString().slice(0, 10) ?? null }),
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await createServiceRoleClient()
    .from("UserProfile")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Could not read profile: ${error.message}`);
  return data ? profileFromSupabase(data) : null;
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const { data, error } = await createServiceRoleClient()
    .from("UserProfile")
    .select("*")
    .order("createdAt", { ascending: true });

  if (error) throw new Error(`Could not list profiles: ${error.message}`);
  return (data ?? []).map(profileFromSupabase);
}

export async function createUserProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
  const { data, error } = await createServiceRoleClient()
    .from("UserProfile")
    .insert({
      id: userId,
      ...profileData(input),
      name: input.name ?? "",
      updatedAt: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw new Error(`Could not create profile: ${error.message}`);
  return profileFromSupabase(data);
}

export async function updateUserProfile(userId: string, input: ProfileInput): Promise<UserProfile> {
  const { data, error } = await createServiceRoleClient()
    .from("UserProfile")
    .update({ ...profileData(input), updatedAt: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Could not update profile: ${error.message}`);
  if (!data) throw new NotFoundError("Profile");
  return profileFromSupabase(data);
}

export async function deleteUserProfile(userId: string): Promise<void> {
  const { data, error } = await createServiceRoleClient()
    .from("UserProfile")
    .delete()
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Could not delete profile: ${error.message}`);
  if (!data) throw new NotFoundError("Profile");
}

export async function findOrganizationIdForDashboardUser(userId: string): Promise<string | null> {
  const { data, error } = await createServiceRoleClient()
    .from("Organization")
    .select("id")
    .contains("dashboardUsers", [userId])
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Could not resolve organization access: ${error.message}`);
  return data?.id ?? null;
}
