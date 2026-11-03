import { createClient } from "@/lib/supabase/server";
import { handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { getScannerQuotaStatus } from "@/lib/scanner/persistence";
import { noStore, throwOnPersistenceFailure } from "@/lib/scanner/http";

export const dynamic = "force-dynamic";

export const GET = withLogging(async () => {
  try {
    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const quota = await getScannerQuotaStatus(supabase);
    if (!quota.ok) throwOnPersistenceFailure(quota);
    return noStore(responses.ok({ limit: quota.limit, used: quota.used, remaining: quota.remaining, cycleId: quota.cycleId }));
  } catch (error) {
    return handleApiError(error);
  }
});
