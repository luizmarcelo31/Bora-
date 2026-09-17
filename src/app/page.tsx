import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

// Opção A inteligente: "/" é auth. Logado → /dashboard, senão → /login
export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}
