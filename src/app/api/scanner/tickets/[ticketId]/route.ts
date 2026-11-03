import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { noStore } from "@/lib/scanner/http";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Devuelve el borrador del propietario sin exponer rutas de Storage ni claves internas. */
export const GET = withLogging(async (_request, context: RouteContext) => {
  try {
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");

    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data: ticket, error: ticketError } = await supabase
      .from("scanner_tickets")
      .select("id,status,status_reason,source,locale,has_draft,draft_version,merchant,receipt_date,total_cents,currency,original_storage,expires_at,updated_at")
      .eq("id", ticketId)
      .maybeSingle();
    if (ticketError) throw apiErrors.accessUnavailable();
    if (!ticket) throw apiErrors.notFound("Ticket");

    const { data: lines, error: linesError } = await supabase
      .from("scanner_ticket_lines")
      .select("id,position,kind,description,amount_cents,category_proposal,category,allocations,include_in_expenses")
      .eq("ticket_id", ticketId)
      .order("position", { ascending: true });
    if (linesError) throw apiErrors.accessUnavailable();

    return noStore(responses.ok({
      ticket: {
        id: ticket.id,
        status: ticket.status,
        statusReason: ticket.status_reason,
        source: ticket.source,
        locale: ticket.locale,
        hasDraft: ticket.has_draft,
        draftVersion: ticket.draft_version,
        merchant: ticket.merchant,
        date: ticket.receipt_date,
        totalCents: ticket.total_cents,
        currency: ticket.currency,
        originalStorage: ticket.original_storage,
        expiresAt: ticket.expires_at,
        updatedAt: ticket.updated_at,
        lines: (lines ?? []).map((line) => ({
          id: line.id,
          position: line.position,
          kind: line.kind,
          description: line.description,
          amountCents: line.amount_cents,
          categoryProposal: line.category_proposal,
          category: line.category,
          allocations: line.allocations,
          includeInExpenses: line.include_in_expenses,
        })),
      },
    }));
  } catch (error) {
    return handleApiError(error);
  }
});
