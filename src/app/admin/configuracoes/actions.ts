import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { registrarAuditoriaPlataforma } from "@/lib/platform-audit";

const schema = z.object({
  supportEmail: z.string().email("Email de suporte inválido").optional().or(z.literal("")),
  defaultTrialDays: z.coerce.number().int().min(0).max(365),
  defaultCurrency: z.string().length(3, "Use o código de 3 letras, ex.: BRL"),
  defaultTimezone: z.string().min(3),
  maintenanceMode: z.coerce.boolean(),
  auditRetentionDays: z.coerce.number().int().min(30).max(3650),
});

const ERROS: Record<string, string> = {
  dadosInvalidos: "Verifique os valores informados.",
};

export async function salvarConfiguracoesAction(formData: FormData) {
  const admin = await requireSuperAdmin();

  const parsed = schema.safeParse({
    supportEmail: formData.get("supportEmail") || "",
    defaultTrialDays: formData.get("defaultTrialDays") ?? 14,
    defaultCurrency: formData.get("defaultCurrency") ?? "BRL",
    defaultTimezone: formData.get("defaultTimezone") ?? "America/Sao_Paulo",
    maintenanceMode: formData.get("maintenanceMode") === "on",
    auditRetentionDays: formData.get("auditRetentionDays") ?? 365,
  });
  if (!parsed.success) redirect("/admin/configuracoes?error=dadosInvalidos");

  const d = parsed.data;
  const dados = {
    supportEmail: d.supportEmail || null,
    defaultTrialDays: d.defaultTrialDays,
    defaultCurrency: d.defaultCurrency.toUpperCase(),
    defaultTimezone: d.defaultTimezone,
    maintenanceMode: d.maintenanceMode,
    auditRetentionDays: d.auditRetentionDays,
  };

  // Configuração é singleton: upsert na primeira gravação.
  const atual = await prisma.platformSettings.findFirst();
  await prisma.platformSettings.upsert({
    where: { id: atual?.id ?? 1 },
    create: dados,
    update: dados,
  });

  await registrarAuditoriaPlataforma({
    atorEmail: admin.email,
    acao: "CONFIGURACAO_ALTERADA",
    entidade: "PlatformSettings",
    antes: atual
      ? {
          supportEmail: atual.supportEmail,
          defaultTrialDays: atual.defaultTrialDays,
          maintenanceMode: atual.maintenanceMode,
          auditRetentionDays: atual.auditRetentionDays,
        }
      : null,
    depois: dados,
  });

  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?ok=1");
}

export { ERROS as ERROS_CONFIG };
