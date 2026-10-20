import { actionResponse, requireRole } from "@/lib/guard";
import { getTicket } from "@/lib/tickets";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireRole();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  return actionResponse(await getTicket(auth.user, id));
}
