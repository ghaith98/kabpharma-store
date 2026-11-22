import { requireFinanceAdmin } from "@/lib/finance/auth";
import { FinanceError } from "@/lib/finance/types";
import ui from "@/lib/finance/ui.json";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const headers = {"Cache-Control":"private, no-store", "X-Robots-Tag":"noindex, nofollow"};
  try {await requireFinanceAdmin(request);return Response.json(ui,{headers});}
  catch(error) {return Response.json({error:error instanceof FinanceError ? error.message : "تعذّر فتح المحاسبة."},{status:error instanceof FinanceError ? error.status : 500,headers});}
}
