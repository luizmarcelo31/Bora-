import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserContextByEmail } from "@/lib/tenant";
import { getHomePathForRole } from "@/lib/redirect";

// "/" é auth. Logado → home do role (/admin p/ super admin, /dashboard p/ demais).
export default async function Home() {
  const user = await getSessionUser();
  if (!user?.email) redirect("/login");

  const dbUser = await getUserContextByEmail(user.email);
  redirect(getHomePathForRole(dbUser?.role));
}
