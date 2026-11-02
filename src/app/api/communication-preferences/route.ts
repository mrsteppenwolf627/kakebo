import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, requireAuth, responses, withLogging } from "@/lib/api";

const CURRENT_PRIVACY_POLICY_VERSION = "2026-11-02";

export const GET = withLogging(async () => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communication_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    return responses.ok({
      preferences: data,
      currentPrivacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const marketingEmailConsent = body.marketingEmailConsent === true;
    const consentSource = body.consentSource === "signup" ? "signup" : "in_app_prompt";
    const privacyPolicyAcknowledged = body.privacyPolicyAcknowledged === true;

    const { data: existingPreferences, error: existingError } = await supabase
      .from("communication_preferences")
      .select("marketing_email_consent_at, marketing_email_consent_source, marketing_email_policy_version")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) throw existingError;

    const payload = {
      user_id: user.id,
      marketing_email_consent: marketingEmailConsent,
      marketing_email_consent_at: marketingEmailConsent
        ? now
        : existingPreferences?.marketing_email_consent_at ?? null,
      marketing_email_consent_source: marketingEmailConsent
        ? consentSource
        : existingPreferences?.marketing_email_consent_source ?? null,
      marketing_email_policy_version: marketingEmailConsent
        ? CURRENT_PRIVACY_POLICY_VERSION
        : existingPreferences?.marketing_email_policy_version ?? null,
      privacy_policy_acknowledged_at: privacyPolicyAcknowledged ? now : null,
      privacy_policy_version: privacyPolicyAcknowledged ? CURRENT_PRIVACY_POLICY_VERSION : null,
      unsubscribed_at: marketingEmailConsent ? null : now,
    };

    const { data, error } = await supabase
      .from("communication_preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error) throw error;
    return responses.ok({ preferences: data, currentPrivacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION });
  } catch (error) {
    return handleApiError(error);
  }
});
