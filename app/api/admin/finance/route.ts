import { requireFinanceAdmin } from "@/lib/finance/auth";
import { FinanceError, type FinanceAction } from "@/lib/finance/types";
import { financeStatus, financeRecordsPage, importFinance, saveFinance, setupFinance } from "@/lib/finance/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = {"Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow"};
function json(data: unknown,status=200) {return Response.json(data,{status,headers});}
function failure(error: unknown) {
  if (error instanceof FinanceError) return json({error: error.message,code:error.code},error.status);
  console.error("Finance operation failed",{type: error instanceof Error ? error.name : "Unknown"});
  return json({error:"تعذّر إكمال العملية. لم يتم تأكيد الحفظ.",code:"INTERNAL"},500);
}
export async function GET(request: Request) {
  try {
    await requireFinanceAdmin(request);
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "status") return json({workspace:await financeStatus()});
    if (mode !== "records") throw new FinanceError("طلب غير صالح.");
    const url=new URL(request.url), rawVersion=url.searchParams.get("version"), after=url.searchParams.get("after") || "";
    const version=rawVersion===null ? null : Number(rawVersion);
    if ((version!==null && (!Number.isSafeInteger(version)||version<0)) || after.length>1000) throw new FinanceError("طلب تحميل غير صالح.");
    return json(await financeRecordsPage(version,after));
  } catch(error) {return failure(error);}
}
export async function POST(request: Request) {
  try {
    const user = await requireFinanceAdmin(request);
    if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) throw new FinanceError("مصدر الطلب غير مسموح.",403,"ORIGIN");
    const raw = await request.text();
    if (Buffer.byteLength(raw,"utf8") > 3_500_000) throw new FinanceError("حجم الطلب أكبر من الحد المدعوم.",413,"SIZE");
    let body;
    try {body=JSON.parse(raw);}catch {throw new FinanceError("صيغة الطلب غير صالحة.");}
    const actor=user.email || user.id;
    if (body.operation === "setup") {await setupFinance(); return json({success:true});}
    if (body.operation === "import") {
      if (typeof body.raw !== "string") throw new FinanceError("اختر ملف البيانات.");
      await importFinance(body.raw,actor); return json({success:true});
    }
    if (body.operation !== "action" || !Number.isSafeInteger(body.version) || body.version < 0 || typeof body.action?.type !== "string" || typeof body.requestId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.requestId)) throw new FinanceError("طلب الحفظ غير صالح.");
    return json(await saveFinance(body.version,body.action as FinanceAction,body.requestId,actor));
  } catch(error) {return failure(error);}
}
