import { getServiceClient } from "@/lib/auth";
import type { ProfileInput } from "@/lib/schemas";

export interface AccountProfile {
  accountId: string;
  displayName: string | null;
  publicHandle: string | null;
  contactMethod: string | null;
  contactValue: string | null;
  organization: string | null;
  avatarUrl: string | null;
  preferredChain: "polygon" | "bnb";
  timezone: string | null;
  onboardingCompletedAt: string | null;
}

function mapRow(row: {
  account_id: string;
  display_name: string | null;
  public_handle: string | null;
  contact_method: string | null;
  contact_value: string | null;
  organization: string | null;
  avatar_url: string | null;
  preferred_chain: "polygon" | "bnb";
  timezone: string | null;
  onboarding_completed_at: string | null;
}): AccountProfile {
  return {
    accountId: row.account_id,
    displayName: row.display_name,
    publicHandle: row.public_handle,
    contactMethod: row.contact_method,
    contactValue: row.contact_value,
    organization: row.organization,
    avatarUrl: row.avatar_url,
    preferredChain: row.preferred_chain,
    timezone: row.timezone,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export async function getProfile(accountId: string): Promise<AccountProfile | null> {
  const sb = getServiceClient();
  const { data } = await sb.from("account_profiles").select("*").eq("account_id", accountId).single();
  if (!data) return null;
  return mapRow(data);
}

/**
 * Insert or update the current account's profile. `onboarding_completed_at`
 * is only ever set once (coalesced), so re-editing an existing profile never
 * moves the original onboarding timestamp.
 */
export async function upsertProfile(accountId: string, input: ProfileInput): Promise<AccountProfile> {
  const sb = getServiceClient();
  const { data: existing } = await sb
    .from("account_profiles")
    .select("onboarding_completed_at")
    .eq("account_id", accountId)
    .single();

  const { data, error } = await sb
    .from("account_profiles")
    .upsert(
      {
        account_id: accountId,
        display_name: input.displayName,
        public_handle: input.publicHandle || null,
        contact_method: input.contactMethod,
        contact_value: input.contactValue,
        organization: input.organization || null,
        preferred_chain: input.preferredChain,
        timezone: input.timezone || null,
        onboarding_completed_at: existing?.onboarding_completed_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" },
    )
    .select("*")
    .single();

  if (error || !data) throw new Error("profile_write_failed");
  return mapRow(data);
}
