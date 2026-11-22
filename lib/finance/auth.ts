import "server-only";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { FinanceError } from "./types";
export async function requireFinanceAdmin(request: Request) {
  const user = await getAdminFromRequest(request);
  if (!user) throw new FinanceError("هذه الصفحة مخصّصة للإدارة. سجّل الدخول بحساب الأدمن.",403,"AUTH");
  const allowed = (process.env.FINANCE_ADMIN_EMAILS || "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes((user.email || "").toLowerCase())) throw new FinanceError("حسابك لا يملك صلاحية المحاسبة.",403,"AUTH");
  return user;
}
