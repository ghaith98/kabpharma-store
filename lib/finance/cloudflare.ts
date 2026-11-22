import "server-only";
import { FinanceError } from "./types";

type QueryResult<T> = { success: boolean; results: T[]; meta?: { changes?: number } };
export async function queryD1<T>(sql: string, params: (string | number | null)[] = []): Promise<QueryResult<T>> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const database = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!account || !database || !token) throw new FinanceError("إعدادات Cloudflare غير مكتملة. أضف المتغيّرات الثلاثة ثم أعد النشر.", 503, "CONFIG");
  if (!/^[a-f0-9]{32}$/i.test(account) || !/^[a-f0-9-]{36}$/i.test(database)) throw new FinanceError("تحقّق من Account ID وDatabase ID في إعدادات الموقع.", 503, "CONFIG");
  let response: Response;
  try {
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(25_000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({sql, params}),
    });
  } catch { throw new FinanceError("تعذّر الاتصال بقاعدة المحاسبة. تحقّق من الإنترنت وحاول مجدداً.", 503, "CONNECTION"); }
  const body = await response.json().catch(() => null) as {
    success?: boolean; result?: QueryResult<T>[]; errors?: { message?: string }[];
  } | null;
  if (!response.ok || !body?.success || body.result?.some(item => !item.success)) {
    const message = (body?.errors || []).map(item => item.message || "").join(" ");
    if (/no such table|no such trigger/i.test(message)) throw new FinanceError("قاعدة المحاسبة بحاجة إلى التهيئة أولاً.", 503, "SCHEMA");
    if ([401,403].includes(response.status)) throw new FinanceError("Cloudflare رفض الربط. تحقّق من التوكن وصلاحية D1 Edit والحساب المحدّد.", 503, "CREDENTIALS");
    if (/limit|quota|exceeded/i.test(message)) throw new FinanceError("تم بلوغ أحد حدود Cloudflare. راجع Usage قبل إعادة المحاولة.", 503, "LIMIT");
    console.error("Finance D1 request failed", {status: response.status});
    throw new FinanceError("تعذّر تنفيذ العملية في قاعدة المحاسبة. لم يتم تأكيد الحفظ.", 503, "DATABASE");
  }
  if (body.result?.length !== 1) throw new FinanceError("استجابة قاعدة المحاسبة غير متوقعة.", 503, "DATABASE");
  return body.result[0];
}
