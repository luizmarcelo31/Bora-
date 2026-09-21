import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail } from "@/lib/tenant";
import { isSuperAdmin } from "@/lib/roles";

// "/" é auth. Logado → /admin (super admin) ou /dashboard, senão → /login
export default async function Home() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/login");

  const dbUser = await getUserContextByEmail(user.email);
  if (dbUser && isSuperAdmin(dbUser.role)) redirect("/admin");

  redirect("/dashboard");
}
